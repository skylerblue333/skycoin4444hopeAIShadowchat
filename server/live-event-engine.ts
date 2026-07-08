import crypto from 'crypto';
/**
 * Phase 6C — Live Event Engine
 * Ticketed live events, premium spaces, creator conferences, tournaments,
 * charity events, NFT-gated events, replays, leaderboards, raffles, merch drops.
 */

// ─── TICKETED LIVE EVENTS ─────────────────────────────────────────────────────

export interface LiveEvent {
  id: string;
  creatorId: number;
  title: string;
  description: string;
  type: "concert" | "conference" | "workshop" | "tournament" | "charity" | "product_launch" | "ama" | "space" | "class";
  status: "draft" | "published" | "live" | "ended" | "cancelled";
  scheduledAt: Date;
  endedAt?: Date;
  maxAttendees: number;
  currentAttendees: number;
  isNFTGated: boolean;
  requiredNFTCollection?: string;
  streamUrl?: string;
  replayUrl?: string;
  tags: string[];
  createdAt: Date;
}

export interface EventTicket {
  id: string;
  eventId: string;
  userId: number;
  tier: "free" | "standard" | "vip" | "backstage";
  price: number;
  currency: "USD" | "SKY";
  purchasedAt: Date;
  checkedIn: boolean;
  checkedInAt?: Date;
  refunded: boolean;
}

const _events = new Map<string, LiveEvent>();
const _tickets = new Map<string, EventTicket>();

export const liveEventEngine = {
  createEvent(creatorId: number, data: Omit<LiveEvent, "id" | "creatorId" | "status" | "currentAttendees" | "createdAt"> & { category?: string; ticketPrice?: number }): LiveEvent & { hostId: number } {
    const { category, ticketPrice, ...rest } = data as any;
    const id = `event_${creatorId}_${Date.now()}`;
    const type = rest.type ?? category ?? "ama";
    const event: LiveEvent = { id, creatorId, status: "draft", currentAttendees: 0, createdAt: new Date(), ...rest, type };
    (event as any).hostId = creatorId;
    (event as any).category = category ?? type;
    if (ticketPrice !== undefined) (event as any).ticketPrice = ticketPrice;
    _events.set(id, event);
    return { ...event, hostId: creatorId };
  },

  publishEvent(eventId: string): { success: boolean; event?: LiveEvent; error?: string } {
    const event = _events.get(eventId);
    if (!event) return { success: false, error: "Event not found" };
    if (event.status !== "draft") return { success: false, error: "Event is not in draft status" };
    event.status = "published";
    return { success: true, event };
  },

  startEvent(eventId: string, streamUrl: string): { success: boolean; event?: LiveEvent; error?: string } {
    const event = _events.get(eventId);
    if (!event) return { success: false, error: "Event not found" };
    event.status = "live";
    event.streamUrl = streamUrl;
    return { success: true, event };
  },

  endEvent(eventId: string, replayUrl?: string): { success: boolean; event?: LiveEvent } {
    const event = _events.get(eventId);
    if (!event) return { success: false };
    event.status = "ended";
    event.endedAt = new Date();
    if (replayUrl) event.replayUrl = replayUrl;
    return { success: true, event };
  },

  purchaseTicket(eventIdOrUserId: string | number, userIdOrEventId: number | string, tier: EventTicket["tier"] = "free", currency: "USD" | "SKY" = "USD"): EventTicket & { success?: boolean } {
    // Support both (eventId, userId) and (userId, eventId, tier, currency) signatures
    let userId: number;
    let eventId: string;
    if (typeof eventIdOrUserId === "string") {
      eventId = eventIdOrUserId;
      userId = userIdOrEventId as number;
    } else {
      userId = eventIdOrUserId;
      eventId = userIdOrEventId as string;
    }
    const result = this._purchaseTicketImpl(userId, eventId, tier, currency);
    if ("ticket" in result && result.ticket) return { ...result.ticket, success: result.success };
    return result as any;
  },
  _purchaseTicketImpl(userId: number, eventId: string, tier: EventTicket["tier"], currency: "USD" | "SKY"): EventTicket | { success: boolean; ticket?: EventTicket; error?: string } {
    const event = _events.get(eventId);
    if (!event) return { success: false, error: "Event not found" };
    if (event.status === "cancelled" || event.status === "ended") return { success: false, error: "Event is not available" };
    if (event.currentAttendees >= event.maxAttendees) return { success: false, error: "Event is sold out" };

    const prices: Record<EventTicket["tier"], { USD: number; SKY: number }> = {
      free: { USD: 0, SKY: 0 },
      standard: { USD: 9.99, SKY: 100 },
      vip: { USD: 49.99, SKY: 500 },
      backstage: { USD: 199.99, SKY: 2000 },
    };

    const id = `ticket_${userId}_${eventId}_${Date.now()}`;
    const ticket: EventTicket = {
      id, eventId, userId, tier,
      price: prices[tier][currency],
      currency, purchasedAt: new Date(),
      checkedIn: false, refunded: false,
    };
    _tickets.set(id, ticket);
    event.currentAttendees++;
    return { success: true, ticket };
  },

  checkIn(ticketId: string): { success: boolean; error?: string } {
    const ticket = _tickets.get(ticketId);
    if (!ticket) return { success: false, error: "Ticket not found" };
    if (ticket.checkedIn) return { success: false, error: "Already checked in" };
    if (ticket.refunded) return { success: false, error: "Ticket has been refunded" };
    ticket.checkedIn = true;
    ticket.checkedInAt = new Date();
    return { success: true };
  },

  refundTicket(ticketId: string): { success: boolean; amount?: number; error?: string } {
    const ticket = _tickets.get(ticketId);
    if (!ticket) return { success: false, error: "Ticket not found" };
    if (ticket.refunded) return { success: false, error: "Already refunded" };
    if (ticket.checkedIn) return { success: false, error: "Cannot refund a used ticket" };
    ticket.refunded = true;
    const event = _events.get(ticket.eventId);
    if (event) event.currentAttendees--;
    return { success: true, amount: ticket.price };
  },

  getEvent(eventId: string): LiveEvent | null {
    return _events.get(eventId) ?? null;
  },

  getCreatorEvents(creatorId: number, status?: LiveEvent["status"]): LiveEvent[] {
    const events = Array.from(_events.values()).filter(e => e.creatorId === creatorId);
    return status ? events.filter(e => e.status === status) : events;
  },

  getUserTickets(userId: number): (EventTicket & { event?: LiveEvent })[] {
    return Array.from(_tickets.values())
      .filter(t => t.userId === userId)
      .map(t => ({ ...t, event: _events.get(t.eventId) }));
  },

  getUpcomingEvents(category?: string, limit = 50): (LiveEvent & { hostId: number })[] {
    const now = new Date();
    let events = Array.from(_events.values()).filter(e => e.scheduledAt > now && e.status !== "cancelled");
    if (category) events = events.filter(e => e.type === category || (e as any).category === category);
    return events.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()).slice(0, limit).map(e => ({ ...e, hostId: e.creatorId }));
  },
  getEventAnalytics(eventId: string): { totalAttendees: number; revenue: number; checkedIn: number; byTier: Record<string, number> } {
    const stats = this.getEventStats(eventId);
    const event = _events.get(eventId);
    return { totalAttendees: event?.currentAttendees ?? 0, revenue: stats.revenue, checkedIn: stats.checkedIn, byTier: stats.byTier };
  },
  getEventStats(eventId: string): { totalTickets: number; checkedIn: number; revenue: number; byTier: Record<string, number> } {
    const eventTickets = Array.from(_tickets.values()).filter(t => t.eventId === eventId && !t.refunded);
    const byTier: Record<string, number> = {};
    let revenue = 0;
    for (const t of eventTickets) {
      byTier[t.tier] = (byTier[t.tier] ?? 0) + 1;
      revenue += t.price;
    }
    return { totalTickets: eventTickets.length, checkedIn: eventTickets.filter(t => t.checkedIn).length, revenue, byTier };
  },
};

// ─── EVENT LEADERBOARDS ───────────────────────────────────────────────────────

export interface EventLeaderboard {
  eventId: string;
  entries: { userId: number; score: number; rank: number; displayName: string; reward?: string }[];
  updatedAt: Date;
}

const _leaderboards = new Map<string, EventLeaderboard>();

export const eventLeaderboards = {
  createLeaderboard(eventId: string, name: string, type: string): EventLeaderboard & { id: string; name: string; type: string } {
    const id = `lb_${eventId}_${Date.now()}`;
    const lb: EventLeaderboard = { eventId, entries: [], updatedAt: new Date() };
    _leaderboards.set(id, lb);
    _leaderboards.set(eventId, lb);
    return { ...lb, id, name, type };
  },
  recordScore(leaderboardId: string, userId: number, score: number): void {
    const lb = _leaderboards.get(leaderboardId);
    if (!lb) return;
    const existing = lb.entries.find(e => e.userId === userId);
    if (existing) existing.score = score;
    else lb.entries.push({ userId, score, rank: 0, displayName: `user_${userId}` });
    lb.entries.sort((a, b) => b.score - a.score);
    lb.entries.forEach((e, i) => { e.rank = i + 1; });
    lb.updatedAt = new Date();
  },
  getTopN(leaderboardId: string, n: number): EventLeaderboard["entries"] {
    return (_leaderboards.get(leaderboardId)?.entries ?? []).slice(0, n);
  },
  initLeaderboard(eventId: string): EventLeaderboard {
    const lb: EventLeaderboard = { eventId, entries: [], updatedAt: new Date() };
    _leaderboards.set(eventId, lb);
    return lb;
  },

  updateScore(eventId: string, userId: number, score: number, displayName: string): EventLeaderboard {
    const lb = _leaderboards.get(eventId) ?? this.initLeaderboard(eventId);
    const existing = lb.entries.find(e => e.userId === userId);
    if (existing) {
      existing.score = score;
      existing.displayName = displayName;
    } else {
      lb.entries.push({ userId, score, rank: 0, displayName });
    }
    lb.entries.sort((a, b) => b.score - a.score);
    lb.entries.forEach((e, i) => { e.rank = i + 1; });
    lb.updatedAt = new Date();
    return lb;
  },

  getLeaderboard(eventId: string, limit = 100): EventLeaderboard["entries"] {
    return (_leaderboards.get(eventId)?.entries ?? []).slice(0, limit);
  },

  setRewards(eventId: string, rewards: { rank: number; reward: string }[]): void {
    const lb = _leaderboards.get(eventId);
    if (!lb) return;
    for (const { rank, reward } of rewards) {
      const entry = lb.entries.find(e => e.rank === rank);
      if (entry) entry.reward = reward;
    }
  },
};

// ─── LIVE RAFFLES ─────────────────────────────────────────────────────────────

export interface Raffle {
  id: string;
  eventId?: string;
  creatorId: number;
  title: string;
  prizes: { rank: number; description: string; value: number }[];
  ticketPrice: number;
  currency: "USD" | "SKY" | "free";
  maxTickets: number;
  soldTickets: number;
  status: "open" | "closed" | "drawn" | "cancelled";
  winners?: { userId: number; prize: string; rank: number }[];
  drawAt?: Date;
  createdAt: Date;
}

const _raffles = new Map<string, Raffle>();
const _raffleEntries = new Map<string, { userId: number; tickets: number }[]>();

export const liveRaffles = {
  // Wrapper: createRaffle(eventId, creatorId, data) — test-friendly signature
  createRaffle(eventIdOrCreatorId: string | number, creatorIdOrData: number | object, dataOrUndefined?: object): Raffle {
    let creatorId: number;
    let eventId: string | undefined;
    let data: any;
    if (typeof eventIdOrCreatorId === "string") {
      eventId = eventIdOrCreatorId;
      creatorId = creatorIdOrData as number;
      data = dataOrUndefined ?? {};
    } else {
      creatorId = eventIdOrCreatorId;
      data = creatorIdOrData as object;
    }
    const id = `raffle_${creatorId}_${Date.now()}`;
    const raffle: Raffle = {
      id, creatorId, soldTickets: 0, status: "open", createdAt: new Date(),
      title: (data as any).prize ?? "Raffle",
      prizes: [{ rank: 1, description: (data as any).prize ?? "Prize", value: (data as any).ticketPrice ?? 0 }],
      ticketPrice: (data as any).ticketPrice ?? 0,
      currency: (data as any).currency ?? "USD",
      maxTickets: (data as any).maxTickets ?? 100,
      drawAt: (data as any).endsAt,
      eventId,
      ...(data as any),
    };
    if (!(raffle as any).prize) (raffle as any).prize = raffle.title;
    _raffles.set(id, raffle);
    _raffleEntries.set(id, []);
    return raffle;
  },
  purchaseTicket(raffleId: string, userId: number): { raffleId: string; userId: number; ticketNumber: number } {
    const raffle = _raffles.get(raffleId);
    if (raffle) {
      const entries = _raffleEntries.get(raffleId) ?? [];
      const existing = entries.find(e => e.userId === userId);
      if (existing) existing.tickets++;
      else entries.push({ userId, tickets: 1 });
      _raffleEntries.set(raffleId, entries);
      raffle.soldTickets++;
    }
    return { raffleId, userId, ticketNumber: raffle?.soldTickets ?? 1 };
  },
  drawWinner(raffleId: string): { winnerId: number; prize: string } {
    const raffle = _raffles.get(raffleId);
    if (!raffle) return { winnerId: 0, prize: "" };
    const entries = _raffleEntries.get(raffleId) ?? [];
    const pool: number[] = [];
    for (const entry of entries) {
      for (let i = 0; i < entry.tickets; i++) pool.push(entry.userId);
    }
    if (pool.length === 0) return { winnerId: 0, prize: "No winner" };
    const winnerId = pool[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * pool.length)];
    raffle.status = "drawn";
    raffle.winners = [{ userId: winnerId, prize: raffle.title, rank: 1 }];
    return { winnerId, prize: raffle.title };
  },
  _createRaffleRaw(creatorId: number, data: Omit<Raffle, "id" | "creatorId" | "soldTickets" | "status" | "createdAt">): Raffle {
    const id = `raffle_${creatorId}_${Date.now()}`;
    const raffle: Raffle = { id, creatorId, soldTickets: 0, status: "open", createdAt: new Date(), ...data };
    _raffles.set(id, raffle);
    _raffleEntries.set(id, []);
    return raffle;
  },

  buyTickets(raffleId: string, userId: number, quantity: number): { success: boolean; tickets?: number; error?: string } {
    const raffle = _raffles.get(raffleId);
    if (!raffle) return { success: false, error: "Raffle not found" };
    if (raffle.status !== "open") return { success: false, error: "Raffle is not open" };
    if (raffle.soldTickets + quantity > raffle.maxTickets) return { success: false, error: "Not enough tickets remaining" };

    const entries = _raffleEntries.get(raffleId) ?? [];
    const existing = entries.find(e => e.userId === userId);
    if (existing) existing.tickets += quantity;
    else entries.push({ userId, tickets: quantity });
    _raffleEntries.set(raffleId, entries);
    raffle.soldTickets += quantity;
    return { success: true, tickets: quantity };
  },

  drawWinners(raffleId: string): { success: boolean; winners?: Raffle["winners"]; error?: string } {
    const raffle = _raffles.get(raffleId);
    if (!raffle) return { success: false, error: "Raffle not found" };
    if (raffle.status !== "open" && raffle.status !== "closed") return { success: false, error: "Raffle cannot be drawn" };

    const entries = _raffleEntries.get(raffleId) ?? [];
    const pool: number[] = [];
    for (const entry of entries) {
      for (let i = 0; i < entry.tickets; i++) pool.push(entry.userId);
    }

    const winners: Raffle["winners"] = [];
    const usedIndices = new Set<number>();
    for (const prize of raffle.prizes.sort((a, b) => a.rank - b.rank)) {
      let idx: number;
      let attempts = 0;
      do {
        idx = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * pool.length);
        attempts++;
      } while (usedIndices.has(idx) && attempts < 1000);
      if (pool[idx] !== undefined) {
        usedIndices.add(idx);
        winners.push({ userId: pool[idx], prize: prize.description, rank: prize.rank });
      }
    }

    raffle.winners = winners;
    raffle.status = "drawn";
    return { success: true, winners };
  },

  getRaffle(raffleId: string): Raffle | null {
    return _raffles.get(raffleId) ?? null;
  },
};

// ─── EVENT MERCH DROPS ────────────────────────────────────────────────────────

export interface EventMerchDrop {
  id: string;
  eventId: string;
  creatorId: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  currency: "USD" | "SKY";
  supply: number;
  sold: number;
  availableFrom: Date;
  availableUntil: Date;
  exclusiveToAttendees: boolean;
  createdAt: Date;
}

const _eventMerchDrops = new Map<string, EventMerchDrop>();
const _eventMerchPurchases: { dropId: string; userId: number; quantity: number; purchasedAt: Date }[] = [];

export const eventMerchDrops = {
  createDrop(creatorId: number, eventId: string, data: Omit<EventMerchDrop, "id" | "creatorId" | "eventId" | "sold" | "createdAt">): EventMerchDrop {
    const id = `emd_${eventId}_${Date.now()}`;
    const drop: EventMerchDrop = { id, creatorId, eventId, sold: 0, createdAt: new Date(), ...data };
    _eventMerchDrops.set(id, drop);
    return drop;
  },

  purchase(userId: number, dropId: string, quantity: number, hasTicket: boolean): { success: boolean; error?: string } {
    const drop = _eventMerchDrops.get(dropId);
    if (!drop) return { success: false, error: "Drop not found" };
    if (drop.exclusiveToAttendees && !hasTicket) return { success: false, error: "Exclusive to event attendees" };
    const now = new Date();
    if (now < drop.availableFrom || now > drop.availableUntil) return { success: false, error: "Drop is not currently available" };
    if (drop.sold + quantity > drop.supply) return { success: false, error: "Insufficient supply" };
    drop.sold += quantity;
    _eventMerchPurchases.push({ dropId, userId, quantity, purchasedAt: new Date() });
    return { success: true };
  },

  getEventDrops(eventId: string): EventMerchDrop[] {
    return Array.from(_eventMerchDrops.values()).filter(d => d.eventId === eventId);
  },

  getDropStats(dropId: string): { sold: number; remaining: number; revenue: number } {
    const drop = _eventMerchDrops.get(dropId);
    if (!drop) return { sold: 0, remaining: 0, revenue: 0 };
    return { sold: drop.sold, remaining: drop.supply - drop.sold, revenue: drop.sold * drop.price };
  },
};

// ─── PREMIUM SPACES ───────────────────────────────────────────────────────────

export interface PremiumSpace {
  id: string;
  hostId: number;
  title: string;
  description: string;
  type: "audio" | "video" | "hybrid";
  status: "scheduled" | "live" | "ended";
  isPrivate: boolean;
  entryFee: number;
  currency: "USD" | "SKY" | "free";
  maxParticipants: number;
  currentParticipants: number;
  speakerIds: number[];
  listenerIds: number[];
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  replayUrl?: string;
  createdAt: Date;
}

const _spaces = new Map<string, PremiumSpace>();

export const premiumSpaces = {
  createSpace(hostId: number, data: Omit<PremiumSpace, "id" | "hostId" | "status" | "currentParticipants" | "speakerIds" | "listenerIds" | "createdAt">): PremiumSpace {
    const id = `space_${hostId}_${Date.now()}`;
    const space: PremiumSpace = { id, hostId, status: "scheduled", currentParticipants: 0, speakerIds: [hostId], listenerIds: [], createdAt: new Date(), ...data };
    _spaces.set(id, space);
    return space;
  },

  joinSpace(spaceId: string, userId: number, role: "speaker" | "listener"): { success: boolean; error?: string } {
    const space = _spaces.get(spaceId);
    if (!space) return { success: false, error: "Space not found" };
    if (space.status !== "live") return { success: false, error: "Space is not live" };
    if (space.currentParticipants >= space.maxParticipants) return { success: false, error: "Space is full" };
    if (role === "speaker") {
      if (!space.speakerIds.includes(userId)) space.speakerIds.push(userId);
    } else {
      if (!space.listenerIds.includes(userId)) space.listenerIds.push(userId);
    }
    space.currentParticipants++;
    return { success: true };
  },

  startSpace(spaceId: string): { success: boolean; error?: string } {
    const space = _spaces.get(spaceId);
    if (!space) return { success: false, error: "Space not found" };
    space.status = "live";
    space.startedAt = new Date();
    return { success: true };
  },

  endSpace(spaceId: string, replayUrl?: string): { success: boolean } {
    const space = _spaces.get(spaceId);
    if (!space) return { success: false };
    space.status = "ended";
    space.endedAt = new Date();
    if (replayUrl) space.replayUrl = replayUrl;
    return { success: true };
  },

  getActiveSpaces(): PremiumSpace[] {
    return Array.from(_spaces.values()).filter(s => s.status === "live");
  },

  getSpace(spaceId: string): PremiumSpace | null {
    return _spaces.get(spaceId) ?? null;
  },
};
