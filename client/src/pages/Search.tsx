import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Search as SearchIcon, Clock, TrendingUp, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// PAGE_INDEX will be loaded dynamically
const pageIndex = { pages: [], total: 1062, categories: {} } as any;

interface SearchResult {
  page: string;
  category: string;
  url: string;
  relevance: number;
}

function pageToUrl(page: string) {
  if (page === 'Home') return '/';
  return '/' + page.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();
}

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const performSearch = (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowerTerm = term.toLowerCase();

    pageIndex.pages.forEach(page => {
      const lowerPage = page.toLowerCase();
      const category = page.split(/(?=[A-Z])/)[0] || 'Other';

      if (lowerPage.includes(lowerTerm)) {
        let relevance = 0;
        if (lowerPage === lowerTerm) relevance = 100;
        else if (lowerPage.startsWith(lowerTerm)) relevance = 80;
        else if (lowerPage.includes(lowerTerm)) relevance = 60;

        searchResults.push({
          page,
          category,
          url: pageToUrl(page),
          relevance,
        });
      }
    });

    setResults(searchResults.sort((a, b) => b.relevance - a.relevance));

    if (term.trim() && !recentSearches.includes(term)) {
      const updated = [term, ...recentSearches].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    performSearch(term);
  };

  const popularPages = ['Trading', 'Portfolio', 'Wallet', 'Feed', 'Marketplace', 'Games', 'Courses', 'AiBrain'].filter(p => pageIndex.pages.includes(p));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent mb-6">
            Discover Pages
          </h1>
          <div className="relative">
            <SearchIcon className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Search across 1,062 pages..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="pl-12 py-3 bg-slate-800 border-slate-700 text-white text-lg"
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {searchTerm ? (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </h2>
            {results.length === 0 ? (
              <Card className="p-12 text-center border-slate-800">
                <p className="text-slate-400 text-lg">No pages found matching "{searchTerm}"</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {results.map(result => (
                  <Link key={result.page} href={result.url}>
                    <Card className="p-4 border-slate-800 hover:border-pink-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white font-semibold group-hover:text-pink-400 transition-colors">
                            {result.page}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {result.category} • {result.url}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-pink-500">
                            {result.relevance}%
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {recentSearches.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-500" />
                  Recent Searches
                </h2>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(search => (
                    <Button
                      key={search}
                      variant="outline"
                      onClick={() => handleSearch(search)}
                      className="border-slate-700 hover:border-pink-500/50"
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-pink-500" />
                Popular Pages
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {popularPages.map(page => (
                  <Link key={page} href={pageToUrl(page)}>
                    <Card className="p-4 border-slate-800 hover:border-pink-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-semibold group-hover:text-pink-400 transition-colors">
                          {page}
                        </p>
                        <Star className="w-4 h-4 text-yellow-500" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
            <div className="text-center">
              <Link href="/sitemap">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90">
                  Browse All {pageIndex.total} Pages
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
