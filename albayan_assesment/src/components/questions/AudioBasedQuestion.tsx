import React, { useRef, useState } from 'react';
import { Question } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { MultipleChoiceSingle } from './MultipleChoiceSingle';
import { MultipleChoiceMultiple } from './MultipleChoiceMultiple';
import { EssayQuestion } from './EssayQuestion';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

interface AudioBasedQuestionProps {
  question: Question;
  response?: any;
  onChange: (response: any) => void;
}

export const AudioBasedQuestion: React.FC<AudioBasedQuestionProps> = ({
  question,
  response,
  onChange
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playCount, setPlayCount] = useState(0);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
        if (currentTime === 0) {
          setPlayCount(prev => prev + 1);
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderQuestionContent = () => {
    if (question.options && question.options.length > 0) {
      if (Array.isArray(response) || question.question.toLowerCase().includes('select all')) {
        return (
          <MultipleChoiceMultiple
            question={{ ...question, question: '' }}
            response={response}
            onChange={onChange}
          />
        );
      } else {
        return (
          <MultipleChoiceSingle
            question={{ ...question, question: '' }}
            response={response}
            onChange={onChange}
          />
        );
      }
    } else {
      return (
        <EssayQuestion
          question={{ ...question, question: '' }}
          response={response}
          onChange={onChange}
        />
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium leading-relaxed">
        {question.question}
      </div>
      
      <div className="text-sm text-muted-foreground">
        Listen to the audio carefully and answer the question below:
      </div>
      
      {question.audioUrl && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
          <audio
            ref={audioRef}
            src={question.audioUrl}
            onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
            onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
            onEnded={() => setIsPlaying(false)}
            preload="metadata"
          />
          
          <div className="flex items-center gap-4 mb-4">
            <Volume2 className="w-6 h-6 text-primary" />
            <h3 className="font-medium">Audio Player</h3>
            <span className="text-sm text-muted-foreground">
              (Played {playCount} time{playCount !== 1 ? 's' : ''})
            </span>
          </div>
          
          <div className="flex items-center gap-4 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayPause}
              className="flex items-center gap-2"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetAudio}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            
            <div className="flex-1 text-center text-sm text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
        <strong>Note:</strong> You can replay the audio multiple times. 
        Make sure your volume is at an appropriate level before playing.
      </div>
      
      {renderQuestionContent()}
    </div>
  );
};