import React from 'react';
import { Question } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface TrueFalseQuestionProps {
  question: Question;
  response?: boolean;
  onChange: (response: boolean) => void;
}

export const TrueFalseQuestion: React.FC<TrueFalseQuestionProps> = ({
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
      
      <div className="text-sm text-muted-foreground">
        Select True or False:
      </div>
      
      <div className="flex gap-4 justify-center">
        <Button
          variant={response === true ? "default" : "outline"}
          size="lg"
          onClick={() => onChange(true)}
          className={`w-32 h-16 flex items-center gap-3 ${
            response === true 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'hover:bg-green-50 hover:border-green-300'
          }`}
        >
          <Check className="w-6 h-6" />
          <span className="text-lg font-medium">True</span>
        </Button>
        
        <Button
          variant={response === false ? "default" : "outline"}
          size="lg"
          onClick={() => onChange(false)}
          className={`w-32 h-16 flex items-center gap-3 ${
            response === false 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'hover:bg-red-50 hover:border-red-300'
          }`}
        >
          <X className="w-6 h-6" />
          <span className="text-lg font-medium">False</span>
        </Button>
      </div>
      
      {response !== undefined && (
        <div className="text-center text-sm text-muted-foreground">
          You selected: <strong>{response ? 'True' : 'False'}</strong>
        </div>
      )}
    </div>
  );
};