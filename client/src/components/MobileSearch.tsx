import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/useMobile';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  icon: string;
}

export function MobileSearch() {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'Mining Dashboard',
      description: 'View real-time mining stats',
      category: 'Mining',
      url: '/miner-dashboard',
      icon: '⛏️',
    },
    {
      id: '2',
      title: 'Trading Terminal',
      description: 'Trade cryptocurrencies',
      category: 'Trading',
      url: '/trading',
      icon: '📈',
    },
    {
      id: '3',
      title: 'Social Feed',
      description: 'Connect with community',
      category: 'Social',
      url: '/social',
      icon: '💬',
    },
    {
      id: '4',
      title: 'Marketplace',
      description: 'Buy and sell items',
      category: 'Marketplace',
      url: '/marketplace',
      icon: '🛍️',
    },
    {
      id: '5',
      title: 'Gaming Hub',
      description: 'Play and earn rewards',
      category: 'Gaming',
      url: '/gaming',
      icon: '🎮',
    },
  ];

  // Handle search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const filtered = mockResults.filter(r =>
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.description.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation (mobile)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        window.location.href = results[selectedIndex].url;
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Handle swipe gestures
  const handleTouchStart = useRef<number>(0);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = handleTouchStart.current - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swiped left - next result
        setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1));
      } else {
        // Swiped right - previous result
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
      }
    }
  };

  if (!isMobile) return null;

  return (
    <>
      {/* Search trigger button */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="w-full justify-start text-muted-foreground"
        >
          <Search className="w-4 h-4 mr-2" />
          <span className="text-xs">Search...</span>
        </Button>
      )}

      {/* Search overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          {/* Header */}
          <div className="sticky top-0 p-4 border-b bg-background">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search features..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none text-base"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setQuery('');
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="overflow-y-auto pb-20">
            {results.length === 0 && query ? (
              <div className="p-8 text-center text-muted-foreground">
                No results for "{query}"
              </div>
            ) : results.length === 0 ? (
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-4">Popular features</p>
                <div className="space-y-2">
                  {mockResults.slice(0, 5).map((result, idx) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        window.location.href = result.url;
                        setIsOpen(false);
                      }}
                      className="w-full p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{result.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{result.title}</div>
                          <div className="text-xs text-muted-foreground">{result.description}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {results.map((result, idx) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      window.location.href = result.url;
                      setIsOpen(false);
                    }}
                    onTouchStart={(e) => {
                      handleTouchStart.current = e.touches[0].clientX;
                    }}
                    onTouchEnd={handleTouchEnd}
                    className={`w-full p-4 rounded-lg transition-colors text-left ${
                      selectedIndex === idx
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{result.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{result.title}</div>
                        <div className="text-xs opacity-75">{result.description}</div>
                      </div>
                      {selectedIndex === idx && (
                        <Zap className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer hints */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-muted/50 border-t text-xs text-muted-foreground text-center">
            <div className="flex justify-center gap-4">
              <span>↑↓ to navigate</span>
              <span>↵ to open</span>
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Mobile command palette
export function MobileCommandPalette() {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (!isMobile) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-center"
      >
        <Zap className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="w-full bg-background rounded-t-2xl p-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Quick Actions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { title: 'Start Mining', icon: '⛏️', action: () => window.location.href = '/miner-dashboard' },
                { title: 'Trade', icon: '📈', action: () => window.location.href = '/trading' },
                { title: 'Social', icon: '💬', action: () => window.location.href = '/social' },
                { title: 'Gaming', icon: '🎮', action: () => window.location.href = '/gaming' },
                { title: 'Marketplace', icon: '🛍️', action: () => window.location.href = '/marketplace' },
                { title: 'Governance', icon: '🗳️', action: () => window.location.href = '/governance' },
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    action.action();
                    setIsOpen(false);
                  }}
                  className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">{action.icon}</div>
                  <div className="text-xs font-medium">{action.title}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
