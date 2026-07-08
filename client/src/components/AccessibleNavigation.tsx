import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface AccessibleNavItem {
  label: string;
  href: string;
  children?: AccessibleNavItem[];
  ariaLabel?: string;
}

interface AccessibleNavigationProps {
  items: AccessibleNavItem[];
  onNavigate?: (path: string) => void;
}

export const AccessibleNavigation: React.FC<AccessibleNavigationProps> = ({
  items,
  onNavigate,
}) => {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement>>({});

  // Handle keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    itemLabel: string,
    hasChildren: boolean
  ) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (hasChildren && !expandedMenus.has(itemLabel)) {
          setExpandedMenus((prev) => new Set([...prev, itemLabel]));
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (hasChildren && expandedMenus.has(itemLabel)) {
          setExpandedMenus((prev) => {
            const newSet = new Set(prev);
            newSet.delete(itemLabel);
            return newSet;
          });
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (hasChildren) {
          setExpandedMenus((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(itemLabel)) {
              newSet.delete(itemLabel);
            } else {
              newSet.add(itemLabel);
            }
            return newSet;
          });
        }
        break;

      case 'Escape':
        e.preventDefault();
        setExpandedMenus(new Set());
        break;

      case 'Home':
        e.preventDefault();
        setFocusedItem(items[0]?.label || null);
        break;

      case 'End':
        e.preventDefault();
        setFocusedItem(items[items.length - 1]?.label || null);
        break;

      default:
        break;
    }
  };

  const handleItemClick = (href: string) => {
    window.location.href = href;
    onNavigate?.(href);
  };

  const renderNavItem = (item: AccessibleNavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.has(item.label);
    const isFocused = focusedItem === item.label;

    return (
      <div key={item.label} className="relative">
        <button
          ref={(el) => {
            if (el) menuRefs.current[item.label] = el as any;
          }}
          onClick={() => {
            if (!hasChildren) {
              handleItemClick(item.href);
            }
          }}
          onKeyDown={(e) => handleKeyDown(e, item.label, hasChildren || false)}
          onFocus={() => setFocusedItem(item.label)}
          onBlur={() => setFocusedItem(null)}
          aria-expanded={hasChildren ? isExpanded : false}
          aria-haspopup={hasChildren ? 'true' : 'false'}
          aria-label={item.ariaLabel || item.label}
          className={`
            w-full px-4 py-2 text-left rounded-md transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            hover:bg-accent hover:text-accent-foreground
            ${isFocused ? 'bg-accent text-accent-foreground' : ''}
            ${level > 0 ? 'text-sm' : 'font-medium'}
            flex items-center justify-between
          `}
        >
          <span>{item.label}</span>
          {hasChildren && (
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          )}
        </button>

        {/* Submenu */}
        {hasChildren && isExpanded && (
          <div
            className="pl-4 space-y-1 mt-1"
            role="region"
            aria-label={`${item.label} submenu`}
          >
            {item.children!.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav
      className="space-y-1"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:block focus:p-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      {/* Navigation items */}
      {items.map((item) => renderNavItem(item))}

      {/* Keyboard shortcuts help */}
      <details className="mt-4 pt-4 border-t border-border">
        <summary className="flex items-center gap-2 cursor-pointer hover:text-foreground text-muted-foreground transition-colors">
          <HelpCircle className="w-4 h-4" />
          <span>Keyboard shortcuts</span>
        </summary>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <kbd className="px-2 py-1 bg-muted rounded">↑ ↓</kbd>
            <span>Navigate menu</span>
          </div>
          <div className="flex justify-between">
            <kbd className="px-2 py-1 bg-muted rounded">Enter</kbd>
            <span>Expand/collapse</span>
          </div>
          <div className="flex justify-between">
            <kbd className="px-2 py-1 bg-muted rounded">Esc</kbd>
            <span>Close menu</span>
          </div>
          <div className="flex justify-between">
            <kbd className="px-2 py-1 bg-muted rounded">Home</kbd>
            <span>First item</span>
          </div>
          <div className="flex justify-between">
            <kbd className="px-2 py-1 bg-muted rounded">End</kbd>
            <span>Last item</span>
          </div>
        </div>
      </details>
    </nav>
  );
};

// Screen reader only text utility
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <span className="sr-only">{children}</span>
);

// Accessible skip links
export const SkipLinks: React.FC = () => (
  <div className="sr-only focus-within:not-sr-only">
    <a
      href="#main-content"
      className="block p-2 bg-primary text-primary-foreground rounded-md m-2"
    >
      Skip to main content
    </a>
    <a
      href="#navigation"
      className="block p-2 bg-primary text-primary-foreground rounded-md m-2"
    >
      Skip to navigation
    </a>
    <a
      href="#footer"
      className="block p-2 bg-primary text-primary-foreground rounded-md m-2"
    >
      Skip to footer
    </a>
  </div>
);

// Accessible focus management
export const useFocusManagement = (elementRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // Manage focus within modal/dialog
        const focusableElements = elementRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    elementRef.current?.addEventListener('keydown', handleKeyDown);
    return () => elementRef.current?.removeEventListener('keydown', handleKeyDown);
  }, [elementRef]);
};

export default AccessibleNavigation;
