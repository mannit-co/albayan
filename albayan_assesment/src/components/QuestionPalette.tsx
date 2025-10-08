  import React from 'react';
  import { Button } from '@/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  import { Question, QuestionState, StatusCounts } from '@/types/exam';
  import { Send } from 'lucide-react';

  interface QuestionPaletteProps {
    questions: Question[];
    currentQuestion: number;
    questionStatus: Record<number, QuestionState>;
    statusCounts: StatusCounts;
    onQuestionSelect: (index: number) => void;
    onSubmit: () => void;
    isLastTest?: boolean;
    minQuestions?: number; // Add minimum questions requirement
    answeredCount?: number; // Add current answered count
  }

  export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
    questions,
    currentQuestion,
    questionStatus,
    statusCounts,
    onQuestionSelect,
    onSubmit,
    isLastTest = false,
    minQuestions = 0,
    answeredCount = 0
  }) => {
    const getQuestionStatus = (index: number): string => {
      const status = questionStatus[index];
      if (!status?.visited) return 'not-visited';
      if (status.answered && status.markedForReview) return 'answered-marked';
      if (status.answered) return 'answered';
      if (status.markedForReview) return 'marked';
      return 'not-answered';
    };

    return (
      <div className="question-palette">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold"> </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col space-y-6">
            {/* Question Buttons Grid */}
            <div>
              <h3 className="font-medium text-sm mb-3">Questions</h3>
              <div className="grid grid-cols-5 gap-3">
                {questions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  const isCurrent = index === currentQuestion;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => onQuestionSelect(index)}
                      className={`palette-button ${status} ${
                        isCurrent ? 'ring-2 ring-primary scale-110' : ''
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary Section (moved below questions) */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-medium text-sm">Summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="palette-button not-visited w-4 h-4"></div>
                    <span>Not Visited</span>
                  </div>
                  <span className="font-medium text-gray-500">{statusCounts.notVisited}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="palette-button not-answered w-4 h-4"></div>
                    <span>Not Answered</span>
                  </div>
                  <span className="font-medium text-blue-600">{statusCounts.notAnswered}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="palette-button answered w-4 h-4"></div>
                    <span>Answered</span>
                  </div>
                  <span className="font-medium text-green-600">{statusCounts.answered}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="palette-button marked w-4 h-4"></div>
                    <span>Marked for Review</span>
                  </div>
                  <span className="font-medium text-yellow-600">{statusCounts.markedForReview}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="palette-button answered-marked w-4 h-4"></div>
                    <span>Answered & Marked</span>
                  </div>
                  <span className="font-medium text-purple-600">
                    {statusCounts.answered && statusCounts.markedForReview
                      ? Math.min(statusCounts.answered, statusCounts.markedForReview)
                      : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button removed - Final Submit is handled by QuestionPanel */}
          </CardContent>
        </Card>
      </div>
    );
  };
