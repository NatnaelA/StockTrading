# StockTrading Web Application

A modern web application for stock trading and portfolio management built with Next.js and Supabase.

## Features

- User authentication with email/password and Google Sign-In
- Portfolio management
- Stock trading simulation
- Real-time data visualization
- Transaction history
- Responsive UI

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Authentication, Database, Storage)
- **Deployment**: Vercel

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16+)
- npm or yarn
- A Supabase account and project

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/stock-trading.git
cd stock-trading/web
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory and add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# For Google Authentication
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Set up Supabase

1. Create a new Supabase project
2. Run the SQL migrations to set up the database schema:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase/migrations/20240528000000_create_schema.sql`
   - Run the SQL in the Supabase SQL Editor

### 5. Configure Supabase Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Set the Site URL to your development URL (e.g., `http://localhost:3000`)
3. Under Redirect URLs, add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/login`
   - `http://localhost:3000/register`

### 6. Set up Google Authentication

Follow the instructions in the `GOOGLE_AUTH_SETUP.md` file to configure Google authentication.

### 7. Run the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### 8. Test your Supabase connection

You can verify your Supabase connection is working correctly by running:

```bash
node scripts/test-supabase-connection.js
```

Or visit the `/auth-test` route in your browser to test authentication.

## Project Structure

```
public/                # Static files
src/
  app/                 # Next.js App Router
    api/               # API routes
    auth/              # Authentication routes
    dashboard/         # Dashboard pages
    login/             # Login page
    register/          # Registration page
  components/          # React components
    auth/              # Authentication components
    trading/           # Trading-related components
  hooks/               # Custom React hooks
  lib/                 # Utilities and libraries
  types/               # TypeScript type definitions
supabase/
  migrations/          # Database migration files
scripts/               # Utility scripts
```

## Authentication Flow

This application uses Supabase for authentication with two methods:

1. **Email/Password**: Traditional sign-up and login flow with email verification
2. **Google Sign-In**: OAuth authentication using Google's identity provider

The authentication flow is managed by custom hooks in `src/hooks/useSupabaseAuth.ts` and protected routes are handled by `src/hooks/useProtectedRoute.ts`.

## Development

### Adding New Database Tables

1. Create a new SQL migration file in the `supabase/migrations` directory
2. Run the migration in the Supabase SQL Editor

### Deploying to Production

1. Update your environment variables on your hosting platform (e.g., Vercel)
2. Deploy the application
3. Update the Site URL and Redirect URLs in your Supabase Auth settings to match your production domain

## Troubleshooting

If you encounter issues with authentication:

1. Check that your environment variables are correctly set
2. Verify your Supabase Auth settings and redirect URLs
3. For Google Sign-In issues, make sure your Google Cloud Console project is configured correctly
4. Check browser console for errors

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
