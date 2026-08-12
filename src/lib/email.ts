import { formatCurrency, formatDateTime } from './utils';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface BookingEmailData {
  clientName: string;
  clientEmail: string;
  services: { name: string; price: number }[];
  totalPrice: number;
  appointmentDate: string;
  appointmentTime: string;
  appointmentId: string;
  paymentMethod?: string;
  phone?: string;
  language?: 'de-CH' | 'pt-BR';
  isProductOrder?: boolean;
  shipping?: { name: string; price: number };
}

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const SALON_OWNER_EMAIL = import.meta.env.VITE_SALON_OWNER_EMAIL;
const SALON_NAME = 'Schönheitslokal';
const SALON_ADDRESS = 'Kalkbreitstrasse 129, 8003 Zurich';
const SALON_PHONE = '077 816 29 33';

const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM || `${SALON_NAME} <onboarding@resend.dev>`;

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email sending failed:', error);
      return false;
    }

    console.log('Email sent successfully to:', emailData.to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export function generateClientConfirmationEmail(data: BookingEmailData): EmailData {
  const formattedDateTime = formatDateTime(new Date(data.appointmentDate + ' ' + data.appointmentTime));
  const formattedTotalPrice = formatCurrency(data.totalPrice);
  const lang = data.language || 'de-CH';

  let subject = data.isProductOrder
    ? (lang === 'pt-BR' ? `Confirmação de Pedido - ${SALON_NAME}` : `Bestellbestätigung - ${SALON_NAME}`)
    : (lang === 'pt-BR' ? `Confirmação de Agendamento - ${SALON_NAME}` : `Buchungsbestätigung - ${SALON_NAME}`);

  let html = '';

  const servicesListHtml = data.services.map(s => `
    <div class="detail-row">
      <span class="label">${data.isProductOrder ? (lang === 'pt-BR' ? 'Produto' : 'Produkt') : (lang === 'pt-BR' ? 'Serviço' : 'Dienstleistung')}:</span>
      <span class="value">${s.name} (${formatCurrency(s.price)})</span>
    </div>
  `).join('');

  const shippingHtml = data.shipping ? `
    <div class="detail-row">
      <span class="label">${lang === 'pt-BR' ? 'Frete' : 'Versand'}:</span>
      <span class="value">${data.shipping.name} (${formatCurrency(data.shipping.price)})</span>
    </div>
  ` : '';

  if (lang === 'pt-BR') {
    if (data.isProductOrder) {
      html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmação de Pedido - ${SALON_NAME}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #d4a574, #c19a6b); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 20px; }
            .order-details { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
            .salon-info { margin: 10px 0; }
            .highlight { color: #d4a574; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ ${SALON_NAME}</h1>
              <h2>Confirmação de Pedido</h2>
            </div>
            
            <div class="content">
              <p>Olá <strong>${data.clientName}</strong>,</p>
              
              <p>Seu pedido foi confirmado com sucesso! Obrigado por comprar conosco.</p>
              
              <div class="order-details">
                ${data.services.map(s => `
                <div class="detail-row">
                  <span class="label">Produto:</span>
                  <span class="value">${s.name} (${formatCurrency(s.price)})</span>
                </div>
                `).join('')}
                ${shippingHtml}
                <div class="detail-row" style="border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px;">
                  <span class="label">Total:</span>
                  <span class="value"><strong>${formattedTotalPrice}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="label">Código do Pedido:</span>
                  <span class="value">${data.appointmentId}</span>
                </div>
              </div>
              
              <div class="highlight">
                <p><strong>Informações Importantes:</strong></p>
                <ul>
                  <li>Você receberá uma notificação quando seu pedido estiver pronto para retirada ou envio.</li>
                  <li>Se tiver dúvidas, entre em contato conosco.</li>
                </ul>
              </div>
              
              <p>Atenciosamente,<br>Equipe ${SALON_NAME}</p>
            </div>
            
            <div class="footer">
              <div class="salon-info">
                <strong>${SALON_NAME}</strong><br>
                ${SALON_ADDRESS}<br>
                Telefone: ${SALON_PHONE}
              </div>
              <p style="font-size: 12px; color: #999;">
                Este é um e-mail automático.
              </p>
            </div>
          </div>
        </body>
        </html>
        `;
    } else {
      subject = `Confirmação de Agendamento - ${SALON_NAME}`;
      html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmação de Agendamento - ${SALON_NAME}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #d4a574, #c19a6b); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; }
        .appointment-details { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
        .salon-info { margin: 10px 0; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #d4a574, #c19a6b); color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .highlight { color: #d4a574; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ ${SALON_NAME}</h1>
          <h2>Confirmação de Agendamento</h2>
        </div>
        
        <div class="content">
          <p>Olá <strong>${data.clientName}</strong>,</p>
          
          <p>Seu agendamento foi confirmado com sucesso! Aqui estão os detalhes:</p>
          
          <div class="appointment-details">
            ${servicesListHtml}
            ${shippingHtml}
            <div class="detail-row" style="border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px;">
              <span class="label">Total:</span>
              <span class="value"><strong>${formattedTotalPrice}</strong></span>
            </div>
            <div class="detail-row">
              <span class="label">Data e Hora:</span>
              <span class="value">${formattedDateTime}</span>
            </div>
            <div class="detail-row">
              <span class="label">Código:</span>
              <span class="value">${data.appointmentId}</span>
            </div>
            ${data.paymentMethod ? `
            <div class="detail-row">
              <span class="label">Pagamento:</span>
              <span class="value">${data.paymentMethod}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="highlight">
            <p><strong>Importante:</strong></p>
            <ul>
              <li>Chegue 10 minutos antes do seu horário</li>
              <li>Para cancelamentos ou reagendamentos, contate-nos com pelo menos 24 horas de antecedência</li>
            </ul>
          </div>
          
          <p>Estamos ansiosos para atendê-lo(a)!</p>
          
          <p>Atenciosamente,<br>Equipe ${SALON_NAME}</p>
        </div>
        
        <div class="footer">
          <div class="salon-info">
            <strong>${SALON_NAME}</strong><br>
            ${SALON_ADDRESS}<br>
            Telefone: ${SALON_PHONE}
          </div>
          <p style="font-size: 12px; color: #999;">
            Este é um e-mail automático. Por favor, não responda diretamente.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
    }
  } else {
    // Default to German (de-CH)
    if (data.isProductOrder) {
      html = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bestellbestätigung - ${SALON_NAME}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #752a77ff; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #e22a86ff, #c16baeff); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 20px; }
            .order-details { background-color: #f19ed1ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
            .salon-info { margin: 10px 0; }
            .highlight { color: #e22a86ff; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ ${SALON_NAME}</h1>
              <h2>Bestellbestätigung</h2>
            </div>
            
            <div class="content">
              <p>Hallo <strong>${data.clientName}</strong>,</p>
              
              <p>Vielen Dank für Ihre Bestellung! Wir haben sie erfolgreich erhalten.</p>
              
              <div class="order-details">
                ${data.services.map(s => `
                <div class="detail-row">
                  <span class="label">Produkt:</span>
                  <span class="value">${s.name} (${formatCurrency(s.price)})</span>
                </div>
                `).join('')}
                ${shippingHtml}
                <div class="detail-row" style="border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px;">
                  <span class="label">Total:</span>
                  <span class="value"><strong>${formattedTotalPrice}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="label">Bestellnummer:</span>
                  <span class="value">${data.appointmentId}</span>
                </div>
              </div>
              
              <div class="highlight">
                <p><strong>Wichtige Informationen:</strong></p>
                <ul>
                  <li>Sie erhalten eine Benachrichtigung, sobald Ihre Bestellung abholbereit oder versandt ist.</li>
                  <li>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</li>
                </ul>
              </div>
              
              <p>Mit freundlichen Grüßen,<br>Das Team von ${SALON_NAME}</p>
            </div>
            
            <div class="footer">
              <div class="salon-info">
                <strong>${SALON_NAME}</strong><br>
                ${SALON_ADDRESS}<br>
                Telefon: ${SALON_PHONE}
              </div>
              <p style="font-size: 12px; color: #999;">
                Dies ist eine automatische E-Mail.
              </p>
            </div>
          </div>
        </body>
        </html>
        `;
    } else {
      html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Buchungsbestätigung - ${SALON_NAME}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #752a77ff; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #e22a86ff, #c16baeff); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; }
        .appointment-details { background-color: #f19ed1ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
        .salon-info { margin: 10px 0; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #e22a86ff, #c16baeff); color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .highlight { color: #e22a86ff; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ ${SALON_NAME}</h1>
          <h2>Buchungsbestätigung</h2>
        </div>
        
        <div class="content">
          <p>Hallo <strong>${data.clientName}</strong>,</p>
          
          <p>Ihre Terminbuchung wurde erfolgreich bestätigt! Hier sind die Details Ihres Termins:</p>
          
          <div class="appointment-details">
            ${servicesListHtml}
            ${shippingHtml}
            <div class="detail-row" style="border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px;">
              <span class="label">Total:</span>
              <span class="value"><strong>${formattedTotalPrice}</strong></span>
            </div>
            <div class="detail-row">
              <span class="label">Datum und Uhrzeit:</span>
              <span class="value">${formattedDateTime}</span>
            </div>
            <div class="detail-row">
              <span class="label">Buchungscode:</span>
              <span class="value">${data.appointmentId}</span>
            </div>
            ${data.paymentMethod ? `
            <div class="detail-row">
              <span class="label">Zahlungsart:</span>
              <span class="value">${data.paymentMethod === 'salon' ? 'Im Salon' : data.paymentMethod === 'twint' ? 'TWINT' : data.paymentMethod === 'cash' ? 'Barzahlung' : data.paymentMethod}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="highlight">
            <p><strong>Wichtig:</strong></p>
            <ul>
              <li>Kommen Sie 10 Minuten vor Ihrem Termin</li>
              <li>Bei Stornierung oder Umbuchung kontaktieren Sie uns bitte mindestens 24 Stunden im Voraus</li>
              <li>Unsere Fachkräfte sind bereit, Ihnen den besten Service zu bieten</li>
            </ul>
          </div>
          
          <p>Wir freuen uns darauf, Sie zu verwöhnen und Ihnen ein unvergessliches Erlebnis zu bieten!</p>
          
          <p>Mit freundlichen Grüßen,<br>Das Team von ${SALON_NAME}</p>
        </div>
        
        <div class="footer">
          <div class="salon-info">
            <strong>${SALON_NAME}</strong><br>
            ${SALON_ADDRESS}<br>
            Telefon: ${SALON_PHONE}
          </div>
          <p style="font-size: 12px; color: #999;">
            Dies ist eine automatische E-Mail. Bitte antworten Sie nicht direkt auf diese Nachricht.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
    }
  }

  return {
    to: data.clientEmail,
    subject,
    html,
  };
}

export function generateOwnerNotificationEmail(data: BookingEmailData): EmailData {
  const formattedDateTime = formatDateTime(new Date(data.appointmentDate + ' ' + data.appointmentTime));
  const formattedTotalPrice = formatCurrency(data.totalPrice);

  const servicesListHtml = data.services.map(s => `
    <div class="detail-row">
      <span class="label">${data.isProductOrder ? 'Produkt' : 'Dienstleistung'}:</span>
      <span class="value">${s.name} (${formatCurrency(s.price)})</span>
    </div>
  `).join('');

  const shippingHtml = data.shipping ? `
    <div class="detail-row">
      <span class="label">Versand:</span>
      <span class="value">${data.shipping.name} (${formatCurrency(data.shipping.price)})</span>
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Neue Buchung - ${SALON_NAME}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #d4a574, #c19a6b); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; }
        .appointment-details { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .highlight { background-color: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.isProductOrder ? '🛍️' : '📅'} ${SALON_NAME}</h1>
          <h2>${data.isProductOrder ? 'Neue Bestellung Erhalten' : 'Neue Buchung Erhalten'}</h2>
        </div>
        
        <div class="content">
          <p>Hallo,</p>
          
          <p>${data.isProductOrder ? 'Eine neue Bestellung ist eingegangen. Hier sind die Details:' : 'Eine neue Buchung wurde im System vorgenommen. Hier sind die Details:'}</p>
          
          <div class="appointment-details">
            <div class="detail-row">
              <span class="label">Kunde:</span>
              <span class="value">${data.clientName}</span>
            </div>
            <div class="detail-row">
              <span class="label">E-Mail:</span>
              <span class="value">${data.clientEmail}</span>
            </div>
            ${data.phone ? `
            <div class="detail-row">
              <span class="label">Telefon:</span>
              <span class="value">${data.phone}</span>
            </div>
            ` : ''}
            ${servicesListHtml}
            ${shippingHtml}
            <div class="detail-row" style="border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px;">
              <span class="label">Total:</span>
              <span class="value"><strong>${formattedTotalPrice}</strong></span>
            </div>
            ${data.paymentMethod ? `
            <div class="detail-row">
              <span class="label">Zahlungsmethode:</span>
              <span class="value">${data.paymentMethod}</span>
            </div>
            ` : ''}
            ${!data.isProductOrder ? `
            <div class="detail-row">
              <span class="label">Datum und Uhrzeit:</span>
              <span class="value">${formattedDateTime}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="label">${data.isProductOrder ? 'Bestellnummer' : 'Buchungscode'}:</span>
              <span class="value">${data.appointmentId}</span>
            </div>
            ${data.paymentMethod ? `
            <div class="detail-row">
              <span class="label">Zahlungsart / Método:</span>
              <span class="value">${data.paymentMethod === 'salon' ? 'Salon' : data.paymentMethod === 'twint' ? 'TWINT' : data.paymentMethod === 'cash' ? 'Cash' : data.paymentMethod}</span>
            </div>
            ` : ''}
            ${data.isProductOrder ? `
              <div class="detail-row">
                 <span class="label">Abholdatum:</span>
                 <span class="value">${formattedDateTime.split(' um')[0]}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="highlight">
            <p><strong>💡 Erforderliche Aktion:</strong></p>
            <p>${data.isProductOrder ? 'Bitte bereiten Sie die Produkte für den Versand vor.' : 'Überprüfen Sie Ihren Zeitplan und bereiten Sie alles für die Behandlung vor.'}</p>
          </div>
          
          <p>${data.isProductOrder ? 'Bestelldatum' : 'Buchungsdatum'}: ${new Date().toLocaleString('de-CH')}</p>
        </div>
        
        <div class="footer">
          <p style="font-size: 12px; color: #999;">
            Dies ist eine automatische E-Mail des ${data.isProductOrder ? 'Bestellsystems' : 'Buchungssystems'}.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: EMAIL_FROM || SALON_OWNER_EMAIL || 'salon@example.com',
    subject: data.isProductOrder
      ? `Novo Pedido - ${data.clientName} - ${SALON_NAME}`
      : `Novo Agendamento - ${data.clientName} - ${SALON_NAME}`,
    html,
  };
}

export async function sendBookingConfirmation(bookingData: BookingEmailData): Promise<boolean> {
  // Send confirmation email to client
  const clientEmail = generateClientConfirmationEmail(bookingData);
  const clientEmailSent = await sendEmail(clientEmail);

  // Send notification email to owner
  const ownerEmail = generateOwnerNotificationEmail(bookingData);
  const ownerEmailSent = await sendEmail(ownerEmail);

  if (clientEmailSent && ownerEmailSent) {
    console.log('Booking confirmation emails sent successfully');
    return true;
  } else {
    console.warn('Some booking confirmation emails failed to send');
    return false;
  }
}

export async function sendCancellationEmail(
  clientEmail: string,
  clientName: string,
  appointmentDetails: {
    serviceName: string;
    appointmentDate: string;
    appointmentTime: string;
  }
): Promise<void> {
  const formattedDateTime = formatDateTime(new Date(appointmentDetails.appointmentDate + ' ' + appointmentDetails.appointmentTime));

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cancelamento de Agendamento - ${SALON_NAME}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; }
        .appointment-details { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ ${SALON_NAME}</h1>
          <h2>Cancelamento de Agendamento</h2>
        </div>
        
        <div class="content">
          <p>Olá <strong>${clientName}</strong>,</p>
          
          <p>Confirmamos o cancelamento do seu agendamento:</p>
          
          <div class="appointment-details">
            <p><strong>Serviço:</strong> ${appointmentDetails.serviceName}</p>
            <p><strong>Data e Horário:</strong> ${formattedDateTime}</p>
          </div>
          
          <p>Sentimos muito que você tenha que cancelar. Esperamos poder atendê-lo(a) em outra oportunidade.</p>
          
          <p>Se desejar reagendar, acesse nosso site ou entre em contato conosco.</p>
          
          <p>Atenciosamente,<br>Equipe ${SALON_NAME}</p>
        </div>
        
        <div class="footer">
          <div style="font-size: 12px; color: #999;">
            Este é um e-mail automático. Por favor, não responda diretamente a esta mensagem.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailData: EmailData = {
    to: clientEmail,
    subject: `Cancelamento Confirmado - ${SALON_NAME}`,
    html,
  };

  await sendEmail(emailData);
}

export function generateClientRescheduleEmail(data: BookingEmailData & { professionalName?: string }): EmailData {
  const formattedDateTime = formatDateTime(new Date(data.appointmentDate + ' ' + data.appointmentTime));
  const formattedTotalPrice = formatCurrency(data.totalPrice);
  const lang = data.language || 'de-CH';

  let subject = lang === 'pt-BR' 
    ? `Alteração de Agendamento - ${SALON_NAME}` 
    : `Terminänderung - ${SALON_NAME}`;

  let html = '';

  const servicesListHtml = data.services.map(s => `
    <div class="detail-row">
      <span class="label">${lang === 'pt-BR' ? 'Serviço' : 'Dienstleistung'}:</span>
      <span class="value">${s.name} (${formatCurrency(s.price)})</span>
    </div>
  `).join('');

  if (lang === 'pt-BR') {
    html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Alteração de Agendamento - ${SALON_NAME}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #e22a86ff, #c16baeff); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; }
        .appointment-details { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
        .salon-info { margin: 10px 0; }
        .highlight { color: #e22a86ff; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ ${SALON_NAME}</h1>
          <h2>Agendamento Alterado</h2>
        </div>
        
        <div class="content">
          <p>Olá <strong>${data.clientName}</strong>,</p>
          
          <p>Informamos que o seu agendamento foi <strong>alterado</strong> pelo estabelecimento. Veja abaixo os novos detalhes da sua reserva:</p>
          
          <div class="appointment-details">
            ${servicesListHtml}
            <div class="detail-row" style="border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px;">
              <span class="label">Total:</span>
              <span class="value"><strong>${formattedTotalPrice}</strong></span>
            </div>
            <div class="detail-row">
              <span class="label">Nova Data e Hora:</span>
              <span class="value"><strong>${formattedDateTime}</strong></span>
            </div>
            ${data.professionalName ? `
            <div class="detail-row">
              <span class="label">Atendente:</span>
              <span class="value">${data.professionalName}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="label">Código:</span>
              <span class="value">${data.appointmentId}</span>
            </div>
            ${data.paymentMethod ? `
            <div class="detail-row">
              <span class="label">Pagamento:</span>
              <span class="value">${data.paymentMethod}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="highlight">
            <p><strong>Informações Importantes:</strong></p>
            <ul>
              <li>Pedimos que chegue 10 minutos antes do seu novo horário.</li>
              <li>Caso precise alterar ou cancelar, por favor entre em contato com pelo menos 24h de antecedência.</li>
            </ul>
          </div>
          
          <p>Agradecemos a compreensão e estamos ansiosos para atendê-lo(a)!</p>
          
          <p>Atenciosamente,<br>Equipe ${SALON_NAME}</p>
        </div>
        
        <div class="footer">
          <div class="salon-info">
            <strong>${SALON_NAME}</strong><br>
            ${SALON_ADDRESS}<br>
            Telefone: ${SALON_PHONE}
          </div>
          <p style="font-size: 12px; color: #999;">
            Este é um e-mail automático. Por favor, não responda diretamente.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  } else {
    html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Terminänderung - ${SALON_NAME}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #752a77ff; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #e22a86ff, #c16baeff); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; }
        .appointment-details { background-color: #f19ed1ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
        .salon-info { margin: 10px 0; }
        .highlight { color: #e22a86ff; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ ${SALON_NAME}</h1>
          <h2>Termin Geändert</h2>
        </div>
        
        <div class="content">
          <p>Hallo <strong>${data.clientName}</strong>,</p>
          
          <p>wir möchten Sie darüber informieren, dass Ihr Termin im Salon <strong>geändert</strong> wurde. Hier sind die neuen Details Ihrer Buchung:</p>
          
          <div class="appointment-details">
            ${servicesListHtml}
            <div class="detail-row" style="border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px;">
              <span class="label">Total:</span>
              <span class="value"><strong>${formattedTotalPrice}</strong></span>
            </div>
            <div class="detail-row">
              <span class="label">Neues Datum und Uhrzeit:</span>
              <span class="value"><strong>${formattedDateTime}</strong></span>
            </div>
            ${data.professionalName ? `
            <div class="detail-row">
              <span class="label">Mitarbeiter:</span>
              <span class="value">${data.professionalName}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="label">Buchungscode:</span>
              <span class="value">${data.appointmentId}</span>
            </div>
            ${data.paymentMethod ? `
            <div class="detail-row">
              <span class="label">Zahlungsart:</span>
              <span class="value">${data.paymentMethod === 'salon' ? 'Im Salon' : data.paymentMethod === 'twint' ? 'TWINT' : data.paymentMethod === 'cash' ? 'Barzahlung' : data.paymentMethod}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="highlight">
            <p><strong>Wichtige Informationen:</strong></p>
            <ul>
              <li>Bitte erscheinen Sie 10 Minuten vor Ihrem neuen Termin.</li>
              <li>Sollten Sie Ihren Termin absagen oder erneut verschieben müssen, tun Sie dies bitte mindestens 24 Stunden im Voraus.</li>
            </ul>
          </div>
          
          <p>Wir danken Ihnen für Ihr Verständnis und freuen uns darauf, Sie bald begrüssen zu dürfen!</p>
          
          <p>Mit freundlichen Grüßen,<br>Ihr Team von ${SALON_NAME}</p>
        </div>
        
        <div class="footer">
          <div class="salon-info">
            <strong>${SALON_NAME}</strong><br>
            ${SALON_ADDRESS}<br>
            Telefon: ${SALON_PHONE}
          </div>
          <p style="font-size: 12px; color: #999;">
            Dies ist eine automatische E-Mail. Bitte antworten Sie nicht direkt auf diese Nachricht.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  return {
    to: data.clientEmail,
    subject,
    html
  };
}

export async function sendRescheduleNotification(bookingData: BookingEmailData & { professionalName?: string }): Promise<boolean> {
  try {
    const clientEmail = generateClientRescheduleEmail(bookingData);
    const clientEmailSent = await sendEmail(clientEmail);
    return clientEmailSent;
  } catch (error) {
    console.error('Error sending reschedule email:', error);
    return false;
  }
}