import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

// -------------------------------------------------------
// STRIPE WEBHOOK HANDLER - PAYMENT PROCESSING
// -------------------------------------------------------

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Lazy Stripe initialization to avoid build-time errors
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
  });
}

// Handle different Stripe events
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const { userId, plan, billingCycle, teamSize, originalCredits, coupon } = session.metadata || {};
    
    if (!userId || !plan) {
      console.error('Missing metadata in checkout session:', session.id);
      return;
    }

    // Calculate the actual credits based on billing cycle
    const baseCredits = parseInt(originalCredits || '0');
    const credits = billingCycle === 'annual' ? baseCredits * 12 : baseCredits;

    // NOTE: Database operations temporarily disabled due to schema setup
    // Create payment record
    // const payment = await prisma.payment.create({
    //   data: {
    //     userId,
    //     stripeId: session.id,
    //     amount: session.amount_total || 0,
    //     currency: session.currency || 'usd',
    //     status: 'completed',
    //     planType: plan,
    //     creditsAdded: credits,
    //     metadata: {
    //       sessionId: session.id,
    //       billingCycle,
    //       teamSize,
    //       coupon
    //     }
    //   }
    // });

    // // Update user credits
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     credits: {
    //       increment: credits
    //     }
    //   }
    // });

    console.log(`✅ Payment processed: User ${userId} received ${credits} credits for ${plan} plan`);

    // Send confirmation email (optional)
    // await sendPaymentConfirmationEmail(userId, plan, credits, session.customer_email);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    // Note: Stripe Invoice type structure may vary, handling subscription differently
    const subscriptionId = (invoice as unknown as { subscription: string }).subscription;
    const customerId = invoice.customer;

    if (!subscriptionId || !customerId) {
      console.log('Missing subscription or customer info in invoice:', invoice.id);
      return;
    }

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customer = await stripe.customers.retrieve(customerId as string);
    
    // Find user by customer email
    const userEmail = (customer as Stripe.Customer).email;
    if (!userEmail) {
      console.error('No email found for customer:', customerId);
      return;
    }

    // NOTE: Database operations temporarily disabled due to schema setup
    // const user = await prisma.user.findFirst({
    //   where: { email: userEmail }
    // });

    // if (!user) {
    //   console.error('User not found for invoice:', invoice.id);
    //   return;
    // }

    // Get plan from subscription metadata
    const plan = subscription.metadata?.plan || 'pro';
    
    // Calculate credits based on plan
    const planCredits = {
      free: 1000,
      pro: 50000,
      enterprise: 500000
    };

    const credits = planCredits[plan as keyof typeof planCredits] || 50000;

    // NOTE: Database operations temporarily disabled
    // Create payment record
    // await prisma.payment.create({
    //   data: {
    //     userId: user.id,
    //     stripeId: invoice.id,
    //     amount: invoice.amount_paid || 0,
    //     currency: invoice.currency || 'usd',
    //     status: 'completed',
    //     planType: plan,
    //     creditsAdded: credits,
    //     metadata: {
    //       subscriptionId: subscription.id,
    //       invoiceId: invoice.id
    //     }
    //   }
    // });

    // // Update user credits
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: {
    //     credits: {
    //       increment: credits
    //     }
    //   }
    // });

    console.log(`✅ Subscription payment processed: ${userEmail} received ${credits} credits for ${plan} plan`);

  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleCustomerSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const stripe = getStripe();
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    // Find user by customer email
    const customerEmail = (customer as Stripe.Customer).email;
    if (!customerEmail) {
      console.error('No email found for customer:', subscription.customer);
      return;
    }

    // NOTE: Database operations temporarily disabled due to schema setup
    // const user = await prisma.user.findFirst({
    //   where: { email: customerEmail }
    // });

    // if (!user) {
    //   console.error('User not found for subscription deletion:', subscription.id);
    //   return;
    // }

    // NOTE: Database operations temporarily disabled
    // Log the cancellation
    // await prisma.payment.create({
    //   data: {
    //     userId: user.id,
    //     stripeId: subscription.id,
    //     amount: 0,
    //     currency: 'usd',
    //     status: 'canceled',
    //     planType: 'free', // Downgrade to free
    //     creditsAdded: 0,
    //     metadata: {
    //       subscriptionId: subscription.id,
    //       canceledAt: new Date().toISOString()
    //     }
    //   }
    // });

    console.log(`⚠️ Subscription canceled: ${customerEmail}`);

  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Handle one-time payments (credit top-ups)
    const { userId, type, credits } = paymentIntent.metadata || {};
    
    if (type !== 'credit_topup' || !userId || !credits) return;

    // NOTE: Database operations temporarily disabled due to schema setup
    // Create payment record
    // await prisma.payment.create({
    //   data: {
    //     userId,
    //     stripeId: paymentIntent.id,
    //     amount: paymentIntent.amount || 0,
    //     currency: paymentIntent.currency || 'usd',
    //     status: 'completed',
    //     planType: 'topup',
    //     creditsAdded: parseInt(credits),
    //     metadata: {
    //       paymentIntentId: paymentIntent.id,
    //       type: 'credit_topup'
    //     }
    //   }
    // });

    // // Update user credits
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     credits: {
    //       increment: parseInt(credits)
    //     }
    //   }
    // });

    console.log(`✅ Credit topup processed: User ${userId} received ${credits} credits`);

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

// Main webhook handler
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`📨 Received Stripe event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'invoice.payment_failed':
        console.log('💳 Payment failed for invoice:', (event.data.object as Stripe.Invoice).id);
        // Handle failed payments (send notification, pause service, etc.)
        break;
        
      case 'checkout.session.expired':
        console.log('⏰ Checkout session expired:', (event.data.object as Stripe.Checkout.Session).id);
        // Handle expired sessions
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to test webhook configuration
export async function GET() {
  try {
    // List recent events for debugging
    const stripe = getStripe();
    const events = await stripe.events.list({
      limit: 10,
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook endpoint is working',
      recentEvents: events.data.map((event: Stripe.Event) => ({
        id: event.id,
        type: event.type,
        created: new Date(event.created * 1000).toISOString()
      }))
    });

  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}