# Skycoin4444 Q4 2026 - NFT Marketplace

**Version:** 1.0  
**Technology:** React + tRPC + Web3.js + Smart Contracts  
**Status:** 🚀 IMPLEMENTATION READY  

---

## Overview

The NFT Marketplace enables:
- Blockchain-backed NFT minting and trading
- Royalty distribution to creators
- Multi-chain support (Ethereum, Polygon, BSC)
- Auction and fixed-price sales
- Collection management
- Marketplace analytics
- Gas optimization

---

## Smart Contract Architecture

### ERC-721 NFT Contract

```solidity
// contracts/SkycoinNFT.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SkycoinNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct NFTMetadata {
        address creator;
        uint256 royaltyPercentage;
        string collectionName;
        uint256 createdAt;
    }

    mapping(uint256 => NFTMetadata) public nftMetadata;
    mapping(address => uint256[]) public creatorNFTs;

    event NFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string uri,
        uint256 royaltyPercentage
    );

    event RoyaltyPaid(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 amount
    );

    constructor() ERC721("SkycoinNFT", "SCNFT") {}

    function mintNFT(
        address to,
        string memory uri,
        uint256 royaltyPercentage,
        string memory collectionName
    ) public returns (uint256) {
        require(royaltyPercentage <= 50, "Royalty too high");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        nftMetadata[tokenId] = NFTMetadata({
            creator: msg.sender,
            royaltyPercentage: royaltyPercentage,
            collectionName: collectionName,
            createdAt: block.timestamp
        });

        creatorNFTs[msg.sender].push(tokenId);

        emit NFTMinted(tokenId, msg.sender, uri, royaltyPercentage);

        return tokenId;
    }

    function getRoyaltyInfo(uint256 tokenId, uint256 salePrice)
        public
        view
        returns (address, uint256)
    {
        NFTMetadata memory metadata = nftMetadata[tokenId];
        uint256 royaltyAmount = (salePrice * metadata.royaltyPercentage) / 100;
        return (metadata.creator, royaltyAmount);
    }

    function getCreatorNFTs(address creator)
        public
        view
        returns (uint256[] memory)
    {
        return creatorNFTs[creator];
    }
}
```

### Marketplace Contract

```solidity
// contracts/NFTMarketplace.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ReentrancyGuard, Ownable {
    IERC721 public nftContract;

    struct Listing {
        address seller;
        uint256 price;
        bool active;
        uint256 createdAt;
    }

    struct Auction {
        address seller;
        uint256 startingPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;
    mapping(address => uint256) public pendingWithdrawals;

    uint256 public marketplaceFeePercentage = 2;

    event ListingCreated(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    event ListingSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );

    event AuctionCreated(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 startingPrice,
        uint256 endTime
    );

    event BidPlaced(
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionEnded(
        uint256 indexed tokenId,
        address indexed winner,
        uint256 finalPrice
    );

    constructor(address _nftContract) {
        nftContract = IERC721(_nftContract);
    }

    // Fixed-price listing
    function createListing(uint256 tokenId, uint256 price) public nonReentrant {
        require(price > 0, "Price must be greater than 0");
        require(
            nftContract.ownerOf(tokenId) == msg.sender,
            "Not token owner"
        );

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true,
            createdAt: block.timestamp
        });

        emit ListingCreated(tokenId, msg.sender, price);
    }

    function buyNFT(uint256 tokenId) public payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");

        // Calculate fees and royalties
        uint256 marketplaceFee = (listing.price * marketplaceFeePercentage) /
            100;
        uint256 sellerAmount = listing.price - marketplaceFee;

        // Transfer NFT
        nftContract.transferFrom(listing.seller, msg.sender, tokenId);

        // Update pending withdrawals
        pendingWithdrawals[listing.seller] += sellerAmount;
        pendingWithdrawals[owner()] += marketplaceFee;

        // Deactivate listing
        listings[tokenId].active = false;

        emit ListingSold(
            tokenId,
            listing.seller,
            msg.sender,
            listing.price
        );
    }

    // Auction
    function createAuction(
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration
    ) public nonReentrant {
        require(
            nftContract.ownerOf(tokenId) == msg.sender,
            "Not token owner"
        );
        require(startingPrice > 0, "Starting price must be > 0");

        auctions[tokenId] = Auction({
            seller: msg.sender,
            startingPrice: startingPrice,
            highestBid: startingPrice,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            active: true
        });

        emit AuctionCreated(
            tokenId,
            msg.sender,
            startingPrice,
            block.timestamp + duration
        );
    }

    function placeBid(uint256 tokenId) public payable nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.highestBid, "Bid too low");

        // Refund previous bidder
        if (auction.highestBidder != address(0)) {
            pendingWithdrawals[auction.highestBidder] += auction.highestBid;
        }

        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    function endAuction(uint256 tokenId) public nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            // Transfer NFT to winner
            nftContract.transferFrom(
                auction.seller,
                auction.highestBidder,
                tokenId
            );

            // Calculate fees
            uint256 marketplaceFee = (auction.highestBid *
                marketplaceFeePercentage) / 100;
            uint256 sellerAmount = auction.highestBid - marketplaceFee;

            pendingWithdrawals[auction.seller] += sellerAmount;
            pendingWithdrawals[owner()] += marketplaceFee;

            emit AuctionEnded(
                tokenId,
                auction.highestBidder,
                auction.highestBid
            );
        }
    }

    function withdraw() public nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No pending withdrawal");

        pendingWithdrawals[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    function setMarketplaceFee(uint256 percentage) public onlyOwner {
        require(percentage <= 10, "Fee too high");
        marketplaceFeePercentage = percentage;
    }
}
```

---

## Database Schema

```typescript
// drizzle/schema.ts - Add NFT tables

export const nftCollections = mysqlTable("nft_collections", {
  id: varchar("id", { length: 255 }).primaryKey(),
  creatorId: varchar("creator_id", { length: 255 }).references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 2000 }),
  imageUrl: varchar("image_url", { length: 500 }),
  contractAddress: varchar("contract_address", { length: 255 }).notNull(),
  chainId: int("chain_id").notNull(), // 1=Ethereum, 137=Polygon, 56=BSC
  totalSupply: int("total_supply").default(0),
  floorPrice: float("floor_price").default(0),
  volume24h: float("volume_24h").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const nfts = mysqlTable("nfts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  collectionId: varchar("collection_id", { length: 255 }).references(() => nftCollections.id),
  tokenId: varchar("token_id", { length: 255 }).notNull(),
  creatorId: varchar("creator_id", { length: 255 }).references(() => users.id),
  ownerId: varchar("owner_id", { length: 255 }).references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 2000 }),
  imageUrl: varchar("image_url", { length: 500 }),
  metadataUri: varchar("metadata_uri", { length: 500 }),
  royaltyPercentage: float("royalty_percentage").default(10),
  contractAddress: varchar("contract_address", { length: 255 }).notNull(),
  chainId: int("chain_id").notNull(),
  attributes: varchar("attributes", { length: 1000 }), // JSON
  rarity: varchar("rarity", { length: 255 }), // common, uncommon, rare, epic, legendary
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const nftListings = mysqlTable("nft_listings", {
  id: varchar("id", { length: 255 }).primaryKey(),
  nftId: varchar("nft_id", { length: 255 }).references(() => nfts.id),
  sellerId: varchar("seller_id", { length: 255 }).references(() => users.id),
  price: float("price").notNull(),
  currency: varchar("currency", { length: 255 }).default("ETH"),
  listingType: varchar("listing_type", { length: 255 }).notNull(), // fixed, auction
  status: varchar("status", { length: 255 }).default("active"), // active, sold, cancelled
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  expiresAt: timestamp("expires_at"),
});

export const nftAuctions = mysqlTable("nft_auctions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  nftId: varchar("nft_id", { length: 255 }).references(() => nfts.id),
  sellerId: varchar("seller_id", { length: 255 }).references(() => users.id),
  startingPrice: float("starting_price").notNull(),
  highestBid: float("highest_bid").default(0),
  highestBidderId: varchar("highest_bidder_id", { length: 255 }).references(() => users.id),
  endTime: timestamp("end_time").notNull(),
  status: varchar("status", { length: 255 }).default("active"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const nftTransactions = mysqlTable("nft_transactions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  nftId: varchar("nft_id", { length: 255 }).references(() => nfts.id),
  fromId: varchar("from_id", { length: 255 }).references(() => users.id),
  toId: varchar("to_id", { length: 255 }).references(() => users.id),
  transactionType: varchar("transaction_type", { length: 255 }), // mint, buy, sell, transfer
  price: float("price"),
  transactionHash: varchar("transaction_hash", { length: 255 }),
  chainId: int("chain_id"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const nftRoyalties = mysqlTable("nft_royalties", {
  id: varchar("id", { length: 255 }).primaryKey(),
  nftId: varchar("nft_id", { length: 255 }).references(() => nfts.id),
  creatorId: varchar("creator_id", { length: 255 }).references(() => users.id),
  transactionId: varchar("transaction_id", { length: 255 }).references(() => nftTransactions.id),
  amount: float("amount").notNull(),
  paid: boolean("paid").default(false),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
```

---

## Backend Service

```typescript
// server/nft/service.ts
import { getDb } from "../db";
import * as schema from "../../drizzle";
import { eq, desc, and } from "drizzle-orm";
import { ethers } from "ethers";

export class NFTMarketplaceService {
  private provider: ethers.Provider;
  private signer: ethers.Signer;

  constructor(rpcUrl: string, privateKey: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
  }

  async mintNFT(data: {
    collectionId: string;
    creatorId: string;
    name: string;
    description: string;
    imageUrl: string;
    metadataUri: string;
    royaltyPercentage: number;
    contractAddress: string;
    chainId: number;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const nftId = crypto.randomUUID();

    // Create NFT record
    await db.insert(schema.nfts).values({
      id: nftId,
      collectionId: data.collectionId,
      creatorId: data.creatorId,
      ownerId: data.creatorId,
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      metadataUri: data.metadataUri,
      royaltyPercentage: data.royaltyPercentage,
      contractAddress: data.contractAddress,
      chainId: data.chainId,
    });

    // Record transaction
    const txId = crypto.randomUUID();
    await db.insert(schema.nftTransactions).values({
      id: txId,
      nftId,
      fromId: data.creatorId,
      toId: data.creatorId,
      transactionType: "mint",
      chainId: data.chainId,
    });

    return nftId;
  }

  async createListing(data: {
    nftId: string;
    sellerId: string;
    price: number;
    currency: string;
    listingType: "fixed" | "auction";
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const listingId = crypto.randomUUID();

    await db.insert(schema.nftListings).values({
      id: listingId,
      nftId: data.nftId,
      sellerId: data.sellerId,
      price: data.price,
      currency: data.currency,
      listingType: data.listingType,
      status: "active",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    return listingId;
  }

  async buyNFT(data: {
    listingId: string;
    buyerId: string;
    transactionHash: string;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const [listing] = await db
      .select()
      .from(schema.nftListings)
      .where(eq(schema.nftListings.id, data.listingId));

    if (!listing) throw new Error("Listing not found");

    const [nft] = await db
      .select()
      .from(schema.nfts)
      .where(eq(schema.nfts.id, listing.nftId));

    if (!nft) throw new Error("NFT not found");

    // Update NFT ownership
    await db
      .update(schema.nfts)
      .set({ ownerId: data.buyerId })
      .where(eq(schema.nfts.id, listing.nftId));

    // Create transaction record
    const txId = crypto.randomUUID();
    await db.insert(schema.nftTransactions).values({
      id: txId,
      nftId: listing.nftId,
      fromId: listing.sellerId,
      toId: data.buyerId,
      transactionType: "buy",
      price: listing.price,
      transactionHash: data.transactionHash,
      chainId: nft.chainId,
    });

    // Record royalty
    if (nft.royaltyPercentage > 0) {
      const royaltyAmount = (listing.price * nft.royaltyPercentage) / 100;
      const royaltyId = crypto.randomUUID();

      await db.insert(schema.nftRoyalties).values({
        id: royaltyId,
        nftId: listing.nftId,
        creatorId: nft.creatorId,
        transactionId: txId,
        amount: royaltyAmount,
      });
    }

    // Update listing status
    await db
      .update(schema.nftListings)
      .set({ status: "sold" })
      .where(eq(schema.nftListings.id, data.listingId));

    return txId;
  }

  async getCollectionStats(collectionId: string) {
    const db = await getDb();
    if (!db) return null;

    const [collection] = await db
      .select()
      .from(schema.nftCollections)
      .where(eq(schema.nftCollections.id, collectionId));

    if (!collection) return null;

    // Calculate stats
    const nfts = await db
      .select()
      .from(schema.nfts)
      .where(eq(schema.nfts.collectionId, collectionId));

    const listings = await db
      .select()
      .from(schema.nftListings)
      .where(
        and(
          eq(schema.nftListings.status, "active"),
          // Join with nfts to filter by collection
        )
      );

    return {
      collection,
      totalNFTs: nfts.length,
      floorPrice: Math.min(...listings.map((l) => l.price)),
      volume24h: 0, // Calculate from transactions
    };
  }

  async getUserNFTs(userId: string) {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select()
      .from(schema.nfts)
      .where(eq(schema.nfts.ownerId, userId))
      .orderBy(desc(schema.nfts.createdAt));
  }

  async getMarketplaceStats() {
    const db = await getDb();
    if (!db) return null;

    const totalNFTs = await db.select().from(schema.nfts);
    const totalListings = await db
      .select()
      .from(schema.nftListings)
      .where(eq(schema.nftListings.status, "active"));
    const totalTransactions = await db.select().from(schema.nftTransactions);

    return {
      totalNFTs: totalNFTs.length,
      activeListings: totalListings.length,
      totalTransactions: totalTransactions.length,
      totalVolume: totalTransactions.reduce((sum, tx) => sum + (tx.price || 0), 0),
    };
  }
}
```

---

## Frontend Components

```typescript
// client/src/components/nft/NFTGallery.tsx
import React, { useEffect, useState } from "react";
import { trpcClient } from "../../services/api/trpcClient";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Image } from "react-native";

export const NFTGallery: React.FC<{ userId: string }> = ({ userId }) => {
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        const data = await trpcClient.nft.getUserNFTs.query({ userId });
        setNfts(data);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [userId]);

  if (loading) return <div>Loading NFTs...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {nfts.map((nft) => (
        <Card key={nft.id} className="overflow-hidden">
          <Image source={{ uri: nft.imageUrl }} style={{ height: 200 }} />
          <div className="p-4">
            <h3 className="font-bold">{nft.name}</h3>
            <p className="text-sm text-gray-600">{nft.description}</p>
            <div className="mt-4 flex gap-2">
              <Button title="List" variant="primary" />
              <Button title="Transfer" variant="outline" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
```

---

**Status:** 🚀 Ready for Implementation

*For questions, contact: nft@skycoin4444.com*
