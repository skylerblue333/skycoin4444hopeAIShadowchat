/**
 * VOICE COMMANDS UI - 444 COMMANDS
 * Rich, smooth voice interface for SKYCOIN4444
 */

import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function VoiceCommandsUI() {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('AI');

  // tRPC queries
  const { data: stats } = trpc.voice.getStats.useQuery();
  const { data: allCommands } = trpc.voice.getAllCommands.useQuery();
  const { data: categories } = trpc.voice.getCategories.useQuery();
  const { data: commandsByCategory } = trpc.voice.getCommandsByCategory.useQuery(
    { category: selectedCategory },
    { enabled: !!selectedCategory }
  );

  // Execute command mutation
  const executeCommand = trpc.voice.executeCommand.useMutation();

  const handleExecuteCommand = async () => {
    if (!input.trim()) return;

    try {
      const res = await executeCommand.mutateAsync({
        input: input.trim(),
      });
      setResult(res);
      setInput('');
    } catch (error) {
      setResult({ error: String(error) });
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleExecuteCommand();
    };

    recognition.onerror = (event: any) => {
      setResult({ error: `Voice recognition error: ${event.error}` });
    };

    recognition.start();
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gold">SKYCOIN4444 Voice Commands</h1>
        <p className="text-xl text-white">
          {stats?.totalCommands || 444} Commands Available
        </p>
      </div>

      {/* Voice Input Section */}
      <Card className="bg-black/50 border-gold/30 p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gold">Voice Command Input</h2>

          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleExecuteCommand()}
              placeholder="Type or say a command..."
              className="bg-black/30 border-gold/30 text-white placeholder:text-gray-500"
            />
            <Button
              onClick={handleExecuteCommand}
              className="bg-gold hover:bg-gold/90 text-black font-bold"
            >
              Execute
            </Button>
            <Button
              onClick={handleVoiceInput}
              disabled={isListening}
              className={`${
                isListening ? 'bg-red-500' : 'bg-blue-500 hover:bg-blue-600'
              } text-white font-bold`}
            >
              {isListening ? '🎤 Listening...' : '🎤 Voice'}
            </Button>
          </div>

          {/* Result Display */}
          {result && (
            <div
              className={`p-4 rounded-lg ${
                result.error
                  ? 'bg-red-900/30 border border-red-500'
                  : 'bg-green-900/30 border border-green-500'
              }`}
            >
              <p className="text-white font-mono text-sm">
                {result.error ? `❌ ${result.error}` : `✅ ${result.command}: ${JSON.stringify(result.result)}`}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Commands Browser */}
      <Card className="bg-black/50 border-gold/30 p-6">
        <h2 className="text-2xl font-bold text-gold mb-4">Browse Commands</h2>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/30">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="byCategory">By Category</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories?.categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                  }}
                  className={`p-3 rounded-lg font-bold transition ${
                    selectedCategory === cat.name
                      ? 'bg-gold text-black'
                      : 'bg-black/30 border border-gold/30 text-gold hover:bg-gold/20'
                  }`}
                >
                  <div className="text-lg">{cat.name}</div>
                  <div className="text-sm opacity-75">{cat.count} commands</div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* By Category Tab */}
          <TabsContent value="byCategory" className="space-y-4">
            <div className="space-y-3">
              {commandsByCategory?.commands.slice(0, 10).map((cmd: any) => (
                <div
                  key={cmd.id}
                  className="p-3 bg-black/30 border border-gold/30 rounded-lg hover:bg-gold/10 cursor-pointer transition"
                  onClick={() => {
                    setInput(cmd.aliases[0] || cmd.name);
                  }}
                >
                  <div className="font-bold text-gold">{cmd.name}</div>
                  <div className="text-sm text-gray-300">
                    {cmd.aliases.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <Input
              placeholder="Search commands..."
              className="bg-black/30 border-gold/30 text-white"
              onChange={(e) => {
                // Implement search
              }}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Statistics */}
      <Card className="bg-black/50 border-gold/30 p-6">
        <h2 className="text-2xl font-bold text-gold mb-4">Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gold">444</div>
            <div className="text-sm text-gray-300">Total Commands</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gold">
              {categories?.totalCategories || 20}
            </div>
            <div className="text-sm text-gray-300">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gold">
              {allCommands?.totalCommands || 444}
            </div>
            <div className="text-sm text-gray-300">Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gold">100%</div>
            <div className="text-sm text-gray-300">Integrated</div>
          </div>
        </div>
      </Card>

      {/* Quick Commands */}
      <Card className="bg-black/50 border-gold/30 p-6">
        <h2 className="text-2xl font-bold text-gold mb-4">Quick Commands</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {['ai chat', 'go home', 'send payment', 'create post', 'play game', 'buy item', 'vote', 'dashboard'].map(
            (cmd) => (
              <button
                key={cmd}
                onClick={() => {
                  setInput(cmd);
                  handleExecuteCommand();
                }}
                className="p-2 bg-black/30 border border-gold/30 text-gold rounded hover:bg-gold/20 transition font-bold text-sm"
              >
                {cmd}
              </button>
            )
          )}
        </div>
      </Card>

      {/* Help Section */}
      <Card className="bg-black/50 border-gold/30 p-6">
        <h2 className="text-2xl font-bold text-gold mb-4">How to Use</h2>
        <ul className="space-y-2 text-gray-300">
          <li>✓ Type a command or use voice input</li>
          <li>✓ Commands are case-insensitive</li>
          <li>✓ Use aliases for shorter commands</li>
          <li>✓ Browse all 444 commands by category</li>
          <li>✓ Voice recognition works in modern browsers</li>
          <li>✓ Admin commands require elevated privileges</li>
        </ul>
      </Card>
    </div>
  );
}
