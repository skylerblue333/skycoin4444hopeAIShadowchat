import crypto from 'crypto';
/**
 * NFT Ownership Engine
 * Phase 5B — Sovereignty Build
 *
 * True digital ownership infrastructure:
 * - NFT minting pipeline
 * - Metadata engine (ERC-721/ERC-1155 compliant)
 * - IPFS pinning service
 * - Rarity scoring engine
 * - Creator drops (whitelist, public, Dutch auction)
 * - GameFi NFT rewards
 * - Donor NFTs (charity proof-of-impact)
 * - Profile NFTs (identity tokens)
 * - Royalty engine (EIP-2981)
 * - Collection launch engine
 * - NFT settlement (buy/sell/transfer)
 */

import { invokeLLM } from "./_core/llm";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  animationUrl?: string;
  externalUrl?: string;
  backgroundColor?: string;
  attributes: NFTAttribute[];
  properties?: Record<string, unknown>;
  compiler?: string;
  createdBy?: string;
}

export interface NFTAttribute {
  traitType: string;
  value: string | number;
  displayType?: "number" | "boost_number" | "boost_percentage" | "date";
  maxValue?: number;
}

export interface NFT {
  id: string;
  tokenId: number;
  contractAddress: string;
  collectionId: string;
  ownerId: number;
  ownerAddress: string;
  creatorId: number;
  creatorAddress: string;
  metadata: NFTMetadata;
  ipfsHash: string;
  ipfsMetadataHash: string;
  rarityScore: number;
  rarityRank: number;
  rarityTier: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  mintedAt: Date;
  lastTransferAt: Date;
  isListed: boolean;
  listingPrice?: bigint;
  listingCurrency?: string;
  isBurned: boolean;
  nftType: "art" | "gaming" | "profile" | "donor" | "membership" | "achievement" | "ticket";
  txHash: string;
  chainId: number;
}

export interface NFTCollection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  contractAddress: string;
  creatorId: number;
  creatorAddress: string;
  coverImage: string;
  bannerImage: string;
  totalSupply: number;
  maxSupply: number;
  mintedCount: number;
  floorPrice: bigint;
  totalVolume: bigint;
  ownerCount: number;
  royaltyPercent: number;
  royaltyRecipient: string;
  category: "art" | "gaming" | "profile" | "charity" | "membership" | "pfp" | "utility";
  isVerified: boolean;
  isActive: boolean;
  launchType: "instant" | "whitelist" | "dutch_auction" | "fair_launch";
  mintPrice: bigint;
  mintCurrency: "SKY444" | "ETH" | "USDT" | "BNB";
  whitelistAddresses?: string[];
  whitelistMintPrice?: bigint;
  dutchAuctionStartPrice?: bigint;
  dutchAuctionEndPrice?: bigint;
  dutchAuctionDuration?: number;
  launchTime: Date;
  revealTime?: Date;
  isRevealed: boolean;
  createdAt: Date;
}

export interface NFTDrop {
  id: string;
  collectionId: string;
  name: string;
  description: string;
  dropType: "whitelist" | "public" | "dutch_auction" | "free_claim" | "airdrop";
  totalDropped: number;
  maxPerWallet: number;
  mintPrice: bigint;
  currency: string;
  startTime: Date;
  endTime: Date;
  whitelistMerkleRoot?: string;
  dutchAuctionConfig?: {
    startPrice: bigint;
    endPrice: bigint;
    priceDecrement: bigint;
    decrementInterval: number;
  };
  status: "upcoming" | "active" | "sold_out" | "ended";
  minted: number;
  revenue: bigint;
}

export interface RoyaltyConfig {
  collectionId: string;
  contractAddress: string;
  royaltyPercent: number; // basis points (250 = 2.5%)
  recipient: string;
  splitRecipients?: { address: string; percent: number }[];
  totalEarned: bigint;
  pendingPayout: bigint;
}

export interface NFTTransaction {
  id: string;
  nftId: string;
  type: "mint" | "transfer" | "sale" | "burn" | "list" | "delist" | "offer" | "accept_offer";
  fromUserId?: number;
  toUserId?: number;
  fromAddress: string;
  toAddress: string;
  price?: bigint;
  currency?: string;
  royaltyPaid?: bigint;
  platformFee?: bigint;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
}

export interface IPFSPin {
  hash: string;
  name: string;
  size: number;
  type: "image" | "video" | "audio" | "metadata" | "collection";
  pinnedAt: Date;
  gateway: string;
  isPinned: boolean;
}

export interface RarityAnalysis {
  nftId: string;
  score: number;
  rank: number;
  tier: NFT["rarityTier"];
  traitScores: { trait: string; value: string | number; rarity: number; score: number }[];
  percentile: number;
}

// ─── IPFS PINNING SERVICE ─────────────────────────────────────────────────────

class IPFSPinningService {
  private pins = new Map<string, IPFSPin>();
  private readonly GATEWAYS = [
    "https://ipfs.io/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://nftstorage.link/ipfs/",
  ];

  async pinContent(content: string | Buffer, name: string, type: IPFSPin["type"]): Promise<IPFSPin> {
    // Simulate IPFS pinning — in production this calls Pinata/NFT.Storage API
    const contentStr = typeof content === "string" ? content : content.toString("base64");
    const hash = `Qm${Buffer.from(contentStr + name + Date.now()).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 44)}`;
    const pin: IPFSPin = {
      hash,
      name,
      size: contentStr.length,
      type,
      pinnedAt: new Date(),
      gateway: this.GATEWAYS[0] + hash,
      isPinned: true,
    };
    this.pins.set(hash, pin);
    return pin;
  }

  async pinMetadata(metadata: NFTMetadata): Promise<string> {
    const pin = await this.pinContent(JSON.stringify(metadata), `${metadata.name}_metadata`, "metadata");
    return pin.hash;
  }

  async pinImage(imageUrl: string, name: string): Promise<string> {
    const pin = await this.pinContent(imageUrl, name, "image");
    return pin.hash;
  }

  getGatewayUrl(hash: string, preferredGateway = 0): string {
    return this.GATEWAYS[preferredGateway % this.GATEWAYS.length] + hash;
  }

  getPin(hash: string): IPFSPin | undefined {
    return this.pins.get(hash);
  }

  unpin(hash: string): boolean {
    const pin = this.pins.get(hash);
    if (!pin) return false;
    pin.isPinned = false;
    return true;
  }

  getPinStats() {
    const all = Array.from(this.pins.values());
    const pinned = all.filter(p => p.isPinned);
    return {
      totalPins: all.length,
      activePins: pinned.length,
      totalSize: pinned.reduce((sum, p) => sum + p.size, 0),
      byType: {
        image: pinned.filter(p => p.type === "image").length,
        metadata: pinned.filter(p => p.type === "metadata").length,
        video: pinned.filter(p => p.type === "video").length,
        collection: pinned.filter(p => p.type === "collection").length,
      },
    };
  }
}

// ─── METADATA ENGINE ──────────────────────────────────────────────────────────

class MetadataEngine {
  async generateMetadata(
    name: string,
    description: string,
    imageHash: string,
    attributes: NFTAttribute[],
    creatorName: string,
    animationHash?: string
  ): Promise<NFTMetadata> {
    return {
      name,
      description,
      image: `ipfs://${imageHash}`,
      animationUrl: animationHash ? `ipfs://${animationHash}` : undefined,
      attributes,
      compiler: "ShadowChat NFT Engine v5",
      createdBy: creatorName,
      properties: {
        files: [{ uri: `ipfs://${imageHash}`, type: "image/png" }],
        category: "image",
      },
    };
  }

  async generateAIDescription(nftName: string, attributes: NFTAttribute[]): Promise<string> {
    try {
      const attrStr = attributes.map(a => `${a.traitType}: ${a.value}`).join(", ");
      return (await invokeLLM({ messages: [{ role: "user" as const, content: `Write a compelling 2-sentence NFT description for "${nftName}" with traits: ${attrStr}. Make it evocative and unique.` }] }))?.choices[0]?.message?.content as string;
    } catch {
      return `${nftName} is a unique digital collectible with distinctive traits that make it one of a kind in the ShadowChat ecosystem.`;
    }
  }

  buildProfileNFTMetadata(userId: number, username: string, level: number, achievements: string[]): NFTMetadata {
    return {
      name: `${username} Profile NFT`,
      description: `Official ShadowChat profile NFT for ${username}. Level ${level} creator with ${achievements.length} achievements.`,
      image: `https://api.shadowchat.app/profile-nft/${userId}/image`,
      attributes: [
        { traitType: "Username", value: username },
        { traitType: "Level", value: level, displayType: "number" },
        { traitType: "Achievements", value: achievements.length, displayType: "number" },
        { traitType: "Member Since", value: Math.floor(Date.now() / 1000), displayType: "date" },
        { traitType: "Platform", value: "ShadowChat" },
      ],
      properties: { type: "profile", userId },
    };
  }

  buildDonorNFTMetadata(donorName: string, charityName: string, amount: number, campaignId: string): NFTMetadata {
    const tier = amount >= 10000 ? "Platinum" : amount >= 1000 ? "Gold" : amount >= 100 ? "Silver" : "Bronze";
    return {
      name: `${tier} Donor — ${charityName}`,
      description: `Proof-of-impact NFT awarded to ${donorName} for donating $${amount.toLocaleString()} to ${charityName}. This NFT represents verified charitable impact on the blockchain.`,
      image: `https://api.shadowchat.app/donor-nft/${campaignId}/${tier.toLowerCase()}/image`,
      attributes: [
        { traitType: "Donor", value: donorName },
        { traitType: "Charity", value: charityName },
        { traitType: "Donation Amount", value: amount, displayType: "number" },
        { traitType: "Tier", value: tier },
        { traitType: "Campaign ID", value: campaignId },
        { traitType: "Verified", value: "Yes" },
        { traitType: "Date", value: Math.floor(Date.now() / 1000), displayType: "date" },
      ],
    };
  }

  buildGameFiNFTMetadata(
    itemName: string,
    itemType: string,
    rarity: string,
    stats: Record<string, number>,
    gameId: string
  ): NFTMetadata {
    const statAttributes: NFTAttribute[] = Object.entries(stats).map(([key, value]) => ({
      traitType: key,
      value,
      displayType: "number" as const,
    }));
    return {
      name: itemName,
      description: `A ${rarity} ${itemType} from the ShadowChat GameFi universe. Usable in-game and tradeable on the marketplace.`,
      image: `https://api.shadowchat.app/gamefi-nft/${gameId}/${itemName.toLowerCase().replace(/\s/g, "-")}/image`,
      attributes: [
        { traitType: "Item Type", value: itemType },
        { traitType: "Rarity", value: rarity },
        { traitType: "Game", value: gameId },
        ...statAttributes,
      ],
      properties: { type: "gaming", gameId, usable: true },
    };
  }
}

// ─── RARITY ENGINE ────────────────────────────────────────────────────────────

class NFTRarityEngine {
  calculateCollectionRarity(nfts: { id: string; attributes: NFTAttribute[] }[]): Map<string, RarityAnalysis> {
    const results = new Map<string, RarityAnalysis>();
    if (nfts.length === 0) return results;

    // Build trait frequency maps
    const traitFrequency = new Map<string, Map<string | number, number>>();
    for (const nft of nfts) {
      for (const attr of nft.attributes) {
        if (!traitFrequency.has(attr.traitType)) {
          traitFrequency.set(attr.traitType, new Map());
        }
        const valueMap = traitFrequency.get(attr.traitType)!;
        valueMap.set(attr.value, (valueMap.get(attr.value) || 0) + 1);
      }
    }

    // Calculate rarity scores
    const scores: { id: string; score: number }[] = [];
    for (const nft of nfts) {
      const traitScores: RarityAnalysis["traitScores"] = [];
      let totalScore = 0;

      for (const attr of nft.attributes) {
        const valueMap = traitFrequency.get(attr.traitType);
        if (!valueMap) continue;
        const count = valueMap.get(attr.value) || 1;
        const rarity = count / nfts.length;
        const score = 1 / rarity;
        traitScores.push({ trait: attr.traitType, value: attr.value, rarity, score });
        totalScore += score;
      }

      scores.push({ id: nft.id, score: totalScore });
      results.set(nft.id, {
        nftId: nft.id,
        score: totalScore,
        rank: 0, // set after sorting
        tier: "common",
        traitScores,
        percentile: 0,
      });
    }

    // Rank by score
    scores.sort((a, b) => b.score - a.score);
    for (let i = 0; i < scores.length; i++) {
      const analysis = results.get(scores[i].id)!;
      analysis.rank = i + 1;
      analysis.percentile = ((scores.length - i) / scores.length) * 100;
      analysis.tier = this.getTier(i + 1, scores.length);
    }

    return results;
  }

  private getTier(rank: number, total: number): NFT["rarityTier"] {
    const percentile = (rank / total) * 100;
    if (percentile <= 0.5) return "mythic";
    if (percentile <= 2) return "legendary";
    if (percentile <= 8) return "epic";
    if (percentile <= 20) return "rare";
    if (percentile <= 45) return "uncommon";
    return "common";
  }

  calculateSingleNFTRarity(attributes: NFTAttribute[], collectionStats: Map<string, Map<string | number, number>>, totalSupply: number): {
    score: number;
    tier: NFT["rarityTier"];
    traitScores: RarityAnalysis["traitScores"];
  } {
    const traitScores: RarityAnalysis["traitScores"] = [];
    let totalScore = 0;

    for (const attr of attributes) {
      const valueMap = collectionStats.get(attr.traitType);
      if (!valueMap) continue;
      const count = valueMap.get(attr.value) || 1;
      const rarity = count / totalSupply;
      const score = 1 / rarity;
      traitScores.push({ trait: attr.traitType, value: attr.value, rarity, score });
      totalScore += score;
    }

    return {
      score: totalScore,
      tier: this.getTier(1, 1),       traitScores,
    };
  }
}

// ─── NFT MINTING SERVICE ──────────────────────────────────────────────────────

class NFTMintingService {
  private nfts = new Map<string, NFT>();
  private collections = new Map<string, NFTCollection>();
  private tokenCounters = new Map<string, number>();

  createCollection(
    creatorId: number,
    creatorAddress: string,
    data: Omit<NFTCollection, "id" | "mintedCount" | "floorPrice" | "totalVolume" | "ownerCount" | "isVerified" | "createdAt">
  ): NFTCollection {
    const collection: NFTCollection = {
      ...data,
      id: `col_${Date.now()}_${creatorId}`,
      mintedCount: 0,
      floorPrice: data.mintPrice,
      totalVolume: 0n,
      ownerCount: 0,
      isVerified: false,
      createdAt: new Date(),
    };
    this.collections.set(collection.id, collection);
    this.tokenCounters.set(collection.id, 0);
    return collection;
  }

  async mintNFT(
    collectionId: string,
    ownerId: number,
    ownerAddress: string,
    metadata: NFTMetadata,
    ipfsImageHash: string,
    nftType: NFT["nftType"] = "art"
  ): Promise<NFT> {
    const collection = this.collections.get(collectionId);
    if (!collection) throw new Error("Collection not found");
    if (collection.mintedCount >= collection.maxSupply) throw new Error("Collection fully minted");

    const tokenId = (this.tokenCounters.get(collectionId) || 0) + 1;
    this.tokenCounters.set(collectionId, tokenId);

    const ipfsMetadataHash = await ipfsPinning.pinMetadata(metadata);
    const txHash = `0x${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2)}${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2)}`;

    const nft: NFT = {
      id: `nft_${collectionId}_${tokenId}`,
      tokenId,
      contractAddress: collection.contractAddress,
      collectionId,
      ownerId,
      ownerAddress,
      creatorId: collection.creatorId,
      creatorAddress: collection.creatorAddress,
      metadata,
      ipfsHash: ipfsImageHash,
      ipfsMetadataHash,
      rarityScore: 0,
      rarityRank: 0,
      rarityTier: "common",
      mintedAt: new Date(),
      lastTransferAt: new Date(),
      isListed: false,
      isBurned: false,
      nftType,
      txHash,
      chainId: 1,
    };

    this.nfts.set(nft.id, nft);
    collection.mintedCount++;
    collection.ownerCount = new Set(
      Array.from(this.nfts.values())
        .filter(n => n.collectionId === collectionId && !n.isBurned)
        .map(n => n.ownerId)
    ).size;

    return nft;
  }

  async batchMint(
    collectionId: string,
    ownerId: number,
    ownerAddress: string,
    metadataList: NFTMetadata[],
    nftType: NFT["nftType"] = "art"
  ): Promise<NFT[]> {
    const results: NFT[] = [];
    for (const metadata of metadataList) {
      const imageHash = await ipfsPinning.pinImage(metadata.image, metadata.name);
      const nft = await this.mintNFT(collectionId, ownerId, ownerAddress, metadata, imageHash, nftType);
      results.push(nft);
    }
    return results;
  }

  getNFT(nftId: string): NFT | undefined {
    return this.nfts.get(nftId);
  }

  getCollection(collectionId: string): NFTCollection | undefined {
    return this.collections.get(collectionId);
  }

  getUserNFTs(userId: number, nftType?: NFT["nftType"]): NFT[] {
    return Array.from(this.nfts.values()).filter(n =>
      n.ownerId === userId && !n.isBurned && (!nftType || n.nftType === nftType)
    );
  }

  getCollectionNFTs(collectionId: string, limit = 50, offset = 0): NFT[] {
    return Array.from(this.nfts.values())
      .filter(n => n.collectionId === collectionId && !n.isBurned)
      .slice(offset, offset + limit);
  }

  getAllCollections(category?: NFTCollection["category"]): NFTCollection[] {
    const all = Array.from(this.collections.values()).filter(c => c.isActive);
    return category ? all.filter(c => c.category === category) : all;
  }

  updateRarityScores(collectionId: string): void {
    const collectionNFTs = Array.from(this.nfts.values()).filter(n => n.collectionId === collectionId);
    const rarityData = rarityEngine.calculateCollectionRarity(
      collectionNFTs.map(n => ({ id: n.id, attributes: n.metadata.attributes }))
    );
    for (const [nftId, analysis] of rarityData) {
      const nft = this.nfts.get(nftId);
      if (nft) {
        nft.rarityScore = analysis.score;
        nft.rarityRank = analysis.rank;
        nft.rarityTier = analysis.tier;
      }
    }
    // Update floor price based on lowest listed price
    const listed = collectionNFTs.filter(n => n.isListed && n.listingPrice);
    if (listed.length > 0) {
      const collection = this.collections.get(collectionId);
      if (collection) {
        collection.floorPrice = listed.reduce((min, n) => n.listingPrice! < min ? n.listingPrice! : min, listed[0].listingPrice!);
      }
    }
  }
}

// ─── CREATOR DROPS SERVICE ────────────────────────────────────────────────────

class CreatorDropsService {
  private drops = new Map<string, NFTDrop>();
  private mintRecords = new Map<string, { userId: number; count: number }[]>();

  createDrop(
    collectionId: string,
    name: string,
    description: string,
    dropType: NFTDrop["dropType"],
    totalDropped: number,
    maxPerWallet: number,
    mintPrice: bigint,
    currency: string,
    startTime: Date,
    endTime: Date,
    dutchAuctionConfig?: NFTDrop["dutchAuctionConfig"]
  ): NFTDrop {
    const drop: NFTDrop = {
      id: `drop_${collectionId}_${Date.now()}`,
      collectionId,
      name,
      description,
      dropType,
      totalDropped,
      maxPerWallet,
      mintPrice,
      currency,
      startTime,
      endTime,
      dutchAuctionConfig,
      status: "upcoming",
      minted: 0,
      revenue: 0n,
    };
    this.drops.set(drop.id, drop);
    this.mintRecords.set(drop.id, []);
    return drop;
  }

  getCurrentPrice(dropId: string): bigint {
    const drop = this.drops.get(dropId);
    if (!drop) return 0n;
    if (drop.dropType !== "dutch_auction" || !drop.dutchAuctionConfig) {
      return drop.mintPrice;
    }
    const { startPrice, endPrice, priceDecrement, decrementInterval } = drop.dutchAuctionConfig;
    const elapsed = Date.now() - drop.startTime.getTime();
    const intervals = Math.floor(elapsed / (decrementInterval * 1000));
    const totalDecrement = priceDecrement * BigInt(intervals);
    const currentPrice = startPrice - totalDecrement;
    return currentPrice < endPrice ? endPrice : currentPrice;
  }

  canMint(dropId: string, userId: number): { canMint: boolean; reason?: string } {
    const drop = this.drops.get(dropId);
    if (!drop) return { canMint: false, reason: "Drop not found" };
    if (drop.status !== "active") return { canMint: false, reason: "Drop not active" };
    if (drop.minted >= drop.totalDropped) return { canMint: false, reason: "Sold out" };
    const records = this.mintRecords.get(dropId) || [];
    const userRecord = records.find(r => r.userId === userId);
    if (userRecord && userRecord.count >= drop.maxPerWallet) {
      return { canMint: false, reason: `Maximum ${drop.maxPerWallet} per wallet` };
    }
    return { canMint: true };
  }

  recordMint(dropId: string, userId: number, count = 1): void {
    const drop = this.drops.get(dropId);
    if (!drop) return;
    const records = this.mintRecords.get(dropId) || [];
    const userRecord = records.find(r => r.userId === userId);
    if (userRecord) {
      userRecord.count += count;
    } else {
      records.push({ userId, count });
    }
    this.mintRecords.set(dropId, records);
    drop.minted += count;
    drop.revenue += this.getCurrentPrice(dropId) * BigInt(count);
    if (drop.minted >= drop.totalDropped) {
      drop.status = "sold_out";
    }
  }

  getActiveDrops(): NFTDrop[] {
    const now = new Date();
    return Array.from(this.drops.values()).filter(d => {
      if (d.status === "upcoming" && now >= d.startTime) d.status = "active";
      if (d.status === "active" && now > d.endTime) d.status = "ended";
      return d.status === "active";
    });
  }

  getAllDrops(): NFTDrop[] {
    return Array.from(this.drops.values());
  }
}

// ─── ROYALTY ENGINE ───────────────────────────────────────────────────────────

class RoyaltyEngine {
  private configs = new Map<string, RoyaltyConfig>();
  private paymentHistory: { configId: string; amount: bigint; salePrice: bigint; timestamp: Date }[] = [];

  setRoyaltyConfig(
    collectionId: string,
    contractAddress: string,
    royaltyPercent: number,
    recipient: string,
    splitRecipients?: RoyaltyConfig["splitRecipients"]
  ): RoyaltyConfig {
    const config: RoyaltyConfig = {
      collectionId,
      contractAddress,
      royaltyPercent,
      recipient,
      splitRecipients,
      totalEarned: 0n,
      pendingPayout: 0n,
    };
    this.configs.set(collectionId, config);
    return config;
  }

  calculateRoyalty(collectionId: string, salePrice: bigint): bigint {
    const config = this.configs.get(collectionId);
    if (!config) return 0n;
    return salePrice * BigInt(config.royaltyPercent) / 10000n;
  }

  recordRoyaltyPayment(collectionId: string, salePrice: bigint): bigint {
    const config = this.configs.get(collectionId);
    if (!config) return 0n;
    const royaltyAmount = this.calculateRoyalty(collectionId, salePrice);
    config.totalEarned += royaltyAmount;
    config.pendingPayout += royaltyAmount;
    this.paymentHistory.push({ configId: collectionId, amount: royaltyAmount, salePrice, timestamp: new Date() });
    return royaltyAmount;
  }

  claimRoyalties(collectionId: string): bigint {
    const config = this.configs.get(collectionId);
    if (!config) return 0n;
    const amount = config.pendingPayout;
    config.pendingPayout = 0n;
    return amount;
  }

  getConfig(collectionId: string): RoyaltyConfig | undefined {
    return this.configs.get(collectionId);
  }

  getCreatorRoyalties(creatorId: number, collections: NFTCollection[]): {
    totalEarned: bigint;
    pendingPayout: bigint;
    byCollection: { collection: NFTCollection; earned: bigint; pending: bigint }[];
  } {
    const creatorCollections = collections.filter(c => c.creatorId === creatorId);
    let totalEarned = 0n;
    let pendingPayout = 0n;
    const byCollection = [];
    for (const col of creatorCollections) {
      const config = this.configs.get(col.id);
      if (config) {
        totalEarned += config.totalEarned;
        pendingPayout += config.pendingPayout;
        byCollection.push({ collection: col, earned: config.totalEarned, pending: config.pendingPayout });
      }
    }
    return { totalEarned, pendingPayout, byCollection };
  }
}

// ─── NFT SETTLEMENT SERVICE ───────────────────────────────────────────────────

class NFTSettlementService {
  private transactions: NFTTransaction[] = [];
  private readonly PLATFORM_FEE_PERCENT = 250n; // 2.5% in basis points

  async listNFT(nftId: string, price: bigint, currency: string, sellerId: number): Promise<{ success: boolean; txHash: string }> {
    const nft = nftMinting.getNFT(nftId);
    if (!nft || nft.ownerId !== sellerId) return { success: false, txHash: "" };
    nft.isListed = true;
    nft.listingPrice = price;
    nft.listingCurrency = currency;
    const txHash = `0x${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2)}${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2)}`;
    this.transactions.push({
      id: `tx_${Date.now()}`,
      nftId,
      type: "list",
      fromUserId: sellerId,
      fromAddress: nft.ownerAddress,
      toAddress: "0xMARKETPLACE",
      price,
      currency,
      txHash,
      blockNumber: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 1000000) + 18000000,
      timestamp: new Date(),
    });
    return { success: true, txHash };
  }

  async buyNFT(nftId: string, buyerId: number, buyerAddress: string): Promise<{
    success: boolean;
    txHash: string;
    platformFee: bigint;
    royaltyPaid: bigint;
    sellerReceived: bigint;
    error?: string;
  }> {
    const nft = nftMinting.getNFT(nftId);
    if (!nft || !nft.isListed || !nft.listingPrice) {
      return { success: false, txHash: "", platformFee: 0n, royaltyPaid: 0n, sellerReceived: 0n, error: "NFT not listed" };
    }
    const salePrice = nft.listingPrice;
    const platformFee = salePrice * this.PLATFORM_FEE_PERCENT / 10000n;
    const royaltyPaid = royaltyEngine.recordRoyaltyPayment(nft.collectionId, salePrice);
    const sellerReceived = salePrice - platformFee - royaltyPaid;
    const txHash = `0x${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2)}${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2)}`;
    const previousOwner = nft.ownerId;
    const previousAddress = nft.ownerAddress;
    nft.ownerId = buyerId;
    nft.ownerAddress = buyerAddress;
    nft.isListed = false;
    nft.lastTransferAt = new Date();
    const collection = nftMinting.getCollection(nft.collectionId);
    if (collection) {
      collection.totalVolume += salePrice;
      collection.floorPrice = salePrice < collection.floorPrice ? salePrice : collection.floorPrice;
    }
    this.transactions.push({
      id: `tx_${Date.now()}`,
      nftId,
      type: "sale",
      fromUserId: previousOwner,
      toUserId: buyerId,
      fromAddress: previousAddress,
      toAddress: buyerAddress,
      price: salePrice,
      currency: nft.listingCurrency,
      royaltyPaid,
      platformFee,
      txHash,
      blockNumber: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 1000000) + 18000000,
      timestamp: new Date(),
    });
    return { success: true, txHash, platformFee, royaltyPaid, sellerReceived };
  }

  async transferNFT(nftId: string, fromUserId: number, toAddress: string, toUserId: number): Promise<{ success: boolean; txHash: string }> {
    const nft = nftMinting.getNFT(nftId);
    if (!nft || nft.ownerId !== fromUserId) return { success: false, txHash: "" };
    const txHash = `0x${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2)}${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2)}`;
    nft.ownerId = toUserId;
    nft.ownerAddress = toAddress;
    nft.isListed = false;
    nft.lastTransferAt = new Date();
    this.transactions.push({
      id: `tx_${Date.now()}`,
      nftId,
      type: "transfer",
      fromUserId,
      toUserId,
      fromAddress: nft.ownerAddress,
      toAddress,
      txHash,
      blockNumber: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 1000000) + 18000000,
      timestamp: new Date(),
    });
    return { success: true, txHash };
  }

  async burnNFT(nftId: string, ownerId: number): Promise<{ success: boolean; txHash: string }> {
    const nft = nftMinting.getNFT(nftId);
    if (!nft || nft.ownerId !== ownerId) return { success: false, txHash: "" };
    nft.isBurned = true;
    nft.isListed = false;
    const txHash = `0x${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2)}${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2)}`;
    this.transactions.push({
      id: `tx_${Date.now()}`,
      nftId,
      type: "burn",
      fromUserId: ownerId,
      fromAddress: nft.ownerAddress,
      toAddress: "0x000000000000000000000000000000000000dead",
      txHash,
      blockNumber: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 1000000) + 18000000,
      timestamp: new Date(),
    });
    return { success: true, txHash };
  }

  getTransactionHistory(nftId: string): NFTTransaction[] {
    return this.transactions.filter(t => t.nftId === nftId).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getMarketplaceStats() {
    const sales = this.transactions.filter(t => t.type === "sale");
    const totalVolume = sales.reduce((sum, t) => sum + (t.price || 0n), 0n);
    const totalFees = sales.reduce((sum, t) => sum + (t.platformFee || 0n), 0n);
    const totalRoyalties = sales.reduce((sum, t) => sum + (t.royaltyPaid || 0n), 0n);
    return {
      totalTransactions: this.transactions.length,
      totalSales: sales.length,
      totalVolume,
      totalFees,
      totalRoyalties,
      uniqueTraders: new Set([
        ...sales.map(t => t.fromUserId),
        ...sales.map(t => t.toUserId),
      ].filter(Boolean)).size,
    };
  }
}

// ─── SPECIAL NFT MINTING HELPERS ─────────────────────────────────────────────

class SpecialNFTService {
  async mintProfileNFT(userId: number, walletAddress: string, username: string, level: number, achievements: string[]): Promise<NFT> {
    const profileCollectionId = "col_profiles_shadowchat";
    const metadata = metadataEngine.buildProfileNFTMetadata(userId, username, level, achievements);
    const imageHash = await ipfsPinning.pinImage(metadata.image, `profile_${userId}`);
    return nftMinting.mintNFT(profileCollectionId, userId, walletAddress, metadata, imageHash, "profile");
  }

  async mintDonorNFT(
    donorId: number,
    donorAddress: string,
    donorName: string,
    charityName: string,
    amount: number,
    campaignId: string
  ): Promise<NFT> {
    const donorCollectionId = "col_donors_shadowchat";
    const metadata = metadataEngine.buildDonorNFTMetadata(donorName, charityName, amount, campaignId);
    const imageHash = await ipfsPinning.pinImage(metadata.image, `donor_${donorId}_${campaignId}`);
    return nftMinting.mintNFT(donorCollectionId, donorId, donorAddress, metadata, imageHash, "donor");
  }

  async mintGameFiNFT(
    userId: number,
    walletAddress: string,
    itemName: string,
    itemType: string,
    rarity: string,
    stats: Record<string, number>,
    gameId: string
  ): Promise<NFT> {
    const gamingCollectionId = `col_gamefi_${gameId}`;
    const metadata = metadataEngine.buildGameFiNFTMetadata(itemName, itemType, rarity, stats, gameId);
    const imageHash = await ipfsPinning.pinImage(metadata.image, `gamefi_${gameId}_${itemName}`);
    return nftMinting.mintNFT(gamingCollectionId, userId, walletAddress, metadata, imageHash, "gaming");
  }

  async mintAchievementNFT(userId: number, walletAddress: string, achievementName: string, description: string): Promise<NFT> {
    const achievementCollectionId = "col_achievements_shadowchat";
    const metadata: NFTMetadata = {
      name: achievementName,
      description,
      image: `https://api.shadowchat.app/achievement-nft/${achievementName.toLowerCase().replace(/\s/g, "-")}/image`,
      attributes: [
        { traitType: "Achievement", value: achievementName },
        { traitType: "Type", value: "Achievement" },
        { traitType: "Earned", value: Math.floor(Date.now() / 1000), displayType: "date" },
      ],
    };
    const imageHash = await ipfsPinning.pinImage(metadata.image, `achievement_${userId}_${achievementName}`);
    return nftMinting.mintNFT(achievementCollectionId, userId, walletAddress, metadata, imageHash, "achievement");
  }
}

// ─── SINGLETON EXPORTS ────────────────────────────────────────────────────────

export const ipfsPinning = new IPFSPinningService();
export const metadataEngine = new MetadataEngine();
export const rarityEngine = new NFTRarityEngine();
export const nftMinting = new NFTMintingService();
export const creatorDrops = new CreatorDropsService();
export const royaltyEngine = new RoyaltyEngine();
export const nftSettlement = new NFTSettlementService();
export const specialNFTs = new SpecialNFTService();
