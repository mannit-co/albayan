import React, { useState, useEffect } from 'react';
import { SecurityViolation } from '@/types/exam';
import { AlertTriangle, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecurityMonitorProps {
  violations: SecurityViolation[];
  onRequestFullscreen?: () => void;
  // Optional: current fullscreen state for potential conditional logic
  isFullscreen?: boolean;
}

export const SecurityMonitor: React.FC<SecurityMonitorProps> = ({ violations, onRequestFullscreen, isFullscreen }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [currentViolation, setCurrentViolation] = useState<SecurityViolation | null>(null);

  useEffect(() => {
    if (violations.length > 0) {
      const latestViolation = violations[violations.length - 1];
      setCurrentViolation(latestViolation);
      setShowWarning(true);
      
      // Auto-hide only for non-fullscreen violations; keep fullscreen-exit visible
      // until the user explicitly clicks "Return to Fullscreen".
      if (latestViolation.type !== 'fullscreen-exit') {
        const timer = setTimeout(() => {
          setShowWarning(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [violations]);

  const getViolationMessage = (violation: SecurityViolation): string => {
    switch (violation.type) {
      case 'tab-switch':
        return 'Tab switching detected! Please stay on the exam page.';
      case 'fullscreen-exit':
        return 'Fullscreen mode exited! Please return to fullscreen.';
      case 'camera-off':
        return 'Camera access lost! Please enable your camera.';
      case 'right-click':
        return 'Right-click is disabled during the exam.';
      case 'copy-paste':
        return 'Copy/paste operations are not allowed.';
      case 'refresh':
        return 'Page refresh is blocked during the exam.';
      case 'shortcut':
        return 'Keyboard shortcut blocked during the exam.';
      default:
        return 'Security violation detected!';
    }
  };

  if (!showWarning || !currentViolation) {
    return null;
  }

  return (
    <div className="security-warning">
      <div className="bg-red-600 text-white p-8 rounded-lg max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <AlertTriangle className="w-8 h-8" />
          <h2 className="text-xl font-bold">Security Alert</h2>
        </div>
        
        <p className="text-lg mb-6">
          {getViolationMessage(currentViolation)}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Shield className="w-4 h-4" />
            <span>Violation #{violations.length}</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (currentViolation?.type === 'fullscreen-exit' && onRequestFullscreen) {
                // Try to re-enter fullscreen on user gesture
                onRequestFullscreen();
              }
              setShowWarning(false);
            }}
            className="bg-white text-red-600 hover:bg-gray-100"
          >
            <X className="w-4 h-4 mr-2" />
            {currentViolation?.type === 'fullscreen-exit' ? 'Return to Fullscreen' : 'Continue'}
          </Button>
        </div>
        
        {violations.length >= 3 && (
          <div className="mt-4 p-3 bg-red-700 rounded text-sm">
            <strong>Warning:</strong> Multiple violations detected. 
            Your exam may be flagged for review.
          </div>
        )}
      </div>
    </div>
  );
};