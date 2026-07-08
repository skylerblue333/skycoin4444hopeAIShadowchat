import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Search, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import pageIndex from '../../PAGE_INDEX.json';

export default function Sitemap() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredPages = useMemo(() => {
    if (!searchTerm) return pageIndex.pages;
    return pageIndex.pages.filter(page =>
      page.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const groupedPages = useMemo(() => {
    const groups: Record<string, string[]> = {};
    filteredPages.forEach(page => {
      const category = page.split(/(?=[A-Z])/)[0] || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(page);
    });
    return groups;
  }, [filteredPages]);

  const pageToUrl = (page: string) => {
    if (page === 'Home') return '/';
    return '/' + page.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent mb-4">
            Site Map
          </h1>
          <p className="text-slate-400 mb-6">
            Browse all {pageIndex.total} pages across {Object.keys(pageIndex.categories).length} categories
          </p>

          {/* Search Bar */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <Input
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="gap-2"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredPages.length === 0 ? (
          <Card className="p-12 text-center border-slate-800">
            <p className="text-slate-400 text-lg">No pages found matching "{searchTerm}"</p>
          </Card>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedPages).map(([category, pages]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded"></span>
                  {category}
                  <span className="text-sm text-slate-500 font-normal">({pages.length})</span>
                </h2>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pages.map(page => (
                      <Link key={page} href={pageToUrl(page)}>
                        <Card className="p-4 border-slate-800 hover:border-pink-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group">
                          <p className="text-white font-semibold group-hover:text-pink-400 transition-colors">
                            {page}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {pageToUrl(page)}
                          </p>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pages.map(page => (
                      <Link key={page} href={pageToUrl(page)}>
                        <div className="p-3 border border-slate-800 rounded hover:border-pink-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group">
                          <div className="flex items-center justify-between">
                            <p className="text-white font-semibold group-hover:text-pink-400 transition-colors">
                              {page}
                            </p>
                            <p className="text-xs text-slate-500">
                              {pageToUrl(page)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800 pt-8">
          <Card className="p-6 text-center border-slate-800">
            <p className="text-3xl font-bold text-pink-500">{pageIndex.total}</p>
            <p className="text-sm text-slate-400 mt-2">Total Pages</p>
          </Card>
          <Card className="p-6 text-center border-slate-800">
            <p className="text-3xl font-bold text-purple-500">{Object.keys(pageIndex.categories).length}</p>
            <p className="text-sm text-slate-400 mt-2">Categories</p>
          </Card>
          <Card className="p-6 text-center border-slate-800">
            <p className="text-3xl font-bold text-cyan-500">{filteredPages.length}</p>
            <p className="text-sm text-slate-400 mt-2">Matching Results</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
