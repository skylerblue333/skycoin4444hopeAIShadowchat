# Skycoin4444 Gaming Tournaments System

**Version:** 1.0  
**Technology:** React + tRPC + Real-time WebSocket  
**Status:** 🚀 IN DEVELOPMENT  

---

## Overview

The Gaming Tournaments system enables:
- Tournament creation and management
- Bracket generation (single-elimination, round-robin, Swiss)
- Real-time scoring and leaderboards
- Prize distribution
- Player registration and team management
- Live match updates
- Tournament analytics

---

## Database Schema

```typescript
// drizzle/schema.ts - Add these tables

export const tournaments = mysqlTable("tournaments", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }),
  organizerId: varchar("organizer_id", { length: 255 }).references(() => users.id).notNull(),
  gameType: varchar("game_type", { length: 255 }).notNull(), // chess, poker, racing, etc
  format: varchar("format", { length: 255 }).notNull(), // single-elimination, round-robin, swiss
  status: varchar("status", { length: 255 }).default("draft"), // draft, registration, live, completed
  maxPlayers: int("max_players").notNull(),
  registeredPlayers: int("registered_players").default(0),
  entryFee: float("entry_fee").default(0),
  totalPrizePool: float("total_prize_pool").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tournamentRegistrations = mysqlTable("tournament_registrations", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tournamentId: varchar("tournament_id", { length: 255 }).references(() => tournaments.id).notNull(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  teamId: varchar("team_id", { length: 255 }),
  registrationStatus: varchar("registration_status", { length: 255 }).default("pending"), // pending, approved, rejected, withdrawn
  seedRank: int("seed_rank"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tournamentMatches = mysqlTable("tournament_matches", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tournamentId: varchar("tournament_id", { length: 255 }).references(() => tournaments.id).notNull(),
  round: int("round").notNull(),
  matchNumber: int("match_number").notNull(),
  player1Id: varchar("player_1_id", { length: 255 }).references(() => users.id),
  player2Id: varchar("player_2_id", { length: 255 }).references(() => users.id),
  team1Id: varchar("team_1_id", { length: 255 }),
  team2Id: varchar("team_2_id", { length: 255 }),
  status: varchar("status", { length: 255 }).default("pending"), // pending, live, completed, cancelled
  winnerId: varchar("winner_id", { length: 255 }),
  player1Score: int("player_1_score").default(0),
  player2Score: int("player_2_score").default(0),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tournamentLeaderboards = mysqlTable("tournament_leaderboards", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tournamentId: varchar("tournament_id", { length: 255 }).references(() => tournaments.id).notNull(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  rank: int("rank"),
  wins: int("wins").default(0),
  losses: int("losses").default(0),
  draws: int("draws").default(0),
  points: int("points").default(0),
  scoreFor: int("score_for").default(0),
  scoreAgainst: int("score_against").default(0),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tournamentPrizes = mysqlTable("tournament_prizes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tournamentId: varchar("tournament_id", { length: 255 }).references(() => tournaments.id).notNull(),
  position: int("position").notNull(), // 1st, 2nd, 3rd, etc
  prizeAmount: float("prize_amount").notNull(),
  prizeType: varchar("prize_type", { length: 255 }).default("cash"), // cash, tokens, nft, badge
  winnerId: varchar("winner_id", { length: 255 }).references(() => users.id),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tournamentTeams = mysqlTable("tournament_teams", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tournamentId: varchar("tournament_id", { length: 255 }).references(() => tournaments.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  captainId: varchar("captain_id", { length: 255 }).references(() => users.id).notNull(),
  logo: varchar("logo", { length: 255 }),
  memberCount: int("member_count").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tournamentTeamMembers = mysqlTable("tournament_team_members", {
  id: varchar("id", { length: 255 }).primaryKey(),
  teamId: varchar("team_id", { length: 255 }).references(() => tournamentTeams.id).notNull(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  role: varchar("role", { length: 255 }).default("member"), // captain, member
  joinedAt: timestamp("joined_at").default(sql`CURRENT_TIMESTAMP`),
});
```

---

## Backend Implementation

### Tournament Service

```typescript
// server/tournaments/service.ts
import { getDb } from "../db";
import * as schema from "../../drizzle";
import { eq, and, desc, sql } from "drizzle-orm";

export class TournamentService {
  async createTournament(data: {
    name: string;
    description?: string;
    organizerId: string;
    gameType: string;
    format: "single-elimination" | "round-robin" | "swiss";
    maxPlayers: number;
    entryFee?: number;
    startDate?: Date;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const tournamentId = crypto.randomUUID();

    await db.insert(schema.tournaments).values({
      id: tournamentId,
      name: data.name,
      description: data.description,
      organizerId: data.organizerId,
      gameType: data.gameType,
      format: data.format,
      maxPlayers: data.maxPlayers,
      entryFee: data.entryFee || 0,
      totalPrizePool: (data.entryFee || 0) * data.maxPlayers,
      startDate: data.startDate,
      status: "draft",
    });

    return tournamentId;
  }

  async registerPlayer(tournamentId: string, userId: string) {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Check if tournament exists and has space
    const [tournament] = await db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.id, tournamentId));

    if (!tournament) throw new Error("Tournament not found");
    if (tournament.registeredPlayers >= tournament.maxPlayers) {
      throw new Error("Tournament is full");
    }

    // Check if already registered
    const existing = await db
      .select()
      .from(schema.tournamentRegistrations)
      .where(
        and(
          eq(schema.tournamentRegistrations.tournamentId, tournamentId),
          eq(schema.tournamentRegistrations.userId, userId)
        )
      );

    if (existing.length > 0) {
      throw new Error("Already registered");
    }

    // Register player
    const registrationId = crypto.randomUUID();
    await db.insert(schema.tournamentRegistrations).values({
      id: registrationId,
      tournamentId,
      userId,
      registrationStatus: "approved",
    });

    // Update player count
    await db
      .update(schema.tournaments)
      .set({
        registeredPlayers: sql`${schema.tournaments.registeredPlayers} + 1`,
      })
      .where(eq(schema.tournaments.id, tournamentId));

    return registrationId;
  }

  async generateBracket(tournamentId: string) {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const [tournament] = await db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.id, tournamentId));

    if (!tournament) throw new Error("Tournament not found");

    // Get registered players
    const registrations = await db
      .select()
      .from(schema.tournamentRegistrations)
      .where(
        and(
          eq(schema.tournamentRegistrations.tournamentId, tournamentId),
          eq(schema.tournamentRegistrations.registrationStatus, "approved")
        )
      );

    const players = registrations.map((r) => r.userId);

    if (tournament.format === "single-elimination") {
      await this.generateSingleElimination(tournamentId, players);
    } else if (tournament.format === "round-robin") {
      await this.generateRoundRobin(tournamentId, players);
    } else if (tournament.format === "swiss") {
      await this.generateSwiss(tournamentId, players);
    }

    // Update tournament status
    await db
      .update(schema.tournaments)
      .set({ status: "live" })
      .where(eq(schema.tournaments.id, tournamentId));
  }

  private async generateSingleElimination(
    tournamentId: string,
    players: string[]
  ) {
    const db = await getDb();
    if (!db) return;

    // Shuffle players for random seeding
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    let round = 1;
    let matchNumber = 1;

    // First round matches
    for (let i = 0; i < shuffled.length; i += 2) {
      const matchId = crypto.randomUUID();
      await db.insert(schema.tournamentMatches).values({
        id: matchId,
        tournamentId,
        round,
        matchNumber: matchNumber++,
        player1Id: shuffled[i],
        player2Id: shuffled[i + 1] || null,
        status: "pending",
      });
    }
  }

  private async generateRoundRobin(tournamentId: string, players: string[]) {
    const db = await getDb();
    if (!db) return;

    let matchNumber = 1;

    // Generate all possible pairings
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const matchId = crypto.randomUUID();
        await db.insert(schema.tournamentMatches).values({
          id: matchId,
          tournamentId,
          round: 1,
          matchNumber: matchNumber++,
          player1Id: players[i],
          player2Id: players[j],
          status: "pending",
        });
      }
    }
  }

  private async generateSwiss(tournamentId: string, players: string[]) {
    // Swiss system implementation
    // Similar to round-robin but with multiple rounds
    // Players are paired based on current standings
  }

  async recordMatchResult(
    matchId: string,
    winnerId: string,
    player1Score: number,
    player2Score: number
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get match details
    const [match] = await db
      .select()
      .from(schema.tournamentMatches)
      .where(eq(schema.tournamentMatches.id, matchId));

    if (!match) throw new Error("Match not found");

    // Update match
    await db
      .update(schema.tournamentMatches)
      .set({
        winnerId,
        player1Score,
        player2Score,
        status: "completed",
        endTime: new Date(),
      })
      .where(eq(schema.tournamentMatches.id, matchId));

    // Update leaderboard
    const loser = winnerId === match.player1Id ? match.player2Id : match.player1Id;

    // Update winner
    await db
      .update(schema.tournamentLeaderboards)
      .set({
        wins: sql`${schema.tournamentLeaderboards.wins} + 1`,
        points: sql`${schema.tournamentLeaderboards.points} + 3`,
        scoreFor: sql`${schema.tournamentLeaderboards.scoreFor} + ${player1Score}`,
      })
      .where(
        and(
          eq(schema.tournamentLeaderboards.tournamentId, match.tournamentId),
          eq(schema.tournamentLeaderboards.userId, winnerId)
        )
      );

    // Update loser
    await db
      .update(schema.tournamentLeaderboards)
      .set({
        losses: sql`${schema.tournamentLeaderboards.losses} + 1`,
        scoreAgainst: sql`${schema.tournamentLeaderboards.scoreAgainst} + ${player2Score}`,
      })
      .where(
        and(
          eq(schema.tournamentLeaderboards.tournamentId, match.tournamentId),
          eq(schema.tournamentLeaderboards.userId, loser)
        )
      );

    // Update rankings
    await this.updateRankings(match.tournamentId);
  }

  private async updateRankings(tournamentId: string) {
    const db = await getDb();
    if (!db) return;

    // Get all leaderboard entries sorted by points
    const leaderboard = await db
      .select()
      .from(schema.tournamentLeaderboards)
      .where(eq(schema.tournamentLeaderboards.tournamentId, tournamentId))
      .orderBy(desc(schema.tournamentLeaderboards.points));

    // Update ranks
    for (let i = 0; i < leaderboard.length; i++) {
      await db
        .update(schema.tournamentLeaderboards)
        .set({ rank: i + 1 })
        .where(eq(schema.tournamentLeaderboards.id, leaderboard[i].id));
    }
  }

  async getLeaderboard(tournamentId: string) {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select()
      .from(schema.tournamentLeaderboards)
      .where(eq(schema.tournamentLeaderboards.tournamentId, tournamentId))
      .orderBy(schema.tournamentLeaderboards.rank);
  }

  async getTournamentMatches(tournamentId: string) {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select()
      .from(schema.tournamentMatches)
      .where(eq(schema.tournamentMatches.tournamentId, tournamentId))
      .orderBy(
        schema.tournamentMatches.round,
        schema.tournamentMatches.matchNumber
      );
  }

  async distributePrizes(tournamentId: string) {
    const db = await getDb();
    if (!db) return;

    // Get final leaderboard
    const leaderboard = await this.getLeaderboard(tournamentId);

    // Get prize structure
    const [tournament] = await db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.id, tournamentId));

    if (!tournament) return;

    const prizePool = tournament.totalPrizePool;
    const prizeDistribution = [0.5, 0.3, 0.15, 0.05]; // 50%, 30%, 15%, 5%

    // Distribute prizes
    for (let i = 0; i < Math.min(leaderboard.length, prizeDistribution.length); i++) {
      const prizeAmount = prizePool * prizeDistribution[i];
      const prizeId = crypto.randomUUID();

      await db.insert(schema.tournamentPrizes).values({
        id: prizeId,
        tournamentId,
        position: i + 1,
        prizeAmount,
        winnerId: leaderboard[i].userId,
        prizeType: "cash",
      });

      // Add to user's wallet
      await db
        .update(schema.users)
        .set({
          balance: sql`${schema.users.balance} + ${prizeAmount}`,
        })
        .where(eq(schema.users.id, leaderboard[i].userId));
    }
  }
}

export const tournamentService = new TournamentService();
```

### tRPC Router

```typescript
// server/routers/tournaments.ts
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { tournamentService } from "../tournaments/service";

export const tournamentsRouter = router({
  // Create tournament
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        gameType: z.string(),
        format: z.enum(["single-elimination", "round-robin", "swiss"]),
        maxPlayers: z.number(),
        entryFee: z.number().optional(),
        startDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await tournamentService.createTournament({
        ...input,
        organizerId: ctx.user.id,
      });
    }),

  // Register for tournament
  register: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await tournamentService.registerPlayer(
        input.tournamentId,
        ctx.user.id
      );
    }),

  // Generate bracket
  generateBracket: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input }) => {
      await tournamentService.generateBracket(input.tournamentId);
      return { success: true };
    }),

  // Record match result
  recordResult: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        winnerId: z.string(),
        player1Score: z.number(),
        player2Score: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await tournamentService.recordMatchResult(
        input.matchId,
        input.winnerId,
        input.player1Score,
        input.player2Score
      );
      return { success: true };
    }),

  // Get leaderboard
  getLeaderboard: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input }) => {
      return await tournamentService.getLeaderboard(input.tournamentId);
    }),

  // Get matches
  getMatches: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input }) => {
      return await tournamentService.getTournamentMatches(input.tournamentId);
    }),

  // Distribute prizes
  distributePrizes: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input }) => {
      await tournamentService.distributePrizes(input.tournamentId);
      return { success: true };
    }),
});
```

### WebSocket Real-time Updates

```typescript
// server/tournaments/websocket.ts
import { WebSocketServer } from "ws";
import { Server } from "http";

export class TournamentWebSocket {
  private wss: WebSocketServer;
  private clients: Map<string, Set<any>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupConnections();
  }

  private setupConnections() {
    this.wss.on("connection", (ws) => {
      ws.on("message", (message) => {
        const data = JSON.parse(message.toString());

        if (data.type === "SUBSCRIBE_TOURNAMENT") {
          const tournamentId = data.tournamentId;
          if (!this.clients.has(tournamentId)) {
            this.clients.set(tournamentId, new Set());
          }
          this.clients.get(tournamentId)!.add(ws);
        }
      });

      ws.on("close", () => {
        this.clients.forEach((clients) => clients.delete(ws));
      });
    });
  }

  broadcastMatchUpdate(tournamentId: string, matchData: any) {
    const clients = this.clients.get(tournamentId);
    if (!clients) return;

    clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(
          JSON.stringify({
            type: "MATCH_UPDATE",
            data: matchData,
          })
        );
      }
    });
  }

  broadcastLeaderboardUpdate(tournamentId: string, leaderboard: any) {
    const clients = this.clients.get(tournamentId);
    if (!clients) return;

    clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(
          JSON.stringify({
            type: "LEADERBOARD_UPDATE",
            data: leaderboard,
          })
        );
      }
    });
  }
}
```

---

## Frontend Components

### Tournament Leaderboard

```typescript
// client/src/components/tournaments/Leaderboard.tsx
import React, { useEffect, useState } from "react";
import { trpcClient } from "../../services/api/trpcClient";
import { Card } from "../ui/Card";
import { Table } from "../ui/Table";

export const TournamentLeaderboard: React.FC<{ tournamentId: string }> = ({
  tournamentId,
}) => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const data = await trpcClient.tournaments.getLeaderboard.query({
        tournamentId,
      });
      setLeaderboard(data);
    };

    fetchLeaderboard();

    // Refresh every 5 seconds
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-4">Tournament Leaderboard</h2>
      <Table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Points</th>
            <th>Score Diff</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, idx) => (
            <tr key={idx}>
              <td className="font-bold text-lg">{entry.rank}</td>
              <td>{entry.userId}</td>
              <td>{entry.wins}</td>
              <td>{entry.losses}</td>
              <td className="font-bold">{entry.points}</td>
              <td>{entry.scoreFor - entry.scoreAgainst}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
};
```

### Match Card

```typescript
// client/src/components/tournaments/MatchCard.tsx
import React from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

export const MatchCard: React.FC<{
  match: any;
  onReportResult: (matchId: string, winnerId: string) => void;
}> = ({ match, onReportResult }) => {
  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-bold">{match.player1Id}</div>
          <div className="text-sm text-gray-500">Score: {match.player1Score}</div>
        </div>

        <div className="px-4 text-center">
          <div className="text-xl font-bold">VS</div>
          <div className="text-xs text-gray-500">Round {match.round}</div>
        </div>

        <div className="flex-1 text-right">
          <div className="font-bold">{match.player2Id || "TBD"}</div>
          <div className="text-sm text-gray-500">Score: {match.player2Score}</div>
        </div>
      </div>

      {match.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <Button
            title={`${match.player1Id} Wins`}
            onPress={() =>
              onReportResult(match.id, match.player1Id)
            }
            variant="primary"
          />
          <Button
            title={`${match.player2Id} Wins`}
            onPress={() =>
              onReportResult(match.id, match.player2Id)
            }
            variant="secondary"
          />
        </div>
      )}

      {match.status === "completed" && (
        <div className="mt-4 text-center">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            ✓ Completed
          </span>
        </div>
      )}
    </Card>
  );
};
```

---

## Features

- ✅ Multiple tournament formats
- ✅ Real-time bracket updates
- ✅ Automated leaderboard management
- ✅ Prize distribution
- ✅ Team support
- ✅ WebSocket live updates
- ✅ Tournament analytics

---

**Status:** 🚀 Ready for Development

*For questions, contact: tournaments@skycoin4444.com*
