import crypto from 'crypto';
/**
 * PHASE 28 — REAL GAMING ENGINE
 * PvP Matchmaking, Skill Ranking, Tournaments, Wagers, Guild Wars,
 * Battle Passes, Reward Seasons, Anti-Cheat, Game Telemetry, AI Balancing
 * Goal: GameFi becomes sticky.
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type GameMode = "1v1" | "2v2" | "squad" | "battle_royale" | "guild_war" | "tournament";
export type MatchStatus = "queuing" | "matched" | "in_progress" | "completed" | "cancelled" | "disputed";
export type TournamentStatus = "registration" | "seeding" | "bracket" | "finals" | "completed" | "cancelled";
export type WagerStatus = "pending" | "accepted" | "in_progress" | "completed" | "disputed" | "refunded";
export type GuildWarStatus = "declared" | "preparation" | "active" | "ended" | "settled";
export type SeasonStatus = "upcoming" | "active" | "ended";

export interface PlayerProfile {
  userId: number;
  displayName: string;
  gameTag: string;
  skillRating: number;
  peakSkillRating: number;
  rank: "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master" | "grandmaster" | "legend";
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalGamesPlayed: number;
  currentStreak: number;
  bestStreak: number;
  avgKDA: number;
  playtimeHours: number;
  guildId?: string;
  battlePassLevel: number;
  seasonPoints: number;
  isBanned: boolean;
  banReason?: string;
  banExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameMatch {
  id: string;
  gameMode: GameMode;
  status: MatchStatus;
  teamA: number[]; // userIds
  teamB: number[]; // userIds
  mapId?: string;
  gameId?: string;
  startedAt?: Date;
  endedAt?: Date;
  durationSeconds?: number;
  winnerTeam?: "A" | "B" | "draw";
  scoreA?: number;
  scoreB?: number;
  mvpUserId?: number;
  skillRatingChanges: Record<number, number>; // userId -> delta
  wagerId?: string;
  tournamentId?: string;
  replayId?: string;
  telemetryData?: Record<string, unknown>;
  isRanked: boolean;
  createdAt: Date;
}

export interface MatchmakingQueue {
  id: string;
  userId: number;
  gameMode: GameMode;
  skillRating: number;
  skillRange: number; // +/- acceptable range
  queuedAt: Date;
  estimatedWaitSeconds: number;
  isActive: boolean;
}

export interface Tournament {
  id: string;
  title: string;
  description: string;
  gameMode: GameMode;
  organizerId: number;
  status: TournamentStatus;
  maxParticipants: number;
  registeredParticipants: number[];
  entryFee: number;
  prizePool: number;
  currency: string;
  prizeDistribution: Array<{ place: number; amount: number; percentage: number }>;
  bracket: Array<{
    round: number;
    matchId: string;
    teamA: number[];
    teamB: number[];
    winnerId?: number;
  }>;
  registrationDeadline: Date;
  startDate: Date;
  endDate?: Date;
  winnerId?: number;
  isSponsored: boolean;
  sponsorId?: number;
  streamId?: string;
  tags: string[];
  createdAt: Date;
}

export interface Wager {
  id: string;
  challengerId: number;
  challengedId: number;
  gameMode: GameMode;
  amount: number;
  currency: string;
  status: WagerStatus;
  matchId?: string;
  winnerId?: number;
  escrowTxHash?: string;
  payoutTxHash?: string;
  expiresAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface Guild {
  id: string;
  name: string;
  tag: string; // 3-5 char tag
  description: string;
  ownerId: number;
  officerIds: number[];
  memberIds: number[];
  maxMembers: number;
  skillRating: number; // avg of top 10 members
  wins: number;
  losses: number;
  warPoints: number;
  level: number;
  xp: number;
  emblemUrl?: string;
  isOpen: boolean;
  minSkillRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuildWar {
  id: string;
  attackerGuildId: string;
  defenderGuildId: string;
  status: GuildWarStatus;
  attackerScore: number;
  defenderScore: number;
  maxBattles: number;
  battlesCompleted: number;
  matchIds: string[];
  prizeWarPoints: number;
  startedAt?: Date;
  endedAt?: Date;
  winnerGuildId?: string;
  createdAt: Date;
}

export interface BattlePass {
  id: string;
  seasonId: string;
  userId: number;
  tier: "free" | "premium" | "premium_plus";
  level: number;
  maxLevel: number;
  xp: number;
  xpPerLevel: number;
  claimedRewards: string[];
  purchasedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface BattlePassReward {
  id: string;
  seasonId: string;
  level: number;
  tier: "free" | "premium" | "premium_plus";
  rewardType: "cosmetic" | "currency" | "nft" | "title" | "emote" | "border";
  rewardId: string;
  rewardName: string;
  rewardValue?: number;
  imageUrl?: string;
}

export interface RewardSeason {
  id: string;
  name: string;
  theme: string;
  status: SeasonStatus;
  startDate: Date;
  endDate: Date;
  battlePassPrice: number;
  premiumPlusPrice: number;
  currency: string;
  totalRewards: number;
  totalLevels: number;
  participantCount: number;
  createdAt: Date;
}

export interface AntiCheatReport {
  id: string;
  matchId: string;
  reportedUserId: number;
  reporterUserId?: number;
  cheatType: "aimbot" | "wallhack" | "speedhack" | "macro" | "account_sharing" | "smurfing" | "ddos" | "exploit";
  evidence: string;
  confidence: number;
  status: "pending" | "investigating" | "confirmed" | "dismissed";
  autoDetected: boolean;
  reviewedBy?: number;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface GameTelemetry {
  id: string;
  matchId: string;
  userId: number;
  eventType: string;
  eventData: Record<string, unknown>;
  timestamp: Date;
  frameNumber?: number;
  sessionId: string;
}

export interface MatchReplay {
  id: string;
  matchId: string;
  duration: number;
  fileSize: number;
  storageUrl: string;
  isPublic: boolean;
  viewCount: number;
  highlights: Array<{
    timestamp: number;
    eventType: string;
    description: string;
    userId: number;
  }>;
  createdAt: Date;
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────

const _playerProfiles = new Map<number, PlayerProfile>();
const _matches = new Map<string, GameMatch>();
const _matchmakingQueue = new Map<string, MatchmakingQueue>();
const _tournaments = new Map<string, Tournament>();
const _wagers = new Map<string, Wager>();
const _guilds = new Map<string, Guild>();
const _guildWars = new Map<string, GuildWar>();
const _battlePasses = new Map<string, BattlePass>();
const _battlePassRewards = new Map<string, BattlePassReward>();
const _rewardSeasons = new Map<string, RewardSeason>();
const _antiCheatReports = new Map<string, AntiCheatReport>();
const _telemetry: GameTelemetry[] = [];
const _replays = new Map<string, MatchReplay>();

// ─── SKILL RANKING ENGINE ────────────────────────────────────────────────────

export const skillRankingEngine = {
  _getRankFromRating(rating: number): PlayerProfile["rank"] {
    if (rating >= 3000) return "legend";
    if (rating >= 2500) return "grandmaster";
    if (rating >= 2000) return "master";
    if (rating >= 1700) return "diamond";
    if (rating >= 1400) return "platinum";
    if (rating >= 1100) return "gold";
    if (rating >= 800) return "silver";
    return "bronze";
  },

  getOrCreateProfile(userId: number, displayName: string, gameTag: string): PlayerProfile {
    const existing = _playerProfiles.get(userId);
    if (existing) return existing;
    const profile: PlayerProfile = {
      userId,
      displayName,
      gameTag,
      skillRating: 1000,
      peakSkillRating: 1000,
      rank: "bronze",
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      totalGamesPlayed: 0,
      currentStreak: 0,
      bestStreak: 0,
      avgKDA: 1.0,
      playtimeHours: 0,
      battlePassLevel: 1,
      seasonPoints: 0,
      isBanned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    _playerProfiles.set(userId, profile);
    return profile;
  },

  updateRating(userId: number, delta: number, won: boolean, drew = false): PlayerProfile | null {
    const profile = _playerProfiles.get(userId);
    if (!profile) return null;
    profile.skillRating = Math.max(0, profile.skillRating + delta);
    if (profile.skillRating > profile.peakSkillRating) profile.peakSkillRating = profile.skillRating;
    profile.rank = this._getRankFromRating(profile.skillRating);
    profile.totalGamesPlayed++;
    if (won) {
      profile.wins++;
      profile.currentStreak = Math.max(0, profile.currentStreak) + 1;
      if (profile.currentStreak > profile.bestStreak) profile.bestStreak = profile.currentStreak;
    } else if (drew) {
      profile.draws++;
      profile.currentStreak = 0;
    } else {
      profile.losses++;
      profile.currentStreak = Math.min(0, profile.currentStreak) - 1;
    }
    profile.winRate = profile.totalGamesPlayed > 0 ? profile.wins / profile.totalGamesPlayed : 0;
    profile.updatedAt = new Date();
    return profile;
  },

  calculateEloChange(winnerRating: number, loserRating: number, kFactor = 32): { winnerDelta: number; loserDelta: number } {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const winnerDelta = Math.round(kFactor * (1 - expectedWinner));
    const loserDelta = -Math.round(kFactor * expectedWinner);
    return { winnerDelta, loserDelta };
  },

  getLeaderboard(rank?: PlayerProfile["rank"], limit = 50): PlayerProfile[] {
    return Array.from(_playerProfiles.values())
      .filter(p => !p.isBanned && (!rank || p.rank === rank))
      .sort((a, b) => b.skillRating - a.skillRating)
      .slice(0, limit);
  },

  getPlayerProfile(userId: number): PlayerProfile | null {
    return _playerProfiles.get(userId) ?? null;
  },
};

// ─── MATCHMAKING ENGINE ───────────────────────────────────────────────────────

export const matchmakingEngine = {
  joinQueue(userId: number, gameMode: GameMode): MatchmakingQueue {
    const profile = _playerProfiles.get(userId);
    const skillRating = profile?.skillRating ?? 1000;
    const id = `queue_${userId}_${gameMode}`;
    const entry: MatchmakingQueue = {
      id,
      userId,
      gameMode,
      skillRating,
      skillRange: 100,
      queuedAt: new Date(),
      estimatedWaitSeconds: 30,
      isActive: true,
    };
    _matchmakingQueue.set(id, entry);
    return entry;
  },

  leaveQueue(userId: number, gameMode: GameMode): boolean {
    const id = `queue_${userId}_${gameMode}`;
    const entry = _matchmakingQueue.get(id);
    if (!entry) return false;
    entry.isActive = false;
    return true;
  },

  findMatch(gameMode: GameMode): GameMatch | null {
    const playersInMode = Array.from(_matchmakingQueue.values())
      .filter(q => q.gameMode === gameMode && q.isActive)
      .sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime());

    const playersNeeded = gameMode === "1v1" ? 2 : gameMode === "2v2" ? 4 : 10;
    if (playersInMode.length < playersNeeded) return null;

    // Sort by skill rating and pair closest players
    const sorted = playersInMode.sort((a, b) => a.skillRating - b.skillRating);
    const selected = sorted.slice(0, playersNeeded);
    const half = Math.floor(playersNeeded / 2);
    const teamA = selected.slice(0, half).map(q => q.userId);
    const teamB = selected.slice(half).map(q => q.userId);

    // Remove from queue
    for (const q of selected) {
      q.isActive = false;
    }

    const matchId = `match_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const match: GameMatch = {
      id: matchId,
      gameMode,
      status: "matched",
      teamA,
      teamB,
      skillRatingChanges: {},
      isRanked: true,
      createdAt: new Date(),
    };
    _matches.set(matchId, match);
    return match;
  },

  getQueueStatus(userId: number, gameMode: GameMode): MatchmakingQueue | null {
    return _matchmakingQueue.get(`queue_${userId}_${gameMode}`) ?? null;
  },

  getQueueStats(): Record<GameMode, number> {
    const stats: Record<string, number> = {};
    for (const q of _matchmakingQueue.values()) {
      if (q.isActive) stats[q.gameMode] = (stats[q.gameMode] ?? 0) + 1;
    }
    return stats as Record<GameMode, number>;
  },
};

// ─── MATCH ENGINE ─────────────────────────────────────────────────────────────

export const matchEngine = {
  startMatch(matchId: string): GameMatch | null {
    const match = _matches.get(matchId);
    if (!match || match.status !== "matched") return null;
    match.status = "in_progress";
    match.startedAt = new Date();
    return match;
  },

  completeMatch(matchId: string, params: {
    winnerTeam: "A" | "B" | "draw";
    scoreA: number;
    scoreB: number;
    durationSeconds: number;
    mvpUserId?: number;
    telemetryData?: Record<string, unknown>;
  }): GameMatch | null {
    const match = _matches.get(matchId);
    if (!match || match.status !== "in_progress") return null;

    match.status = "completed";
    match.winnerTeam = params.winnerTeam;
    match.scoreA = params.scoreA;
    match.scoreB = params.scoreB;
    match.durationSeconds = params.durationSeconds;
    match.mvpUserId = params.mvpUserId;
    match.endedAt = new Date();
    match.telemetryData = params.telemetryData;

    // Update ratings
    if (match.isRanked && params.winnerTeam !== "draw") {
      const winners = params.winnerTeam === "A" ? match.teamA : match.teamB;
      const losers = params.winnerTeam === "A" ? match.teamB : match.teamA;
      const avgWinnerRating = winners.reduce((s, id) => s + (_playerProfiles.get(id)?.skillRating ?? 1000), 0) / winners.length;
      const avgLoserRating = losers.reduce((s, id) => s + (_playerProfiles.get(id)?.skillRating ?? 1000), 0) / losers.length;
      const { winnerDelta, loserDelta } = skillRankingEngine.calculateEloChange(avgWinnerRating, avgLoserRating);
      for (const uid of winners) {
        skillRankingEngine.updateRating(uid, winnerDelta, true);
        match.skillRatingChanges[uid] = winnerDelta;
      }
      for (const uid of losers) {
        skillRankingEngine.updateRating(uid, loserDelta, false);
        match.skillRatingChanges[uid] = loserDelta;
      }
    }

    // Settle wager if exists
    if (match.wagerId) {
      wagerEngine.settleWager(match.wagerId, match.winnerTeam === "A" ? match.teamA[0] : match.teamB[0]);
    }

    return match;
  },

  getMatch(matchId: string): GameMatch | null {
    return _matches.get(matchId) ?? null;
  },

  getPlayerMatches(userId: number, limit = 20): GameMatch[] {
    return Array.from(_matches.values())
      .filter(m => m.teamA.includes(userId) || m.teamB.includes(userId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  },
};

// ─── TOURNAMENT ENGINE ────────────────────────────────────────────────────────

export const tournamentEngine = {
  createTournament(params: Omit<Tournament, "id" | "registeredParticipants" | "bracket" | "createdAt">): Tournament {
    const id = `tourney_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const tournament: Tournament = {
      ...params,
      id,
      registeredParticipants: [],
      bracket: [],
      createdAt: new Date(),
    };
    _tournaments.set(id, tournament);
    return tournament;
  },

  registerParticipant(tournamentId: string, userId: number): { success: boolean; reason?: string } {
    const tournament = _tournaments.get(tournamentId);
    if (!tournament) return { success: false, reason: "Tournament not found" };
    if (tournament.status !== "registration") return { success: false, reason: "Registration closed" };
    if (tournament.registeredParticipants.includes(userId)) return { success: false, reason: "Already registered" };
    if (tournament.registeredParticipants.length >= tournament.maxParticipants) return { success: false, reason: "Tournament full" };
    tournament.registeredParticipants.push(userId);
    return { success: true };
  },

  generateBracket(tournamentId: string): Tournament | null {
    const tournament = _tournaments.get(tournamentId);
    if (!tournament || tournament.status !== "registration") return null;
    tournament.status = "bracket";

    // Seed participants by skill rating
    const seeded = [...tournament.registeredParticipants].sort((a, b) =>
      (_playerProfiles.get(b)?.skillRating ?? 1000) - (_playerProfiles.get(a)?.skillRating ?? 1000)
    );

    // Generate first round matches
    tournament.bracket = [];
    for (let i = 0; i < seeded.length - 1; i += 2) {
      const matchId = `tourney_match_${tournamentId}_r1_${i}`;
      tournament.bracket.push({
        round: 1,
        matchId,
        teamA: [seeded[i]],
        teamB: [seeded[i + 1]],
      });
    }
    return tournament;
  },

  recordBracketResult(tournamentId: string, matchId: string, winnerId: number): Tournament | null {
    const tournament = _tournaments.get(tournamentId);
    if (!tournament) return null;
    const bracketMatch = tournament.bracket.find(b => b.matchId === matchId);
    if (bracketMatch) bracketMatch.winnerId = winnerId;
    return tournament;
  },

  getTournament(id: string): Tournament | null {
    return _tournaments.get(id) ?? null;
  },

  getActiveTournaments(gameMode?: GameMode): Tournament[] {
    return Array.from(_tournaments.values())
      .filter(t => ["registration", "bracket", "finals"].includes(t.status) && (!gameMode || t.gameMode === gameMode))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  },
};

// ─── WAGER ENGINE ─────────────────────────────────────────────────────────────

export const wagerEngine = {
  createWager(params: Omit<Wager, "id" | "matchId" | "winnerId" | "payoutTxHash" | "acceptedAt" | "completedAt" | "createdAt">): Wager {
    const id = `wager_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const wager: Wager = { ...params, id, createdAt: new Date() };
    _wagers.set(id, wager);
    return wager;
  },

  acceptWager(wagerId: string): Wager | null {
    const wager = _wagers.get(wagerId);
    if (!wager || wager.status !== "pending") return null;
    wager.status = "accepted";
    wager.acceptedAt = new Date();
    return wager;
  },

  settleWager(wagerId: string, winnerId: number): Wager | null {
    const wager = _wagers.get(wagerId);
    if (!wager || !["accepted", "in_progress"].includes(wager.status)) return null;
    wager.status = "completed";
    wager.winnerId = winnerId;
    wager.completedAt = new Date();
    wager.payoutTxHash = `0x${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(16).slice(2, 66)}`;
    return wager;
  },

  getPlayerWagers(userId: number, status?: WagerStatus): Wager[] {
    return Array.from(_wagers.values())
      .filter(w => (w.challengerId === userId || w.challengedId === userId) && (!status || w.status === status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  getWager(id: string): Wager | null {
    return _wagers.get(id) ?? null;
  },
};

// ─── GUILD ENGINE ─────────────────────────────────────────────────────────────

export const guildEngine = {
  createGuild(params: Omit<Guild, "id" | "officerIds" | "wins" | "losses" | "warPoints" | "level" | "xp" | "createdAt" | "updatedAt">): Guild {
    const id = `guild_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const guild: Guild = {
      ...params,
      id,
      officerIds: [],
      wins: 0,
      losses: 0,
      warPoints: 0,
      level: 1,
      xp: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    _guilds.set(id, guild);
    return guild;
  },

  joinGuild(guildId: string, userId: number): { success: boolean; reason?: string } {
    const guild = _guilds.get(guildId);
    if (!guild) return { success: false, reason: "Guild not found" };
    if (!guild.isOpen) return { success: false, reason: "Guild is closed" };
    if (guild.memberIds.length >= guild.maxMembers) return { success: false, reason: "Guild is full" };
    const profile = _playerProfiles.get(userId);
    if (guild.minSkillRating && (profile?.skillRating ?? 0) < guild.minSkillRating) {
      return { success: false, reason: "Skill rating too low" };
    }
    if (!guild.memberIds.includes(userId)) guild.memberIds.push(userId);
    guild.updatedAt = new Date();
    return { success: true };
  },

  declareWar(attackerGuildId: string, defenderGuildId: string): GuildWar {
    const id = `war_${attackerGuildId}_${defenderGuildId}_${Date.now()}`;
    const war: GuildWar = {
      id,
      attackerGuildId,
      defenderGuildId,
      status: "declared",
      attackerScore: 0,
      defenderScore: 0,
      maxBattles: 10,
      battlesCompleted: 0,
      matchIds: [],
      prizeWarPoints: 100,
      createdAt: new Date(),
    };
    _guildWars.set(id, war);
    return war;
  },

  recordWarBattle(warId: string, matchId: string, winnerGuildId: string): GuildWar | null {
    const war = _guildWars.get(warId);
    if (!war || war.status !== "active") return null;
    war.matchIds.push(matchId);
    war.battlesCompleted++;
    if (winnerGuildId === war.attackerGuildId) war.attackerScore++;
    else war.defenderScore++;
    if (war.battlesCompleted >= war.maxBattles) {
      war.status = "ended";
      war.endedAt = new Date();
      war.winnerGuildId = war.attackerScore > war.defenderScore ? war.attackerGuildId : war.defenderGuildId;
    }
    return war;
  },

  getGuild(id: string): Guild | null {
    return _guilds.get(id) ?? null;
  },

  getTopGuilds(limit = 20): Guild[] {
    return Array.from(_guilds.values())
      .sort((a, b) => b.warPoints - a.warPoints)
      .slice(0, limit);
  },
};

// ─── BATTLE PASS ENGINE ───────────────────────────────────────────────────────

export const battlePassEngine = {
  createSeason(params: Omit<RewardSeason, "id" | "participantCount" | "createdAt">): RewardSeason {
    const id = `season_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const season: RewardSeason = { ...params, id, participantCount: 0, createdAt: new Date() };
    _rewardSeasons.set(id, season);
    return season;
  },

  addReward(params: Omit<BattlePassReward, "id">): BattlePassReward {
    const id = `bpr_${params.seasonId}_${params.level}_${params.tier}`;
    const reward: BattlePassReward = { ...params, id };
    _battlePassRewards.set(id, reward);
    return reward;
  },

  purchaseBattlePass(userId: number, seasonId: string, tier: BattlePass["tier"]): BattlePass {
    const season = _rewardSeasons.get(seasonId);
    const id = `bp_${userId}_${seasonId}`;
    const existing = _battlePasses.get(id);
    if (existing) {
      existing.tier = tier;
      existing.purchasedAt = new Date();
      return existing;
    }
    const bp: BattlePass = {
      id,
      seasonId,
      userId,
      tier,
      level: 1,
      maxLevel: season?.totalLevels ?? 100,
      xp: 0,
      xpPerLevel: 1000,
      claimedRewards: [],
      purchasedAt: new Date(),
      expiresAt: season?.endDate ?? new Date(Date.now() + 90 * 86400000),
      createdAt: new Date(),
    };
    _battlePasses.set(id, bp);
    if (season) season.participantCount++;
    return bp;
  },

  addXP(userId: number, seasonId: string, xp: number): BattlePass | null {
    const bp = _battlePasses.get(`bp_${userId}_${seasonId}`);
    if (!bp) return null;
    bp.xp += xp;
    while (bp.xp >= bp.xpPerLevel && bp.level < bp.maxLevel) {
      bp.xp -= bp.xpPerLevel;
      bp.level++;
    }
    return bp;
  },

  claimReward(userId: number, seasonId: string, rewardId: string): { success: boolean; reward?: BattlePassReward; reason?: string } {
    const bp = _battlePasses.get(`bp_${userId}_${seasonId}`);
    if (!bp) return { success: false, reason: "No battle pass" };
    const reward = _battlePassRewards.get(rewardId);
    if (!reward) return { success: false, reason: "Reward not found" };
    if (reward.level > bp.level) return { success: false, reason: "Level not reached" };
    if (reward.tier === "premium" && bp.tier === "free") return { success: false, reason: "Premium pass required" };
    if (bp.claimedRewards.includes(rewardId)) return { success: false, reason: "Already claimed" };
    bp.claimedRewards.push(rewardId);
    return { success: true, reward };
  },

  getBattlePass(userId: number, seasonId: string): BattlePass | null {
    return _battlePasses.get(`bp_${userId}_${seasonId}`) ?? null;
  },

  getSeasonRewards(seasonId: string, tier?: BattlePass["tier"]): BattlePassReward[] {
    return Array.from(_battlePassRewards.values())
      .filter(r => r.seasonId === seasonId && (!tier || r.tier === tier))
      .sort((a, b) => a.level - b.level);
  },

  getActiveSeason(): RewardSeason | null {
    const now = new Date();
    return Array.from(_rewardSeasons.values()).find(s => s.status === "active" && s.startDate <= now && s.endDate > now) ?? null;
  },
};

// ─── ANTI-CHEAT ENGINE ────────────────────────────────────────────────────────

export const antiCheatEngine = {
  reportCheat(params: Omit<AntiCheatReport, "id" | "status" | "resolvedAt" | "createdAt">): AntiCheatReport {
    const id = `cheat_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const report: AntiCheatReport = {
      ...params,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    _antiCheatReports.set(id, report);
    return report;
  },

  analyzeMatchTelemetry(matchId: string): AntiCheatReport[] {
    const matchTelemetry = _telemetry.filter(t => t.matchId === matchId);
    const reports: AntiCheatReport[] = [];

    // Detect suspicious patterns
    const userEventCounts: Record<number, Record<string, number>> = {};
    for (const event of matchTelemetry) {
      if (!userEventCounts[event.userId]) userEventCounts[event.userId] = {};
      userEventCounts[event.userId][event.eventType] = (userEventCounts[event.userId][event.eventType] ?? 0) + 1;
    }

    for (const [userIdStr, eventCounts] of Object.entries(userEventCounts)) {
      const userId = parseInt(userIdStr);
      // Detect macro: too many actions per second
      const totalEvents = Object.values(eventCounts).reduce((s, c) => s + c, 0);
      const match = _matches.get(matchId);
      const durationSecs = match?.durationSeconds ?? 300;
      const eventsPerSec = totalEvents / durationSecs;
      if (eventsPerSec > 20) {
        const report = this.reportCheat({
          matchId,
          reportedUserId: userId,
          cheatType: "macro",
          evidence: `${eventsPerSec.toFixed(1)} events/sec detected`,
          confidence: Math.min(1, eventsPerSec / 30),
          autoDetected: true,
        });
        reports.push(report);
      }
    }
    return reports;
  },

  resolveReport(reportId: string, status: "confirmed" | "dismissed", reviewedBy: number): AntiCheatReport | null {
    const report = _antiCheatReports.get(reportId);
    if (!report) return null;
    report.status = status;
    report.reviewedBy = reviewedBy;
    report.resolvedAt = new Date();

    // Auto-ban if confirmed
    if (status === "confirmed") {
      const profile = _playerProfiles.get(report.reportedUserId);
      if (profile) {
        profile.isBanned = true;
        profile.banReason = report.cheatType;
        profile.banExpiresAt = new Date(Date.now() + 30 * 86400000); // 30 day ban
      }
    }
    return report;
  },

  getPendingReports(limit = 50): AntiCheatReport[] {
    return Array.from(_antiCheatReports.values())
      .filter(r => r.status === "pending")
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  },

  getBannedPlayers(): PlayerProfile[] {
    return Array.from(_playerProfiles.values()).filter(p => p.isBanned);
  },
};

// ─── GAME TELEMETRY ENGINE ────────────────────────────────────────────────────

export const gameTelemetryEngine = {
  recordEvent(params: Omit<GameTelemetry, "id">): GameTelemetry {
    const id = `tel_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).slice(2, 6)}`;
    const event: GameTelemetry = { ...params, id };
    _telemetry.push(event);
    return event;
  },

  getMatchTelemetry(matchId: string, userId?: number): GameTelemetry[] {
    return _telemetry.filter(t => t.matchId === matchId && (!userId || t.userId === userId));
  },

  createReplay(matchId: string, highlights: MatchReplay["highlights"]): MatchReplay {
    const id = `replay_${matchId}`;
    const replay: MatchReplay = {
      id,
      matchId,
      duration: _matches.get(matchId)?.durationSeconds ?? 0,
      fileSize: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 50000000) + 5000000,
      storageUrl: `https://replays.shadowchat.io/${matchId}.scr`,
      isPublic: true,
      viewCount: 0,
      highlights,
      createdAt: new Date(),
    };
    _replays.set(id, replay);
    const match = _matches.get(matchId);
    if (match) match.replayId = id;
    return replay;
  },

  getReplay(matchId: string): MatchReplay | null {
    return _replays.get(`replay_${matchId}`) ?? null;
  },
};

// ─── AI BALANCING ENGINE ─────────────────────────────────────────────────────

export const aiBalancingEngine = {
  analyzeMatchBalance(matchId: string): {
    balanceScore: number;
    skillGap: number;
    recommendations: string[];
    isBalanced: boolean;
  } {
    const match = _matches.get(matchId);
    if (!match) return { balanceScore: 0, skillGap: 0, recommendations: [], isBalanced: false };

    const avgTeamA = match.teamA.reduce((s, id) => s + (_playerProfiles.get(id)?.skillRating ?? 1000), 0) / match.teamA.length;
    const avgTeamB = match.teamB.reduce((s, id) => s + (_playerProfiles.get(id)?.skillRating ?? 1000), 0) / match.teamB.length;
    const skillGap = Math.abs(avgTeamA - avgTeamB);
    const balanceScore = Math.max(0, 1 - skillGap / 500);
    const isBalanced = skillGap < 100;

    const recommendations: string[] = [];
    if (skillGap > 200) recommendations.push("Consider rebalancing teams by swapping players");
    if (skillGap > 100) recommendations.push("Adjust handicap settings for fairer gameplay");
    if (match.teamA.length !== match.teamB.length) recommendations.push("Teams have unequal sizes");

    return { balanceScore, skillGap, recommendations, isBalanced };
  },

  getMetaAnalysis(): {
    mostPlayedMode: GameMode | null;
    avgMatchDuration: number;
    avgSkillRating: number;
    winRateByRank: Record<string, number>;
  } {
    const matches = Array.from(_matches.values()).filter(m => m.status === "completed");
    const modeCounts: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;

    for (const m of matches) {
      modeCounts[m.gameMode] = (modeCounts[m.gameMode] ?? 0) + 1;
      if (m.durationSeconds) { totalDuration += m.durationSeconds; durationCount++; }
    }

    const mostPlayedMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as GameMode ?? null;
    const profiles = Array.from(_playerProfiles.values());
    const avgSkillRating = profiles.length > 0 ? profiles.reduce((s, p) => s + p.skillRating, 0) / profiles.length : 1000;

    const winRateByRank: Record<string, number> = {};
    for (const p of profiles) {
      if (!winRateByRank[p.rank]) winRateByRank[p.rank] = 0;
      winRateByRank[p.rank] += p.winRate;
    }
    const rankCounts: Record<string, number> = {};
    for (const p of profiles) rankCounts[p.rank] = (rankCounts[p.rank] ?? 0) + 1;
    for (const rank of Object.keys(winRateByRank)) {
      winRateByRank[rank] /= (rankCounts[rank] ?? 1);
    }

    return {
      mostPlayedMode,
      avgMatchDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      avgSkillRating,
      winRateByRank,
    };
  },

  getGamingDashboard(): {
    activePlayers: number;
    matchesInProgress: number;
    activeTournaments: number;
    pendingWagers: number;
    activeGuildWars: number;
    topPlayers: PlayerProfile[];
  } {
    return {
      activePlayers: _playerProfiles.size,
      matchesInProgress: Array.from(_matches.values()).filter(m => m.status === "in_progress").length,
      activeTournaments: tournamentEngine.getActiveTournaments().length,
      pendingWagers: Array.from(_wagers.values()).filter(w => w.status === "pending").length,
      activeGuildWars: Array.from(_guildWars.values()).filter(w => w.status === "active").length,
      topPlayers: skillRankingEngine.getLeaderboard(undefined, 5),
    };
  },
};
