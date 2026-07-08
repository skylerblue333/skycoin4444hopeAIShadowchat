import React, { createContext, useContext, ReactNode } from 'react';
import { useAudioNarration, AudioNarrationConfig, AudioSegment } from '@/hooks/useAudioNarration';

interface AudioNarrationContextType {
  config: AudioNarrationConfig;
  updateConfig: (config: Partial<AudioNarrationConfig>) => void;
  speak: (segment: AudioSegment) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  toggleAudio: () => void;
  isPlaying: boolean;
  currentAudio: string | null;
}

const AudioNarrationContext = createContext<AudioNarrationContextType | undefined>(undefined);

export const AudioNarrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const audioNarration = useAudioNarration();

  return (
    <AudioNarrationContext.Provider value={audioNarration}>
      {children}
    </AudioNarrationContext.Provider>
  );
};

export const useAudioNarrationContext = () => {
  const context = useContext(AudioNarrationContext);
  if (!context) {
    throw new Error('useAudioNarrationContext must be used within AudioNarrationProvider');
  }
  return context;
};

export default AudioNarrationContext;
