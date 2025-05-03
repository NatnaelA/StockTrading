# Setting Up Your Supabase Database

Follow these steps to set up your Supabase database schema:

## Step 1: Log in to Supabase Dashboard

1. Go to [https://app.supabase.io/](https://app.supabase.io/)
2. Sign in to your account
3. Select the project you created

## Step 2: Get Your Project Credentials

1. In the Supabase dashboard, go to Project Settings > API
2. Copy the following values:

   - Project URL
   - anon/public key
   - service_role key (keep this secret!)

3. Update your `.env.local` file with these values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Step 3: Set Up Database Schema

### Option 1: Using the SQL Editor

1. In the Supabase dashboard, go to the SQL Editor
2. Click "New Query"
3. Copy and paste the contents of the migration file:
   ```
   /Users/natnaelbelay/StockTrading/web/supabase/migrations/20240528000000_create_schema.sql
   ```
4. Run the SQL query to create all tables and policies

### Option 2: Using Supabase CLI (Advanced)

If you have the Supabase CLI installed:

1. Install the CLI if you haven't already:

   ```bash
   npm install -g supabase
   ```

2. Link your project:

   ```bash
   supabase login
   supabase link --project-ref your-project-reference-id
   ```

3. Push the migrations:
   ```bash
   supabase db push
   ```

## Step 4: Configure Authentication

1. In the Supabase dashboard, go to Authentication > Settings
2. Under Site URL, enter your site URL (use `http://localhost:3000` for local development)
3. Under Redirect URLs, add:

   - `http://localhost:3000/auth/callback` (for development)
   - Your production URL when deployed

4. If you want to use Google OAuth:
   - Go to Authentication > Providers > Google
   - Enable Google Sign-in
   - Set up a Google OAuth application in the Google Cloud Console
   - Add the Client ID and Secret
   - Make sure to add the proper redirect URL to your Google OAuth settings

## Step 5: Start Your Application

Once everything is set up, you can start your application:

```bash
cd /Users/natnaelbelay/StockTrading/web
npm run dev
```

The application should now connect to your Supabase project and use the configured database schema.
