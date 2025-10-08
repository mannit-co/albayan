import React from 'react';
import { Question } from '@/types/exam';
import { Textarea } from '@/components/ui/textarea';

interface CodingQuestionProps {
  question: Question;
  response?: string;
  onChange: (response: string) => void;
}

export const CodingQuestion: React.FC<CodingQuestionProps> = ({
  question,
  response = '',
  onChange
}) => {
  const lineCount = response.split('\n').length;

  return (
    <div className="space-y-6">
      {/* Question text */}
      <div className="text-lg font-medium leading-relaxed">
        {question.question}
      </div>

      {/* Optional image */}
      {question.imageUrl && (
        <div className="my-4">
          <img
            src={question.imageUrl}
            alt="Question image"
            className="max-w-full h-auto rounded-lg border"
          />
        </div>
      )}

      {/* Code editor (basic textarea) */}
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">
          Write your code below ({question.language || "Any Language"}):
        </div>

        <Textarea
          value={response}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Write your ${question.language || "code"} solution here...`}
          className="min-h-[300px] font-mono text-sm resize-y border bg-gray-50"
        />

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Lines: {lineCount}</span>
          <span>Characters: {response.length}</span>
        </div>
      </div>

      {/* Tips */}
      <div className="text-sm text-muted-foreground bg-accent/50 p-3 rounded-lg">
        <strong>Tips:</strong> Write clean, efficient code. Use comments where needed. 
        Make sure your solution is syntactically correct.
      </div>
    </div>
  );
};
