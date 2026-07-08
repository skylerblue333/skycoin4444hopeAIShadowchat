import { describe, it, expect } from 'vitest';

describe('API Credentials Validation', () => {
  it('should have Stripe API key configured', () => {
    const stripeKey = process.env.STRIPE_API_KEY;
    expect(stripeKey).toBeDefined();
    expect(stripeKey).toMatch(/^sk_test_/);
      });

  it('should have OpenAI API key configured', () => {
    const openaiKey = process.env.OPENAI_API_KEY;
    expect(openaiKey).toBeDefined();
    expect(openaiKey).toMatch(/^sk-proj-/);
      });

  it('should validate Stripe API key format', () => {
    const stripeKey = process.env.STRIPE_API_KEY;
    expect(stripeKey).toMatch(/^sk_test_[a-zA-Z0-9]{32,}$/);
      });

  it('should validate OpenAI API key format', () => {
    const openaiKey = process.env.OPENAI_API_KEY;
    expect(openaiKey).toMatch(/^sk-proj-[a-zA-Z0-9_-]{40,}$/);
      });

  it('should have both keys present for production', () => {
    const hasStripe = !!process.env.STRIPE_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    expect(hasStripe && hasOpenAI).toBe(true);
      });
});
