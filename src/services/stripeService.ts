import { supabase } from '../lib/supabase';
import type { SubscriptionTier } from './subscriptionService';

/**
 * Stripe Integration Service
 *
 * Prepared for Stripe integration but NOT enforced during beta.
 * This service will be activated when you're ready to start charging.
 *
 * Setup steps (when ready):
 * 1. Create Stripe account at https://stripe.com
 * 2. Add VITE_STRIPE_PUBLISHABLE_KEY to .env
 * 3. Add STRIPE_SECRET_KEY to Supabase Edge Function environment
 * 4. Uncomment Stripe initialization below
 * 5. Deploy Edge Functions for webhook handling
 * 6. Enable payment_enforcement feature flag
 */

// import { loadStripe } from '@stripe/stripe-js';

// Uncomment when ready to activate Stripe
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export interface CheckoutSessionParams {
  priceId: string;
  tier: SubscriptionTier;
  billingCycle: 'monthly' | 'yearly';
  successUrl?: string;
  cancelUrl?: string;
}

export interface CustomerPortalParams {
  returnUrl?: string;
}

export const stripeService = {
  /**
   * Create a Stripe Checkout session for subscription
   *
   * This is prepared but won't be called until payment_enforcement is enabled.
   */
  async createCheckoutSession(
    userId: string,
    params: CheckoutSessionParams
  ): Promise<{ sessionId: string; url: string } | null> {
    try {
      // Call Supabase Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            userId,
            priceId: params.priceId,
            tier: params.tier,
            billingCycle: params.billingCycle,
            successUrl:
              params.successUrl ||
              `${window.location.origin}/account/subscription?success=true`,
            cancelUrl:
              params.cancelUrl ||
              `${window.location.origin}/account/subscription?canceled=true`,
          },
        }
      );

      if (error) {
        console.error('Error creating checkout session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  },

  /**
   * Redirect to Stripe Customer Portal
   *
   * Allows users to manage their subscription, payment methods, etc.
   */
  async redirectToCustomerPortal(
    userId: string,
    params?: CustomerPortalParams
  ): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-customer-portal-session',
        {
          body: {
            userId,
            returnUrl:
              params?.returnUrl ||
              `${window.location.origin}/account/subscription`,
          },
        }
      );

      if (error) {
        console.error('Error creating portal session:', error);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error redirecting to customer portal:', error);
    }
  },

  /**
   * Cancel subscription (will remain active until end of billing period)
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'cancel-subscription',
        {
          body: { userId },
        }
      );

      if (error) {
        console.error('Error canceling subscription:', error);
        return false;
      }

      return data?.success === true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  },

  /**
   * Resume a canceled subscription
   */
  async resumeSubscription(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'resume-subscription',
        {
          body: { userId },
        }
      );

      if (error) {
        console.error('Error resuming subscription:', error);
        return false;
      }

      return data?.success === true;
    } catch (error) {
      console.error('Error resuming subscription:', error);
      return false;
    }
  },

  /**
   * Update subscription to a different tier/price
   */
  async updateSubscription(
    userId: string,
    newPriceId: string,
    newTier: SubscriptionTier
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'update-subscription',
        {
          body: {
            userId,
            newPriceId,
            newTier,
          },
        }
      );

      if (error) {
        console.error('Error updating subscription:', error);
        return false;
      }

      return data?.success === true;
    } catch (error) {
      console.error('Error updating subscription:', error);
      return false;
    }
  },

  /**
   * Get Stripe publishable key
   */
  getPublishableKey(): string {
    return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  },

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  },
};

/**
 * Stripe Edge Functions (to be created in supabase/functions/)
 *
 * You'll need to create these when ready to activate payments:
 *
 * 1. create-checkout-session
 * 2. create-customer-portal-session
 * 3. cancel-subscription
 * 4. resume-subscription
 * 5. update-subscription
 * 6. stripe-webhook (handles Stripe events)
 */

export const STRIPE_EDGE_FUNCTIONS_GUIDE = `
## Stripe Edge Functions Setup

When you're ready to activate payments, create these Edge Functions:

### 1. create-checkout-session
\`\`\`typescript
// supabase/functions/create-checkout-session/index.ts
import Stripe from 'https://esm.sh/stripe@14.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  const { userId, priceId, successUrl, cancelUrl } = await req.json()

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
  })

  return new Response(JSON.stringify({ sessionId: session.id, url: session.url }))
})
\`\`\`

### 2. stripe-webhook
Handles Stripe events like subscription created, updated, canceled, etc.

### 3. create-customer-portal-session
Creates a session for users to manage their subscription.

See Stripe documentation: https://stripe.com/docs
`;
