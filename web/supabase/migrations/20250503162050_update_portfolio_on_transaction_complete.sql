-- Function to update portfolio based on a completed transaction
CREATE OR REPLACE FUNCTION public.handle_completed_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_portfolio RECORD;
  v_quantity DECIMAL;
  v_cost DECIMAL;
  v_current_quantity DECIMAL;
  v_new_quantity DECIMAL;
BEGIN
  -- Only run logic if the transaction status is 'COMPLETED'
  -- Check both NEW (for INSERT/UPDATE) and OLD (for UPDATE) to handle status changes
  IF NEW.status = 'COMPLETED' AND (TG_OP = 'INSERT' OR NEW.status <> OLD.status) THEN

    -- Check if it's a BUY or SELL transaction
    IF NEW.type = 'BUY' OR NEW.type = 'SELL' THEN
    
      -- Get the relevant portfolio
      SELECT * INTO v_portfolio FROM public.portfolios WHERE id = NEW.portfolio_id;

      -- If portfolio not found, raise an error or log?
      IF NOT FOUND THEN
        RAISE WARNING 'Portfolio not found for transaction %', NEW.id;
        RETURN NULL; -- Or raise exception?
      END IF;

      -- Calculate cost (positive for BUY, negative for SELL)
      v_quantity := NEW.quantity;
      v_cost := NEW.total_amount; -- Use total_amount which should include price * quantity + fees

      IF NEW.type = 'BUY' THEN
        -- Decrease balance
        v_portfolio.balance := v_portfolio.balance - v_cost;

        -- Update holdings: Add shares
        v_current_quantity := COALESCE((v_portfolio.holdings ->> NEW.stock_symbol)::DECIMAL, 0);
        v_new_quantity := v_current_quantity + v_quantity;
        v_portfolio.holdings := v_portfolio.holdings || jsonb_build_object(NEW.stock_symbol, v_new_quantity);

      ELSIF NEW.type = 'SELL' THEN
        -- Increase balance
        v_portfolio.balance := v_portfolio.balance + v_cost;

        -- Update holdings: Subtract shares
        v_current_quantity := COALESCE((v_portfolio.holdings ->> NEW.stock_symbol)::DECIMAL, 0);
        v_new_quantity := v_current_quantity - v_quantity;

        -- Remove holding if quantity is zero or less, otherwise update
        IF v_new_quantity <= 0 THEN
            v_portfolio.holdings := v_portfolio.holdings - NEW.stock_symbol;
        ELSE
            v_portfolio.holdings := v_portfolio.holdings || jsonb_build_object(NEW.stock_symbol, v_new_quantity);
        END IF;
      END IF;

      -- Update the portfolio table
      UPDATE public.portfolios
      SET 
        balance = v_portfolio.balance,
        holdings = v_portfolio.holdings,
        updated_at = timezone('utc', now())
      WHERE id = v_portfolio.id;
      
      RAISE LOG 'Portfolio % updated for transaction %', v_portfolio.id, NEW.id;

    END IF; -- End check for BUY/SELL type
  
  END IF; -- End check for COMPLETED status

  RETURN NEW; -- Return NEW for INSERT/UPDATE triggers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a transaction is inserted or updated
CREATE TRIGGER on_transaction_completed
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_completed_transaction();

-- Optional: Add comment to describe the function and trigger
COMMENT ON FUNCTION public.handle_completed_transaction() IS 'Updates the portfolio balance and holdings when a transaction status changes to COMPLETED.';
COMMENT ON TRIGGER on_transaction_completed ON public.transactions IS 'Calls handle_completed_transaction function after insert or update on transactions table if status is COMPLETED.';
