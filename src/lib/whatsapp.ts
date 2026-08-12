import { formatCurrency, formatDateTime } from './utils';
import { BookingEmailData } from './email';

export interface WhatsAppData {
  number: string;
  text: string;
}

export async function sendWhatsAppMessage(data: WhatsAppData): Promise<boolean> {
  try {
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('WhatsApp sending failed:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return false;
  }
}

export async function sendBookingConfirmationWhatsApp(data: BookingEmailData): Promise<boolean> {
   if (!data.phone) return false; // We can't send WP without a phone number

   // Format phone number to numbers only, and remove any weird characters
   // A robust actual system would validate international format, we do basic cleaning
   const phoneClean = data.phone.replace(/\D/g, '');

   const formattedDateTime = formatDateTime(new Date(data.appointmentDate + ' ' + data.appointmentTime));
   const lang = data.language || 'de-CH';

   let text = '';
   if (lang === 'pt-BR') {
     text = `Olá *${data.clientName}*! 👋\n\n` +
            `Seu agendamento em *Schönheitslokal* foi confirmado com sucesso!\n\n` +
            `📅 *Data e Horário:* ${formattedDateTime}\n\n`;
     if (data.services.length > 0) {
       text += `✂️ *Serviço(s):*\n` + data.services.map(s => `- ${s.name}`).join('\n') + `\n\n`;
     }
      text += `💰 *Total:* ${formatCurrency(data.totalPrice)}\n` +
              `💳 *Método de Pagamento:* ${data.paymentMethod === 'salon' ? 'No Salão' : data.paymentMethod === 'twint' ? 'TWINT' : data.paymentMethod === 'cash' ? 'Dinheiro' : data.paymentMethod || 'No Salão'}\n\n` +
              `📍 *Endereço:* Kalkbreitstrasse 129, 8003 Zurich\n\n` +
              `Agradecemos a preferência e esperamos você! ✨`;
   } else {
     text = `Hallo *${data.clientName}*! 👋\n\n` +
            `Ihre Buchung bei *Schönheitslokal* wurde erfolgreich bestätigt!\n\n` +
            `📅 *Datum und Uhrzeit:* ${formattedDateTime}\n\n`;
     if (data.services.length > 0) {
       text += `✂️ *Dienstleistung(en):*\n` + data.services.map(s => `- ${s.name}`).join('\n') + `\n\n`;
     }
      text += `💰 *Total:* ${formatCurrency(data.totalPrice)}\n` +
              `💳 *Zahlungsart:* ${data.paymentMethod === 'salon' ? 'Im Salon' : data.paymentMethod === 'twint' ? 'TWINT' : data.paymentMethod === 'cash' ? 'Barzahlung' : data.paymentMethod || 'Im Salon'}\n\n` +
              `📍 *Adresse:* Kalkbreitstrasse 129, 8003 Zurich\n\n` +
              `Wir freuen uns auf Sie! ✨`;
   }

   return sendWhatsAppMessage({ number: phoneClean, text });
}

export async function sendReviewRequestWhatsApp(name: string, phone: string, language: string = 'de-CH'): Promise<boolean> {
   if (!phone) return false;
   const phoneClean = phone.replace(/\D/g, '');
   const reviewLink = "https://g.page/r/CU7EmC4Q93FgEAE/review";

   let text = '';
   if (language === 'pt-BR') {
     text = `Olá *${name}*! 👋\n\n` +
            `Esperamos que você tenha tido uma ótima experiência no *Schönheitslokal*. 😍\n\n` +
            `Poderia nos ajudar avaliando nosso atendimento? Leva apenas um minutinho!\n` +
            `👉 ${reviewLink}\n\n` +
            `Sua opinião é muito importante para nós. Muito obrigado! ✨`;
   } else {
     text = `Hallo *${name}*! 👋\n\n` +
            `Wir hoffen, Sie hatten eine tolle Erfahrung im *Schönheitslokal*. 😍\n\n` +
            `Könnten Sie uns helfen, indem Sie unseren Service bewerten? Es dauert nur eine Minute!\n` +
            `👉 ${reviewLink}\n\n` +
            `Ihre Meinung ist uns sehr wichtig. Vielen Dank! ✨`;
   }

   return sendWhatsAppMessage({ number: phoneClean, text });
}

export async function sendRescheduleWhatsApp(data: BookingEmailData & { professionalName?: string }): Promise<boolean> {
  if (!data.phone) return false;
  const phoneClean = data.phone.replace(/\D/g, '');

  const formattedDateTime = formatDateTime(new Date(data.appointmentDate + ' ' + data.appointmentTime));
  const lang = data.language || 'de-CH';

  let text = '';
  if (lang === 'pt-BR') {
    text = `✨ *${data.clientName}*, seu agendamento no *Schönheitslokal* foi *alterado* com sucesso! 👋\n\n` +
           `📅 *Nova Data e Horário:* ${formattedDateTime}\n`;
    if (data.professionalName) {
      text += `👤 *Atendente:* ${data.professionalName}\n`;
    }
    if (data.services.length > 0) {
      text += `✂️ *Serviço(s):*\n` + data.services.map(s => `- ${s.name}`).join('\n') + `\n\n`;
    }
    text += `💰 *Total:* ${formatCurrency(data.totalPrice)}\n` +
            `💳 *Método de Pagamento:* ${data.paymentMethod === 'salon' ? 'No Salão' : data.paymentMethod === 'twint' ? 'TWINT' : data.paymentMethod === 'cash' ? 'Dinheiro' : data.paymentMethod || 'No Salão'}\n\n` +
            `📍 *Endereço:* Kalkbreitstrasse 129, 8003 Zurich\n\n` +
            `Agradecemos a compreensão e aguardamos você! ✨`;
  } else {
    text = `✨ Hallo *${data.clientName}*, Ihr Termin bei *Schönheitslokal* wurde erfolgreich *geändert*! 👋\n\n` +
           `📅 *Neues Datum und Uhrzeit:* ${formattedDateTime}\n`;
    if (data.professionalName) {
      text += `👤 *Mitarbeiter:* ${data.professionalName}\n`;
    }
    if (data.services.length > 0) {
      text += `✂️ *Dienstleistung(en):*\n` + data.services.map(s => `- ${s.name}`).join('\n') + `\n\n`;
    }
    text += `💰 *Total:* ${formatCurrency(data.totalPrice)}\n` +
            `💳 *Zahlungsart:* ${data.paymentMethod === 'salon' ? 'Im Salon' : data.paymentMethod === 'twint' ? 'TWINT' : data.paymentMethod === 'cash' ? 'Barzahlung' : data.paymentMethod || 'Im Salon'}\n\n` +
            `📍 *Adresse:* Kalkbreitstrasse 129, 8003 Zurich\n\n` +
            `Vielen Dank für Ihr Verständnis. Wir freuen uns auf Sie! ✨`;
  }

  return sendWhatsAppMessage({ number: phoneClean, text });
}
