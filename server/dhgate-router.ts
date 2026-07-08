import crypto from 'crypto';
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { dhgateProducts, dhgateReviews, dhgateOrders } from "../drizzle";
import { eq, like, or, and, desc, asc } from "drizzle-orm";

// Admin fee: 44% of every order goes to platform treasury
const ADMIN_FEE_PERCENT = 44;

const parseProduct = (p: typeof dhgateProducts.$inferSelect) => ({
  ...p,
  price: parseFloat(p.price as unknown as string || "0"),
  originalPrice: p.originalPrice ? parseFloat(p.originalPrice as unknown as string) : null,
  rating: parseFloat(p.rating as unknown as string || "0"),
  adminFeePercent: parseFloat(p.adminFeePercent as unknown as string || "44"),
  shippingCost: parseFloat(p.shippingCost as unknown as string || "0"),
  supplierRating: parseFloat(p.supplierRating as unknown as string || "0"),
  tags: Array.isArray(p.tags) ? p.tags : [],
  images: Array.isArray(p.images) ? p.images : (p.imageUrl ? [p.imageUrl] : []),
});

// ─── DHgate Marketplace Router ────────────────────────────────────────────────
export const dhgateRouter = router({
  // List products with optional category/search filter
  getProducts: publicProcedure
    .input(z.object({
      category: z.string().default("all"),
      search: z.string().optional(),
      sort: z.enum(["featured", "price_asc", "price_desc", "rating", "sold"]).default("featured"),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions: ReturnType<typeof eq>[] = [eq(dhgateProducts.isActive, true)];
      if (input.category && input.category !== "all") {
        conditions.push(eq(dhgateProducts.category, input.category));
      }
      if (input.search) {
        conditions.push(
          or(
            like(dhgateProducts.title, `%${input.search}%`),
            like(dhgateProducts.supplier, `%${input.search}%`),
            like(dhgateProducts.description, `%${input.search}%`)
          ) as ReturnType<typeof eq>
        );
      }
      let orderBy;
      switch (input.sort) {
        case "price_asc": orderBy = asc(dhgateProducts.price); break;
        case "price_desc": orderBy = desc(dhgateProducts.price); break;
        case "rating": orderBy = desc(dhgateProducts.rating); break;
        case "sold": orderBy = desc(dhgateProducts.soldCount); break;
        default: orderBy = desc(dhgateProducts.soldCount);
      }
      const products = await db
        .select()
        .from(dhgateProducts)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(input.offset);
      return products.map(parseProduct);
    }),

  // Get single product with reviews
  getProduct: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [product] = await db
        .select()
        .from(dhgateProducts)
        .where(and(eq(dhgateProducts.id, input.id), eq(dhgateProducts.isActive, true)));
      if (!product) throw new Error("Product not found");
      const reviews = await db
        .select()
        .from(dhgateReviews)
        .where(eq(dhgateReviews.productId, input.id))
        .orderBy(desc(dhgateReviews.helpful))
        .limit(20);
      return {
        ...parseProduct(product),
        reviews: reviews.map(r => ({
          ...r,
          images: Array.isArray(r.images) ? r.images : [],
        })),
      };
    }),

  // Get reviews for a product
  getReviews: publicProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const reviews = await db
        .select()
        .from(dhgateReviews)
        .where(eq(dhgateReviews.productId, input.productId))
        .orderBy(desc(dhgateReviews.helpful));
      return reviews.map(r => ({
        ...r,
        images: Array.isArray(r.images) ? r.images : [],
      }));
    }),

  // Get featured products (highest sold)
  getFeatured: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const products = await db
      .select()
      .from(dhgateProducts)
      .where(eq(dhgateProducts.isActive, true))
      .orderBy(desc(dhgateProducts.soldCount))
      .limit(8);
    return products.map(parseProduct);
  }),

  // Get hot/trending products (highest rating)
  getHot: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const products = await db
      .select()
      .from(dhgateProducts)
      .where(eq(dhgateProducts.isActive, true))
      .orderBy(desc(dhgateProducts.rating))
      .limit(6);
    return products.map(parseProduct);
  }),

  // Get product categories
  getCategories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .selectDistinct({ category: dhgateProducts.category })
      .from(dhgateProducts)
      .where(eq(dhgateProducts.isActive, true));
    return rows.map(r => r.category).filter(Boolean) as string[];
  }),

  // Place an order — auto-routes 44% to admin treasury
  placeOrder: publicProcedure
    .input(z.object({
      productId: z.string(),
      quantity: z.number().min(1).max(99).default(1),
      selectedColor: z.string().optional(),
      selectedSize: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [product] = await db
        .select()
        .from(dhgateProducts)
        .where(and(eq(dhgateProducts.id, input.productId), eq(dhgateProducts.isActive, true)));
      if (!product) throw new Error("Product not found");

      const unitPrice = parseFloat(product.price as unknown as string || "0");
      const totalAmount = unitPrice * input.quantity;
      const adminEarnings = parseFloat((totalAmount * ADMIN_FEE_PERCENT / 100).toFixed(2));
      const supplierPayout = parseFloat((totalAmount - adminEarnings).toFixed(2));
      const orderId = `DHG-${Date.now()}-${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6).toUpperCase()}`;

      await db.insert(dhgateOrders).values({
        id: orderId,
        userId: (ctx as any).user?.id?.toString() || null,
        productId: input.productId,
        productTitle: product.title,
        quantity: input.quantity,
        unitPrice: String(unitPrice),
        totalPrice: String(totalAmount),
        adminFee: String(adminEarnings),
        supplierPayout: String(supplierPayout),
        currency: product.currency || "USD",
        status: "pending",
        dhgateOrderRef: orderId,
        createdAt: Date.now(),
      } as any);

      // Redirect URL to DHgate search for this product
      const dhgateUrl = `https://www.dhgate.com/product/search?q=${encodeURIComponent(product.dhgateSearchQuery || product.title)}`;

      // Notify owner of new order (non-blocking)
      try {
        const { notifyOwner } = await import("./_core/notification");
        await notifyOwner({
          title: `🛒 New DHgate Order — $${adminEarnings.toFixed(2)} earned`,
          content: [
            `Product: ${product.title}`,
            `Qty: ${input.quantity} × $${unitPrice.toFixed(2)}`,
            `Order Total: $${totalAmount.toFixed(2)}`,
            `Platform Earnings (${ADMIN_FEE_PERCENT}%): $${adminEarnings.toFixed(2)}`,
            `Supplier Payout: $${supplierPayout.toFixed(2)}`,
            `Buyer: ${(ctx as any).user?.name || "Guest"}`,
            `Ref: ${orderId}`,
          ].join("\n"),
        });
      } catch (_e) {
        // Non-blocking — order still succeeds if notification fails
      }

      return {
        orderId,
        dhgateUrl,
        totalAmount,
        adminEarnings,
        supplierPayout,
        adminFeePercent: ADMIN_FEE_PERCENT,
        message: `Order tracked. Platform fee: $${adminEarnings.toFixed(2)} (${ADMIN_FEE_PERCENT}%). Redirecting to DHgate...`,
      };
    }),

  // Admin: get all orders with earnings summary
  getAdminOrders: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { orders: [], summary: { totalEarnings: 0, totalOrders: 0, pendingOrders: 0 } };
    const orders = await db
      .select()
      .from(dhgateOrders)
      .orderBy(desc(dhgateOrders.createdAt))
      .limit(200);

    const totalEarnings = orders.reduce((sum, o) => sum + parseFloat(o.adminFee as unknown as string || "0"), 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === "pending").length;

    return {
      orders: orders.map(o => ({
        ...o,
        unitPrice: parseFloat(o.unitPrice as unknown as string || "0"),
        totalPrice: parseFloat(o.totalPrice as unknown as string || "0"),
        adminFee: parseFloat(o.adminFee as unknown as string || "0"),
        supplierPayout: parseFloat(o.supplierPayout as unknown as string || "0"),
      })),
      summary: { totalEarnings, totalOrders, pendingOrders },
    };
  }),
});
