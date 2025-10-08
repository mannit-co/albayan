import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface ExamTimerProps {
  duration: number; // in minutes
  onTimeUp: () => void;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({ duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // convert to seconds
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;

        // Warning when 10 minutes or less remaining
        if (newTime <= 600 && !isWarning) {
          setIsWarning(true);
        }

        // Time's up
        if (newTime <= 0) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeUp, isWarning]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  const getTimerClass = () => {
    if (timeLeft <= 300) return 'bg-gray text-black border-2 border-red-500 px-4 py-2 rounded-lg font-mono font-bold text-lg shadow-lg'; // Last 5 minutes - white bg with red border
    if (timeLeft <= 600) return 'bg-gray text-black border-2 border-orange-500 px-4 py-2 rounded-lg font-mono font-bold text-lg shadow-lg'; // Last 10 minutes - white bg with orange border
    return 'bg-white text-black border-2 border-gray-300 px-4 py-2 rounded-lg font-mono font-bold text-lg shadow-lg'; // Normal - white background with black text
  };

  return (
    <div className={`${getTimerClass()} ${isWarning ? 'animate-pulse' : ''}`}>
      <div className="flex items-center gap-2">
        {isWarning && <AlertTriangle className="w-5 h-5" />}
        <Clock className="w-5 h-5" />
        <span>{formatTime(timeLeft)}</span>
      </div>
    </div>
  );
};