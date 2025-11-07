# Authentication Setup Guide

This document provides step-by-step instructions for setting up authentication in the Project Scope Analyzer dashboard.

## Overview

The application uses JWT (JSON Web Tokens) for session management, with email/password authentication and support for OAuth providers (Google and Microsoft).

## Prerequisites

- PostgreSQL database (Neon recommended)
- Resend account for email verification
- Node.js 18+ installed

## Step 1: Database Setup

1. Create a PostgreSQL database (we recommend Neon.tech for serverless PostgreSQL)

2. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

3. Update `DATABASE_URL` in `.env.local`:
```
DATABASE_URL="postgresql://user:password@host:5432/database"
```

4. Run database migrations:
```bash
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

## Step 2: JWT Secret

Generate a secure JWT secret:
```bash
openssl rand -base64 32
```

Add it to `.env.local`:
```
JWT_SECRET="your_generated_secret_here"
```

## Step 3: Email Verification Setup (Resend)

1. Sign up for a free account at [Resend.com](https://resend.com)

2. Get your API key from the Resend dashboard

3. Add to `.env.local`:
```
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="Project Scope Analyzer <onboarding@yourdomain.com>"
```

4. Verify your sending domain in Resend (or use their test domain)

## Step 4: Application URL

Set your application URL in `.env.local`:
```
NEXT_PUBLIC_APP_URL="http://localhost:5000"
```

For production, update this to your actual domain:
```
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## Step 5: OAuth Providers (Optional)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Save the Client ID and Client Secret

### Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Add redirect URIs:
   - `http://localhost:5000/api/auth/callback/microsoft` (development)
   - `https://yourdomain.com/api/auth/callback/microsoft` (production)
5. Go to "Certificates & secrets" and create a new client secret
6. Save the Application (client) ID and client secret

### Add OAuth credentials to `.env.local`:
```
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

MICROSOFT_CLIENT_ID="your_microsoft_client_id"
MICROSOFT_CLIENT_SECRET="your_microsoft_client_secret"
```

## Authentication Flow

### Sign Up Process

1. User fills out sign-up form (email, username, password, full name)
2. Password is hashed using bcrypt
3. User record is created in database
4. Email verification token is generated
5. Verification email is sent via Resend
6. User clicks verification link
7. Email is marked as verified
8. User can now sign in

### Sign In Process

1. User enters email and password
2. Credentials are verified against database
3. JWT token is generated with user data
4. Token is stored in httpOnly cookie
5. User is redirected to dashboard

### Protected Routes

The middleware (`middleware.ts`) protects these routes:
- `/dashboard`
- `/projects`
- `/tasks`
- `/team`
- `/settings`
- `/reports`
- `/attendance`
- `/billing`
- `/messages`
- `/friends`
- `/timeline`

Unauthenticated users are redirected to `/sign-in`.

## Security Best Practices

1. **JWT Secret**: Use a strong, randomly generated secret in production
2. **Password Hashing**: Passwords are hashed with bcrypt (10 rounds)
3. **HttpOnly Cookies**: JWT tokens are stored in httpOnly cookies to prevent XSS attacks
4. **Session Expiration**: Tokens expire after 7 days
5. **HTTPS**: Always use HTTPS in production
6. **Environment Variables**: Never commit `.env.local` to version control

## Testing Authentication

1. Start the development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:5000/sign-up`

3. Create a test account

4. Check your email for the verification link

5. Verify your email

6. Sign in at `http://localhost:5000/sign-in`

7. You should be redirected to the dashboard

## Troubleshooting

### Email not sending
- Check your RESEND_API_KEY is correct
- Verify your sending domain is verified in Resend
- Check the Resend dashboard for error logs

### JWT errors
- Ensure JWT_SECRET is set in `.env.local`
- Clear browser cookies and try again
- Check that the secret is at least 32 characters

### Database connection errors
- Verify DATABASE_URL is correct
- Check that your database is running
- Ensure migrations have been run

### OAuth issues
- Verify redirect URIs match exactly (including trailing slashes)
- Check that client ID and secret are correct
- Ensure the OAuth app is not in restricted mode

## Additional Resources

- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)
- [Jose JWT Library](https://github.com/panva/jose)
- [Resend Documentation](https://resend.com/docs)
- [Drizzle ORM Guide](https://orm.drizzle.team/docs/overview)

