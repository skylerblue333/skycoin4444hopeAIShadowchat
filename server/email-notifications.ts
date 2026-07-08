/**
 * Email Notification Service
 * Sends transactional emails via SendGrid
 * Integrates with all major platform events
 */

import sgMail from "@sendgrid/mail";
import { ENV } from "./_core/env";

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL = "noreply@skycoin4444.com";
const OWNER_EMAIL = "iitrskylerblue4444@gmail.com";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via SendGrid
 */
export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
        return false;
  }

  try {
    await sgMail.send({
      to: template.to,
      from: FROM_EMAIL,
      subject: template.subject,
      html: template.html,
      text: template.text || "",
    });
        return true;
  } catch (error) {
        return false;
  }
}

/**
 * Send notification to owner
 */
export async function notifyOwner(subject: string, html: string): Promise<boolean> {
  return sendEmail({
    to: OWNER_EMAIL,
    subject: `[SKYCOIN4444] ${subject}`,
    html,
  });
}

// ═══════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════

/**
 * User Registration Confirmation
 */
export async function emailUserSignup(email: string, userName: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Welcome to SKYCOIN4444! 🚀",
    html: `
      <h2>Welcome, ${userName}!</h2>
      <p>Your account has been created successfully.</p>
      <p><strong>Your Airdrop:</strong></p>
      <ul>
        <li>1,000 SKY4444 tokens</li>
        <li>500 DOGE tokens</li>
        <li>100 TRUMP tokens</li>
      </ul>
      <p><a href="https://skycoinpro-ebv4wfmm.manus.space">Start Exploring →</a></p>
    `,
  });
}

/**
 * Staking Confirmation
 */
export async function emailStakingConfirmed(
  email: string,
  amount: number,
  apy: number,
  lockDays: number
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Staking Confirmed: ${amount} SKY4444 @ ${apy}% APY`,
    html: `
      <h2>✅ Staking Confirmed</h2>
      <p><strong>Amount:</strong> ${amount} SKY4444</p>
      <p><strong>APY:</strong> ${apy}%</p>
      <p><strong>Lock Period:</strong> ${lockDays} days</p>
      <p>Your rewards will be calculated daily and credited to your account.</p>
    `,
  });
}

/**
 * Staking Rewards Earned
 */
export async function emailStakingRewards(
  email: string,
  rewardAmount: number,
  totalStaked: number
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `🎉 Staking Rewards: +${rewardAmount} SKY4444`,
    html: `
      <h2>Staking Rewards Earned!</h2>
      <p><strong>Reward Amount:</strong> +${rewardAmount} SKY4444</p>
      <p><strong>Total Staked:</strong> ${totalStaked} SKY4444</p>
      <p>Your rewards have been automatically added to your account.</p>
    `,
  });
}

/**
 * Payment Received
 */
export async function emailPaymentReceived(
  email: string,
  amount: number,
  currency: string,
  orderId: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Payment Received: ${amount} ${currency}`,
    html: `
      <h2>✅ Payment Received</h2>
      <p><strong>Amount:</strong> ${amount} ${currency}</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p>Your payment has been processed successfully.</p>
    `,
  });
}

/**
 * Crypto Swap Completed
 */
export async function emailSwapCompleted(
  email: string,
  fromToken: string,
  toToken: string,
  fromAmount: number,
  toAmount: number
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Swap Completed: ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`,
    html: `
      <h2>✅ Swap Completed</h2>
      <p><strong>From:</strong> ${fromAmount} ${fromToken}</p>
      <p><strong>To:</strong> ${toAmount} ${toToken}</p>
      <p>Your tokens have been swapped and are now in your wallet.</p>
    `,
  });
}

/**
 * Tip Received
 */
export async function emailTipReceived(
  email: string,
  amount: number,
  currency: string,
  fromUser: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `💰 Tip Received: ${amount} ${currency} from ${fromUser}`,
    html: `
      <h2>You Received a Tip!</h2>
      <p><strong>Amount:</strong> ${amount} ${currency}</p>
      <p><strong>From:</strong> ${fromUser}</p>
      <p>Thank you for your contribution to the community!</p>
    `,
  });
}

/**
 * Mining Rewards
 */
export async function emailMiningRewards(
  email: string,
  rewardAmount: number,
  miningAgent: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `⛏️ Mining Rewards: +${rewardAmount} SKY4444`,
    html: `
      <h2>Mining Rewards Earned!</h2>
      <p><strong>Reward Amount:</strong> +${rewardAmount} SKY4444</p>
      <p><strong>Mining Agent:</strong> ${miningAgent}</p>
      <p>Your AI mining agent earned these rewards while you slept!</p>
    `,
  });
}

/**
 * Charity Campaign Created
 */
export async function emailCharityCampaignCreated(
  email: string,
  campaignName: string,
  campaignId: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `🎗️ Charity Campaign Created: ${campaignName}`,
    html: `
      <h2>Campaign Created Successfully!</h2>
      <p><strong>Campaign:</strong> ${campaignName}</p>
      <p><strong>Campaign ID:</strong> ${campaignId}</p>
      <p>Share your campaign with the community to start raising funds!</p>
    `,
  });
}

/**
 * Donation Received
 */
export async function emailDonationReceived(
  email: string,
  amount: number,
  campaignName: string,
  donorName: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `❤️ Donation Received: ${amount} SKY4444 for ${campaignName}`,
    html: `
      <h2>Donation Received!</h2>
      <p><strong>Amount:</strong> ${amount} SKY4444</p>
      <p><strong>Campaign:</strong> ${campaignName}</p>
      <p><strong>From:</strong> ${donorName}</p>
      <p>Thank you for supporting this cause!</p>
    `,
  });
}

/**
 * Marketplace Sale
 */
export async function emailMarketplaceSale(
  email: string,
  itemName: string,
  salePrice: number,
  buyerName: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `🛍️ Item Sold: ${itemName} for ${salePrice} SKY4444`,
    html: `
      <h2>Your Item Sold!</h2>
      <p><strong>Item:</strong> ${itemName}</p>
      <p><strong>Price:</strong> ${salePrice} SKY4444</p>
      <p><strong>Buyer:</strong> ${buyerName}</p>
      <p>The funds have been transferred to your wallet.</p>
    `,
  });
}

/**
 * Achievement Unlocked
 */
export async function emailAchievementUnlocked(
  email: string,
  achievementName: string,
  reward: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `🏆 Achievement Unlocked: ${achievementName}`,
    html: `
      <h2>Achievement Unlocked!</h2>
      <p><strong>Achievement:</strong> ${achievementName}</p>
      <p><strong>Reward:</strong> ${reward}</p>
      <p>Keep up the great work!</p>
    `,
  });
}

/**
 * Governance Vote Reminder
 */
export async function emailGovernanceVoteReminder(
  email: string,
  proposalTitle: string,
  votingEndsIn: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `🗳️ Governance Vote: ${proposalTitle}`,
    html: `
      <h2>Vote on This Proposal</h2>
      <p><strong>Proposal:</strong> ${proposalTitle}</p>
      <p><strong>Voting Ends:</strong> ${votingEndsIn}</p>
      <p><a href="https://skycoinpro-ebv4wfmm.manus.space/governance">Vote Now →</a></p>
    `,
  });
}

/**
 * Owner Notification: New User Signup
 */
export async function notifyOwnerNewUser(userName: string, email: string): Promise<boolean> {
  return notifyOwner(
    "New User Signup",
    `
      <h2>New User Registered</h2>
      <p><strong>Name:</strong> ${userName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p>Total platform users growing!</p>
    `
  );
}

/**
 * Owner Notification: Large Transaction
 */
export async function notifyOwnerLargeTransaction(
  amount: number,
  currency: string,
  type: string,
  userName: string
): Promise<boolean> {
  return notifyOwner(
    `Large ${type} Transaction: ${amount} ${currency}`,
    `
      <h2>Large Transaction Alert</h2>
      <p><strong>Type:</strong> ${type}</p>
      <p><strong>Amount:</strong> ${amount} ${currency}</p>
      <p><strong>User:</strong> ${userName}</p>
    `
  );
}

/**
 * Owner Notification: System Alert
 */
export async function notifyOwnerSystemAlert(alertType: string, message: string): Promise<boolean> {
  return notifyOwner(
    `System Alert: ${alertType}`,
    `
      <h2>System Alert</h2>
      <p><strong>Type:</strong> ${alertType}</p>
      <p><strong>Message:</strong> ${message}</p>
    `
  );
}

export default {
  sendEmail,
  notifyOwner,
  emailUserSignup,
  emailStakingConfirmed,
  emailStakingRewards,
  emailPaymentReceived,
  emailSwapCompleted,
  emailTipReceived,
  emailMiningRewards,
  emailCharityCampaignCreated,
  emailDonationReceived,
  emailMarketplaceSale,
  emailAchievementUnlocked,
  emailGovernanceVoteReminder,
  notifyOwnerNewUser,
  notifyOwnerLargeTransaction,
  notifyOwnerSystemAlert,
};
