/**
 * Digital Art Store tRPC Router
 * 144 signed prints, coded tools, COA generation, download delivery
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import {
  generatePrintCatalog,
  CODED_TOOLS,
  generateCOA,
  calculateTechNetWorth,
} from "./digital-art-engine";
import { notifyOwner } from "./_core/notification";

export const digitalArtRouter = router({
  // ─── Print Catalog ───────────────────────────────────────────────────────
  getPrints: publicProcedure
    .input(
      z.object({
        series: z.string().optional(),
        currency: z.enum(["USD", "SKY444"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const catalog = generatePrintCatalog();
      let filtered = catalog;
      if (input.series) {
        filtered = filtered.filter((p) => p.series === input.series);
      }
      return filtered;
    }),

  // ─── Coded Tools ─────────────────────────────────────────────────────────
  getTools: publicProcedure.query(() => {
    return CODED_TOOLS;
  }),

  // ─── Certificate of Authenticity ─────────────────────────────────────────
  generateCOA: protectedProcedure
    .input(
      z.object({
        printId: z.string(),
        buyerName: z.string(),
        buyerWallet: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const catalog = generatePrintCatalog();
      const print = catalog.find((p) => p.id === input.printId);
      if (!print) throw new Error("Print not found");
      return generateCOA(print, ctx.user!.id);
    }),

  // ─── Tech Net Worth ───────────────────────────────────────────────────────
  getTechNetWorth: publicProcedure.query(() => {
    return calculateTechNetWorth();
  }),

  // ─── Series List ─────────────────────────────────────────────────────────
  getSeries: publicProcedure.query(() => {
    const catalog = generatePrintCatalog();
    const series = [...new Set(catalog.map((p) => p.series))];
    return series.map((s) => ({
      name: s,
      count: catalog.filter((p) => p.series === s).length,
      priceRange: {
        min: Math.min(...catalog.filter((p) => p.series === s).map((p) => p.price)),
        max: Math.max(...catalog.filter((p) => p.series === s).map((p) => p.price)),
      },
    }));
  }),

  // ─── Checkout (Stripe) ───────────────────────────────────────────────────
  checkout: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            price: z.number(),
            quantity: z.number().default(1),
          })
        ),
        successUrl: z.string(),
        cancelUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const total = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const itemNames = input.items.map((i) => i.title).join(", ");

      // Notify owner of new art store purchase
      await notifyOwner({
        title: `🎨 New Digital Art Order — $${total}`,
        content: `User ${ctx.user!.id} purchased: ${itemNames} (Total: $${total})`,
      });

      try {
        const { createCheckoutSession } = await import("./stripe-skycoin");
        const orderId = Date.now();
        const session = await createCheckoutSession(
          orderId,
          ctx.user!.id,
          total,
          input.successUrl,
          input.cancelUrl
        );
        return {
          sessionId: (session as any).id,
          url: (session as any).url,
          mock: false,
        };
      } catch {
        // Stripe not configured — return mock checkout for dev
        return {
          sessionId: `art_mock_${Date.now()}`,
          url: `${input.successUrl}?mock=1&items=${encodeURIComponent(itemNames)}&total=${total}`,
          mock: true,
        };
      }
    }),
});
