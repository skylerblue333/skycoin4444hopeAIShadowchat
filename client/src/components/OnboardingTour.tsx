import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
  videoUrl?: string;
  duration?: number; // in seconds
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
  category: 'mining' | 'trading' | 'social' | 'gaming' | 'marketplace' | 'governance';
  estimatedTime: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface OnboardingTourProps {
  tour: Tour;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ tour, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const step = tour.steps[currentStep];

  // Calculate tooltip position
  useEffect(() => {
    const element = document.querySelector(step.target);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const offset = 16;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'top':
        top = rect.top - offset;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - offset;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + offset;
        break;
    }

    setPosition({ top, left });
  }, [currentStep, step.target, step.position]);

  const handleNext = () => {
    if (step.action) {
      step.action();
    }
    if (currentStep < tour.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Highlight overlay */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        <div className="absolute inset-0 bg-black/40" />
        <div
          className="absolute border-2 border-primary rounded-lg"
          style={{
            top: `${document.querySelector(step.target)?.getBoundingClientRect().top || 0}px`,
            left: `${document.querySelector(step.target)?.getBoundingClientRect().left || 0}px`,
            width: `${document.querySelector(step.target)?.getBoundingClientRect().width || 0}px`,
            height: `${document.querySelector(step.target)?.getBoundingClientRect().height || 0}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
          }}
        />
      </div>

      {/* Tooltip */}
      <Card
        className="fixed z-50 w-80 shadow-2xl pointer-events-auto"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">{step.title}</h3>
              <p className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {tour.steps.length}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsVisible(false);
                onSkip();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

          {/* Video (if available) */}
          {step.videoUrl && (
            <div className="mb-4 rounded-lg overflow-hidden bg-muted aspect-video">
              <video
                src={step.videoUrl}
                controls
                className="w-full h-full"
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-1 mb-4">
            <div
              className="bg-primary h-1 rounded-full transition-all"
              style={{
                width: `${((currentStep + 1) / tour.steps.length) * 100}%`,
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="flex-1"
            >
              {currentStep === tour.steps.length - 1 ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}

// Tour catalog
export const ONBOARDING_TOURS: Tour[] = [
  {
    id: 'mining-basics',
    name: 'Mining Basics',
    description: 'Learn how to start mining and track your earnings',
    category: 'mining',
    difficulty: 'beginner',
    estimatedTime: 5,
    steps: [
      {
        id: 'mining-1',
        title: 'Welcome to Mining',
        description: 'Start your cryptocurrency mining journey. Click "Start Mining" to begin.',
        target: '[data-tour="mining-start"]',
        position: 'bottom',
      },
      {
        id: 'mining-2',
        title: 'View Your Dashboard',
        description: 'Monitor your mining performance, hashrate, and earnings in real-time.',
        target: '[data-tour="mining-dashboard"]',
        position: 'right',
      },
      {
        id: 'mining-3',
        title: 'Manage Pools',
        description: 'Connect to multiple mining pools for better earnings.',
        target: '[data-tour="mining-pools"]',
        position: 'right',
      },
      {
        id: 'mining-4',
        title: 'Withdraw Rewards',
        description: 'Convert your mined coins to your wallet automatically.',
        target: '[data-tour="mining-withdraw"]',
        position: 'left',
      },
    ],
  },
  {
    id: 'trading-basics',
    name: 'Trading Basics',
    description: 'Learn how to trade cryptocurrencies',
    category: 'trading',
    difficulty: 'beginner',
    estimatedTime: 7,
    steps: [
      {
        id: 'trading-1',
        title: 'Trading Terminal',
        description: 'Access the advanced trading interface with real-time charts.',
        target: '[data-tour="trading-terminal"]',
        position: 'bottom',
      },
      {
        id: 'trading-2',
        title: 'Place a Trade',
        description: 'Buy or sell cryptocurrencies with limit and market orders.',
        target: '[data-tour="trading-orders"]',
        position: 'right',
      },
      {
        id: 'trading-3',
        title: 'View Your Portfolio',
        description: 'Track your holdings and performance.',
        target: '[data-tour="trading-portfolio"]',
        position: 'left',
      },
    ],
  },
  {
    id: 'social-basics',
    name: 'Social Basics',
    description: 'Connect with the community',
    category: 'social',
    difficulty: 'beginner',
    estimatedTime: 5,
    steps: [
      {
        id: 'social-1',
        title: 'Social Feed',
        description: 'See posts from community members.',
        target: '[data-tour="social-feed"]',
        position: 'right',
      },
      {
        id: 'social-2',
        title: 'Create a Post',
        description: 'Share your thoughts and updates with the community.',
        target: '[data-tour="social-post"]',
        position: 'bottom',
      },
      {
        id: 'social-3',
        title: 'Join Communities',
        description: 'Find and join communities based on your interests.',
        target: '[data-tour="social-communities"]',
        position: 'left',
      },
    ],
  },
];

// Tour selection modal
interface TourSelectionProps {
  onSelectTour: (tour: Tour) => void;
  onSkip: () => void;
}

export function TourSelection({ onSelectTour, onSkip }: TourSelectionProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">Welcome to Skycoin4444!</h2>
          <p className="text-muted-foreground mb-6">
            Choose a tour to get started with your favorite features.
          </p>

          <div className="grid gap-4">
            {ONBOARDING_TOURS.map(tour => (
              <button
                key={tour.id}
                onClick={() => onSelectTour(tour)}
                className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{tour.name}</h3>
                  <div className="flex gap-2">
                    <Badge variant="outline">{tour.difficulty}</Badge>
                    <Badge variant="secondary">{tour.estimatedTime} min</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{tour.description}</p>
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full mt-6"
            onClick={onSkip}
          >
            Skip for Now
          </Button>
        </div>
      </Card>
    </div>
  );
}
