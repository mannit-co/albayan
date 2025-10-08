import React from 'react';
import { Question } from '@/types/exam';
import { Checkbox } from '@/components/ui/checkbox';

interface MultipleChoiceMultipleProps {
  question: Question;
  response?: string[];
  onChange: (response: string[]) => void;
}

export const MultipleChoiceMultiple: React.FC<MultipleChoiceMultipleProps> = ({
  question,
  response = [],
  onChange
}) => {
  const handleOptionChange = (option: string, checked: boolean) => {
    if (checked) {
      onChange([...response, option]);
    } else {
      onChange(response.filter(item => item !== option));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium leading-relaxed">
        {question.question}
      </div>
      
      <div className="text-sm text-muted-foreground">
        Select all correct options:
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
          const isSelected = response.includes(option);
          
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                isSelected 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border bg-card hover:bg-accent/50 hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`option-${index}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleOptionChange(option, checked as boolean)}
                />
                <div className={`w-6 h-6 rounded border flex items-center justify-center text-sm font-medium ${
                  isSelected 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-muted-foreground'
                }`}>
                  {optionLabel}
                </div>
                <label 
                  htmlFor={`option-${index}`}
                  className="flex-1 cursor-pointer"
                >
                  {option}
                </label>
              </div>
            </div>
          );
        })}
      </div>
      
      {response.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Selected: {response.length} option{response.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};