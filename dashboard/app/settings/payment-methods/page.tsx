'use client';

import { useState } from 'react';
import { CreditCard, Plus, Trash2, Check, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PaymentMethod {
  id: string;
  type: 'card';
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export default function PaymentMethodsPage() {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expMonth: 12,
      expYear: 2025,
      isDefault: true,
    },
    {
      id: '2',
      type: 'card',
      last4: '5555',
      brand: 'Mastercard',
      expMonth: 6,
      expYear: 2026,
      isDefault: false,
    },
  ]);

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev =>
      prev.map(pm => ({ ...pm, isDefault: pm.id === id }))
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    }
  };

  const getCardIcon = (brand: string) => {
    const icons: Record<string, string> = {
      Visa: '💳',
      Mastercard: '💳',
      Amex: '💳',
      Discover: '💳',
    };
    return icons[brand] || '💳';
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/settings')}
            className="p-2 glass-light rounded-lg hover:glass-medium transition-all hover:scale-110"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Payment Methods</h1>
            <p className="text-text-secondary mt-1">
              Manage your payment methods and billing information
            </p>
          </div>
        </div>

        {/* Add New Payment Method */}
        <button className="w-full glass-medium rounded-2xl p-6 border border-dashed border-white/20 hover:glass-light transition-all duration-200 hover:scale-[1.01]">
          <div className="flex items-center justify-center gap-3 text-text-primary">
            <Plus className="w-6 h-6" />
            <span className="font-semibold">Add New Payment Method</span>
          </div>
        </button>

        {/* Payment Methods List */}
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="glass-medium rounded-2xl p-6 border border-white/10 hover:glass-light transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8098F9] to-[#A78BFA] flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(128,152,249,0.5)]">
                    {getCardIcon(method.brand)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">
                        {method.brand} •••• {method.last4}
                      </span>
                      {method.isDefault && (
                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mt-1">
                      Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="px-4 py-2 glass-light text-text-primary rounded-lg hover:glass-medium transition-all font-medium"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="p-2 glass-light text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                    disabled={method.isDefault}
                    title={method.isDefault ? 'Cannot delete default payment method' : 'Delete'}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Security Notice */}
        <div className="glass-medium rounded-2xl p-6 border border-white/10">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🔒</div>
            <div>
              <h3 className="font-semibold text-text-primary mb-1">
                Secure Payment Processing
              </h3>
              <p className="text-sm text-text-secondary">
                All payment information is encrypted and securely processed by Stripe.
                We never store your complete card details on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

