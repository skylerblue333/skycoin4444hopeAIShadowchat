import { useState, useCallback, useRef, useEffect } from 'react';

export interface AudioNarrationConfig {
  enabled: boolean;
  volume: number;
  speed: number;
  voice: 'male' | 'female' | 'neutral';
  autoPlay: boolean;
  language: string;
}

export interface AudioSegment {
  id: string;
  text: string;
  context?: string;
  priority?: 'high' | 'medium' | 'low';
  duration?: number;
}

export const useAudioNarration = () => {
  const [config, setConfig] = useState<AudioNarrationConfig>({
    enabled: true,
    volume: 0.8,
    speed: 1,
    voice: 'neutral',
    autoPlay: false,
    language: 'en-US',
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechSynthesisUtterance =
        window.SpeechSynthesisUtterance ||
        (window as any).webkitSpeechSynthesisUtterance;
      const speechSynthesis =
        window.speechSynthesis || (window as any).webkitSpeechSynthesis;

      if (SpeechSynthesisUtterance && speechSynthesis) {
        synthRef.current = speechSynthesis;
      }
    }
  }, []);

  // Load configuration from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('audioNarrationConfig');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
              }
    }
  }, []);

  // Save configuration to localStorage
  const updateConfig = useCallback((newConfig: Partial<AudioNarrationConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('audioNarrationConfig', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Speak text using Web Speech API
  const speak = useCallback(
    async (segment: AudioSegment) => {
      if (!config.enabled || !synthRef.current) return;

      // Cancel any ongoing speech
      if (synthRef.current.speaking) {
        synthRef.current.cancel();
      }

      try {
        const utterance = new (window.SpeechSynthesisUtterance ||
          (window as any).webkitSpeechSynthesisUtterance)(segment.text);

        utterance.rate = config.speed;
        utterance.volume = config.volume;
        utterance.lang = config.language;

        // Select voice based on config
        const voices = synthRef.current.getVoices();
        if (voices.length > 0) {
          const selectedVoice = voices.find(v => {
            if (config.voice === 'male') return v.name.includes('Male');
            if (config.voice === 'female') return v.name.includes('Female');
            return true;
          }) || voices[0];
          utterance.voice = selectedVoice;
        }

        utterance.onstart = () => {
          setIsPlaying(true);
          setCurrentAudio(segment.id);
        };

        utterance.onend = () => {
          setIsPlaying(false);
          setCurrentAudio(null);
        };

        utterance.onerror = (event) => {
                    setIsPlaying(false);
          setCurrentAudio(null);
        };

        utteranceRef.current = utterance;
        synthRef.current.speak(utterance);
      } catch (error) {
              }
    },
    [config, synthRef]
  );

  // Stop current audio
  const stop = useCallback(() => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  }, []);

  // Pause current audio
  const pause = useCallback(() => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Resume paused audio
  const resume = useCallback(() => {
    if (synthRef.current && synthRef.current.paused) {
      synthRef.current.resume();
      setIsPlaying(true);
    }
  }, []);

  // Toggle audio narration
  const toggleAudio = useCallback(() => {
    updateConfig({ enabled: !config.enabled });
    if (config.enabled && synthRef.current?.speaking) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  }, [config.enabled, updateConfig]);

  return {
    config,
    updateConfig,
    speak,
    stop,
    pause,
    resume,
    toggleAudio,
    isPlaying,
    currentAudio,
  };
};

export default useAudioNarration;
