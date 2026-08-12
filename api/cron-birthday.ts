import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return response.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
        // 1. Fetch Birthday Settings
        const keys = [
            'birthday_voucher_enabled',
            'birthday_voucher_type',
            'birthday_voucher_value',
            'birthday_voucher_service_id',
            'birthday_voucher_validity',
            'birthday_message_template_de',
            'birthday_message_template_pt'
        ];

        const { data: settings, error: settingsError } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', keys);

        if (settingsError) throw settingsError;

        const getSetting = (key: string) => settings?.find(s => s.key === key)?.value;

        const enabled = getSetting('birthday_voucher_enabled') === 'true';
        if (!enabled) {
            return response.status(200).json({ message: 'Birthday vouchers are disabled' });
        }

        const voucherType = getSetting('birthday_voucher_type') || 'discount_percentage';
        const voucherValue = Number(getSetting('birthday_voucher_value') || 0);
        const serviceId = getSetting('birthday_voucher_service_id');
        const validityDays = Number(getSetting('birthday_voucher_validity') || 30);
        const templateDe = getSetting('birthday_message_template_de') || "Herzlichen Glückwunsch zum Geburtstag! 🎂 Wir haben ein Geschenk für Sie: Verwenden Sie den Code {voucher_code} für Ihren nächsten Besuch. Gültig bis {expiry_date}.";
        const templatePt = getSetting('birthday_message_template_pt') || "Parabéns pelo seu aniversário! 🎂 Temos um presente para você: Use o código {voucher_code} na sua próxima visita. Válido até {expiry_date}.";

        // 2. Find clients with birthday today
        const today = new Date();
        const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('id, full_name, phone, email, birth_date')
            .not('birth_date', 'is', null);

        if (clientsError) throw clientsError;

        const birthdayClients = clients.filter(c => {
            if (!c.birth_date) return false;
            // birth_date format is YYYY-MM-DD
            return c.birth_date.substring(5, 10) === monthDay;
        });

        if (birthdayClients.length === 0) {
            return response.status(200).json({ message: 'No birthdays today', processed: 0 });
        }

        const results = [];
        const startOfToday = new Date(today);
        startOfToday.setHours(0, 0, 0, 0);

        for (const client of birthdayClients) {
            try {
                // 3. Check for existing birthday voucher today (deduplication)
                const { data: existingVoucher } = await supabase
                    .from('vouchers')
                    .select('id')
                    .eq('client_id', client.id)
                    .eq('is_birthday_voucher', true)
                    .gte('created_at', startOfToday.toISOString())
                    .maybeSingle();

                if (existingVoucher) {
                    results.push({ id: client.id, status: 'skipped', reason: 'Already sent today' });
                    continue;
                }

                // 4. Generate Voucher Code
                const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
                const voucherCode = `BDAY-${randomPart}-${client.id.substring(0, 4).toUpperCase()}`;
                
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + validityDays);

                // 5. Create Voucher record
                const { error: voucherError } = await supabase
                    .from('vouchers')
                    .insert([{
                        client_id: client.id,
                        code: voucherCode,
                        type: voucherType,
                        value: voucherType === 'free_service' ? null : voucherValue,
                        service_id: voucherType === 'free_service' ? serviceId : null,
                        expires_at: expiresAt.toISOString(),
                        validity_days: validityDays,
                        is_birthday_voucher: true
                    }]);

                if (voucherError) throw voucherError;

                // 6. Queue WhatsApp Message
                if (client.phone) {
                    let phoneClean = client.phone.replace(/\D/g, '');
                    // Basic formatting for WhatsApp
                    if (phoneClean.length === 11 && (phoneClean.startsWith('1') || phoneClean.startsWith('2') || phoneClean.startsWith('3'))) {
                        phoneClean = '55' + phoneClean;
                    } else if (phoneClean.length === 11 && !phoneClean.startsWith('55')) {
                        phoneClean = '55' + phoneClean;
                    }

                    const isPt = phoneClean.startsWith('55');
                    const template = isPt ? templatePt : templateDe;
                    
                    let message = template
                        .replace(/{name}/g, client.full_name || 'Amigo(a)')
                        .replace(/{voucher_code}/g, voucherCode)
                        .replace(/{expiry_date}/g, expiresAt.toLocaleDateString(isPt ? 'pt-BR' : 'de-CH'));

                    await supabase
                        .from('whatsapp_queue')
                        .insert([{
                            number: phoneClean,
                            message: message,
                            status: 'pending'
                        }]);
                }

                results.push({ id: client.id, status: 'success', code: voucherCode });

            } catch (err) {
                console.error(`Error processing birthday for client ${client.id}:`, err);
                results.push({ id: client.id, status: 'error', error: (err as any).message });
            }
        }

        return response.status(200).json({
            success: true,
            processed: results.filter(r => r.status === 'success').length,
            results
        });

    } catch (error) {
        console.error('Birthday Cron error:', error);
        return response.status(500).json({ error: 'Internal Server Error', details: (error as any).message });
    }
}
