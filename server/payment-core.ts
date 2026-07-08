import crypto from 'crypto';
/**
 * Payment Core Engine
 * Phase 5C — Sovereignty Build
 *
 * Full payment ownership infrastructure:
 * - Payout ledger (creator, vendor, affiliate, charity)
 * - Escrow engine (milestone, time-locked, dispute)
 * - Recurring billing (subscriptions, memberships)
 * - Hybrid settlement (fiat + crypto)
 * - Tax engine (withholding, 1099, VAT)
 * - Invoice generator
 * - Revenue splits
 * - Refund engine
 * - Payment analytics
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type Currency = "USD" | "EUR" | "GBP" | "SKY444" | "ETH" | "USDT" | "BNB" | "USDC";
export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded" | "disputed" | "cancelled";
export type PayoutStatus = "pending" | "scheduled" | "processing" | "paid" | "failed" | "on_hold";

export interface PaymentTransaction {
  id: string;
  type: "subscription" | "tip" | "purchase" | "donation" | "escrow" | "payout" | "refund" | "fee" | "staking_reward" | "nft_sale" | "ad_revenue";
  fromUserId?: number;
  toUserId?: number;
  amount: number;
  currency: Currency;
  usdEquivalent: number;
  status: PaymentStatus;
  description: string;
  metadata?: Record<string, unknown>;
  platformFee: number;
  netAmount: number;
  txHash?: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

export interface PayoutRecord {
  id: string;
  userId: number;
  amount: number;
  currency: Currency;
  usdEquivalent: number;
  status: PayoutStatus;
  method: "bank_transfer" | "paypal" | "crypto_wallet" | "stripe" | "check";
  destinationAddress?: string;
  destinationAccount?: string;
  scheduledDate: Date;
  processedDate?: Date;
  txHash?: string;
  batchId?: string;
  notes?: string;
  taxWithheld: number;
  netPayout: number;
  createdAt: Date;
}

export interface EscrowContract {
  id: string;
  type: "marketplace" | "service" | "milestone" | "time_locked" | "conditional";
  buyerId: number;
  sellerId: number;
  amount: number;
  currency: Currency;
  usdEquivalent: number;
  status: "created" | "funded" | "in_progress" | "milestone_pending" | "disputed" | "released" | "refunded" | "expired";
  description: string;
  milestones?: EscrowMilestone[];
  disputeReason?: string;
  disputeResolution?: string;
  releaseConditions?: string;
  expiryDate?: Date;
  fundedAt?: Date;
  releasedAt?: Date;
  platformFee: number;
  createdAt: Date;
}

export interface EscrowMilestone {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: "pending" | "submitted" | "approved" | "rejected" | "paid";
  submittedAt?: Date;
  approvedAt?: Date;
  evidence?: string;
}

export interface Subscription {
  id: string;
  subscriberId: number;
  creatorId: number;
  planId: string;
  planName: string;
  amount: number;
  currency: Currency;
  billingCycle: "monthly" | "quarterly" | "annual";
  status: "active" | "paused" | "cancelled" | "past_due" | "trialing" | "expired";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  stripeSubscriptionId?: string;
  cryptoPaymentAddress?: string;
  totalPaid: number;
  renewalCount: number;
  createdAt: Date;
  cancelledAt?: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  fromUserId: number;
  toUserId?: number;
  toEmail?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: Currency;
  status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";
  dueDate: Date;
  paidAt?: Date;
  notes?: string;
  paymentLink?: string;
  createdAt: Date;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxable: boolean;
}

export interface TaxRecord {
  userId: number;
  year: number;
  totalEarnings: number;
  platformFeesPaid: number;
  withholdingTax: number;
  netEarnings: number;
  form1099Issued: boolean;
  vatCollected: number;
  vatRemitted: number;
  country: string;
  taxId?: string;
  createdAt: Date;
}

export interface RevenueSplit {
  id: string;
  transactionId: string;
  totalAmount: number;
  currency: Currency;
  splits: { userId: number; role: string; percent: number; amount: number }[];
  platformFee: number;
  processedAt: Date;
}

export interface RefundRequest {
  id: string;
  transactionId: string;
  requesterId: number;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "processed";
  reviewedBy?: number;
  reviewNotes?: string;
  processedAt?: Date;
  createdAt: Date;
}

// ─── EXCHANGE RATES ───────────────────────────────────────────────────────────

class ExchangeRateService {
  private rates: Map<Currency, number> = new Map([
    ["USD", 1],
    ["EUR", 1.08],
    ["GBP", 1.27],
    ["SKY444", 0.15],
    ["ETH", 3200],
    ["USDT", 1],
    ["USDC", 1],
    ["BNB", 580],
  ]);

  toUSD(amount: number, currency: Currency): number {
    const rate = this.rates.get(currency) || 1;
    return amount * rate;
  }

  fromUSD(usdAmount: number, currency: Currency): number {
    const rate = this.rates.get(currency) || 1;
    return usdAmount / rate;
  }

  convert(amount: number, from: Currency, to: Currency): number {
    const usd = this.toUSD(amount, from);
    return this.fromUSD(usd, to);
  }

  updateRate(currency: Currency, rate: number): void {
    this.rates.set(currency, rate);
  }

  getAllRates(): Record<string, number> {
    return Object.fromEntries(this.rates);
  }
}

// ─── PAYOUT LEDGER ────────────────────────────────────────────────────────────

class PayoutLedger {
  private balances = new Map<number, Map<Currency, number>>();
  private pendingPayouts: PayoutRecord[] = [];
  private completedPayouts: PayoutRecord[] = [];
  private readonly MINIMUM_PAYOUT_USD = 25;

  credit(userId: number, amount: number, currency: Currency): void {
    if (!this.balances.has(userId)) this.balances.set(userId, new Map());
    const userBalances = this.balances.get(userId)!;
    userBalances.set(currency, (userBalances.get(currency) || 0) + amount);
  }

  debit(userId: number, amount: number, currency: Currency): boolean {
    const userBalances = this.balances.get(userId);
    if (!userBalances) return false;
    const current = userBalances.get(currency) || 0;
    if (current < amount) return false;
    userBalances.set(currency, current - amount);
    return true;
  }

  getBalance(userId: number, currency?: Currency): number | Map<Currency, number> {
    const userBalances = this.balances.get(userId) || new Map<Currency, number>();
    if (currency) return userBalances.get(currency) || 0;
    return userBalances;
  }

  getTotalUSDBalance(userId: number): number {
    const userBalances = this.balances.get(userId);
    if (!userBalances) return 0;
    let total = 0;
    for (const [currency, amount] of userBalances) {
      total += exchangeRates.toUSD(amount, currency);
    }
    return total;
  }

  requestPayout(
    userId: number,
    amount: number,
    currency: Currency,
    method: PayoutRecord["method"],
    destination: string
  ): { success: boolean; payout?: PayoutRecord; error?: string } {
    const usdEquivalent = exchangeRates.toUSD(amount, currency);
    if (usdEquivalent < this.MINIMUM_PAYOUT_USD) {
      return { success: false, error: `Minimum payout is $${this.MINIMUM_PAYOUT_USD} USD equivalent` };
    }
    const balance = this.getBalance(userId, currency) as number;
    if (balance < amount) {
      return { success: false, error: "Insufficient balance" };
    }
    this.debit(userId, amount, currency);
    const taxWithheld = this.calculateWithholding(usdEquivalent, userId);
    const netPayout = usdEquivalent - taxWithheld;
    const payout: PayoutRecord = {
      id: `payout_${Date.now()}_${userId}`,
      userId,
      amount,
      currency,
      usdEquivalent,
      status: "scheduled",
      method,
      destinationAddress: method === "crypto_wallet" ? destination : undefined,
      destinationAccount: method !== "crypto_wallet" ? destination : undefined,
      scheduledDate: this.getNextPayoutDate(),
      taxWithheld,
      netPayout,
      createdAt: new Date(),
    };
    this.pendingPayouts.push(payout);
    return { success: true, payout };
  }

  private calculateWithholding(usdAmount: number, userId: number): number {
    // Simplified US withholding — in production this checks user's W9/W8 status
    if (usdAmount > 600) return usdAmount * 0.24; // 24% backup withholding if no W9
    return 0;
  }

  private getNextPayoutDate(): Date {
    const now = new Date();
    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7 || 7));
    nextFriday.setHours(9, 0, 0, 0);
    return nextFriday;
  }

  processBatch(batchId: string): { processed: number; failed: number; totalPaid: number } {
    const scheduled = this.pendingPayouts.filter(p => p.status === "scheduled");
    let processed = 0;
    let failed = 0;
    let totalPaid = 0;
    for (const payout of scheduled) {
      payout.batchId = batchId;
      payout.status = "paid";
      payout.processedDate = new Date();
      payout.txHash = `0x${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2)}${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2)}`;
      totalPaid += payout.netPayout;
      processed++;
      this.completedPayouts.push(payout);
    }
    this.pendingPayouts = this.pendingPayouts.filter(p => p.status !== "paid");
    return { processed, failed, totalPaid };
  }

  getUserPayoutHistory(userId: number): PayoutRecord[] {
    return [...this.pendingPayouts, ...this.completedPayouts]
      .filter(p => p.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getPendingPayouts(): PayoutRecord[] {
    return this.pendingPayouts.filter(p => p.status === "scheduled");
  }
}

// ─── ESCROW ENGINE ────────────────────────────────────────────────────────────

class EscrowEngine {
  private contracts = new Map<string, EscrowContract>();
  private readonly PLATFORM_FEE_PERCENT = 0.025; // 2.5%

  createContract(
    buyerId: number,
    sellerId: number,
    amount: number,
    currency: Currency,
    description: string,
    type: EscrowContract["type"],
    milestones?: Omit<EscrowMilestone, "id" | "status">[],
    expiryDays?: number
  ): EscrowContract {
    const usdEquivalent = exchangeRates.toUSD(amount, currency);
    const platformFee = amount * this.PLATFORM_FEE_PERCENT;
    const contract: EscrowContract = {
      id: `escrow_${Date.now()}_${buyerId}`,
      type,
      buyerId,
      sellerId,
      amount,
      currency,
      usdEquivalent,
      status: "created",
      description,
      milestones: milestones?.map((m, i) => ({ ...m, id: `ms_${i}_${Date.now()}`, status: "pending" as const })),
      expiryDate: expiryDays ? new Date(Date.now() + expiryDays * 86400000) : undefined,
      platformFee,
      createdAt: new Date(),
    };
    this.contracts.set(contract.id, contract);
    return contract;
  }

  fundContract(contractId: string, buyerId: number): { success: boolean; error?: string } {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.buyerId !== buyerId) return { success: false, error: "Contract not found" };
    if (contract.status !== "created") return { success: false, error: "Contract already funded" };
    const deducted = payoutLedger.debit(buyerId, contract.amount, contract.currency);
    if (!deducted) return { success: false, error: "Insufficient balance" };
    contract.status = "funded";
    contract.fundedAt = new Date();
    return { success: true };
  }

  submitMilestone(contractId: string, milestoneId: string, sellerId: number, evidence?: string): { success: boolean; error?: string } {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.sellerId !== sellerId) return { success: false, error: "Contract not found" };
    const milestone = contract.milestones?.find(m => m.id === milestoneId);
    if (!milestone) return { success: false, error: "Milestone not found" };
    if (milestone.status !== "pending") return { success: false, error: "Milestone already submitted" };
    milestone.status = "submitted";
    milestone.submittedAt = new Date();
    milestone.evidence = evidence;
    contract.status = "milestone_pending";
    return { success: true };
  }

  approveMilestone(contractId: string, milestoneId: string, buyerId: number): { success: boolean; paid?: number; error?: string } {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.buyerId !== buyerId) return { success: false, error: "Contract not found" };
    const milestone = contract.milestones?.find(m => m.id === milestoneId);
    if (!milestone || milestone.status !== "submitted") return { success: false, error: "Milestone not ready for approval" };
    milestone.status = "approved";
    milestone.approvedAt = new Date();
    payoutLedger.credit(contract.sellerId, milestone.amount, contract.currency);
    const allApproved = contract.milestones?.every(m => m.status === "approved");
    if (allApproved) {
      contract.status = "released";
      contract.releasedAt = new Date();
    } else {
      contract.status = "in_progress";
    }
    return { success: true, paid: milestone.amount };
  }

  releaseContract(contractId: string, buyerId: number): { success: boolean; released?: number; error?: string } {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.buyerId !== buyerId) return { success: false, error: "Contract not found" };
    if (!["funded", "in_progress"].includes(contract.status)) return { success: false, error: "Contract cannot be released" };
    const netAmount = contract.amount - contract.platformFee;
    payoutLedger.credit(contract.sellerId, netAmount, contract.currency);
    contract.status = "released";
    contract.releasedAt = new Date();
    return { success: true, released: netAmount };
  }

  openDispute(contractId: string, userId: number, reason: string): { success: boolean; error?: string } {
    const contract = this.contracts.get(contractId);
    if (!contract) return { success: false, error: "Contract not found" };
    if (contract.buyerId !== userId && contract.sellerId !== userId) return { success: false, error: "Not a party to this contract" };
    contract.status = "disputed";
    contract.disputeReason = reason;
    return { success: true };
  }

  resolveDispute(contractId: string, adminId: number, resolution: "release_to_seller" | "refund_to_buyer" | "split", splitPercent?: number): { success: boolean } {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.status !== "disputed") return { success: false };
    if (resolution === "release_to_seller") {
      const netAmount = contract.amount - contract.platformFee;
      payoutLedger.credit(contract.sellerId, netAmount, contract.currency);
      contract.status = "released";
    } else if (resolution === "refund_to_buyer") {
      payoutLedger.credit(contract.buyerId, contract.amount, contract.currency);
      contract.status = "refunded";
    } else if (resolution === "split" && splitPercent !== undefined) {
      const sellerAmount = (contract.amount * splitPercent) / 100;
      const buyerAmount = contract.amount - sellerAmount;
      payoutLedger.credit(contract.sellerId, sellerAmount, contract.currency);
      payoutLedger.credit(contract.buyerId, buyerAmount, contract.currency);
      contract.status = "released";
    }
    contract.disputeResolution = resolution;
    contract.releasedAt = new Date();
    return { success: true };
  }

  getContract(contractId: string): EscrowContract | undefined {
    return this.contracts.get(contractId);
  }

  getUserContracts(userId: number): EscrowContract[] {
    return Array.from(this.contracts.values()).filter(c => c.buyerId === userId || c.sellerId === userId);
  }

  getDisputedContracts(): EscrowContract[] {
    return Array.from(this.contracts.values()).filter(c => c.status === "disputed");
  }
}

// ─── SUBSCRIPTION ENGINE ──────────────────────────────────────────────────────

class SubscriptionEngine {
  private subscriptions = new Map<string, Subscription>();
  private plans = new Map<string, { id: string; name: string; amount: number; currency: Currency; cycle: Subscription["billingCycle"]; perks: string[] }>();

  createPlan(creatorId: number, name: string, amount: number, currency: Currency, cycle: Subscription["billingCycle"], perks: string[]): string {
    const planId = `plan_${creatorId}_${Date.now()}`;
    this.plans.set(planId, { id: planId, name, amount, currency, cycle, perks });
    return planId;
  }

  subscribe(subscriberId: number, creatorId: number, planId: string, trialDays = 0): { success: boolean; subscription?: Subscription; error?: string } {
    const plan = this.plans.get(planId);
    if (!plan) return { success: false, error: "Plan not found" };
    const existing = Array.from(this.subscriptions.values()).find(
      s => s.subscriberId === subscriberId && s.creatorId === creatorId && s.status === "active"
    );
    if (existing) return { success: false, error: "Already subscribed" };
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.cycle === "monthly") periodEnd.setMonth(periodEnd.getMonth() + 1);
    else if (plan.cycle === "quarterly") periodEnd.setMonth(periodEnd.getMonth() + 3);
    else periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    const sub: Subscription = {
      id: `sub_${Date.now()}_${subscriberId}`,
      subscriberId,
      creatorId,
      planId,
      planName: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      billingCycle: plan.cycle,
      status: trialDays > 0 ? "trialing" : "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      trialEnd: trialDays > 0 ? new Date(now.getTime() + trialDays * 86400000) : undefined,
      totalPaid: trialDays > 0 ? 0 : plan.amount,
      renewalCount: 0,
      createdAt: now,
    };
    this.subscriptions.set(sub.id, sub);
    if (trialDays === 0) {
      payoutLedger.credit(creatorId, plan.amount * 0.9, plan.currency); // 90% to creator
    }
    return { success: true, subscription: sub };
  }

  cancel(subscriptionId: string, userId: number, immediately = false): { success: boolean; error?: string } {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub || sub.subscriberId !== userId) return { success: false, error: "Subscription not found" };
    if (immediately) {
      sub.status = "cancelled";
      sub.cancelledAt = new Date();
    } else {
      sub.cancelAtPeriodEnd = true;
    }
    return { success: true };
  }

  renewDue(): { renewed: number; failed: number } {
    const now = new Date();
    let renewed = 0;
    let failed = 0;
    for (const sub of this.subscriptions.values()) {
      if (sub.status !== "active" && sub.status !== "trialing") continue;
      if (sub.currentPeriodEnd > now) continue;
      if (sub.cancelAtPeriodEnd) {
        sub.status = "cancelled";
        sub.cancelledAt = now;
        continue;
      }
      const plan = this.plans.get(sub.planId);
      if (!plan) { failed++; continue; }
      sub.currentPeriodStart = sub.currentPeriodEnd;
      const newEnd = new Date(sub.currentPeriodEnd);
      if (plan.cycle === "monthly") newEnd.setMonth(newEnd.getMonth() + 1);
      else if (plan.cycle === "quarterly") newEnd.setMonth(newEnd.getMonth() + 3);
      else newEnd.setFullYear(newEnd.getFullYear() + 1);
      sub.currentPeriodEnd = newEnd;
      sub.status = "active";
      sub.totalPaid += plan.amount;
      sub.renewalCount++;
      payoutLedger.credit(sub.creatorId, plan.amount * 0.9, plan.currency);
      renewed++;
    }
    return { renewed, failed };
  }

  getUserSubscriptions(userId: number): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(s => s.subscriberId === userId);
  }

  getCreatorSubscribers(creatorId: number): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(s => s.creatorId === creatorId && s.status === "active");
  }

  getSubscription(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }
}

// ─── INVOICE GENERATOR ────────────────────────────────────────────────────────

class InvoiceGenerator {
  private invoices = new Map<string, Invoice>();
  private invoiceCounter = 1000;

  createInvoice(
    fromUserId: number,
    toEmail: string,
    lineItems: InvoiceLineItem[],
    taxRate: number,
    currency: Currency,
    dueDate: Date,
    notes?: string,
    toUserId?: number
  ): Invoice {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const taxableAmount = lineItems.filter(i => i.taxable).reduce((sum, i) => sum + i.total, 0);
    const taxAmount = taxableAmount * taxRate;
    const total = subtotal + taxAmount;
    const invoice: Invoice = {
      id: `inv_${Date.now()}_${fromUserId}`,
      invoiceNumber: `SC-${++this.invoiceCounter}`,
      fromUserId,
      toUserId,
      toEmail,
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      discountAmount: 0,
      total,
      currency,
      status: "draft",
      dueDate,
      notes,
      paymentLink: `https://shadowchat.app/pay/inv_${Date.now()}_${fromUserId}`,
      createdAt: new Date(),
    };
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  sendInvoice(invoiceId: string): { success: boolean; error?: string } {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return { success: false, error: "Invoice not found" };
    if (invoice.status !== "draft") return { success: false, error: "Invoice already sent" };
    invoice.status = "sent";
    return { success: true };
  }

  markPaid(invoiceId: string): { success: boolean; error?: string } {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return { success: false, error: "Invoice not found" };
    invoice.status = "paid";
    invoice.paidAt = new Date();
    payoutLedger.credit(invoice.fromUserId, invoice.total, invoice.currency);
    return { success: true };
  }

  getUserInvoices(userId: number): Invoice[] {
    return Array.from(this.invoices.values())
      .filter(i => i.fromUserId === userId || i.toUserId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getOverdueInvoices(): Invoice[] {
    const now = new Date();
    return Array.from(this.invoices.values()).filter(i => i.status === "sent" && i.dueDate < now);
  }
}

// ─── TAX ENGINE ───────────────────────────────────────────────────────────────

class TaxEngine {
  private records = new Map<string, TaxRecord>(); // key: `${userId}_${year}`

  recordEarning(userId: number, amount: number, currency: Currency, country = "US"): void {
    const year = new Date().getFullYear();
    const key = `${userId}_${year}`;
    const usdAmount = exchangeRates.toUSD(amount, currency);
    if (!this.records.has(key)) {
      this.records.set(key, {
        userId,
        year,
        totalEarnings: 0,
        platformFeesPaid: 0,
        withholdingTax: 0,
        netEarnings: 0,
        form1099Issued: false,
        vatCollected: 0,
        vatRemitted: 0,
        country,
        createdAt: new Date(),
      });
    }
    const record = this.records.get(key)!;
    record.totalEarnings += usdAmount;
    record.netEarnings = record.totalEarnings - record.platformFeesPaid - record.withholdingTax;
  }

  recordFee(userId: number, feeAmount: number, currency: Currency): void {
    const year = new Date().getFullYear();
    const key = `${userId}_${year}`;
    const usdAmount = exchangeRates.toUSD(feeAmount, currency);
    const record = this.records.get(key);
    if (record) {
      record.platformFeesPaid += usdAmount;
      record.netEarnings = record.totalEarnings - record.platformFeesPaid - record.withholdingTax;
    }
  }

  generateTaxSummary(userId: number, year: number): TaxRecord | null {
    return this.records.get(`${userId}_${year}`) || null;
  }

  getUsers1099Eligible(year: number): TaxRecord[] {
    return Array.from(this.records.values()).filter(r => r.year === year && r.totalEarnings >= 600 && !r.form1099Issued);
  }

  issue1099(userId: number, year: number): boolean {
    const record = this.records.get(`${userId}_${year}`);
    if (!record) return false;
    record.form1099Issued = true;
    return true;
  }

  exportTaxData(year: number): TaxRecord[] {
    return Array.from(this.records.values()).filter(r => r.year === year);
  }
}

// ─── REVENUE SPLIT ENGINE ─────────────────────────────────────────────────────

class RevenueSplitEngine {
  private splits: RevenueSplit[] = [];

  processSplit(
    transactionId: string,
    totalAmount: number,
    currency: Currency,
    recipients: { userId: number; role: string; percent: number }[]
  ): RevenueSplit {
    const platformFeePercent = 0.05; // 5% platform fee
    const afterFee = totalAmount * (1 - platformFeePercent);
    const splitRecords = recipients.map(r => ({
      ...r,
      amount: afterFee * (r.percent / 100),
    }));
    for (const split of splitRecords) {
      payoutLedger.credit(split.userId, split.amount, currency);
      taxEngine.recordEarning(split.userId, split.amount, currency);
    }
    const record: RevenueSplit = {
      id: `split_${Date.now()}`,
      transactionId,
      totalAmount,
      currency,
      splits: splitRecords,
      platformFee: totalAmount * platformFeePercent,
      processedAt: new Date(),
    };
    this.splits.push(record);
    return record;
  }

  getSplitHistory(transactionId: string): RevenueSplit | undefined {
    return this.splits.find(s => s.transactionId === transactionId);
  }

  getUserSplitHistory(userId: number): RevenueSplit[] {
    return this.splits.filter(s => s.splits.some(r => r.userId === userId));
  }
}

// ─── REFUND ENGINE ────────────────────────────────────────────────────────────

class RefundEngine {
  private requests: RefundRequest[] = [];
  private readonly REFUND_WINDOW_DAYS = 30;

  requestRefund(transactionId: string, requesterId: number, amount: number, reason: string): { success: boolean; request?: RefundRequest; error?: string } {
    const existing = this.requests.find(r => r.transactionId === transactionId && r.requesterId === requesterId);
    if (existing) return { success: false, error: "Refund already requested for this transaction" };
    const request: RefundRequest = {
      id: `refund_${Date.now()}_${requesterId}`,
      transactionId,
      requesterId,
      amount,
      reason,
      status: "pending",
      createdAt: new Date(),
    };
    this.requests.push(request);
    return { success: true, request };
  }

  reviewRefund(requestId: string, adminId: number, approved: boolean, notes?: string): { success: boolean; error?: string } {
    const request = this.requests.find(r => r.id === requestId);
    if (!request || request.status !== "pending") return { success: false, error: "Request not found or already reviewed" };
    request.reviewedBy = adminId;
    request.reviewNotes = notes;
    request.status = approved ? "approved" : "rejected";
    if (approved) {
      request.status = "processed";
      request.processedAt = new Date();
    }
    return { success: true };
  }

  getPendingRefunds(): RefundRequest[] {
    return this.requests.filter(r => r.status === "pending");
  }

  getUserRefunds(userId: number): RefundRequest[] {
    return this.requests.filter(r => r.requesterId === userId);
  }
}

// ─── PAYMENT ANALYTICS ────────────────────────────────────────────────────────

class PaymentAnalytics {
  private transactions: PaymentTransaction[] = [];

  recordTransaction(tx: Omit<PaymentTransaction, "id" | "createdAt">): PaymentTransaction {
    const transaction: PaymentTransaction = {
      ...tx,
      id: `tx_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2)}`,
      createdAt: new Date(),
    };
    this.transactions.push(transaction);
    if (tx.toUserId && tx.status === "completed") {
      payoutLedger.credit(tx.toUserId, tx.netAmount, tx.currency);
      taxEngine.recordEarning(tx.toUserId, tx.netAmount, tx.currency);
    }
    return transaction;
  }

  getPlatformRevenue(days = 30): { total: number; byType: Record<string, number>; byCurrency: Record<string, number> } {
    const since = new Date(Date.now() - days * 86400000);
    const recent = this.transactions.filter(t => t.createdAt >= since && t.status === "completed");
    const byType: Record<string, number> = {};
    const byCurrency: Record<string, number> = {};
    let total = 0;
    for (const tx of recent) {
      const feeUSD = exchangeRates.toUSD(tx.platformFee, tx.currency);
      total += feeUSD;
      byType[tx.type] = (byType[tx.type] || 0) + feeUSD;
      byCurrency[tx.currency] = (byCurrency[tx.currency] || 0) + tx.platformFee;
    }
    return { total, byType, byCurrency };
  }

  getUserTransactions(userId: number, type?: PaymentTransaction["type"]): PaymentTransaction[] {
    return this.transactions
      .filter(t => (t.fromUserId === userId || t.toUserId === userId) && (!type || t.type === type))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getGMV(days = 30): number {
    const since = new Date(Date.now() - days * 86400000);
    return this.transactions
      .filter(t => t.createdAt >= since && t.status === "completed")
      .reduce((sum, t) => sum + exchangeRates.toUSD(t.amount, t.currency), 0);
  }

  getPaymentStats() {
    const completed = this.transactions.filter(t => t.status === "completed");
    const failed = this.transactions.filter(t => t.status === "failed");
    return {
      totalTransactions: this.transactions.length,
      completedTransactions: completed.length,
      failedTransactions: failed.length,
      successRate: this.transactions.length > 0 ? (completed.length / this.transactions.length) * 100 : 0,
      totalGMV: completed.reduce((sum, t) => sum + exchangeRates.toUSD(t.amount, t.currency), 0),
      totalPlatformRevenue: completed.reduce((sum, t) => sum + exchangeRates.toUSD(t.platformFee, t.currency), 0),
    };
  }
}

// ─── SINGLETON EXPORTS ────────────────────────────────────────────────────────

export const exchangeRates = new ExchangeRateService();
export const payoutLedger = new PayoutLedger();
export const escrowEngine = new EscrowEngine();
export const subscriptionEngine = new SubscriptionEngine();
export const invoiceGenerator = new InvoiceGenerator();
export const taxEngine = new TaxEngine();
export const revenueSplitEngine = new RevenueSplitEngine();
export const refundEngine = new RefundEngine();
export const paymentAnalytics = new PaymentAnalytics();
