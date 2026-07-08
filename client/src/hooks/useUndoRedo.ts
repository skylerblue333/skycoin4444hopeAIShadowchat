import { useState, useCallback, useEffect } from 'react';

export interface UndoableAction {
  id: string;
  name: string;
  timestamp: number;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
  category: 'mining' | 'trading' | 'social' | 'marketplace' | 'governance' | 'other';
}

export function useUndoRedo(maxHistorySize = 50) {
  const [history, setHistory] = useState<UndoableAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isUndoing, setIsUndoing] = useState(false);

  // Add action to history
  const addAction = useCallback((action: UndoableAction) => {
    setHistory(prev => {
      // Remove any "future" actions if we're adding a new action
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(action);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  }, [currentIndex, maxHistorySize]);

  // Undo action (Cmd+Z)
  const undo = useCallback(async () => {
    if (currentIndex <= 0) return;
    
    setIsUndoing(true);
    try {
      const action = history[currentIndex];
      if (action) {
        await action.undo();
      }
      setCurrentIndex(prev => prev - 1);
    } catch (error) {
          } finally {
      setIsUndoing(false);
    }
  }, [currentIndex, history]);

  // Redo action (Cmd+Shift+Z)
  const redo = useCallback(async () => {
    if (currentIndex >= history.length - 1) return;
    
    setIsUndoing(true);
    try {
      const action = history[currentIndex + 1];
      if (action) {
        await action.redo();
      }
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
          } finally {
      setIsUndoing(false);
    }
  }, [currentIndex, history]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  // Get current action
  const getCurrentAction = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < history.length) {
      return history[currentIndex];
    }
    return null;
  }, [currentIndex, history]);

  // Get history stats
  const getStats = useCallback(() => ({
    totalActions: history.length,
    currentIndex,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    undoAction: currentIndex >= 0 ? history[currentIndex]?.name : null,
    redoAction: currentIndex + 1 < history.length ? history[currentIndex + 1]?.name : null,
  }), [currentIndex, history]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'z' && e.shiftKey || e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    addAction,
    undo,
    redo,
    clearHistory,
    getCurrentAction,
    getStats,
    isUndoing,
    history,
    currentIndex,
  };
}

// Global undo/redo store for cross-component usage
let globalHistory: UndoableAction[] = [];
let globalIndex = -1;

export function useGlobalUndoRedo() {
  const [, setRefresh] = useState({});

  const addAction = useCallback((action: UndoableAction) => {
    globalHistory = globalHistory.slice(0, globalIndex + 1);
    globalHistory.push(action);
    globalIndex = globalHistory.length - 1;
    setRefresh({});
  }, []);

  const undo = useCallback(async () => {
    if (globalIndex <= 0) return;
    const action = globalHistory[globalIndex];
    if (action) {
      await action.undo();
    }
    globalIndex--;
    setRefresh({});
  }, []);

  const redo = useCallback(async () => {
    if (globalIndex >= globalHistory.length - 1) return;
    globalIndex++;
    const action = globalHistory[globalIndex];
    if (action) {
      await action.redo();
    }
    setRefresh({});
  }, []);

  return {
    addAction,
    undo,
    redo,
    canUndo: globalIndex > 0,
    canRedo: globalIndex < globalHistory.length - 1,
    undoAction: globalIndex >= 0 ? globalHistory[globalIndex]?.name : null,
    redoAction: globalIndex + 1 < globalHistory.length ? globalHistory[globalIndex + 1]?.name : null,
  };
}
