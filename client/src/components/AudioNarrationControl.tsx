import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Play, Pause, Square, Settings } from 'lucide-react';
import { useAudioNarration, AudioNarrationConfig } from '@/hooks/useAudioNarration';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export const AudioNarrationControl: React.FC = () => {
  const { config, updateConfig, toggleAudio, isPlaying, pause, resume, stop } = useAudioNarration();
  const [showSettings, setShowSettings] = useState(false);

  const handleVolumeChange = (value: number[]) => {
    updateConfig({ volume: value[0] / 100 });
  };

  const handleSpeedChange = (value: number[]) => {
    updateConfig({ speed: value[0] / 100 });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Main Audio Control */}
      <div className="bg-gradient-to-r from-pink-500 to-orange-500 rounded-full shadow-lg p-4 flex items-center gap-3">
        {/* Audio Toggle */}
        <Button
          onClick={toggleAudio}
          size="sm"
          className={`rounded-full w-12 h-12 p-0 ${
            config.enabled
              ? 'bg-white text-pink-500 hover:bg-gray-100'
              : 'bg-gray-400 text-white hover:bg-gray-500'
          }`}
          title={config.enabled ? 'Disable audio narration' : 'Enable audio narration'}
        >
          {config.enabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </Button>

        {/* Playback Controls (shown when audio is enabled) */}
        {config.enabled && (
          <div className="flex items-center gap-2">
            {!isPlaying ? (
              <Button
                onClick={resume}
                size="sm"
                className="rounded-full w-10 h-10 p-0 bg-white text-pink-500 hover:bg-gray-100"
                title="Play audio"
              >
                <Play className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={pause}
                size="sm"
                className="rounded-full w-10 h-10 p-0 bg-white text-pink-500 hover:bg-gray-100"
                title="Pause audio"
              >
                <Pause className="w-4 h-4" />
              </Button>
            )}

            {isPlaying && (
              <Button
                onClick={stop}
                size="sm"
                className="rounded-full w-10 h-10 p-0 bg-white text-pink-500 hover:bg-gray-100"
                title="Stop audio"
              >
                <Square className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Settings Menu */}
        <DropdownMenu open={showSettings} onOpenChange={setShowSettings}>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="rounded-full w-10 h-10 p-0 bg-white text-pink-500 hover:bg-gray-100"
              title="Audio settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-slate-800 border-slate-700">
            <DropdownMenuLabel className="text-white">Audio Settings</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-700" />

            {/* Volume Control */}
            <div className="px-4 py-3 space-y-2">
              <label className="text-sm text-gray-300">Volume: {Math.round(config.volume * 100)}%</label>
              <Slider
                value={[config.volume * 100]}
                onValueChange={handleVolumeChange}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Speed Control */}
            <div className="px-4 py-3 space-y-2">
              <label className="text-sm text-gray-300">Speed: {(config.speed * 100).toFixed(0)}%</label>
              <Slider
                value={[config.speed * 100]}
                onValueChange={handleSpeedChange}
                min={50}
                max={200}
                step={10}
                className="w-full"
              />
            </div>

            <DropdownMenuSeparator className="bg-slate-700" />

            {/* Voice Selection */}
            <DropdownMenuLabel className="text-white text-xs px-4 py-2">Voice</DropdownMenuLabel>
            {(['male', 'female', 'neutral'] as const).map(voice => (
              <DropdownMenuItem
                key={voice}
                onClick={() => updateConfig({ voice })}
                className={`cursor-pointer ${config.voice === voice ? 'bg-pink-500/20' : ''}`}
              >
                <span className="capitalize text-gray-300">{voice}</span>
                {config.voice === voice && <span className="ml-auto text-pink-400">✓</span>}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator className="bg-slate-700" />

            {/* Language Selection */}
            <DropdownMenuLabel className="text-white text-xs px-4 py-2">Language</DropdownMenuLabel>
            {[
              { code: 'en-US', label: 'English (US)' },
              { code: 'en-GB', label: 'English (UK)' },
              { code: 'es-ES', label: 'Spanish' },
              { code: 'fr-FR', label: 'French' },
              { code: 'de-DE', label: 'German' },
              { code: 'ja-JP', label: 'Japanese' },
              { code: 'zh-CN', label: 'Chinese (Simplified)' },
            ].map(lang => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => updateConfig({ language: lang.code })}
                className={`cursor-pointer text-sm ${config.language === lang.code ? 'bg-pink-500/20' : ''}`}
              >
                <span className="text-gray-300">{lang.label}</span>
                {config.language === lang.code && <span className="ml-auto text-pink-400">✓</span>}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator className="bg-slate-700" />

            {/* Auto-Play Toggle */}
            <div className="px-4 py-3 flex items-center justify-between">
              <label className="text-sm text-gray-300">Auto-play narration</label>
              <input
                type="checkbox"
                checked={config.autoPlay}
                onChange={e => updateConfig({ autoPlay: e.target.checked })}
                className="w-4 h-4 rounded cursor-pointer"
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Indicator */}
      {isPlaying && (
        <div className="absolute -top-8 right-0 bg-slate-800 text-white text-xs px-3 py-1 rounded-full border border-slate-700">
          🎙️ Narration active
        </div>
      )}
    </div>
  );
};

export default AudioNarrationControl;
