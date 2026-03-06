import nodemailer from 'nodemailer';

type QuoteEmailPayload = {
  name: string;
  email: string;
  phone?: string;
  typeOfService: string;
  specification?: string;
  requestDetails: string;
  preferredContactMethod?: string;
  propertyLocation?: string;
  timeline?: string;
  sourcePage?: string;
};

type EmailDispatchResult = {
  sent: boolean;
  reason?: string;
};

function toBool(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatOptionalLabel(label: string, value?: string): string {
  if (!value) {
    return '';
  }

  return `${label}: ${value}\n`;
}

function buildCompanyEmailText(payload: QuoteEmailPayload): string {
  return [
    'New quote request received from Constein Group website.',
    '',
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    formatOptionalLabel('Phone', payload.phone),
    `Type of Service: ${payload.typeOfService}`,
    formatOptionalLabel('Specification', payload.specification),
    formatOptionalLabel('Preferred Contact Method', payload.preferredContactMethod),
    formatOptionalLabel('Property Location', payload.propertyLocation),
    formatOptionalLabel('Desired Timeline', payload.timeline),
    formatOptionalLabel('Source Page', payload.sourcePage),
    '',
    'Request Details:',
    payload.requestDetails,
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

function buildCompanyEmailHtml(payload: QuoteEmailPayload): string {
  const detailsLines = [
    ['Name', payload.name],
    ['Email', payload.email],
    ['Phone', payload.phone],
    ['Type of Service', payload.typeOfService],
    ['Specification', payload.specification],
    ['Preferred Contact Method', payload.preferredContactMethod],
    ['Property Location', payload.propertyLocation],
    ['Desired Timeline', payload.timeline],
    ['Source Page', payload.sourcePage],
  ]
    .filter((line): line is [string, string] => Boolean(line[1]))
    .map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`)
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h2 style="margin-bottom: 8px;">New Quote Request</h2>
      <p style="margin-top: 0;">A new request was submitted from the website.</p>
      <ul>${detailsLines}</ul>
      <h3 style="margin-bottom: 8px;">Request Details</h3>
      <p style="white-space: pre-wrap;">${escapeHtml(payload.requestDetails)}</p>
    </div>
  `;
}

function buildCustomerEmailText(payload: QuoteEmailPayload): string {
  return [
    `Hi ${payload.name},`,
    '',
    'Thank you for contacting Constein Group. We received your quote request and our team will get back to you shortly.',
    '',
    `Type of Service: ${payload.typeOfService}`,
    formatOptionalLabel('Specification', payload.specification),
    '',
    'Best regards,',
    'Constein Group',
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

function buildCustomerEmailHtml(payload: QuoteEmailPayload): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <p>Hi ${escapeHtml(payload.name)},</p>
      <p>
        Thank you for contacting <strong>Constein Group</strong>. We received your quote request and
        our team will get back to you shortly.
      </p>
      <p><strong>Type of Service:</strong> ${escapeHtml(payload.typeOfService)}</p>
      ${payload.specification ? `<p><strong>Specification:</strong> ${escapeHtml(payload.specification)}</p>` : ''}
      <p>Best regards,<br/>Constein Group</p>
    </div>
  `;
}

function createTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPortRaw = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpPortRaw || !smtpUser || !smtpPass) {
    return null;
  }

  const smtpPort = Number(smtpPortRaw);
  const secure = toBool(process.env.SMTP_SECURE);

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendQuoteEmails(payload: QuoteEmailPayload): Promise<EmailDispatchResult> {
  const transporter = createTransporter();
  const fromEmail = process.env.SMTP_FROM_EMAIL;

  if (!transporter || !fromEmail) {
    return { sent: false, reason: 'Email settings are not configured' };
  }

  const companyEmail = process.env.QUOTE_INBOX_EMAIL ?? 'shadmansadee@gmail.com';

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: companyEmail,
      replyTo: payload.email,
      subject: `New Quote Request: ${payload.typeOfService}`,
      text: buildCompanyEmailText(payload),
      html: buildCompanyEmailHtml(payload),
    });

    await transporter.sendMail({
      from: fromEmail,
      to: payload.email,
      subject: 'Constein Group: We Received Your Quote Request',
      text: buildCustomerEmailText(payload),
      html: buildCustomerEmailHtml(payload),
    });

    return { sent: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send emails';
    return { sent: false, reason: message };
  }
}
