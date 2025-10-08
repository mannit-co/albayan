import React from 'react';
import { Question } from '@/types/exam';
import { Input } from '@/components/ui/input';

interface FillBlanksQuestionProps {
  question: Question;
  response?: string[];
  onChange: (response: string[]) => void;
}

export const FillBlanksQuestion: React.FC<FillBlanksQuestionProps> = ({
  question,
  response = [],
  onChange
}) => {
  // Parse the question text to identify blanks marked with 3+ underscores (e.g., ___, _____, __________)
  // or the literal token {blank}. Any continuous run of underscores is treated as a SINGLE blank.
  const BLANK_REGEX = /(_{3,}|-{3,}|\{blank\})/g;


  const parseQuestionWithBlanks = (text: string) => {
    const parts = text.split(BLANK_REGEX);
    let blankIndex = 0;

    return parts.map((part, index) => {
      if (part && (BLANK_REGEX.test(part))) {
        const currentBlankIndex = blankIndex;
        blankIndex++;
        return (
          <span key={index} className="inline-block mx-1">
            <Input
              type="text"
              value={response[currentBlankIndex] || ''}
              onChange={(e) => {
                const newResponse = [...response];
                newResponse[currentBlankIndex] = e.target.value;
                onChange(newResponse);
              }}
              className="w-32 h-8 text-center border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent focus:bg-accent/20"
              placeholder={`Blank ${currentBlankIndex + 1}`}
            />
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Count total blanks in the question
  const totalBlanks = (question.question.match(BLANK_REGEX) || []).length;




  return (
    <div className="space-y-6">
      <div className="text-lg font-medium leading-relaxed">
        Fill in the blanks:
      </div>

      {question.image && (
        <div className="my-4">
          <img
            src={question.image}
            alt="Question image"
            className="max-w-full h-auto rounded-lg border"
          />
        </div>
      )}

      <div className="text-lg leading-relaxed p-6 bg-accent/30 rounded-lg border">
        {parseQuestionWithBlanks(question.question)}
      </div>


      <div className="text-sm text-muted-foreground">
        Progress: {response.filter(r => r && r.trim()).length} of {totalBlanks} blanks filled
      </div>
    </div>
  );
};