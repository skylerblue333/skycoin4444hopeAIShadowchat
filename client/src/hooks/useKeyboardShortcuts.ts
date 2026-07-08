import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = () => {
  const [, navigate] = useLocation();

  const shortcuts: KeyboardShortcut[] = [
    // Service shortcuts (Cmd/Ctrl + 1-6)
    {
      key: '1',
      metaKey: true,
      action: () => navigate('/mining'),
      description: 'Go to Mining',
    },
    {
      key: '2',
      metaKey: true,
      action: () => navigate('/trading'),
      description: 'Go to Trading',
    },
    {
      key: '3',
      metaKey: true,
      action: () => navigate('/social'),
      description: 'Go to Social',
    },
    {
      key: '4',
      metaKey: true,
      action: () => navigate('/gaming'),
      description: 'Go to Gaming',
    },
    {
      key: '5',
      metaKey: true,
      action: () => navigate('/marketplace'),
      description: 'Go to Marketplace',
    },
    {
      key: '6',
      metaKey: true,
      action: () => navigate('/governance'),
      description: 'Go to Governance',
    },

    // Global shortcuts
    {
      key: 'k',
      metaKey: true,
      action: () => {
        const event = new CustomEvent('open-command-palette');
        window.dispatchEvent(event);
      },
      description: 'Open Command Palette',
    },
    {
      key: '/',
      metaKey: true,
      action: () => {
        const event = new CustomEvent('focus-search');
        window.dispatchEvent(event);
      },
      description: 'Focus Search',
    },
    {
      key: 'h',
      metaKey: true,
      action: () => navigate('/'),
      description: 'Go to Home',
    },
    {
      key: 'p',
      metaKey: true,
      action: () => navigate('/profile'),
      description: 'Go to Profile',
    },
    {
      key: 's',
      metaKey: true,
      action: () => navigate('/settings'),
      description: 'Go to Settings',
    },

    // Navigation shortcuts
    {
      key: 'ArrowLeft',
      altKey: true,
      action: () => window.history.back(),
      description: 'Go Back',
    },
    {
      key: 'ArrowRight',
      altKey: true,
      action: () => window.history.forward(),
      description: 'Go Forward',
    },

    // Action shortcuts
    {
      key: 'n',
      metaKey: true,
      action: () => {
        const event = new CustomEvent('new-item');
        window.dispatchEvent(event);
      },
      description: 'New Item',
    },
    {
      key: 'e',
      metaKey: true,
      action: () => {
        const event = new CustomEvent('edit-item');
        window.dispatchEvent(event);
      },
      description: 'Edit Item',
    },
    {
      key: 'd',
      metaKey: true,
      action: () => {
        const event = new CustomEvent('delete-item');
        window.dispatchEvent(event);
      },
      description: 'Delete Item',
    },

    // Help
    {
      key: '?',
      action: () => {
        const event = new CustomEvent('show-help');
        window.dispatchEvent(event);
      },
      description: 'Show Help',
    },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = (event.ctrlKey || event.metaKey) === (shortcut.ctrlKey || shortcut.metaKey);
        const shiftMatch = event.shiftKey === (shortcut.shiftKey || false);
        const altMatch = event.altKey === (shortcut.altKey || false);

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, navigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
};

export default useKeyboardShortcuts;
