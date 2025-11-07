'use client';

import { useState } from 'react';
import { Check, CreditCard, Zap, Crown, Rocket } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'Perfect for small teams getting started',
    icon: Zap,
    features: [
      '10 project analyses per month',
      'Basic AI insights',
      'Email support',
      '1 team member',
      'Basic templates',
    ],
    color: 'from-blue-500 to-cyan-500',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Professional',
    price: '$79',
    period: '/month',
    description: 'Best for growing teams and businesses',
    icon: Crown,
    features: [
      'Unlimited project analyses',
      'Advanced AI insights',
      'Priority support',
      'Up to 10 team members',
      'Custom templates',
      'Advanced analytics',
      'API access',
    ],
    color: 'from-purple-500 to-pink-500',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$299',
    period: '/month',
    description: 'For large organizations with custom needs',
    icon: Rocket,
    features: [
      'Everything in Pro',
      'Unlimited team members',
      '24/7 dedicated support',
      'Custom integrations',
      'On-premise deployment',
      'SLA guarantee',
      'Custom AI training',
      'White-label option',
    ],
    color: 'from-orange-500 to-red-500',
    popular: false,
  },
];

export default function PaymentPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (planId: string, amount: number) => {
    setLoading(planId);

    try {
      const response = await fetch('/api/payments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          currency: 'usd',
          planId,
        }),
      });

      const { clientSecret } = await response.json();

      if (clientSecret) {
        // Redirect to Stripe Checkout or show payment form
        alert('Payment intent created! In production, this would redirect to Stripe Checkout.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold gradient-text mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Unlock the full potential of AI-powered project scope analysis
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const priceNum = parseInt(plan.price.replace('$', ''));
            
            return (
              <div
                key={plan.id}
                className={`relative glass-medium rounded-3xl p-8 border ${
                  plan.popular
                    ? 'border-primary/50 glass-hover'
                    : 'border-white/10'
                } transition-all duration-500 hover:scale-105`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1 bg-gradient-to-r from-primary to-secondary rounded-full text-white text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-2xl`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-text-primary mb-2">
                  {plan.name}
                </h3>
                <p className="text-text-secondary text-sm mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold gradient-text">
                      {plan.price}
                    </span>
                    <span className="text-text-tertiary ml-2">{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleCheckout(plan.id, priceNum)}
                  disabled={loading === plan.id}
                  className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'glass-button'
                      : 'glass-light hover:glass-medium'
                  } ${loading === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {loading === plan.id ? 'Processing...' : 'Get Started'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="glass-medium rounded-3xl p-8 border border-white/10 text-center">
          <h3 className="text-2xl font-bold text-text-primary mb-4">
            All plans include
          </h3>
          <div className="grid md:grid-cols-4 gap-6 text-text-secondary">
            <div>
              <div className="text-3xl mb-2">🔒</div>
              <div className="font-semibold text-text-primary mb-1">Secure</div>
              <div className="text-sm">256-bit SSL encryption</div>
            </div>
            <div>
              <div className="text-3xl mb-2">⚡</div>
              <div className="font-semibold text-text-primary mb-1">Fast</div>
              <div className="text-sm">Instant analysis results</div>
            </div>
            <div>
              <div className="text-3xl mb-2">🤖</div>
              <div className="font-semibold text-text-primary mb-1">AI-Powered</div>
              <div className="text-sm">Claude 4 Sonnet</div>
            </div>
            <div>
              <div className="text-3xl mb-2">💯</div>
              <div className="font-semibold text-text-primary mb-1">Guarantee</div>
              <div className="text-sm">30-day money back</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

