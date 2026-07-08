import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, TrendingUp, Clock, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'feature' | 'content' | 'user' | 'transaction' | 'help';
  icon: string;
  url: string;
  timestamp?: string;
}

export function UniversalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    const trimmedQuery = searchQuery.trim();

    setIsLoading(true);
    try {
      // Simulate search results - replace with actual API call
      const mockResults: SearchResult[] = ([
        {
          id: '1',
          title: 'Mining Dashboard',
          description: 'View real-time mining stats and earnings',
          category: 'feature',
          icon: '⛏️',
          url: '/miner-dashboard',
        },
        {
          id: '2',
          title: 'Trading Terminal',
          description: 'Advanced crypto trading interface',
          category: 'feature',
          icon: '📈',
          url: '/trading',
        },
        {
          id: '3',
          title: 'Social Feed',
          description: 'Connect with community members',
          category: 'feature',
          icon: '💬',
          url: '/social',
        },
        {
          id: '4',
          title: 'Marketplace',
          description: 'Buy and sell items with escrow',
          category: 'feature',
          icon: '🛍️',
          url: '/marketplace',
        },
        {
          id: '5',
          title: 'Governance',
          description: 'Vote on platform proposals',
          category: 'feature',
          icon: '🗳️',
          url: '/governance',
        },
      ] as const) as SearchResult[];
      
      const filtered = mockResults.filter(r => 
        r.title.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(trimmedQuery.toLowerCase())
      );

      setResults(filtered);
      setSelectedIndex(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    // Add to search history
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));

    // Navigate to result
    window.location.href = result.url;
    setIsOpen(false);
  };

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
        handleSelectResult(results[selectedIndex]);
      }
    }
  };

  return (
    <>
      {/* Search Button in Header */}
      <Button
        variant="outline"
        size="sm"
        className="w-full max-w-xs"
        onClick={() => setIsOpen(true)}
      >
        <Search className="w-4 h-4 mr-2" />
        <span className="text-muted-foreground">Search...</span>
        <kbd className="ml-auto text-xs text-muted-foreground">⌘K</kbd>
      </Button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
          <Card className="w-full max-w-2xl shadow-lg">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Search features, content, users..."
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading && (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}

              {!isLoading && query && results.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No results found for "{query}"
                </div>
              )}

              {!isLoading && !query && searchHistory.length > 0 && (
                <div className="p-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-3 flex items-center">
                    <Clock className="w-3 h-3 mr-2" />
                    Recent Searches
                  </div>
                  <div className="space-y-2">
                    {searchHistory.map((item, idx) => (
                      <Button
                        key={idx}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleSearch(item)}
                      >
                        <Clock className="w-3 h-3 mr-2" />
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {!isLoading && !query && (
                <div className="p-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-3 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-2" />
                    Popular Features
                  </div>
                  <div className="space-y-2">
                    {[
                      { title: 'Mining Dashboard', icon: '⛏️' },
                      { title: 'Trading Terminal', icon: '📈' },
                      { title: 'Social Feed', icon: '💬' },
                      { title: 'Marketplace', icon: '🛍️' },
                    ].map((item, idx) => (
                      <Button
                        key={idx}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleSearch(item.title)}
                      >
                        <span className="mr-2">{item.icon}</span>
                        {item.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {!isLoading && query && results.length > 0 && (
                <div className="p-2">
                  {results.map((result, idx) => (
                    <Button
                      key={result.id}
                      variant={selectedIndex === idx ? 'secondary' : 'ghost'}
                      className="w-full justify-start mb-1"
                      onClick={() => handleSelectResult(result)}
                    >
                      <span className="mr-3 text-lg">{result.icon}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{result.title}</div>
                        <div className="text-xs text-muted-foreground">{result.description}</div>
                      </div>
                      <Badge variant="outline" className="ml-2">{result.category}</Badge>
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground flex justify-between">
              <div>
                <kbd className="px-2 py-1 bg-background rounded border">↑↓</kbd> to navigate
                <kbd className="px-2 py-1 bg-background rounded border ml-2">↵</kbd> to select
                <kbd className="px-2 py-1 bg-background rounded border ml-2">esc</kbd> to close
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
