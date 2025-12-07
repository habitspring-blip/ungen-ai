"use client"

import { useState, useEffect } from "react"
import Container from "@/components/ui/Container"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"

type ButtonVariant = "primary" | "subtle" | "ghost" | "gradient"

type Currency = {
  code: string
  symbol: string
  rate: number
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] =
    useState<"monthly" | "annual">("annual")
  const [currency, setCurrency] = useState<Currency>({
    code: "USD",
    symbol: "$",
    rate: 1
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Detect user's country and set currency
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code === 'IN') {
          setCurrency({
            code: "INR",
            symbol: "₹",
            rate: 83 // 1 USD = 83 INR (approximate)
          })
        }
      })
      .catch(() => {
        // Default to USD if detection fails
        setCurrency({
          code: "USD",
          symbol: "$",
          rate: 1
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Base prices in INR for India
  const baseINRPrices = {
    pro: { monthly: 349, annual: Math.round(349 * 12 * 0.83) }, // 17% discount
    enterprise: { monthly: 999, annual: Math.round(999 * 12 * 0.83) } // 17% discount
  }

  // Convert to USD (rounded to whole dollar)
  const baseUSDPrices = {
    pro: { 
      monthly: Math.round(baseINRPrices.pro.monthly / 83), 
      annual: Math.round(baseINRPrices.pro.annual / 83) 
    },
    enterprise: { 
      monthly: Math.round(baseINRPrices.enterprise.monthly / 83), 
      annual: Math.round(baseINRPrices.enterprise.annual / 83) 
    }
  }

  const plans = [
    {
      name: "Free",
      priceINR: { monthly: 0, annual: 0 },
      priceUSD: { monthly: 0, annual: 0 },
      description: "Explore the platform basics.",
      features: ["500 credits total (500 words)", "3 modes", "Basic engine", "Community support"],
      stats: { words: "500", modes: "3", support: "Community" },
      icon: "🌱",
      gradient: "from-emerald-500 to-green-600",
      popular: false,
      buttonVariant: "subtle" as ButtonVariant,
    },
    {
      name: "Student",
      priceINR: { monthly: Math.round(baseINRPrices.pro.monthly * 0.5), annual: Math.round(baseINRPrices.pro.annual * 0.5) }, // 50% discount
      priceUSD: { monthly: Math.round(baseUSDPrices.pro.monthly * 0.5), annual: Math.round(baseUSDPrices.pro.annual * 0.5) },
      description: "Perfect for students and learners.",
      features: [
        "25K words/month",
        "6 modes",
        "Advanced engine",
        "Community support",
        "Student verification required",
      ],
      stats: { words: "25K", modes: "6", support: "Community" },
      icon: "🎓",
      gradient: "from-blue-500 to-indigo-600",
      popular: false,
      buttonVariant: "subtle" as ButtonVariant,
    },
    {
      name: "Pro",
      priceINR: baseINRPrices.pro,
      priceUSD: baseUSDPrices.pro,
      description: "Perfect for daily professional usage.",
      features: [
        "50K words/month",
        "8 modes",
        "Advanced engine",
        "Email support",
        "API access",
      ],
      stats: { words: "50K", modes: "8", support: "Email" },
      icon: "🚀",
      gradient: "from-indigo-500 to-purple-600",
      popular: true,
      buttonVariant: "primary" as ButtonVariant,
    },
  ]

  const getPrice = (plan: typeof plans[0]) => {
    return currency.code === "INR" ? plan.priceINR : plan.priceUSD
  }

  const formatPrice = (price: number) => {
    if (price === 0) return "0"
    return price.toLocaleString()
  }

  const calculateSavings = (plan: typeof plans[0]) => {
    const prices = getPrice(plan)
    const monthlyCost = prices.monthly * 12
    const savings = monthlyCost - prices.annual
    return `${currency.symbol}${formatPrice(savings)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600 mt-4">Loading pricing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">

      <Container className="pt-6 pb-8">

        {/* HERO */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Simple Pricing
          </h1>

          <p className="text-gray-600 text-base max-w-lg mx-auto mt-2">
            Choose a plan that fits your workflow.
          </p>

          {/* Currency indicator */}
          <div className="text-xs text-gray-500 mt-2">
            Prices in {currency.code} {currency.code === "INR" && "🇮🇳"}
          </div>

          {/* BILLING TOGGLE */}
          <div className="mt-4 inline-flex items-center gap-2 p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
            <Button
              variant={billingCycle === "monthly" ? "primary" : "subtle"}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </Button>

            <Button
              variant={billingCycle === "annual" ? "primary" : "subtle"}

              onClick={() => setBillingCycle("annual")}
              className="flex items-center gap-1"
            >
              Annual
              <span className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
                Save 17%
              </span>
            </Button>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`
                relative overflow-hidden p-5 transition-all duration-300
                hover:shadow-lg hover:scale-[1.01]
                ${plan.popular ? "ring-2 ring-indigo-400 shadow-md scale-[1.02]" : ""}
              `}
            >
              {/* ICON */}
              <div
                className={`w-12 h-12 bg-gradient-to-br ${plan.gradient} rounded-xl flex items-center justify-center text-2xl mb-4 shadow-sm`}
              >
                {plan.icon}
              </div>

              {/* NAME */}
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {plan.name}
              </h3>

              <p className="text-gray-600 text-sm mb-4">
                {plan.description}
              </p>

              {/* PRICE */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-3xl font-extrabold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}
                  >
                    {currency.symbol}{formatPrice(getPrice(plan)[billingCycle])}
                  </span>
                  <span className="text-gray-500 text-sm">
                    /{billingCycle === "monthly" ? "mo" : "yr"}
                  </span>
                </div>

                {billingCycle === "annual" && plan.name !== "Free" && (
                  <div className="text-xs text-green-600 font-semibold mt-1">
                    Save {calculateSavings(plan)}/year
                  </div>
                )}
              </div>

              {/* QUICK STATS */}
              <div className="grid grid-cols-3 gap-3 mb-4 text-center text-xs text-gray-600">
                <div>
                  <div className="font-semibold text-gray-900">
                    {plan.stats.words}
                  </div>
                  Words
                </div>
                <div className="border-x border-gray-200">
                  <div className="font-semibold text-gray-900">
                    {plan.stats.modes}
                  </div>
                  Modes
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {plan.stats.support}
                  </div>
                  Support
                </div>
              </div>

              {/* CTA */}
              <Button
                variant={plan.buttonVariant}
                className="w-full mb-4"
                disabled={false}
                onClick={() => {
                  if (plan.name === "Free") {
                    // Handle free plan activation
                    alert('Free plan activated!');
                  } else {
                    // Navigate to payment checkout
                    window.location.href = `/checkout?plan=${plan.name.toLowerCase()}`;
                  }
                }}
              >
                {plan.name === "Free"
                  ? "Start Free"
                  : "Upgrade Now"}
              </Button>
              
              {plan.name !== "Free" && (
                <div className="text-xs text-center text-green-600 font-semibold mb-2 bg-green-50 py-1 px-2 rounded-lg">
                  🚀 Available Now
                </div>
              )}

              {/* FEATURES */}
              <div className="space-y-2">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className={`text-base bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                      ✓
                    </span>
                    {feature}
                  </div>
                ))}
              </div>
            </Card>
          ))}

        </div>

        {/* FINAL CTA */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Need help deciding?
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            Our team will guide you to the right plan.
          </p>

          <div className="flex justify-center gap-3">
            <Button variant="primary" onClick={() => window.location.href = '/contact'}>
              Contact Sales
            </Button>
            <Button variant="subtle" onClick={() => window.location.href = '/dashboard'}>
              View Dashboard
            </Button>
          </div>
          
          <p className="text-xs text-green-600 font-medium mt-3">
            💡 All plans are now available! Choose your preferred option.
          </p>
        </div>

      </Container>
    </div>
  )
}