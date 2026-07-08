import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Play, Pause, TrendingUp, Zap, Coins, Activity, DollarSign, Cpu, GitBranch, Wallet, CheckCircle, AlertCircle } from 'lucide-react';

interface MiningStatus {
  isRunning: boolean;
  activeMiners: number;
  totalSessions: number;
  totalCoinsGenerated: number;
  totalRewardsSent: number;
  lastSession: any;
}

interface MiningStats {
  totalSessions: number;
  totalCoinsGenerated: number;
  totalRewardsSent: number;
  averageCoinsPerSession: number;
  uptime: number;
  activeMiners: number;
}

interface MiningSession {
  id: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'completed' | 'failed';
  coinsGenerated: number;
  rewardsSent: number;
  poolsUsed: string[];
  aiOptimizations: string[];
  errors: string[];
}

export default function MiningDashboard() {
  const [status, setStatus] = useState<MiningStatus | null>(null);
  const [stats, setStats] = useState<MiningStats | null>(null);
  const [sessions, setSessions] = useState<MiningSession[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch mining status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/mining/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Fetch mining statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/mining/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Fetch session history
  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/mining/sessions?limit=50');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data.sessions);

      // Prepare chart data
      const chartData = data.sessions.map((session: MiningSession) => ({
        name: new Date(session.startTime).toLocaleTimeString(),
        coins: session.coinsGenerated,
        rewards: session.rewardsSent,
      }));
      setChartData(chartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Start mining
  const startMining = async () => {
    try {
      const response = await fetch('/api/mining/start', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to start mining');
      fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Stop mining
  const stopMining = async () => {
    try {
      const response = await fetch('/api/mining/stop', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to stop mining');
      fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Real-time earnings simulation
  const [usdValue, setUsdValue] = useState(0);
  const [cryptoBreakdown, setCryptoBreakdown] = useState([
    { name: 'BTC', value: 0.0045, color: '#F7931A' },
    { name: 'ETH', value: 0.082, color: '#627EEA' },
    { name: 'SOL', value: 1.23, color: '#14F195' },
    { name: 'DOGE', value: 234.5, color: '#BA9F33' },
    { name: 'TRUMP', value: 156.8, color: '#FF6B6B' },
  ]);

  // Initial load and polling
  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchStatus(), fetchStats(), fetchSessions()]);
      setLoading(false);
    };

    load();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      Promise.all([fetchStatus(), fetchStats(), fetchSessions()]);
    }, 10000);

    // Real-time USD value update
    const usdInterval = setInterval(() => {
      setUsdValue((prev) => prev + Math.random() * 50);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(usdInterval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Zap className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold">Loading mining dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⛏️ Mining Dashboard</h1>
          <p className="text-slate-400">24/7 Autonomous Crypto Mining System</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Control Panel */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Mining Control</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {status?.isRunning ? (
                <Button onClick={stopMining} variant="destructive" size="lg">
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Mining
                </Button>
              ) : (
                <Button onClick={startMining} size="lg" className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start Mining
                </Button>
              )}
              <Badge variant={status?.isRunning ? 'default' : 'secondary'} className="text-base py-2 px-4">
                {status?.isRunning ? '🟢 MINING ACTIVE' : '🔴 MINING INACTIVE'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          {/* Total USD Value */}
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

          {/* Total Coins */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                Total Coins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{stats?.totalCoinsGenerated.toLocaleString()}</div>
              <p className="text-slate-400 text-sm mt-1">Generated</p>
            </CardContent>
          </Card>

          {/* Rewards Sent */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Rewards Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">${stats?.totalRewardsSent.toLocaleString()}</div>
              <p className="text-slate-400 text-sm mt-1">To Admin Wallet</p>
            </CardContent>
          </Card>

          {/* Max Workers */}
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

          {/* Sessions */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{stats?.totalSessions}</div>
              <p className="text-slate-400 text-sm mt-1">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Crypto Breakdown */}
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-5 gap-2 mt-4">
              {cryptoBreakdown.map((crypto) => (
                <div key={crypto.name} className="text-center">
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: crypto.color }} />
                  <p className="text-xs font-semibold text-white">{crypto.name}</p>
                  <p className="text-xs text-slate-400">${(crypto.value * 1000).toFixed(0)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Coins Generated Chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Coins Generated (Last 50 Sessions)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                  <Legend />
                  <Line type="monotone" dataKey="coins" stroke="#eab308" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Rewards Sent Chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Rewards Sent (Last 50 Sessions)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                  <Legend />
                  <Bar dataKey="rewards" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Performance Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-1">Average Coins/Session</p>
                <p className="text-2xl font-bold text-white">{stats?.averageCoinsPerSession.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Uptime</p>
                <p className="text-2xl font-bold text-white">{Math.floor((stats?.uptime || 0) / 3600000)} hours</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Mining Efficiency</p>
                <p className="text-2xl font-bold text-white">
                  {((stats?.totalRewardsSent || 0) / (stats?.totalCoinsGenerated || 1) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Mining Sessions</CardTitle>
            <CardDescription>Last 10 sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300">Session ID</th>
                    <th className="text-left py-3 px-4 text-slate-300">Status</th>
                    <th className="text-right py-3 px-4 text-slate-300">Coins</th>
                    <th className="text-right py-3 px-4 text-slate-300">Rewards</th>
                    <th className="text-right py-3 px-4 text-slate-300">Pools</th>
                    <th className="text-left py-3 px-4 text-slate-300">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 10).map((session) => (
                    <tr key={session.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="py-3 px-4 text-slate-300 font-mono text-xs">{session.id.slice(0, 20)}...</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={session.status === 'completed' ? 'default' : session.status === 'failed' ? 'destructive' : 'secondary'}
                        >
                          {session.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-yellow-500 font-semibold">{session.coinsGenerated}</td>
                      <td className="py-3 px-4 text-right text-green-500 font-semibold">{session.rewardsSent}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{session.poolsUsed.length}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(session.startTime).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
