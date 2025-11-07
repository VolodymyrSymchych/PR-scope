import { Resend } from 'resend';
import { VerificationEmail } from './templates/verification-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  username: string,
  token: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000';
  const verificationUrl = `${baseUrl}/verify?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Project Scope Analyzer <onboarding@resend.dev>',
      to: [email],
      subject: 'Verify your email address',
      react: VerificationEmail({ username, verificationUrl }),
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }

    return data;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  username: string,
  resetToken: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Project Scope Analyzer <onboarding@resend.dev>',
      to: [email],
      subject: 'Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #00e5ff; text-align: center; margin-bottom: 30px;">Reset Your Password</h1>
          <p style="font-size: 16px; line-height: 24px; color: #333; margin-bottom: 20px;">
            Hi ${username},
          </p>
          <p style="font-size: 16px; line-height: 24px; color: #333; margin-bottom: 20px;">
            You requested to reset your password for Project Scope Analyzer. Click the button below to create a new password:
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" style="background-color: #00e5ff; color: white; padding: 14px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; line-height: 22px; color: #666; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="font-size: 14px; color: #00e5ff; word-break: break-all;">
            ${resetUrl}
          </p>
          <p style="font-size: 14px; line-height: 22px; color: #999; margin-top: 40px;">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    return data;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

