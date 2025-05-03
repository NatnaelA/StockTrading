import { NextRequest, NextResponse } from 'next/server';

const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'AAPL';
    
    console.log('Testing Alpha Vantage API for symbol:', symbol);
    console.log('API Key exists:', !!ALPHA_VANTAGE_API_KEY);
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    const data = await response.json();
    
    return NextResponse.json({
      apiKeyExists: !!ALPHA_VANTAGE_API_KEY,
      apiResponse: data,
      symbol: symbol
    });
  } catch (error) {
    console.error('Error testing Alpha Vantage API:', error);
    return NextResponse.json(
      { error: 'Failed to test Alpha Vantage API', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 