// import React from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Question, QuestionState, StatusCounts } from '@/types/exam';
// import { Send } from 'lucide-react';

// interface QuestionPaletteProps {
//   questions: Question[];
//   currentQuestion: number;
//   questionStatus: Record<number, QuestionState>;
//   statusCounts: StatusCounts;
//   onQuestionSelect: (index: number) => void;
//   onSubmit: () => void;
// }

// export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
//   questions,
//   currentQuestion,
//   questionStatus,
//   statusCounts,
//   onQuestionSelect,
//   onSubmit
// }) => {
//   const getQuestionStatus = (index: number): string => {
//     const status = questionStatus[index];
//     if (!status?.visited) return 'not-visited';
//     if (status.answered && status.markedForReview) return 'answered-marked';
//     if (status.answered) return 'answered';
//     if (status.markedForReview) return 'marked';
//     return 'not-answered';
//   };

//   return (
//     <div className="question-palette">
//       <Card className="h-full flex flex-col">
//         <CardHeader className="pb-4">
//           <CardTitle className="text-lg font-semibold">Question Palette</CardTitle>
//         </CardHeader>
        
//         <CardContent className="flex-1 flex flex-col space-y-6">
//           {/* Status Legend */}
//           <div className="space-y-3">
//             <h3 className="font-medium text-sm">Status Legend</h3>
//             <div className="grid grid-cols-1 gap-2 text-xs">
//               <div className="flex items-center gap-2">
//                 <div className="palette-button not-visited w-4 h-4"></div>
//                 <span>Not Visited ({statusCounts.notVisited})</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="palette-button not-answered w-4 h-4"></div>
//                 <span>Not Answered ({statusCounts.notAnswered - statusCounts.markedForReview})</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="palette-button answered w-4 h-4"></div>
//                 <span>Answered ({statusCounts.answered - statusCounts.markedForReview})</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="palette-button marked w-4 h-4"></div>
//                 <span>Marked for Review</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="palette-button answered-marked w-4 h-4"></div>
//                 <span>Answered & Marked</span>
//               </div>
//             </div>
//           </div>

//           {/* Question Buttons Grid */}
//           <div className="flex-1">
//             <h3 className="font-medium text-sm mb-3">Questions</h3>
//             <div className="grid grid-cols-5 gap-3">
//               {questions.map((_, index) => {
//                 const status = getQuestionStatus(index);
//                 const isCurrent = index === currentQuestion;
                
//                 return (
//                   <button
//                     key={index}
//                     onClick={() => onQuestionSelect(index)}
//                     className={`palette-button ${status} ${
//                       isCurrent ? 'ring-2 ring-primary scale-110' : ''
//                     }`}
//                   >
//                     {index + 1}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Summary Stats */}
//           <div className="space-y-3 pt-4 border-t">
//             <h3 className="font-medium text-sm">Summary</h3>
//             <div className="space-y-2 text-sm">
//               <div className="flex justify-between">
//                 <span>Total Questions:</span>
//                 <span className="font-medium">{statusCounts.total}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Answered:</span>
//                 <span className="font-medium text-green-600">{statusCounts.answered}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Not Answered:</span>
//                 <span className="font-medium text-red-600">{statusCounts.notAnswered}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Marked for Review:</span>
//                 <span className="font-medium text-yellow-600">{statusCounts.markedForReview}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Not Visited:</span>
//                 <span className="font-medium text-gray-500">{statusCounts.notVisited}</span>
//               </div>
//             </div>
//           </div>

//           {/* Submit Button */}
//           <Button
//             onClick={onSubmit}
//             className="w-full flex items-center gap-2"
//             variant="destructive"
//             size="lg"
//           >
//             <Send className="w-4 h-4" />
//             Submit Exam
//           </Button>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

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
  }

  export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
    questions,
    currentQuestion,
    questionStatus,
    statusCounts,
    onQuestionSelect,
    onSubmit
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
                  <span className="font-medium text-red-600">{statusCounts.notAnswered}</span>
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

            {/* Submit Button */}
            <Button
              onClick={onSubmit}
              className="w-full flex items-center gap-2"
              variant="destructive"
              size="lg"
            >
              <Send className="w-4 h-4" />
              Submit Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };
