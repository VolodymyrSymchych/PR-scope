'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push('/');
    }
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-md w-full glass-medium rounded-3xl p-12 border border-white/10 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.5)]"
        >
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>

        <h1 className="text-4xl font-bold gradient-text mb-4">Payment Successful!</h1>
        <p className="text-text-secondary text-lg mb-8">
          Welcome to your new plan! Your subscription is now active.
        </p>

        {sessionId && (
          <div className="glass-light rounded-xl p-4 mb-8">
            <p className="text-sm text-text-tertiary mb-1">Session ID</p>
            <p className="text-xs text-text-secondary font-mono break-all">{sessionId}</p>
          </div>
        )}

        <div className="space-y-4">
          <motion.button
            onClick={() => router.push('/')}
            className="w-full glass-button py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          <p className="text-sm text-text-tertiary">
            Redirecting in {countdown} seconds...
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary glow-cyan-soft"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

