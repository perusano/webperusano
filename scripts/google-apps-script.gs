/**
 * Perú Sano SRL - Receptor Directo en Gmail (Google Apps Script Web App)
 *
 * Desplegar desde la cuenta: serviciosanitariosdelperu@gmail.com
 * 1. Ir a https://script.google.com -> Nuevo proyecto
 * 2. Pegar este código completo y guardar
 * 3. Implementar -> Nueva implementación -> Tipo: Aplicación web
 *    - Ejecutar como: Yo (serviciosanitariosdelperu@gmail.com)
 *    - Quién tiene acceso: Cualquier usuario
 * 4. Copiar la URL /exec y pegarla en GOOGLE_SCRIPT_URL dentro de js/funnel.js
 */

const DESTINO_EMAIL = 'serviciosanitariosdelperu@gmail.com';
const NOMBRE_REMITENTE = 'Central Operativa • Perú Sano SRL';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildJsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return buildJsonResponse({
    ok: true,
    service: 'Perú Sano SRL - Receptor Operativo Activo'
  });
}

function doPost(e) {
  try {
    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const data = JSON.parse(rawBody);

    const orderCode = escapeHtml(data.orderCode || 'PS-2026-0000');
    const vehicle = escapeHtml(data.vehicle || 'No especificado');
    const placa = escapeHtml(data.placa || 'SIN-PLACA');
    const telefono = escapeHtml(data.telefono || 'No especificado');
    const ubicacion = escapeHtml(data.ubicacion || 'Por confirmar');
    const timestamp = escapeHtml(
      data.timestamp ||
      Utilities.formatDate(new Date(), 'America/Lima', 'dd/MM/yyyy HH:mm:ss')
    );
    const userAgent = escapeHtml(data.userAgent || 'Web');

    const subject = `URGENTE: Solicitud Certificado SENASA - Placa ${placa} (${orderCode})`;

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
      </head>
      <body style="margin:0;padding:24px;background-color:#FAF8F2;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #E5DEC9;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="background:#15803D;padding:22px 28px;text-align:center;color:#ffffff;">
              <div style="font-size:20px;font-weight:800;letter-spacing:0.3px;">PERÚ SANO SRL</div>
              <div style="font-size:12px;opacity:0.92;margin-top:4px;">Plataforma Operativa • Nueva Solicitud Digital SENASA</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;">
              <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px 18px;margin-bottom:20px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#166534;letter-spacing:0.6px;">
                  Código Oficial de Orden
                </div>
                <div style="font-size:22px;font-weight:800;color:#15803D;margin-top:4px;">
                  ${orderCode}
                </div>
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="border-collapse:collapse;font-size:14px;">
                <tr style="border-bottom:1px solid #F3F4F6;">
                  <td style="font-weight:700;color:#374151;width:42%;">Placa del Vehículo:</td>
                  <td style="font-weight:800;color:#DC2626;font-size:16px;">${placa}</td>
                </tr>
                <tr style="border-bottom:1px solid #F3F4F6;">
                  <td style="font-weight:700;color:#374151;">Tipo de Vehículo:</td>
                  <td style="color:#111827;font-weight:600;">${vehicle}</td>
                </tr>
                <tr style="border-bottom:1px solid #F3F4F6;">
                  <td style="font-weight:700;color:#374151;">Celular de Contacto:</td>
                  <td style="color:#111827;font-weight:700;">${telefono}</td>
                </tr>
                <tr style="border-bottom:1px solid #F3F4F6;">
                  <td style="font-weight:700;color:#374151;">Garita / Ubicación:</td>
                  <td style="color:#111827;">${ubicacion}</td>
                </tr>
                <tr>
                  <td style="font-weight:700;color:#374151;">Fecha y Hora (Lima):</td>
                  <td style="color:#4B5563;">${timestamp}</td>
                </tr>
              </table>

              <div style="margin-top:20px;padding:12px 14px;background:#FAF8F2;border-radius:8px;font-size:11px;color:#6B7280;line-height:1.5;">
                <strong>Trazabilidad técnica:</strong><br />
                Origen: www.perusanoapp.com • Entorno: ${userAgent}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#F9FAFB;padding:16px 28px;border-top:1px solid #E5E7EB;font-size:11px;color:#6B7280;line-height:1.5;">
              <strong>EMPRESA PRESTADORA DE SERVICIOS SANITARIOS Y AMBIENTALES DEL PERU S.R.L.</strong><br />
              RUC: 20608476408 | Autorización Oficial SENASA N° 006260001
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    MailApp.sendEmail({
      to: DESTINO_EMAIL,
      subject: subject,
      htmlBody: htmlBody,
      name: NOMBRE_REMITENTE
    });

    return buildJsonResponse({
      ok: true,
      orderCode: orderCode
    });
  } catch (error) {
    return buildJsonResponse({
      ok: false,
      error: error && error.message ? error.message : 'Error interno en Apps Script'
    });
  }
}
