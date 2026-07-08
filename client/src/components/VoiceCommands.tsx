import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';

export function VoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
            return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          handleVoiceCommand(transcript);
        } else {
          interim += transcript;
        }
      }
      setTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      toast.error(`Speech error: ${event.error}`);
    };

    const handleVoiceCommand = (command: string) => {
      const cmd = command.toLowerCase().trim();
      
      if (cmd.includes('navigate')) {
        const page = cmd.split('to')[1]?.trim() || 'home';
        window.location.href = `/${page}`;
      } else if (cmd.includes('search')) {
        const query = cmd.split('for')[1]?.trim() || '';
        window.location.href = `/search?q=${query}`;
      } else if (cmd.includes('help')) {
        toast.info('Available commands: navigate, search, buy, sell, trade');
      }
      
      setTranscript('');
    };

    return () => {
      recognition.abort();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        onClick={toggleListening}
        className={`p-4 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white shadow-lg`}
      >
        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
      </button>
      {transcript && (
        <div className="absolute bottom-20 right-0 bg-black text-white p-3 rounded-lg max-w-xs">
          {transcript}
        </div>
      )}
    </div>
  );
}
