import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Play, Pause, TrendingUp, Zap, Coins, Activity, DollarSign, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function MiningDashboard() {
  const { isAuthenticated } = useAuth();
  const [usdValue, setUsdValue] = useState(0);
  const [cryptoBreakdown, setCryptoBreakdown] = useState([
    { name: 'BTC', value: 0.0045, color: '#F7931A' },
    { name: 'ETH', value: 0.082, color: '#627EEA' },
    { name: 'SOL', value: 1.23, color: '#14F195' },
    { name: 'DOGE', value: 234.5, color: '#BA9F33' },
    { name: 'SKY444', value: 156.8, color: '#00BFFF' }, // Added SKY444
  ]);

  const { data: pools, isLoading: isLoadingPools, error: poolsError } = trpc.mining.getPools.useQuery();
  const { data: userStats, isLoading: isLoadingUserStats, error: userStatsError, refetch: refetchUserStats } = trpc.mining.getUserStats.useQuery(undefined, { enabled: isAuthenticated });
  const startMiningMutation = trpc.mining.startMining.useMutation({
    onSuccess: () => {
      toast.success("Mining started successfully!");
      refetchUserStats();
    },
    onError: (error) => {
      toast.error(`Error starting mining: ${error.message}`);
    },
  });
  const stopMiningMutation = trpc.mining.stopMining.useMutation({
    onSuccess: () => {
      toast.success("Mining stopped successfully!");
      refetchUserStats();
    },
    onError: (error) => {
      toast.error(`Error stopping mining: ${error.message}`);
    },
  });

  // Simulate real-time USD value update
  useEffect(() => {
    const usdInterval = setInterval(() => {
      setUsdValue((prev) => prev + Math.random() * 50);
    }, 5000);
    return () => clearInterval(usdInterval);
  }, []);

  if (isLoadingPools || isLoadingUserStats) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (poolsError || userStatsError) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        <p>Error loading mining data: {poolsError?.message || userStatsError?.message}</p>
      </div>
    );
  }

  const chartData = userStats?.coins.map(c => ({ name: c.coin, coins: c.rewards, rewards: c.rewards })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⛏️ Crypto Mining Dashboard</h1>
          <p className="text-slate-400">24/7 Autonomous Crypto Mining System</p>
        </div>

        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Mining Control</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {userStats?.activePools > 0 ? (
                <Button onClick={() => stopMiningMutation.mutate("all")} variant="destructive" size="lg" disabled={stopMiningMutation.isLoading}>
                  {stopMiningMutation.isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Pause className="w-4 h-4 mr-2" />}
                  Stop All Mining
                </Button>
              ) : (
                <Button onClick={() => startMiningMutation.mutate({ poolId: pools?.[0]?.id || "", hashpower: 100 })} size="lg" className="bg-green-600 hover:bg-green-700" disabled={startMiningMutation.isLoading || !isAuthenticated}>
                  {startMiningMutation.isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  Start Mining
                </Button>
              )}
              <Badge variant={userStats?.activePools > 0 ? 'default' : 'secondary'} className="text-base py-2 px-4">
                {userStats?.activePools > 0 ? '🟢 MINING ACTIVE' : '🔴 MINING INACTIVE'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <Card className="bg-slate-800 border-cyan-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-cyan-500" />
                USD Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-500">${usdValue.toFixed(2)}</div>
              <p className="text-slate-400 text-sm mt-1">Real-time</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                Total Coins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{userStats?.totalCoinsGenerated?.toLocaleString() || 0}</div>
              <p className="text-slate-400 text-sm mt-1">Generated</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Rewards Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{userStats?.totalRewards?.toLocaleString() || 0}</div>
              <p className="text-slate-400 text-sm mt-1">To Admin Wallet</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-500" />
                Max Workers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">128</div>
              <p className="text-slate-400 text-sm mt-1">Parallel</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                Active Pools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{userStats?.activePools || 0}</div>
              <p className="text-slate-400 text-sm mt-1">Currently Mining</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Crypto Earnings Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={cryptoBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {cryptoBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: 'white' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-5 gap-2 mt-4">
              {cryptoBreakdown.map((crypto) => (
                <div key={crypto.name} className="text-center">
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: crypto.color }} />
                  <p className="text-xs font-semibold text-white">{crypto.name}</p>
                  <p className="text-xs text-slate-400">{crypto.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold text-white mb-4">Available Mining Pools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools?.map((pool) => (
            <Card key={pool.id} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{pool.name} ({pool.coin})</CardTitle>
                <CardDescription className="text-slate-400">Current Difficulty: {pool.difficulty}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">Estimated Hashrate: {pool.hashrate} TH/s</p>
                <p className="text-slate-300">Reward per Block: {pool.reward} {pool.coin}</p>
                {isAuthenticated && (
                  <Button
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                    onClick={() => startMiningMutation.mutate({ poolId: pool.id, hashpower: 100 })}
                    disabled={startMiningMutation.isLoading}
                  >
                    {startMiningMutation.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Join Pool
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
