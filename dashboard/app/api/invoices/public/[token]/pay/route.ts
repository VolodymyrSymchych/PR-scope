import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../../../../../../server/storage';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const invoice = await storage.getInvoiceByPublicToken(params.token);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
    }

    // Get base URL from environment variable - required for production
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_APP_URL environment variable is required' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: invoice.currency || 'usd',
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: invoice.description || undefined,
            },
            unit_amount: invoice.totalAmount, // Already in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/invoices/public/${params.token}?payment=success`,
      cancel_url: `${baseUrl}/invoices/public/${params.token}?payment=cancelled`,
      metadata: {
        invoiceId: invoice.id.toString(),
        invoiceToken: params.token,
      },
    });

    // Create payment record
    await storage.createInvoicePayment({
      invoiceId: invoice.id,
      stripePaymentIntentId: session.id,
      amount: invoice.totalAmount,
      currency: invoice.currency || 'usd',
      status: 'pending',
      paidAt: null,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error: any) {
    console.error('Error creating payment session:', error);
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    );
  }
}

