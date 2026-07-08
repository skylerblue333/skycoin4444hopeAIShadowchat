import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Service {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
  description: string;
  color: string;
}

export interface GlobalNavigationContextType {
  currentService: Service | null;
  setCurrentService: (service: Service) => void;
  services: Service[];
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  globalNotifications: number;
  setGlobalNotifications: (count: number) => void;
  recentlyVisited: string[];
  addToRecentlyVisited: (path: string) => void;
  favorites: string[];
  toggleFavorite: (path: string) => void;
}

const GlobalNavigationContext = createContext<GlobalNavigationContextType | undefined>(undefined);

export const SERVICES: Service[] = [
  {
    id: 'mining',
    name: 'Mining',
    icon: '⛏️',
    path: '/mining',
    description: 'Cryptocurrency mining operations',
    color: '#FF6B6B',
  },
  {
    id: 'trading',
    name: 'Trading',
    icon: '📈',
    path: '/trading',
    description: 'Buy, sell, and trade crypto',
    color: '#4ECDC4',
  },
  {
    id: 'social',
    name: 'Social',
    icon: '💬',
    path: '/social',
    description: 'Connect with community',
    color: '#FFE66D',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    path: '/gaming',
    description: 'Play games and earn rewards',
    color: '#95E1D3',
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    icon: '🛒',
    path: '/marketplace',
    description: 'Buy and sell items',
    color: '#F38181',
  },
  {
    id: 'governance',
    name: 'Governance',
    icon: '🗳️',
    path: '/governance',
    description: 'Vote and propose changes',
    color: '#AA96DA',
  },
];

export const GlobalNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentService, setCurrentService] = useState<Service | null>(SERVICES[0]);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalNotifications, setGlobalNotifications] = useState(0);
  const [recentlyVisited, setRecentlyVisited] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const addToRecentlyVisited = useCallback((path: string) => {
    setRecentlyVisited((prev) => {
      const filtered = prev.filter((p) => p !== path);
      return [path, ...filtered].slice(0, 10);
    });
  }, []);

  const toggleFavorite = useCallback((path: string) => {
    setFavorites((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  }, []);

  const value: GlobalNavigationContextType = {
    currentService,
    setCurrentService,
    services: SERVICES,
    globalSearchQuery,
    setGlobalSearchQuery,
    globalNotifications,
    setGlobalNotifications,
    recentlyVisited,
    addToRecentlyVisited,
    favorites,
    toggleFavorite,
  };

  return (
    <GlobalNavigationContext.Provider value={value}>
      {children}
    </GlobalNavigationContext.Provider>
  );
};

export const useGlobalNavigation = () => {
  const context = useContext(GlobalNavigationContext);
  if (!context) {
    throw new Error('useGlobalNavigation must be used within GlobalNavigationProvider');
  }
  return context;
};

// Service Switcher Component
export const ServiceSwitcher: React.FC = () => {
  const { currentService, setCurrentService, services } = useGlobalNavigation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
      >
        <span className="text-2xl">{currentService?.icon}</span>
        <span className="font-medium">{currentService?.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-lg z-50">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => {
                setCurrentService(service);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-b-0 ${
                currentService?.id === service.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{service.icon}</span>
                <div>
                  <div className="font-medium">{service.name}</div>
                  <div className="text-xs text-muted-foreground">{service.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlobalNavigationContext;
