import { Resend } from 'resend';
import { render } from '@react-email/render';
import { VerificationEmail } from './templates/verification-email';

// Lazy initialization to avoid errors during build time
let resendClient: Resend | null = null;
function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured. Please add it to your environment variables.');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendVerificationEmail(
  email: string,
  username: string,
  token: string
) {
  // Get base URL from environment variable - required for production
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for sending verification emails');
  }
  const verificationUrl = `${baseUrl}/verify?token=${token}`;

  try {
    // Render React component to HTML for better compatibility
    const emailHtml = await render(VerificationEmail({ username, verificationUrl }));

    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Project Scope Analyzer <onboarding@resend.dev>',
      to: [email],
      subject: 'Verify your email address',
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      const errorMessage = error.message || JSON.stringify(error) || 'Unknown error';
      throw new Error(`Failed to send verification email: ${errorMessage}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    if (error?.message) {
      throw error;
    }
    throw new Error(`Failed to send verification email: ${error?.toString() || 'Unknown error'}`);
  }
}

export async function sendPasswordResetEmail(
  email: string,
  username: string,
  resetToken: string
) {
  // Get base URL from environment variable - required for production
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for sending password reset emails');
  }
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  try {
    const { data, error } = await getResendClient().emails.send({
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
      const errorMessage = error.message || JSON.stringify(error) || 'Unknown error';
      throw new Error(`Failed to send password reset email: ${errorMessage}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    if (error?.message) {
      throw error;
    }
    throw new Error(`Failed to send password reset email: ${error?.toString() || 'Unknown error'}`);
  }
}

