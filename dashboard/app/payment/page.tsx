'use client';

import { useState } from 'react';
import { Check, CreditCard, Zap, Crown, Rocket } from 'lucide-react';

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
    color: 'from-cyan-500 to-blue-500',
    popular: false,
  },
  {
    id: 'professional',
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
      console.log('Starting checkout for:', planId, amount);

      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100,
          currency: 'usd',
          planId,
          planName: plans.find(p => p.id === planId)?.name || 'Plan',
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok || data.error) {
        console.error('API error:', data.error);
        alert(data.error || 'Failed to create checkout session');
        setLoading(null);
        return;
      }

      if (data.url) {
        console.log('Redirecting to Stripe Checkout:', data.url);
        // Redirect to Stripe Checkout page
        window.location.href = data.url;
      } else {
        console.error('No checkout URL in response');
        alert('No checkout session created');
        setLoading(null);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error.message || 'Please try again'}`);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-background px-4 py-8">
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

        {/* Popular Badge */}
        {plans.find(p => p.popular) && (
          <div className="text-center mb-4">
            <span className="inline-block px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-semibold shadow-lg">
              Most Popular
            </span>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-end">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const priceNum = parseInt(plan.price.replace('$', ''));
            
            return (
              <div
                key={plan.id}
                className={`relative bg-[#2a2d35] rounded-3xl p-8 border transition-all duration-200 hover:scale-[1.02] flex flex-col ${
                  plan.popular
                    ? 'border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.3)]'
                    : 'border-white/10'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-2xl`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Plan Name */}
                <h3 className="text-3xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-gray-400 ml-2 text-lg">{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <Check className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-gray-300 text-base">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button - Always at bottom */}
                <button
                  onClick={() => handleCheckout(plan.id, priceNum)}
                  disabled={loading === plan.id}
                  className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 mt-auto ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]'
                      : 'bg-[#3a3d45] text-white hover:bg-[#4a4d55]'
                  } ${loading === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <CreditCard className="w-5 h-5" />
                  {loading === plan.id ? 'Processing...' : 'Get Started'}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-text-secondary">
            Need a custom plan? <a href="/contact" className="text-primary hover:underline">Contact us</a> for enterprise solutions.
          </p>
        </div>
      </div>
    </div>
  );
}
