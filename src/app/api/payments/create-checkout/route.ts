import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// -------------------------------------------------------
// ADVANCED PAYMENT SYSTEM - SUPERIOR TO QUILLBOT
// -------------------------------------------------------

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const _CF_API_KEY = process.env.CLOUDFLARE_API_KEY || process.env.CLOUDFLARE_API_TOKEN;
const _CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

// Enhanced pricing plans
const PRICING_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    credits: 1000,
    features: ['1,000 words/month', 'Basic AI detection', 'Grammar checking', '3 rewrite modes'],
    stripePriceId: null
  },
  pro: {
    name: 'Pro',
    price: 999, // $9.99 in cents
    credits: 50000,
    features: ['50,000 words/month', 'Advanced AI detection', 'Enhanced grammar', 'All rewrite modes', 'Priority support'],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID
  },
  enterprise: {
    name: 'Enterprise',
    price: 4999, // $49.99 in cents
    credits: 500000,
    features: ['500,000 words/month', 'Premium AI detection', 'Custom models', 'Team management', 'API access', 'Dedicated support'],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID
  }
};

// Type definitions
interface CreateCheckoutRequest {
  plan: 'free' | 'pro' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  coupon?: string;
  teamSize?: number;
}

interface CreateCheckoutResponse {
  success: boolean;
  sessionId?: string;
  url?: string | null;
  error?: string;
  message?: string;
}

// Validate coupon codes
async function validateCoupon(couponCode: string): Promise<{ valid: boolean; discount?: number; message?: string }> {
  const validCoupons = {
    'WELCOME10': { discount: 10, message: '10% off your first month!' },
    'STUDENT20': { discount: 20, message: '20% student discount!' },
    'EARLYBIRD15': { discount: 15, message: '15% early bird discount!' },
    'ENTERPRISE25': { discount: 25, message: '25% enterprise discount!' }
  };

  const coupon = validCoupons[couponCode.toUpperCase() as keyof typeof validCoupons];
  if (coupon) {
    return { valid: true, discount: coupon.discount, message: coupon.message };
  }

  return { valid: false, message: 'Invalid coupon code' };
}

// Calculate pricing with discounts and team sizes
function calculatePricing(plan: string, billingCycle: 'monthly' | 'annual', teamSize: number = 1): { 
  basePrice: number; 
  discountedPrice: number; 
  savings: number;
  credits: number;
} {
  const pricingPlan = PRICING_PLANS[plan as keyof typeof PRICING_PLANS];
  
  if (!pricingPlan) {
    throw new Error('Invalid plan selected');
  }

  let basePrice = pricingPlan.price;
  let credits = pricingPlan.credits;

  // Apply annual discount (15% off)
  if (billingCycle === 'annual') {
    basePrice = basePrice * 12 * 0.85; // 15% discount for annual
    credits = credits * 12; // Double credits for annual
  }

  // Apply team volume discount
  let teamDiscount = 0;
  if (teamSize > 1) {
    if (teamSize >= 10) teamDiscount = 20;
    else if (teamSize >= 5) teamDiscount = 15;
    else if (teamSize >= 3) teamDiscount = 10;
  }

  const discountedPrice = basePrice * (1 - teamDiscount / 100);
  const savings = basePrice - discountedPrice;

  return {
    basePrice,
    discountedPrice,
    savings,
    credits
  };
}

// Create Stripe checkout session
async function createStripeCheckout(
  userId: string,
  email: string,
  plan: string,
  billingCycle: 'monthly' | 'annual',
  teamSize: number,
  coupon?: string
): Promise<CreateCheckoutResponse> {
  try {
    const pricing = calculatePricing(plan, billingCycle, teamSize);
    
    let couponId: string | undefined;
    
    // Validate and apply coupon
    if (coupon) {
      const couponValidation = await validateCoupon(coupon);
      if (!couponValidation.valid) {
        return { 
          success: false, 
          error: couponValidation.message 
        };
      }
      
      // Create Stripe coupon
      const stripeCoupon = await stripe.coupons.create({
        percent_off: couponValidation.discount,
        duration: 'once',
        name: coupon
      });
      couponId = stripeCoupon.id;
    }

    // Prepare metadata for the session
    const sessionMetadata = {
      userId,
      plan,
      billingCycle,
      teamSize: teamSize.toString(),
      originalCredits: pricing.credits.toString(),
      coupon: coupon || 'none'
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `UngenAI ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: `${pricing.credits.toLocaleString()} words per month`,
              images: [`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`]
            },
            unit_amount: Math.round(pricing.discountedPrice / (billingCycle === 'annual' ? 12 : 1)),
            recurring: {
              interval: billingCycle === 'annual' ? 'year' : 'month'
            }
          },
          quantity: 1,
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      customer_email: email,
      metadata: sessionMetadata,
      discounts: couponId ? [{ coupon: couponId }] : undefined,
      subscription_data: {
        metadata: sessionMetadata
      }
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url
    };

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return {
      success: false,
      error: 'Failed to create checkout session. Please try again.'
    };
  }
}

// Create one-time payment for credit top-up
async function createCreditTopupCheckout(
  userId: string,
  email: string,
  credits: number
): Promise<CreateCheckoutResponse> {
  try {
    // Pricing: $0.02 per 1,000 words (much better than QuillBot's $0.03)
    const pricePerThousand = 20; // $0.02 in cents
    const amount = Math.ceil(credits / 1000) * pricePerThousand;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `UngenAI Credit Top-up`,
              description: `${credits.toLocaleString()} writing credits`,
              images: [`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`]
            },
            unit_amount: amount,
          },
          quantity: 1,
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?topup_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?topup_canceled=true`,
      customer_email: email,
      metadata: {
        userId,
        type: 'credit_topup',
        credits: credits.toString()
      }
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url
    };

  } catch (error) {
    console.error('Credit topup checkout error:', error);
    return {
      success: false,
      error: 'Failed to create topup session. Please try again.'
    };
  }
}

// Main API endpoint
export async function POST(req: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const body = await req.json();
    const { plan, billingCycle = 'monthly', coupon, teamSize = 1, type = 'subscription' }: 
      CreateCheckoutRequest & { type?: 'subscription' | 'topup' } = body;

    if (!plan || !['free', 'pro', 'enterprise'].includes(plan)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid plan selected' 
      }, { status: 400 });
    }

    // Handle free plan
    if (plan === 'free') {
      // Just upgrade user to free plan without payment
      await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: PRICING_PLANS.free.credits
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Free plan activated successfully!',
        url: '/dashboard'
      });
    }

    // Handle credit topup
    if (type === 'topup') {
      const credits = body.credits || 10000; // Default 10k credits
      const result = await createCreditTopupCheckout(user.id, user.email!, credits);
      
      return NextResponse.json(result);
    }

    // Handle subscription plans
    const result = await createStripeCheckout(
      user.id,
      user.email!,
      plan,
      billingCycle,
      teamSize,
      coupon
    );

    // Log payment attempt
    try {
      await prisma.payment.create({
        data: {
          userId: user.id,
          amount: result.sessionId ? 0 : 0, // Will be updated by webhook
          status: 'pending',
          planType: plan,
          creditsAdded: calculatePricing(plan, billingCycle, teamSize).credits
        }
      });
    } catch (dbError) {
      console.error('Failed to log payment attempt:', dbError);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Payment creation error:', error);
    const errorMessage = error instanceof Error ? error.message : "Payment creation failed";
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to get current plan and usage
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        credits: true,
        createdAt: true
      }
    });

    if (!userRecord) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Get payment history
    const paymentHistory = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get current subscription (if any)
    // This would typically come from Stripe webhook data
    
    const currentPlan = userRecord.credits >= 500000 ? 'enterprise' :
                       userRecord.credits >= 50000 ? 'pro' : 'free';

    return NextResponse.json({
      success: true,
      plan: currentPlan,
      credits: userRecord.credits,
      memberSince: userRecord.createdAt,
      paymentHistory: paymentHistory.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        planType: payment.planType,
        createdAt: payment.createdAt
      })),
      availablePlans: Object.entries(PRICING_PLANS).map(([key, plan]) => ({
        id: key,
        name: plan.name,
        price: plan.price,
        features: plan.features,
        credits: plan.credits
      }))
    });

  } catch (error) {
    console.error('Payment info error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment information" },
      { status: 500 }
    );
  }
}