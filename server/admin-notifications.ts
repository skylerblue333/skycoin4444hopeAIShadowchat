/**
 * Admin Notification System
 * Sends formatted notifications to Sky4 admin account (iitrskylerblue4444@gmail.com)
 * via in-app ShadowChat messaging
 */

import * as db from "./db";

const ADMIN_USER_ID = "admin-skyler-blue"; // Sky4 admin account identifier

export interface AdminNotification {
  type: "user_signup" | "payment" | "stake" | "swap" | "tip" | "mining" | "charity" | "marketplace" | "governance" | "security" | "system";
  title: string;
  message: string;
  data?: Record<string, any>;
  severity?: "info" | "warning" | "critical";
  timestamp?: number;
}

/**
 * Send notification to admin ShadowChat
 */
export async function notifyAdmin(notification: AdminNotification): Promise<boolean> {
  try {
    const timestamp = notification.timestamp || Date.now();
    const severity = notification.severity || "info";
    
    // Format message for ShadowChat
    const formattedMessage = formatNotificationMessage(notification);
    
    // Store in database for retrieval via ShadowChat
    await db.createNotification({
      userId: 1, // Admin user ID
      type: notification.type,
      title: notification.title,
      message: formattedMessage,
    });
    return true;
  } catch (error) {
        return false;
  }
}

/**
 * Format notification for display in ShadowChat
 */
function formatNotificationMessage(notification: AdminNotification): string {
  const timestamp = new Date(notification.timestamp || Date.now()).toLocaleString();
  let message = `\n📌 **${notification.title}**\n`;
  message += `${notification.message}\n`;
  message += `⏰ ${timestamp}\n`;
  
  if (notification.data && Object.keys(notification.data).length > 0) {
    message += `\n📊 **Details:**\n`;
    Object.entries(notification.data).forEach(([key, value]) => {
      message += `• ${key}: ${value}\n`;
    });
  }
  
  return message;
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION TRIGGERS
// ═══════════════════════════════════════════════════════════════

/**
 * New User Signup
 */
export async function notifyNewUser(userName: string, email: string, airdropAmount: number): Promise<boolean> {
  return notifyAdmin({
    type: "user_signup",
    title: `👤 New User: ${userName}`,
    message: `New user registered on the platform`,
    data: {
      "User Name": userName,
      "Email": email,
      "Airdrop": `${airdropAmount} SKY4444`,
      "Timestamp": new Date().toISOString(),
    },
    severity: "info",
  });
}

/**
 * Payment Received
 */
export async function notifyPaymentReceived(
  amount: number,
  currency: string,
  userName: string,
  orderId: string,
  method: "stripe" | "coinbase" | "crypto"
): Promise<boolean> {
  return notifyAdmin({
    type: "payment",
    title: `💳 Payment Received: ${amount} ${currency}`,
    message: `Payment processed successfully`,
    data: {
      "Amount": `${amount} ${currency}`,
      "Method": method.toUpperCase(),
      "User": userName,
      "Order ID": orderId,
      "Status": "✅ Completed",
    },
    severity: "info",
  });
}

/**
 * Large Payment Alert
 */
export async function notifyLargePayment(
  amount: number,
  currency: string,
  userName: string,
  threshold: number
): Promise<boolean> {
  return notifyAdmin({
    type: "payment",
    title: `⚠️ LARGE PAYMENT: ${amount} ${currency}`,
    message: `Payment exceeds threshold of ${threshold} ${currency}`,
    data: {
      "Amount": `${amount} ${currency}`,
      "Threshold": `${threshold} ${currency}`,
      "User": userName,
      "Alert Level": "HIGH",
    },
    severity: "warning",
  });
}

/**
 * Staking Event
 */
export async function notifyStakingEvent(
  userName: string,
  amount: number,
  apy: number,
  lockDays: number,
  poolId: string
): Promise<boolean> {
  return notifyAdmin({
    type: "stake",
    title: `📈 Staking: ${amount} SKY4444 @ ${apy}% APY`,
    message: `User staked tokens in liquidity pool`,
    data: {
      "User": userName,
      "Amount": `${amount} SKY4444`,
      "APY": `${apy}%`,
      "Lock Period": `${lockDays} days`,
      "Pool ID": poolId,
      "Status": "✅ Active",
    },
    severity: "info",
  });
}

/**
 * Swap Executed
 */
export async function notifySwapExecuted(
  userName: string,
  fromToken: string,
  toToken: string,
  fromAmount: number,
  toAmount: number,
  slippage: number
): Promise<boolean> {
  return notifyAdmin({
    type: "swap",
    title: `🔄 Swap: ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`,
    message: `Token swap completed on DEX`,
    data: {
      "User": userName,
      "From": `${fromAmount} ${fromToken}`,
      "To": `${toAmount} ${toToken}`,
      "Slippage": `${slippage}%`,
      "Price Impact": "Calculated",
      "Status": "✅ Completed",
    },
    severity: "info",
  });
}

/**
 * Tip Sent
 */
export async function notifyTipSent(
  fromUser: string,
  toUser: string,
  amount: number,
  currency: string,
  message: string
): Promise<boolean> {
  return notifyAdmin({
    type: "tip",
    title: `💰 Tip: ${amount} ${currency} from ${fromUser}`,
    message: `Creator tip sent successfully`,
    data: {
      "From": fromUser,
      "To": toUser,
      "Amount": `${amount} ${currency}`,
      "Message": message || "(no message)",
      "Status": "✅ Sent",
    },
    severity: "info",
  });
}

/**
 * Mining Rewards Earned
 */
export async function notifyMiningRewards(
  userName: string,
  rewardAmount: number,
  miningAgent: string,
  totalEarned: number
): Promise<boolean> {
  return notifyAdmin({
    type: "mining",
    title: `⛏️ Mining Rewards: +${rewardAmount} SKY4444`,
    message: `AI mining agent earned rewards`,
    data: {
      "User": userName,
      "Reward": `${rewardAmount} SKY4444`,
      "Mining Agent": miningAgent,
      "Total Earned": `${totalEarned} SKY4444`,
      "Status": "✅ Credited",
    },
    severity: "info",
  });
}

/**
 * Charity Campaign Created
 */
export async function notifyCharityCampaignCreated(
  campaignName: string,
  creatorName: string,
  targetAmount: number,
  campaignId: string
): Promise<boolean> {
  return notifyAdmin({
    type: "charity",
    title: `🎗️ Charity Campaign: ${campaignName}`,
    message: `New charity campaign launched`,
    data: {
      "Campaign": campaignName,
      "Creator": creatorName,
      "Target": `${targetAmount} SKY4444`,
      "Campaign ID": campaignId,
      "Status": "✅ Live",
    },
    severity: "info",
  });
}

/**
 * Donation Received
 */
export async function notifyDonationReceived(
  campaignName: string,
  donorName: string,
  amount: number,
  totalRaised: number,
  targetAmount: number
): Promise<boolean> {
  const percentageRaised = ((totalRaised / targetAmount) * 100).toFixed(1);
  return notifyAdmin({
    type: "charity",
    title: `❤️ Donation: ${amount} SKY4444 for ${campaignName}`,
    message: `Donation received for charity campaign`,
    data: {
      "Campaign": campaignName,
      "Donor": donorName,
      "Amount": `${amount} SKY4444`,
      "Total Raised": `${totalRaised} SKY4444`,
      "Target": `${targetAmount} SKY4444`,
      "Progress": `${percentageRaised}%`,
      "Status": "✅ Received",
    },
    severity: "info",
  });
}

/**
 * Marketplace Sale
 */
export async function notifyMarketplaceSale(
  itemName: string,
  sellerName: string,
  buyerName: string,
  salePrice: number,
  currency: string,
  listingId: string
): Promise<boolean> {
  return notifyAdmin({
    type: "marketplace",
    title: `🛍️ Sale: ${itemName} - ${salePrice} ${currency}`,
    message: `Item sold on marketplace`,
    data: {
      "Item": itemName,
      "Seller": sellerName,
      "Buyer": buyerName,
      "Price": `${salePrice} ${currency}`,
      "Listing ID": listingId,
      "Status": "✅ Completed",
    },
    severity: "info",
  });
}

/**
 * NFT Minted
 */
export async function notifyNFTMinted(
  nftName: string,
  creatorName: string,
  tokenId: string,
  contractAddress: string
): Promise<boolean> {
  return notifyAdmin({
    type: "marketplace",
    title: `🎨 NFT Minted: ${nftName}`,
    message: `New NFT created and minted`,
    data: {
      "NFT": nftName,
      "Creator": creatorName,
      "Token ID": tokenId,
      "Contract": contractAddress,
      "Status": "✅ Minted",
    },
    severity: "info",
  });
}

/**
 * Achievement Unlocked
 */
export async function notifyAchievementUnlocked(
  userName: string,
  achievementName: string,
  reward: string,
  rarity: "common" | "rare" | "epic" | "legendary"
): Promise<boolean> {
  const rarityEmoji = {
    common: "⚪",
    rare: "🔵",
    epic: "🟣",
    legendary: "🟡",
  };
  
  return notifyAdmin({
    type: "system",
    title: `${rarityEmoji[rarity]} Achievement: ${achievementName}`,
    message: `User unlocked achievement`,
    data: {
      "User": userName,
      "Achievement": achievementName,
      "Rarity": rarity.toUpperCase(),
      "Reward": reward,
      "Status": "✅ Unlocked",
    },
    severity: "info",
  });
}

/**
 * Governance Vote
 */
export async function notifyGovernanceVote(
  proposalTitle: string,
  proposalId: string,
  votesFor: number,
  votesAgainst: number,
  status: "active" | "passed" | "failed"
): Promise<boolean> {
  const statusEmoji = {
    active: "🗳️",
    passed: "✅",
    failed: "❌",
  };
  
  return notifyAdmin({
    type: "governance",
    title: `${statusEmoji[status]} Governance: ${proposalTitle}`,
    message: `DAO proposal vote update`,
    data: {
      "Proposal": proposalTitle,
      "Proposal ID": proposalId,
      "For": votesFor,
      "Against": votesAgainst,
      "Status": status.toUpperCase(),
    },
    severity: "info",
  });
}

/**
 * Security Alert
 */
export async function notifySecurityAlert(
  alertType: string,
  description: string,
  affectedUsers: number,
  action: string
): Promise<boolean> {
  return notifyAdmin({
    type: "security",
    title: `🔒 Security Alert: ${alertType}`,
    message: `Security issue detected and action taken`,
    data: {
      "Alert Type": alertType,
      "Description": description,
      "Affected Users": affectedUsers,
      "Action Taken": action,
      "Severity": "HIGH",
    },
    severity: "critical",
  });
}

/**
 * System Health Alert
 */
export async function notifySystemAlert(
  alertType: string,
  message: string,
  metrics: Record<string, any>
): Promise<boolean> {
  return notifyAdmin({
    type: "system",
    title: `⚙️ System Alert: ${alertType}`,
    message: `System health check alert`,
    data: {
      "Alert": alertType,
      "Message": message,
      ...metrics,
    },
    severity: "warning",
  });
}

/**
 * Daily Summary Report
 */
export async function notifyDailySummary(
  newUsers: number,
  totalTransactions: number,
  totalVolume: number,
  topUser: string,
  topActivity: string
): Promise<boolean> {
  return notifyAdmin({
    type: "system",
    title: `📊 Daily Summary Report`,
    message: `Platform activity summary for the day`,
    data: {
      "New Users": newUsers,
      "Total Transactions": totalTransactions,
      "Total Volume": `${totalVolume} SKY4444`,
      "Top User": topUser,
      "Top Activity": topActivity,
      "Date": new Date().toLocaleDateString(),
    },
    severity: "info",
  });
}

export default {
  notifyAdmin,
  notifyNewUser,
  notifyPaymentReceived,
  notifyLargePayment,
  notifyStakingEvent,
  notifySwapExecuted,
  notifyTipSent,
  notifyMiningRewards,
  notifyCharityCampaignCreated,
  notifyDonationReceived,
  notifyMarketplaceSale,
  notifyNFTMinted,
  notifyAchievementUnlocked,
  notifyGovernanceVote,
  notifySecurityAlert,
  notifySystemAlert,
  notifyDailySummary,
};
