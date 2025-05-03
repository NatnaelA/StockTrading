import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
// @ts-ignore
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
});

export async function POST(request: Request) {
  try {
    // Create a Supabase client with cookie-based auth
    const supabase = createServerSupabaseClient();
    
    // Get the current authenticated user
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = authData.session.user.id;
    const data = await request.json();
    const { amount, portfolioId, currency = 'usd' } = data;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Fetch the user's primary portfolio (assuming one for now)
    // If multiple portfolios are allowed, the client should specify which one.
    const { data: userPortfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle if user might not have a portfolio yet

    if (portfolioError) {
      console.error('[API /payments/deposit] Error fetching portfolio:', portfolioError);
      return NextResponse.json(
        { error: 'Failed to fetch portfolio' },
        { status: 500 }
      );
    }

    if (!userPortfolio) {
      console.error('[API /payments/deposit] Portfolio not found for user:', userId);
      // A portfolio MUST exist before depositing.
      // This should have been created after profile completion.
      return NextResponse.json(
        { error: 'Portfolio not found. Please complete your profile or contact support.' },
        { status: 404 } // Not Found or Bad Request (400)
      );
    }

    const actualPortfolioId = userPortfolio.id;
    console.log(`[API /payments/deposit] Using portfolio ID: ${actualPortfolioId} for user: ${userId}`);

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        portfolio_id: actualPortfolioId,
        type: 'DEPOSIT',
        total_amount: amount,
        status: 'PENDING',
        date: new Date().toISOString(),
        notes: 'Stripe payment processing'
      })
      .select()
      .single();
      
    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create transaction record' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'Portfolio Deposit',
              description: `Deposit to portfolio ${actualPortfolioId}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portfolio/${actualPortfolioId}/deposit?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/portfolio/${actualPortfolioId}/deposit?canceled=true`,
      metadata: {
        transactionId: transaction.id,
        portfolioId: actualPortfolioId,
        userId,
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      transactionId: transaction.id,
      portfolioId: actualPortfolioId, // Return the actual portfolio ID used (might be new)
      portfolioCreated: userPortfolio !== undefined && portfolioId !== actualPortfolioId, // Indicate if a new portfolio was created
    });
  } catch (error) {
    console.error('Error processing deposit:', error);
    return NextResponse.json(
      { error: 'Failed to process deposit' },
      { status: 500 }
    );
  }
} 