import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { InsertUser } from '../drizzle/schema';

const poolConnection = mysql.createPool(process.env.DATABASE_URL as string);

export const db = drizzle(poolConnection, { schema, mode: 'default' });

export async function getDb() {
  return db;
}

// ============ USER HELPERS =============
export async function getUserById(id: string) {
  try {
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, id) });
    return user || { id: "", name: "User", email: "user@example.com", balance: 0 };
  } catch (error) {
    console.error(`[Database] Failed to get user by ID:`, error);
    return { id: "", name: "User", email: "user@example.com", balance: 0 };
  }
}

export async function getUserByEmail(email: string) {
  try {
    const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
    return user || { id: "", name: "User", email, balance: 0 };
  } catch (error) {
    console.error(`[Database] Failed to get user by email:`, error);
    return { id: "", name: "User", email, balance: 0 };
  }
}

export async function upsertUser(data: InsertUser) {
  try {
    if (data.id) {
      await db.update(schema.users).set(data).where(eq(schema.users.id, data.id));
      return db.query.users.findFirst({ where: eq(schema.users.id, data.id) });
    } else {
      await db.insert(schema.users).values(data);
      return data;
    }
  } catch (error) {
    console.error(`[Database] Failed to upsert user:`, error);
    return data;
  }
}

export async function getUserByOpenId(openId: string) {
  try {
    // Note: users table doesn't have openId field, using email as fallback
    return await db.query.users.findFirst({ where: eq(schema.users.email, openId) });
  } catch (error) {
    console.error(`[Database] Failed to get user by OpenId:`, error);
    return null;
  }
}

export async function ensureAllTokenBalances(userId: string) {
  try {
    const defaultTokens = ['BTC', 'ETH', 'SOL', 'DOGE', 'TRUMP', 'SKY444'];
    for (const tokenSymbol of defaultTokens) {
      const existingBalance = await db.query.tokenBalances.findFirst({
        where: (tokenBalances, { eq: eqOp, and: andOp }) => andOp(eqOp(tokenBalances.userId, userId), eqOp(tokenBalances.tokenSymbol, tokenSymbol)),
      });
      if (!existingBalance) {
        await db.insert(schema.tokenBalances).values({ id: `${userId}-${tokenSymbol}`, userId, tokenSymbol, balance: 0 });
      }
    }
    return { success: true };
  } catch (error) {
    console.error(`[Database] Failed to ensure token balances:`, error);
    return { success: false };
  }
}

export async function createUser(data: InsertUser) {
  try {
    await db.insert(schema.users).values(data);
    return data;
  } catch (error) {
    console.error(`[Database] Failed to create user:`, error);
    return data;
  }
}

export async function updateUserBalance(userId: string, amount: number) {
  try {
    await db.update(schema.users).set({ balance: amount }).where(eq(schema.users.id, userId));
    return { success: true };
  } catch (error) {
    console.error(`[Database] Failed to update user balance:`, error);
    return { success: false };
  }
}

// ============ POST HELPERS =============
export async function getPosts(limit = 20, offset = 0) {
  try {
    return await db.query.posts.findMany({ limit, offset });
  } catch (error) {
    console.error(`[Database] Failed to get posts:`, error);
    return [];
  }
}

export async function getPostsByUser(userId: string) {
  try {
    return await db.query.posts.findMany({ where: eq(schema.posts.userId, userId) });
  } catch (error) {
    console.error(`[Database] Failed to get posts by user:`, error);
    return [];
  }
}

export async function createPost(userId: string, content: string, media?: string) {
  try {
    const id = `post-${Date.now()}`;
    await db.insert(schema.posts).values({ id, userId, content, media });
    return { id, userId, content, media };
  } catch (error) {
    console.error(`[Database] Failed to create post:`, error);
    return { id: "1", userId, content, media };
  }
}

// ============ PRODUCT HELPERS =============
export async function getProducts(limit = 20, offset = 0, category?: string) {
  try {
    if (category) {
      return await db.query.products.findMany({ where: eq(schema.products.category, category), limit, offset });
    }
    return await db.query.products.findMany({ limit, offset });
  } catch (error) {
    console.error(`[Database] Failed to get products:`, error);
    return [];
  }
}

export async function getProductById(id: string) {
  try {
    return await db.query.products.findFirst({ where: eq(schema.products.id, id) });
  } catch (error) {
    console.error(`[Database] Failed to get product by ID:`, error);
    return null;
  }
}

export async function createProduct(data: { id: string; creatorId: string; title: string; description: string; image: string; price: number; currency: string; rarity: string; status: string; createdAt: Date; }) {
  try {
    await db.insert(schema.products).values(data);
    return data;
  } catch (error) {
    console.error(`[Database] Failed to create product:`, error);
    return data;
  }
}

// ============ ORDER HELPERS =============
export async function getOrders(userId: string) {
  try {
    return await db.query.orders.findMany({ where: eq(schema.orders.userId, userId) });
  } catch (error) {
    console.error(`[Database] Failed to get orders:`, error);
    return [];
  }
}

export async function createOrder(data: { id: string; userId: string; productId: string; quantity: number; totalAmount: number; status: string; createdAt: Date; }) {
  try {
    await db.insert(schema.orders).values(data);
    return data;
  } catch (error) {
    console.error(`[Database] Failed to create order:`, error);
    return data;
  }
}

// ============ TRANSACTION HELPERS =============
export async function getTransactions(userId: string) {
  try {
    return await db.query.transactions.findMany({ where: eq(schema.transactions.userId, userId) });
  } catch (error) {
    console.error(`[Database] Failed to get transactions:`, error);
    return [];
  }
}

export async function createTransaction(data: { id: string; userId: string; type: string; amount: number; currency: string; status: string; createdAt: Date; }) {
  try {
    await db.insert(schema.transactions).values(data);
    return data;
  } catch (error) {
    console.error(`[Database] Failed to create transaction:`, error);
    return data;
  }
}

// ============ WALLET HELPERS =============
export async function getWallet(userId: string) {
  try {
    return await db.query.wallets.findFirst({ where: eq(schema.wallets.userId, userId) });
  } catch (error) {
    console.error(`[Database] Failed to get wallet:`, error);
    return null;
  }
}

export async function createWallet(data: { id: string; userId: string; address: string; balance: number; currency: string; createdAt: Date; }) {
  try {
    await db.insert(schema.wallets).values(data);
    return data;
  } catch (error) {
    console.error(`[Database] Failed to create wallet:`, error);
    return data;
  }
}

// ============ GENERIC HELPERS =============
export async function getAllRecords<T extends keyof typeof schema>(table: T) {
  try {
    if (table in db.query) {
      return await db.query[table].findMany();
    } else {
      console.warn(`[Database] Table '${table}' not found in schema for getAllRecords.`);
      return [];
    }
  } catch (error) {
    console.error(`[Database] Failed to get records for table '${table}':`, error);
    return [];
  }
}

export async function deleteRecord(table: any, id: string) {
  try {
    await db.delete(table).where(eq(table.id, id));
    return { success: true };
  } catch (error) {
    console.error(`[Database] Failed to delete record for table '${table}':`, error);
    return { success: false };
  }
}
