"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { useUser } from '@/context/UserContext';

interface PlanInfo {
  name: string;
  price: number;
  features: string[];
  description: string;
}

export default function CheckoutPage() {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();

  // Available plans
  const plans: Record<string, PlanInfo> = {
    pro: {
      name: "Pro",
      price: 999, // $9.99 in cents
      features: [
        "50,000 words/month",
        "Advanced AI detection",
        "Enhanced grammar checking",
        "All rewrite modes",
        "Priority support"
      ],
      description: "Perfect for daily professional usage with advanced features."
    },
    enterprise: {
      name: "Enterprise",
      price: 4999, // $49.99 in cents
      features: [
        "Unlimited words",
        "Premium AI detection",
        "Custom models",
        "Team management",
        "Dedicated support"
      ],
      description: "Scale your content creation with premium features and support."
    }
  };

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      router.push('/login');
      return;
    }

    // Get plan from URL params
    const planParam = searchParams.get('plan');
    if (planParam && plans[planParam]) {
      // Use setTimeout to avoid synchronous state update
      setTimeout(() => {
        setPlan(plans[planParam]);
        setLoading(false);
      }, 0);
    } else {
      setTimeout(() => {
        setError('Invalid plan selected');
        setLoading(false);
      }, 0);
    }
  }, [user, router, searchParams]);

  const handleCheckout = async () => {
    if (!plan || !user) return;

    setPaymentStatus('processing');
    setError(null);

    try {
      // Call payment API to create checkout session
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: plan.name.toLowerCase(),
          billingCycle: 'monthly',
          teamSize: 1
        })
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
        setPaymentStatus('error');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Network error. Please try again.');
      setPaymentStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600 mt-4">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 px-4">
        <PremiumCard title="Error" gradient="from-red-50 to-red-100">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
            <PremiumButton
              onClick={() => router.push('/pricing')}
              size="sm"
              className="mt-4"
            >
              Back to Pricing
            </PremiumButton>
          </div>
        </PremiumCard>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-md mx-auto mt-12 px-4">
        <PremiumCard title="Invalid Plan" gradient="from-slate-50 to-slate-100">
          <div className="text-center py-8">
            <p className="text-slate-600">The selected plan is not available.</p>
            <PremiumButton
              onClick={() => router.push('/pricing')}
              size="sm"
              className="mt-4"
            >
              View Available Plans
            </PremiumButton>
          </div>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Upgrade to {plan.name}</h1>
        <p className="text-slate-600 mt-2">Complete your purchase to unlock premium features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan Summary */}
        <PremiumCard
          title={`${plan.name} Plan`}
          subtitle="Plan Summary"
          gradient="from-indigo-50 to-purple-50"
        >
          <div className="space-y-4">
            <div>
              <div className="text-sm text-slate-600">Price</div>
              <div className="text-2xl font-bold text-slate-900">
                ${(plan.price / 100).toFixed(2)} <span className="text-sm font-normal text-slate-500">/month</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-600">Features</div>
              <ul className="text-sm text-slate-700 space-y-1 mt-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm text-slate-600">Description</div>
              <p className="text-sm text-slate-700 mt-1">{plan.description}</p>
            </div>
          </div>
        </PremiumCard>

        {/* Payment Method */}
        <PremiumCard
          title="Payment Method"
          subtitle="Secure Checkout"
          gradient="from-emerald-50 to-teal-50"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <div className="font-medium text-slate-900">Stripe</div>
                <div className="text-xs text-slate-500">Secure payment processing</div>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              <p>✅ Secure SSL encryption</p>
              <p>✅ PCI compliant</p>
              <p>✅ Money-back guarantee</p>
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* Checkout Button */}
      <div className="mt-8 sticky bottom-6">
        <PremiumButton
          onClick={handleCheckout}
          disabled={paymentStatus === 'processing'}
          size="lg"
          className="w-full"
        >
          {paymentStatus === 'processing' ? (
            <>
              <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="60" strokeDashoffset="20" />
              </svg>
              Processing...
            </>
          ) : 'Complete Purchase'}
        </PremiumButton>

        {paymentStatus === 'error' && (
          <p className="text-red-600 text-sm text-center mt-2">{error}</p>
        )}

        <p className="text-xs text-slate-500 text-center mt-4">
          By completing this purchase, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}