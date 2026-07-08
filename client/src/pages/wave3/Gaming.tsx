// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

const GamingPage: React.FC = () => {
  
  const [activeTab, setActiveTab] = useState<'games' | 'leaderboard' | 'history' | 'achievements'>('games');

  // Queries
  const gamesQuery = trpc.gaming.getGames.useQuery({ limit: 20 }, { enabled: true });
  const leaderboardQuery = trpc.gaming.getLeaderboard.useQuery({ limit: 20 }, { enabled: true });
  const historyQuery = trpc.gaming.getHistory.useQuery({ limit: 20 }, { enabled: isAuthenticated });
  const statsQuery = trpc.gaming.getStats.useQuery(undefined, { enabled: isAuthenticated });
  const achievementsQuery = trpc.gaming.getAchievements.useQuery(undefined, { enabled: isAuthenticated });

  const recordSessionMutation = trpc.gaming.recordSession.useMutation({
    onSuccess: () => {
      historyQuery.refetch();
      statsQuery.refetch();
      toast.success('Game recorded!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record game');
    },
  });

  const handlePlayGame = async (gameId: string) => {
    const score = Math.floor((Math.random()) * 1000);
    const won = (Math.random()) > 0.5;
    await recordSessionMutation.mutateAsync({
      gameId,
      score,
      won,
      duration: Math.floor((Math.random()) * 600),
    });
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gaming Hub</h2>
        {isAuthenticated && statsQuery.data && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Games: {statsQuery.data.totalGames}</p>
            <p className="text-sm font-medium">Win Rate: {statsQuery.data.winRate.toFixed(1)}%</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['games', 'leaderboard', 'history', 'achievements'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Games Tab */}
      {activeTab === 'games' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gamesQuery.isLoading ? (
            <>
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </>
          ) : (gamesQuery.data?.games || []).length > 0 ? (
            (gamesQuery.data?.games || []).map((game: any) => (
              <Card key={game.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{game.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{game.description}</p>
                  <p className="text-xs text-muted-foreground">{game._count.sessions} plays</p>
                  {isAuthenticated && (
                    <Button
                      onClick={() => handlePlayGame(game.id)}
                      disabled={recordSessionMutation.isPending}
                      className="w-full"
                    >
                      {recordSessionMutation.isPending ? 'Playing...' : 'Play Now'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No games available</p>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <Card>
          <CardHeader>
            <CardTitle>Top Players</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (leaderboardQuery.data || []).length > 0 ? (
              <div className="space-y-2">
                {(leaderboardQuery.data || []).map((entry: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg border border-border flex justify-between items-center">
                    <div>
                      <p className="font-medium">#{entry.rank} {entry.user?.name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.gamesPlayed} games • {entry.wins} wins
                      </p>
                    </div>
                    <p className="font-bold text-lg">{entry.score}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No leaderboard data</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* History Tab */}
      {activeTab === 'history' && isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle>Game History</CardTitle>
          </CardHeader>
          <CardContent>
            {historyQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (historyQuery.data?.sessions || []).length > 0 ? (
              <div className="space-y-2">
                {(historyQuery.data?.sessions || []).map((session: any) => (
                  <div key={session.id} className="p-3 rounded-lg border border-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{session.game.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.wins > 0 ? '✓ Won' : '✗ Lost'} • Score: {session.score}
                        </p>
                      </div>
                      <p className="text-sm font-medium">+{session.reward.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No game history</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {achievementsQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (achievementsQuery.data || []).length > 0 ? (
              <div className="grid gap-2 md:grid-cols-2">
                {(achievementsQuery.data || []).map((achievement: any) => (
                  <div key={achievement.id} className="p-3 rounded-lg border border-border bg-blue-50">
                    <p className="font-medium text-blue-900">{achievement.badge?.name}</p>
                    <p className="text-xs text-blue-700">{achievement.badge?.description}</p>
                    {achievement.claimedAt && (
                      <p className="text-xs text-blue-600 mt-1">
                        Claimed: {new Date(achievement.claimedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No achievements yet</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GamingPage;
