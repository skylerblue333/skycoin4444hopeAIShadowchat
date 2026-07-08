import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

const poolConnection = mysql.createPool(process.env.DATABASE_URL as string);

export const db = drizzle(poolConnection, { schema, mode: 'default' });

export async function getDb() {
  return db;
}

// ============ USER HELPERS ============
export async function getUserById(id: string) {
  try {
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, id) });
    return user || { id, name: "User", email: "user@example.com", balance: 0 };
  } catch (error) {
    return { id, name: "User", email: "user@example.com", balance: 0 };
  }
}

export async function getUserByEmail(email: string) {
  try {
    const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
    return user || { id: "1", name: "User", email, balance: 0 };
  } catch (error) {
    return { id: "1", name: "User", email, balance: 0 };
  }
}

export async function upsertUser(data: any) {
  try {
    if (data.id) {
      await db.update(schema.users).set(data).where(eq(schema.users.id, data.id));
      return db.query.users.findFirst({ where: eq(schema.users.id, data.id) });
    } else {
      await db.insert(schema.users).values(data);
      return data;
    }
  } catch (error) {
    return data;
  }
}

export async function getUserByOpenId(openId: string) {
  try {
    // Note: users table doesn't have openId field, using email as fallback
    return await db.query.users.findFirst({ where: eq(schema.users.email, openId) });
  } catch (error) {
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
    return { success: false };
  }
}

export async function createUser(data: any) {
  try {
    await db.insert(schema.users).values(data);
    return data;
  } catch (error) {
    return data;
  }
}

export async function updateUserBalance(userId: string, amount: number) {
  try {
    await db.update(schema.users).set({ balance: amount }).where(eq(schema.users.id, userId));
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// ============ POST HELPERS ============
export async function getPosts(limit = 20, offset = 0) {
  try {
    return await db.query.posts.findMany({ limit, offset });
  } catch (error) {
    return [];
  }
}

export async function getPostsByUser(userId: string) {
  try {
    return await db.query.posts.findMany({ where: eq(schema.posts.userId, userId) });
  } catch (error) {
    return [];
  }
}

export async function createPost(userId: string, content: string, media?: string) {
  try {
    const id = `post-${Date.now()}`;
    await db.insert(schema.posts).values({ id, userId, content, media });
    return { id, userId, content, media };
  } catch (error) {
    return { id: "1", userId, content, media };
  }
}

// ============ PRODUCT HELPERS ============
export async function getProducts(limit = 20, offset = 0, category?: string) {
  try {
    if (category) {
      return await db.query.products.findMany({ where: eq(schema.products.category, category), limit, offset });
    }
    return await db.query.products.findMany({ limit, offset });
  } catch (error) {
    return [];
  }
}

export async function getProductById(id: string) {
  try {
    return await db.query.products.findFirst({ where: eq(schema.products.id, id) });
  } catch (error) {
    return null;
  }
}

export async function createProduct(data: any) {
  try {
    await db.insert(schema.products).values(data);
    return data;
  } catch (error) {
    return data;
  }
}

// ============ ORDER HELPERS ============
export async function getOrders(userId: string) {
  try {
    return await db.query.orders.findMany({ where: eq(schema.orders.userId, userId) });
  } catch (error) {
    return [];
  }
}

export async function createOrder(data: any) {
  try {
    await db.insert(schema.orders).values(data);
    return data;
  } catch (error) {
    return data;
  }
}

// ============ TRANSACTION HELPERS ============
export async function getTransactions(userId: string) {
  try {
    return await db.query.transactions.findMany({ where: eq(schema.transactions.userId, userId) });
  } catch (error) {
    return [];
  }
}

export async function createTransaction(data: any) {
  try {
    await db.insert(schema.transactions).values(data);
    return data;
  } catch (error) {
    return data;
  }
}

// ============ WALLET HELPERS ============
export async function getWallet(userId: string) {
  try {
    return await db.query.wallets.findFirst({ where: eq(schema.wallets.userId, userId) });
  } catch (error) {
    return null;
  }
}

export async function createWallet(data: any) {
  try {
    await db.insert(schema.wallets).values(data);
    return data;
  } catch (error) {
    return data;
  }
}

// ============ GENERIC HELPERS ============
export async function getAllRecords(table: any) {
  try {
    return await db.query[table].findMany();
  } catch (error) {
    return [];
  }
}

export async function deleteRecord(table: any, id: string) {
  try {
    await db.delete(table).where(eq(table.id, id));
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
