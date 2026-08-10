import { Resend } from 'resend';

export const sendPasswordResetEmail = async (to: string, resetUrl: string) => {
  const resendApiKey = process.env.RESEND_API;
  
  const appName = process.env.APP_NAME || 'Reader Fandoms';

  if (!resendApiKey) {
    console.log('---------------------------------------------------------');
    console.log('NO RESEND_API CONFIGURED');
    console.log(`Mocking email delivery to: ${to}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('---------------------------------------------------------');
    return;
  }

  const resend = new Resend(resendApiKey);
  // Note: For Resend, if you haven't verified a domain yet, you can only send emails 
  // from onboarding@resend.dev to the email address you used to sign up for Resend.
  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Password Reset Request - ${appName}`,
      text: `We received a request to reset your password for your ${appName} account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`,
      html: `<p>We received a request to reset your password for your ${appName} account.</p><p>Please click on the following link to complete the process:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link will expire in 1 hour.</p><p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`
    });
    console.log("Email sent successfully", data);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
