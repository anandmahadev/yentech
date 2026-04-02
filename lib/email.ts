import nodemailer from 'nodemailer';

/**
 * Configure the email transporter using environment variables.
 * For Gmail, use an "App Password". 
 * For other services, use their specific SMTP settings.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Generic function to send email
 */
export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Yentech Recruitment" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Helper to generate the assessment invite email HTML
 */
export function getInviteEmailTemplate(name: string, domain: string, testLink: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #050508; padding: 24px; text-align: center; border-bottom: 2px solid #00d4ff;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">YENTECH RECRUITMENT</h1>
      </div>
      <div style="padding: 32px; background-color: #ffffff;">
        <h2 style="color: #111827; margin-bottom: 16px;">Hello ${name},</h2>
        <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">
          Thank you for applying for the <strong>${domain}</strong> role at Yentech. 
          We are impressed with your profile and would like to invite you to complete an initial technical assessment.
        </p>
        <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
          <h3 style="margin-top: 0; color: #111827;">Your Assessment Link</h3>
          <a href="${testLink}" target="_blank" style="background-color: #00d4ff; color: #050508; padding: 12px 24px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block;">
            Start Assessment Now
          </a>
        </div>
        <p style="color: #ef4444; font-size: 13px; line-height: 1.5;">
          <strong>Important:</strong> Please ensure you take the test on a desktop or laptop with a stable internet connection. 
          The test must be completed in <strong>fullscreen mode</strong>; exiting fullscreen may invalidate your submission.
        </p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} Yentech Recruitment Team. All rights reserved.
        </p>
      </div>
    </div>
  `;
}
