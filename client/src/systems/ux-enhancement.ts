/**
 * UX Enhancement System
 * Phase 2: 100% Smoother User Experience
 */

// 1. Micro-interactions
export interface MicroInteraction {
  trigger: 'hover' | 'click' | 'focus' | 'scroll';
  animation: string;
  duration: number;
  easing: string;
}

export const MICRO_INTERACTIONS: Record<string, MicroInteraction> = {
  buttonHover: {
    trigger: 'hover',
    animation: 'scale(1.05)',
    duration: 150,
    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
  },
  buttonClick: {
    trigger: 'click',
    animation: 'scale(0.95)',
    duration: 100,
    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
  },
  inputFocus: {
    trigger: 'focus',
    animation: 'borderColor(primary)',
    duration: 200,
    easing: 'ease-out',
  },
  cardHover: {
    trigger: 'hover',
    animation: 'translateY(-4px) shadow(lg)',
    duration: 200,
    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
  },
};

// 2. Loading States
export interface LoadingState {
  type: 'skeleton' | 'spinner' | 'progress' | 'pulse';
  duration: number;
  message?: string;
}

export const LOADING_STATES: Record<string, LoadingState> = {
  pageSkeleton: {
    type: 'skeleton',
    duration: 300,
  },
  apiSpinner: {
    type: 'spinner',
    duration: 200,
  },
  fileUpload: {
    type: 'progress',
    duration: 500,
  },
  dataRefresh: {
    type: 'pulse',
    duration: 400,
  },
};

// 3. Gesture Support
export interface GestureHandler {
  swipeLeft: () => void;
  swipeRight: () => void;
  swipeUp: () => void;
  swipeDown: () => void;
  pinch: (scale: number) => void;
  longPress: () => void;
}

export class GestureRecognizer {
  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
    this.touchStartY = e.changedTouches[0].screenY;
  }

  onTouchEnd(e: TouchEvent, handlers: Partial<GestureHandler>) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.touchEndY = e.changedTouches[0].screenY;
    this.handleSwipe(handlers);
  }

  private handleSwipe(handlers: Partial<GestureHandler>) {
    const diffX = this.touchStartX - this.touchEndX;
    const diffY = this.touchStartY - this.touchEndY;
    const threshold = 50;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > threshold && handlers.swipeLeft) handlers.swipeLeft();
      if (diffX < -threshold && handlers.swipeRight) handlers.swipeRight();
    } else {
      if (diffY > threshold && handlers.swipeUp) handlers.swipeUp();
      if (diffY < -threshold && handlers.swipeDown) handlers.swipeDown();
    }
  }
}

// 4. Error Messages
export interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
  actionHandler?: () => void;
  severity: 'error' | 'warning' | 'info';
}

export const createErrorMessage = (
  error: Error,
  context?: string
): ErrorMessage => ({
  title: 'Something went wrong',
  message: error.message || 'An unexpected error occurred',
  severity: 'error',
  action: 'Try again',
  actionHandler: () => window.location.reload(),
});

// 5. Success Notifications
export interface SuccessNotification {
  message: string;
  icon?: string;
  duration: number;
  action?: string;
}

export const createSuccessNotification = (
  message: string
): SuccessNotification => ({
  message,
  icon: '✓',
  duration: 3000,
});

// 6. Tooltips
export interface Tooltip {
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  delay: number;
  maxWidth: number;
}

export const TOOLTIP_DEFAULTS: Tooltip = {
  content: '',
  position: 'top',
  delay: 500,
  maxWidth: 250,
};

// 7. Animations
export const ANIMATION_LIBRARY = {
  fadeIn: 'fade-in 0.3s ease-out',
  fadeOut: 'fade-out 0.3s ease-out',
  slideIn: 'slide-in 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
  slideOut: 'slide-out 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
  scaleIn: 'scale-in 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
  scaleOut: 'scale-out 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
  bounce: 'bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  shimmer: 'shimmer 2s infinite',
};

// 8. Page Transitions
export interface PageTransition {
  enter: string;
  exit: string;
  duration: number;
}

export const PAGE_TRANSITIONS: Record<string, PageTransition> = {
  default: {
    enter: 'fade-in',
    exit: 'fade-out',
    duration: 300,
  },
  slide: {
    enter: 'slide-in-right',
    exit: 'slide-out-left',
    duration: 400,
  },
  modal: {
    enter: 'scale-in',
    exit: 'scale-out',
    duration: 300,
  },
};

// 9. Focus Management
export class FocusManager {
  private previouslyFocused: HTMLElement | null = null;

  trap(element: HTMLElement) {
    this.previouslyFocused = document.activeElement as HTMLElement;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    element.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

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
    });

    firstElement.focus();
  }

  restore() {
    this.previouslyFocused?.focus();
  }
}

// 10. Haptic Feedback
export class HapticFeedback {
  static light() {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  static medium() {
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  }

  static heavy() {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }

  static pattern(pattern: number[]) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }
}

// 11. Voice Commands
export interface VoiceCommand {
  phrase: string;
  action: () => void;
  description: string;
}

export class VoiceCommandManager {
  private recognition: any = null;
  private commands: Map<string, () => void> = new Map();

  constructor() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      this.recognition = new SR();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((result: any) => result[0].transcript)
        .join('')
        .toLowerCase();

      for (const [phrase, action] of this.commands) {
        if (transcript.includes(phrase.toLowerCase())) {
          action();
          break;
        }
      }
    };
  }

  addCommand(phrase: string, action: () => void) {
    this.commands.set(phrase, action);
  }

  start() {
    if (this.recognition) {
      this.recognition.start();
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

// 12. Undo/Redo System
export class UndoRedoManager {
  private history: any[] = [];
  private currentIndex = -1;

  execute(action: any) {
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(action);
    this.currentIndex++;
  }

  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
  }

  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }
}

export default {
  MICRO_INTERACTIONS,
  LOADING_STATES,
  GestureRecognizer,
  createErrorMessage,
  createSuccessNotification,
  TOOLTIP_DEFAULTS,
  ANIMATION_LIBRARY,
  PAGE_TRANSITIONS,
  FocusManager,
  HapticFeedback,
  VoiceCommandManager,
  UndoRedoManager,
};
