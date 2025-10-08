import React from 'react';
import { Question } from '@/types/exam';
import { Button } from '@/components/ui/button';

interface MultipleChoiceSingleProps {
  question: Question;
  response?: string;
  onChange: (response: string) => void;
}

export const MultipleChoiceSingle: React.FC<MultipleChoiceSingleProps> = ({
  question,
  response,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <div className="text-lg font-medium leading-relaxed">
        {question.question}
      </div>
      
      {question.imageUrl && (
        <div className="my-4">
          <img 
            src={question.imageUrl} 
            alt="Question image" 
            className="max-w-full h-auto rounded-lg border"
          />
        </div>
      )}
      
      <div className="space-y-3">
        {question.options?.map((option, index) => {
          const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
          const isSelected = response === option;
          
          return (
            <button
              key={index}
              onClick={() => onChange(option)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 hover:border-primary/50 ${
                isSelected 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border bg-card hover:bg-accent/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                  isSelected 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : 'border-muted-foreground'
                }`}>
                  {optionLabel}
                </div>
                <span className="flex-1">{option}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};