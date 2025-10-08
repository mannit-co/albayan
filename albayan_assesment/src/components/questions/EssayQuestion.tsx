  import React from 'react';
  import { Question } from '@/types/exam';
  import { Textarea } from '@/components/ui/textarea';

  interface EssayQuestionProps {
    question: Question;
    response?: string;
    onChange: (response: string) => void;
  }

  export const EssayQuestion: React.FC<EssayQuestionProps> = ({
    question,
    response = '',
    onChange
  }) => {
    const wordCount = response.trim().split(/\s+/).filter(word => word.length > 0).length;
    
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
          <div className="text-sm text-muted-foreground">
            Write your answer in the text area below:
          </div>
          
          <Textarea
            value={response}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-48 resize-none text-base leading-relaxed"
          />
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Word count: {wordCount}</span>
            <span>Characters: {response.length}</span>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground bg-accent/50 p-3 rounded-lg">
          <strong>Tips:</strong> Be clear and concise. Structure your answer with proper paragraphs. 
          Check your spelling and grammar before moving to the next question.
        </div>
      </div>
    );
  };