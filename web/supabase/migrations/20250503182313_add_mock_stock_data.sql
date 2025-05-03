-- Insert mock stock data

INSERT INTO public.stocks (symbol, name, exchange, current_price, day_change, day_change_percentage, last_updated)
VALUES 
    ('AAPL', 'Apple Inc.', 'NASDAQ', 170.33, 1.50, 0.89, timezone('utc', now())),
    ('GOOGL', 'Alphabet Inc.', 'NASDAQ', 155.60, -0.75, -0.48, timezone('utc', now())),
    ('MSFT', 'Microsoft Corporation', 'NASDAQ', 410.10, 2.40, 0.59, timezone('utc', now())),
    ('AMZN', 'Amazon.com, Inc.', 'NASDAQ', 180.00, -1.20, -0.66, timezone('utc', now())),
    ('TSLA', 'Tesla, Inc.', 'NASDAQ', 175.79, 3.10, 1.79, timezone('utc', now()))
ON CONFLICT (symbol) 
DO UPDATE SET
    name = EXCLUDED.name,
    exchange = EXCLUDED.exchange,
    current_price = EXCLUDED.current_price,
    day_change = EXCLUDED.day_change,
    day_change_percentage = EXCLUDED.day_change_percentage,
    last_updated = EXCLUDED.last_updated;
