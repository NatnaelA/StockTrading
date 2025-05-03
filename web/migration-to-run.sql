-- Create public schema
CREATE SCHEMA IF NOT EXISTS public;

-- Enable Row Level Security (RLS)
-- ALTER SCHEMA public REPLICA IDENTITY FULL;

-- Users Table Extension (for user profiles)
-- Note: auth.users is created automatically by Supabase
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  phone_number TEXT,
  account_type TEXT CHECK (account_type IN ('individual', 'broker')),
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'individual',
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  email_verified BOOLEAN DEFAULT FALSE,
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Portfolios Table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  balance DECIMAL(18, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  holdings JSONB DEFAULT '{}'::jsonb,
  total_value DECIMAL(18, 2) DEFAULT 0,
  day_change DECIMAL(18, 2) DEFAULT 0,
  day_change_percentage DECIMAL(8, 4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Stocks Table
CREATE TABLE IF NOT EXISTS public.stocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  exchange TEXT,
  current_price DECIMAL(18, 2),
  day_change DECIMAL(18, 2),
  day_change_percentage DECIMAL(8, 4),
  last_updated TIMESTAMP WITH TIME ZONE
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
  stock_symbol TEXT,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL', 'DEPOSIT', 'WITHDRAW')),
  quantity DECIMAL(16, 6),
  price DECIMAL(18, 2),
  fee DECIMAL(18, 2) DEFAULT 0,
  total_amount DECIMAL(18, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
  notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for portfolios table
CREATE POLICY "Users can view their own portfolios"
  ON public.portfolios
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolios"
  ON public.portfolios
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios"
  ON public.portfolios
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios"
  ON public.portfolios
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for stocks table (public read)
CREATE POLICY "Stocks are viewable by all users"
  ON public.stocks
  FOR SELECT
  USING (true);

-- Create policies for transactions table
CREATE POLICY "Users can view their own transactions"
  ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to tables with updated_at column
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 
