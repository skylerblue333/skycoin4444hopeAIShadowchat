import React from 'react';
import { useVoiceNav } from '../hooks/useVoiceNav';
import { Button } from './ui/button';
import { Mic, MicOff } from 'lucide-react';

export function VoiceNavBar() {
  const { isListening, transcript, startListening, stopListening, commands } = useVoiceNav();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-xs">
      {/* Voice Status Display */}
      {(isListening || transcript) && (
        <div className="bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg p-4 text-white shadow-lg">
          <div className="text-sm font-semibold mb-1">
            {isListening ? '🎤 Listening...' : '✓ Command Processed'}
          </div>
          <div className="text-xs opacity-90">{transcript}</div>
        </div>
      )}

      {/* Voice Control Button */}
      <Button
        onClick={isListening ? stopListening : startListening}
        className={`rounded-full w-16 h-16 p-0 flex items-center justify-center shadow-lg transition-all ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700'
        }`}
        title={isListening ? 'Stop listening' : 'Start voice commands'}
      >
        {isListening ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </Button>

      {/* Voice Commands Help */}
      <details className="bg-gray-900 rounded-lg p-3 text-white text-xs border border-cyan-500/30">
        <summary className="cursor-pointer font-semibold mb-2 hover:text-cyan-400">
          📋 Voice Commands
        </summary>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {commands.slice(0, 8).map((cmd, i) => (
            <div key={i} className="text-gray-300">
              • {cmd.description}
            </div>
          ))}
          <div className="text-gray-400 italic mt-2">+ {commands.length - 8} more commands...</div>
        </div>
      </details>
    </div>
  );
}
