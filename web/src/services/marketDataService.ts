import { env } from '@/env';

export interface MarketData {
  symbol: string;
  latestPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number;
  isUSMarket: boolean;
  primaryExchange: string;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketIndicators {
  rsi: number;  // Relative Strength Index
  sma: number;  // Simple Moving Average
  ema: number;  // Exponential Moving Average
  macd: {       // Moving Average Convergence Divergence
    macd: number;
    signal: number;
    histogram: number;
  };
}

class MarketDataService {
  private readonly baseUrl = 'https://cloud.iexapis.com/stable';
  private readonly apiKey = env.NEXT_PUBLIC_IEX_API_KEY;
  private readonly marketHours = {
    open: 9.5,   // 9:30 AM EST
    close: 16,   // 4:00 PM EST
    timezone: 'America/New_York'
  };

  async getQuote(symbol: string): Promise<MarketData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/stock/${symbol}/quote?token=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stock quote');
      }

      const data = await response.json();
      return {
        symbol: data.symbol,
        latestPrice: data.latestPrice,
        previousClose: data.previousClose,
        change: data.change,
        changePercent: data.changePercent,
        high: data.high,
        low: data.low,
        volume: data.volume,
        marketCap: data.marketCap,
        isUSMarket: data.isUSMarket,
        primaryExchange: data.primaryExchange
      };
    } catch (error) {
      console.error('Error fetching stock quote:', error);
      throw error;
    }
  }

  async getHistoricalData(symbol: string, range: '1m' | '3m' | '6m' | '1y' | '2y' = '1m'): Promise<HistoricalData[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/stock/${symbol}/chart/${range}?token=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }

      const data = await response.json();
      return data.map((item: any) => ({
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }));
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  async getMarketIndicators(symbol: string): Promise<MarketIndicators> {
    try {
      const [rsiResponse, smaResponse, emaResponse, macdResponse] = await Promise.all([
        fetch(`${this.baseUrl}/stock/${symbol}/indicator/rsi?range=1m&token=${this.apiKey}`),
        fetch(`${this.baseUrl}/stock/${symbol}/indicator/sma?range=1m&token=${this.apiKey}`),
        fetch(`${this.baseUrl}/stock/${symbol}/indicator/ema?range=1m&token=${this.apiKey}`),
        fetch(`${this.baseUrl}/stock/${symbol}/indicator/macd?range=1m&token=${this.apiKey}`)
      ]);

      const [rsiData, smaData, emaData, macdData] = await Promise.all([
        rsiResponse.json(),
        smaResponse.json(),
        emaResponse.json(),
        macdResponse.json()
      ]);

      return {
        rsi: rsiData.indicator[rsiData.indicator.length - 1],
        sma: smaData.indicator[smaData.indicator.length - 1],
        ema: emaData.indicator[emaData.indicator.length - 1],
        macd: {
          macd: macdData.indicator[macdData.indicator.length - 1].macd,
          signal: macdData.indicator[macdData.indicator.length - 1].signal,
          histogram: macdData.indicator[macdData.indicator.length - 1].histogram
        }
      };
    } catch (error) {
      console.error('Error fetching market indicators:', error);
      throw error;
    }
  }

  async validateTradePrice(symbol: string, price: number, type: 'market' | 'limit' | 'stop'): Promise<{ isValid: boolean; reason?: string }> {
    try {
      const quote = await this.getQuote(symbol);
      
      if (type === 'market') {
        return { isValid: true };
      }

      // For limit and stop orders, check if the price is within 10% of current market price
      const priceDifference = Math.abs(quote.latestPrice - price);
      const percentDifference = (priceDifference / quote.latestPrice) * 100;
      
      if (percentDifference > 10) {
        return { 
          isValid: false, 
          reason: `Price deviation of ${percentDifference.toFixed(2)}% exceeds 10% limit`
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating trade price:', error);
      throw error;
    }
  }

  async validateTrade(symbol: string, quantity: number, side: 'buy' | 'sell', type: 'market' | 'limit' | 'stop', price?: number): Promise<{ isValid: boolean; reason?: string }> {
    try {
      // Check if market is open
      const marketStatus = await this.getMarketStatus();
      if (!marketStatus.isOpen) {
        return { 
          isValid: false, 
          reason: `Market is ${marketStatus.status}. Trading hours: ${this.marketHours.open}:30 AM - ${this.marketHours.close}:00 PM EST`
        };
      }

      // Get quote data
      const quote = await this.getQuote(symbol);

      // Validate US market securities only
      if (!quote.isUSMarket) {
        return {
          isValid: false,
          reason: 'Only US market securities are supported'
        };
      }

      // Validate minimum quantity
      if (quantity < 1) {
        return {
          isValid: false,
          reason: 'Quantity must be at least 1'
        };
      }

      // Validate price for limit orders
      if (type === 'limit' && price) {
        const priceValidation = await this.validateTradePrice(symbol, price, type);
        if (!priceValidation.isValid) {
          return priceValidation;
        }
      }

      // Get market indicators for additional validation
      const indicators = await this.getMarketIndicators(symbol);

      // Add warning if RSI indicates overbought/oversold conditions
      if (indicators.rsi > 70 && side === 'buy') {
        return {
          isValid: true,
          reason: 'Warning: Stock may be overbought (RSI > 70)'
        };
      } else if (indicators.rsi < 30 && side === 'sell') {
        return {
          isValid: true,
          reason: 'Warning: Stock may be oversold (RSI < 30)'
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating trade:', error);
      throw error;
    }
  }

  async getMarketStatus(): Promise<{ isOpen: boolean; status: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/status?token=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch market status');
      }

      const data = await response.json();
      
      // Get current time in EST
      const now = new Date();
      const estTime = new Date(now.toLocaleString('en-US', { timeZone: this.marketHours.timezone }));
      const currentHour = estTime.getHours() + estTime.getMinutes() / 60;

      // Check if it's a weekday
      const isWeekday = estTime.getDay() > 0 && estTime.getDay() < 6;
      
      // Check if within trading hours
      const isDuringTradingHours = currentHour >= this.marketHours.open && currentHour < this.marketHours.close;

      return {
        isOpen: data.status === 'open' && isWeekday && isDuringTradingHours,
        status: data.status
      };
    } catch (error) {
      console.error('Error fetching market status:', error);
      throw error;
    }
  }
}

export const marketDataService = new MarketDataService(); 