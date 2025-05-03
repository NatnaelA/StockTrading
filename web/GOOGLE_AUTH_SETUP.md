# Setting Up Google Authentication with Supabase

This guide will walk you through the process of setting up Google OAuth for your StockTrading application using Supabase.

## Prerequisites

1. A Google Cloud Platform account
2. A Supabase project
3. Your StockTrading project set up locally

## Step 1: Configure Google Cloud Platform

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "OAuth consent screen"
   - Set the User Type to "External" (unless your app is just for internal users)
   - Fill in the required fields (App name, User support email, Developer contact information)
   - Add the following scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Save and continue
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" and select "OAuth Client ID"
6. Select "Web application" as the application type
7. Add the following to the "Authorized JavaScript origins":
   - Your local development URL (e.g., `http://localhost:3000`)
   - Your production URL when you deploy (e.g., `https://yourdomain.com`)
8. Add the following to the "Authorized redirect URIs":
   - `https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://yourdomain.com/auth/callback` (for production)
9. Click "Create" to generate your Client ID and Client Secret
10. Make note of the Client ID and Client Secret as you'll need them in the next step

## Step 2: Configure Supabase Auth Provider

1. Go to your [Supabase Dashboard](https://app.supabase.io/)
2. Select your project
3. Navigate to "Authentication" > "Providers"
4. Find "Google" in the list of providers and enable it
5. Enter your Google OAuth Client ID and Client Secret obtained in Step 1
6. Save the changes

## Step 3: Update Your Environment Variables

1. In your project directory, make sure your `.env.local` file contains the necessary variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Change for production
```

## Step 4: Test the Authentication Flow

1. Run your application locally:
   ```
   npm run dev
   ```
2. Open your browser and navigate to `http://localhost:3000/login`
3. Click "Sign in with Google" and follow the OAuth flow
4. You should be redirected back to your application and signed in

## Troubleshooting

### Common Issues:

1. **Redirect URI Mismatch**: Ensure that the redirect URIs in your Google Cloud Console match exactly what Supabase is expecting.

2. **CORS Issues**: If you're experiencing CORS errors, double-check that your "Authorized JavaScript origins" in Google Cloud Console include your application's domain.

3. **Missing Scopes**: If user information is not being returned correctly, ensure you've enabled the required scopes in the OAuth consent screen.

4. **Invalid Client ID**: If you're getting errors about an invalid client ID, check that you've correctly added your Google Client ID to your environment variables.

5. **Cookie Issues**: If you're having problems with session persistence, check your cookie settings in the Next.js configuration.

## Pre-built vs Application Code Approach

This implementation uses Google's pre-built sign-in buttons for a more streamlined user experience. If you prefer to use your own custom buttons, you'll need to modify the `GoogleSignIn.tsx` component to use Supabase's `signInWithOAuth` method instead of the pre-built approach.
