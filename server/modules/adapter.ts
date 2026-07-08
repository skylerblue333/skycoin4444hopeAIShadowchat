// @ts-nocheck
/**
 * Adapter to integrate extracted Express controllers into tRPC procedures
 * Converts Express request/response handlers to tRPC input/output
 */

// Use native fetch in Node 18+
import Stripe from 'stripe';
import { invokeLLM } from '../_core/llm';

// ─── CRYPTO MODULE ─────────────────────────────────────────────────────────

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CACHE_TTL = 60000; // 1 minute
let marketCache: any = {};
let cacheTime = 0;

export async function fetchRealMarketData() {
  const now = Date.now();
  if (marketCache && now - cacheTime < CACHE_TTL) {
    return marketCache;
  }
  try {
    const response = await (globalThis.fetch as any)(
      `${COINGECKO_API}/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true`
    );
    const data: any = await response.json();
    marketCache = [
      { pair: 'BTC/USD', price: data.bitcoin.usd, change24h: data.bitcoin.usd_24h_change },
      { pair: 'ETH/USD', price: data.ethereum.usd, change24h: data.ethereum.usd_24h_change },
      { pair: 'SOL/USD', price: data.solana.usd, change24h: data.solana.usd_24h_change },
    ];
    cacheTime = now;
    return marketCache;
  } catch (error) {
        return marketCache || [];
  }
}

// Fallback mock data if API fails
export function getMockMarketData() {
  return [
    { pair: 'BTC/USD', price: 67500, change24h: 2.5 },
    { pair: 'ETH/USD', price: 3200, change24h: 1.8 },
    { pair: 'SOL/USD', price: 185, change24h: 3.2 },
  ];
}

// ─── STRIPE MODULE ────────────────────────────────────────────────────────

let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-04-22.dahlia' as any,
  });
}

export async function createStripeCheckoutSession(
  productId: string,
  quantity: number,
  userId: number,
  userEmail: string
) {
  if (!stripe) throw new Error('Stripe not configured');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Product ${productId}`,
          },
          unit_amount: 9999, // $99.99
        },
        quantity,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cancel`,
    metadata: { userId: userId.toString(), productId },
  });

  return { id: session.id };
}

export async function createStripeSubscription(
  userId: number,
  userEmail: string,
  priceId: string
) {
  if (!stripe) throw new Error('Stripe not configured');

  const customer = await stripe.customers.create({
    email: userEmail,
    metadata: { userId: userId.toString() },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });

  return {
    subscriptionId: subscription.id,
    clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
  };
}

// ─── AI MODULE ────────────────────────────────────────────────────────────

export async function moderateContent(text: string) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a content moderation system. Analyze the following text and respond with JSON: {"flagged": boolean, "reason": string}',
        },
        { role: 'user', content: text },
      ],
    });

    const content = typeof response.choices[0]?.message.content === 'string' ? response.choices[0].message.content : '{}';
    return JSON.parse(content);
  } catch (error) {
        return { flagged: false, reason: 'Unable to moderate' };
  }
}

export async function analyzeSentiment(text: string) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Analyze the sentiment of the following text and respond with a single word: positive, negative, or neutral.',
        },
        { role: 'user', content: text },
      ],
    });

    const contentStr = typeof response.choices[0]?.message.content === 'string' ? response.choices[0].message.content : 'neutral';
    const sentiment = contentStr.trim().toLowerCase() || 'neutral';
    return { sentiment };
  } catch (error) {
        return { sentiment: 'neutral' };
  }
}

export async function hopeAIChat(message: string) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are HopeAI, a helpful assistant for the SkyCoin4444 platform. Provide concise, helpful responses.',
        },
        { role: 'user', content: message },
      ],
    });

    const contentStr = typeof response.choices[0]?.message.content === 'string' ? response.choices[0].message.content : 'Unable to process request';
    return { response: contentStr };
  } catch (error) {
        return { response: 'Sorry, I encountered an error. Please try again.' };
  }
}
