import { loadStripe, type Stripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '';
export const hasStripeConfig = Boolean(stripePublishableKey);

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = hasStripeConfig ? loadStripe(stripePublishableKey) : Promise.resolve(null);
  }

  return stripePromise;
}

export async function createDonationCheckout(amount: number, fund: string) {
  const stripe = await getStripe();

  return {
    stripeReady: Boolean(stripe),
    amount,
    fund,
    checkoutUrl: '#stripe-demo',
  };
}
