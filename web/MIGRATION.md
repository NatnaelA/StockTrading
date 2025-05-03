# Firebase to Supabase Migration Guide

This document provides detailed instructions for migrating your StockTrading application from Firebase to Supabase.

## Why Migrate?

Supabase offers several advantages over Firebase:

1. **Simplified Architecture**: Supabase provides a more straightforward architecture with PostgreSQL at its core.
2. **Developer Experience**: Better developer tools, local development experience, and more predictable pricing.
3. **SQL Access**: Direct SQL access to your database, providing more flexibility.
4. **Open Source**: Supabase is open source and can be self-hosted if needed.

## Prerequisites

Before starting the migration, ensure you have:

1. A Supabase account and project created
2. Your Supabase project credentials (URL, anon key, service role key)
3. Node.js 14+ installed
4. Firebase credentials for data migration

## Step 1: Update Environment Variables

Update your `.env.local` file with Supabase credentials:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Step 2: Set Up Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `/supabase/migrations/20240528000000_create_schema.sql`
3. Run the SQL script to create all necessary tables and security policies

Alternatively, if you have the Supabase CLI installed:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

## Step 3: Configure Authentication

1. In the Supabase dashboard, go to Authentication > Settings
2. Configure the Site URL to match your application URL
3. Enable Email/Password sign-in
4. If using Google OAuth:
   - Go to Providers > Google
   - Enable Google sign-in
   - Configure your Google OAuth credentials
   - Add the Supabase redirect URL to your Google OAuth configuration

## Step 4: Migrate Data (Optional)

To migrate your existing Firebase data to Supabase:

1. Install required dependencies:

   ```bash
   npm install dotenv ts-node firebase-admin @supabase/supabase-js
   ```

2. Create a Firebase service account key and reference it in your `.env.local` file:

   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json
   # OR
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   ```

3. Run the migration script:
   ```bash
   cd scripts
   ts-node migrate-firebase-to-supabase.ts
   ```

Note: The migration script requires custom SQL execution functions in Supabase. You may need to create these functions in the SQL editor:

```sql
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 5: Test Your Application

1. Run the development server:

   ```bash
   npm run dev
   ```

2. Test the following functionality:
   - User registration
   - User login (email/password and Google)
   - Profile management
   - Portfolio operations
   - Stock transactions

## Troubleshooting

### Authentication Issues

If users can't log in after migration:

- Check Supabase authentication logs
- Verify OAuth configuration
- Confirm your application is using the correct Supabase client

### Data Migration Issues

- Verify schema compatibility
- Check Supabase RLS policies
- Ensure service role key has necessary permissions

### API Errors

- Check for Firebase-specific code patterns that need updating
- Verify correct Supabase API usage
- Test API endpoints individually

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
