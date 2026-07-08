import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "skycoin4444",
});

async function seedDatabase() {
  console.log("🌱 Seeding database with sample data...");

  try {
    // Clear existing data (optional - comment out to preserve data)
    // await connection.execute("DELETE FROM users");
    // await connection.execute("DELETE FROM posts");
    // await connection.execute("DELETE FROM products");

    // Seed Users
    console.log("📝 Seeding users...");
    const users = [
      {
        id: "user_1",
        email: "skyler@skycoin4444.com",
        name: "Skyler Spillers",
        password: "$2b$10$...", // bcrypt hash
        role: "admin",
      },
      {
        id: "user_2",
        email: "demo@skycoin4444.com",
        name: "Demo User",
        password: "$2b$10$...",
        role: "user",
      },
      {
        id: "user_3",
        email: "investor@skycoin4444.com",
        name: "Investor User",
        password: "$2b$10$...",
        role: "user",
      },
    ];

    for (const user of users) {
      await connection.execute(
        "INSERT IGNORE INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)",
        [user.id, user.email, user.name, user.password, user.role]
      );
    }

    // Seed Posts
    console.log("📰 Seeding posts...");
    const posts = [
      {
        id: "post_1",
        userId: "user_1",
        content: "🚀 SKYCOIN4444 is live! Join the revolution.",
        likes: 1250,
        createdAt: new Date(),
      },
      {
        id: "post_2",
        userId: "user_2",
        content: "Just staked 500 SKY444 tokens. Earning rewards! 💰",
        likes: 342,
        createdAt: new Date(),
      },
      {
        id: "post_3",
        userId: "user_3",
        content: "IITR cybersecurity audit completed. Zero vulnerabilities found.",
        likes: 789,
        createdAt: new Date(),
      },
    ];

    for (const post of posts) {
      await connection.execute(
        "INSERT IGNORE INTO posts (id, user_id, content, likes, created_at) VALUES (?, ?, ?, ?, ?)",
        [post.id, post.userId, post.content, post.likes, post.createdAt]
      );
    }

    // Seed Products
    console.log("🛍️ Seeding products...");
    const products = [
      {
        id: "prod_1",
        name: "IITR Cybersecurity Audit",
        description: "Enterprise-grade security assessment",
        price: 5000,
        category: "services",
      },
      {
        id: "prod_2",
        name: "Managed IT Services - Starter",
        description: "24/7 monitoring and support",
        price: 2000,
        category: "services",
      },
      {
        id: "prod_3",
        name: "AI Integration Package",
        description: "Custom AI implementation",
        price: 10000,
        category: "services",
      },
      {
        id: "prod_4",
        name: "SKY444 Staking NFT",
        description: "Exclusive NFT for token stakers",
        price: 100,
        category: "nft",
      },
    ];

    for (const product of products) {
      await connection.execute(
        "INSERT IGNORE INTO products (id, name, description, price, category) VALUES (?, ?, ?, ?, ?)",
        [product.id, product.name, product.description, product.price, product.category]
      );
    }

    // Seed Wallets
    console.log("💰 Seeding wallets...");
    const wallets = [
      {
        id: "wallet_1",
        userId: "user_1",
        address: "0x1234567890123456789012345678901234567890",
        balance: 50000,
        currency: "SKY444",
      },
      {
        id: "wallet_2",
        userId: "user_2",
        address: "0x0987654321098765432109876543210987654321",
        balance: 5000,
        currency: "SKY444",
      },
      {
        id: "wallet_3",
        userId: "user_3",
        address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        balance: 25000,
        currency: "SKY444",
      },
    ];

    for (const wallet of wallets) {
      await connection.execute(
        "INSERT IGNORE INTO wallets (id, user_id, address, balance, currency) VALUES (?, ?, ?, ?, ?)",
        [wallet.id, wallet.userId, wallet.address, wallet.balance, wallet.currency]
      );
    }

    // Seed Transactions
    console.log("💸 Seeding transactions...");
    const transactions = [
      {
        id: "tx_1",
        userId: "user_1",
        type: "stake",
        amount: 1000,
        status: "completed",
        createdAt: new Date(),
      },
      {
        id: "tx_2",
        userId: "user_2",
        type: "purchase",
        amount: 500,
        status: "completed",
        createdAt: new Date(),
      },
      {
        id: "tx_3",
        userId: "user_3",
        type: "transfer",
        amount: 250,
        status: "pending",
        createdAt: new Date(),
      },
    ];

    for (const tx of transactions) {
      await connection.execute(
        "INSERT IGNORE INTO transactions (id, user_id, type, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [tx.id, tx.userId, tx.type, tx.amount, tx.status, tx.createdAt]
      );
    }

    console.log("✅ Database seeding completed successfully!");
    console.log("\n📊 Sample Data Summary:");
    console.log("  - 3 Users created");
    console.log("  - 3 Posts created");
    console.log("  - 4 Products created");
    console.log("  - 3 Wallets created");
    console.log("  - 3 Transactions created");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await connection.end();
  }
}

seedDatabase();
