import nodemailer from 'nodemailer';

export const sendPasswordResetEmail = async (to: string, resetUrl: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    if (isProduction) {
      throw new Error('SMTP configuration is missing in production environment');
    } else {
      console.log('---------------------------------------------------------');
      console.log('DEVELOPMENT MODE: NO SMTP CREDENTIALS CONFIGURED');
      console.log(`Mocking email delivery to: ${to}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('---------------------------------------------------------');
      return;
    }
  }

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  const appName = process.env.APP_NAME || 'Project Luminous';
  const fromEmail = process.env.SMTP_FROM || `"Project Luminous" <noreply@projectluminous.com>`;

  const mailOptions = {
    from: fromEmail,
    to,
    subject: `Password Reset Request - ${appName}`,
    text: `We received a request to reset your password for your ${appName} account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`
  };

  await transporter.sendMail(mailOptions);
};
