// import React from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Question } from '@/types/exam';
// import { MultipleChoiceSingle } from './questions/MultipleChoiceSingle';
// import { MultipleChoiceMultiple } from './questions/MultipleChoiceMultiple';
// import { EssayQuestion } from './questions/EssayQuestion';
// import { FillBlanksQuestion } from './questions/FillBlanksQuestion';
// import { TrueFalseQuestion } from './questions/TrueFalseQuestion';
// import { MatchFollowingQuestion } from './questions/MatchFollowingQuestion';
// import { ImageBasedQuestion } from './questions/ImageBasedQuestion';
// import { AudioBasedQuestion } from './questions/AudioBasedQuestion';
// import { DiscRankingQuestion } from './questions/DiscRankingQuestion';
// import { DiscBehavioralQuestion } from './questions/DiscBehavioralQuestion';
// import { YesNoQuestion } from './questions/YesNoQuestions';
// import { CodingQuestion } from './questions/CodingQuestion';
// import { ChevronLeft, ChevronRight, BookmarkPlus, Eraser, Save } from 'lucide-react';

// interface QuestionPanelProps {
//   question: Question;
//   response?: any;
//   onResponseChange: (response: any) => void;
//   onNext: () => void;
//   onPrevious: () => void;
//   onClear: () => void;
//   onMarkReview: () => void;
//   isMarkedForReview: boolean;
//   canGoNext: boolean;
//   canGoPrevious: boolean;
// }

// export const QuestionPanel: React.FC<QuestionPanelProps> = ({
//   question,
//   response,
//   onResponseChange,
//   onNext,
//   onPrevious,
//   onClear,
//   onMarkReview,
//   isMarkedForReview,
//   canGoNext,
//   canGoPrevious
// }) => {
//   const renderQuestion = () => {
//     console.log("Rendering question type:", question.type);
//     switch (question.type) {
//       case 'SingleSelect':
//         return (
//           <MultipleChoiceSingle
//             question={question}
//             response={response}
//             onChange={onResponseChange}
//           />
//         );
//       case 'MultipleSelect':
//         return (
//           <MultipleChoiceMultiple
//             question={question}
//             response={response}
//             onChange={onResponseChange}
//           />
//         );

//       case 'Essay':
//         return (
//           <EssayQuestion
//             question={question}
//             response={response}
//             onChange={onResponseChange}
//           />
//         );
//       case 'Fillup':
//         return (
//           <FillBlanksQuestion
//             question={question}
//             response={response}
//             onChange={onResponseChange}
//           />
//         );
//           case 'Coding':   // ✅ Add coding case
//       return (
//         <CodingQuestion
//           question={question}
//           response={response}
//           onChange={onResponseChange}
//         />
//       );
//       case 'True/False':
//         return (
//           <TrueFalseQuestion
//             question={question}
//             response={response}
//             onChange={onResponseChange}
//           />
//         );
//       case 'Yes/No':
//         return (
//           <YesNoQuestion
//             question={question}
//             response={response}
//             onChange={onResponseChange}
//           />
//         );
//       case 'match-following':
//         return (
//           <MatchFollowingQuestion
//             question={question}
//             response={response}
//             onChange={onResponseChange}
//           />
//         );
//       case 'Image':
//         return (
//           <ImageBasedQuestion
//             question={question}
//             response={response}
//             onChange={onResponseChange}
//           />
//         );
//       case 'audio-based':
//         return (
//           <AudioBasedQuestion
//             question={question}
//             response={response}
//             onChange={onResponseChange}
//           />
//         );
//       case 'disc-ranking':
//         return (
//           <DiscRankingQuestion
//             question={question}
//             response={response}
//             onChange={onResponseChange}
//           />
//         );
//       case 'disc-behavioral':
//       case 'Disc':   // ✅ support both formats
//         return (
//           <DiscBehavioralQuestion
//             question={question}
//             response={response}
//             onChange={onResponseChange}
//           />
//         );
//       default:
//         return <div>Unsupported question type</div>;
//     }
//   };

//   return (
//     <div className="question-panel">
//       <Card className="h-full flex flex-col">
//         <CardHeader className="pb-4">
//           <div className="flex items-center justify-between">
//             <CardTitle className="text-lg font-semibold">
//               Question {question.id}
//             </CardTitle>
//             <div className="flex items-center gap-2 text-sm text-muted-foreground">
//               <span>Marks: {question.marks}</span>
//               {isMarkedForReview && (
//                 <BookmarkPlus className="w-4 h-4 text-yellow-600" />
//               )}
//             </div>
//           </div>
//         </CardHeader>

//         <CardContent className="flex-1 flex flex-col">
//           <div className="flex-1 mb-6">
//             {renderQuestion()}
//           </div>

//           {/* Action Buttons */}
//           <div className="flex items-center justify-between pt-6 border-t">
//             <div className="flex gap-2">
//               <Button
//                 variant="outline"
//                 onClick={onPrevious}
//                 disabled={!canGoPrevious}
//                 className="flex items-center gap-2"
//               >
//                 <ChevronLeft className="w-4 h-4" />
//                 Previous
//               </Button>

//               <Button
//                 variant="outline"
//                 onClick={onClear}
//                 className="flex items-center gap-2"
//               >
//                 <Eraser className="w-4 h-4" />
//                 Clear Response
//               </Button>

//               <Button
//                 variant="outline"
//                 onClick={onMarkReview}
//                 className={`flex items-center gap-2 ${isMarkedForReview ? 'bg-yellow-100 text-yellow-800' : ''
//                   }`}
//               >
//                 <BookmarkPlus className="w-4 h-4" />
//                 {isMarkedForReview ? 'Unmark' : 'Mark for Review'}
//               </Button>
//             </div>

//             <div className="flex gap-2">
//               <Button
//                 onClick={onNext}
//                 disabled={!canGoNext}
//                 className="flex items-center gap-2"
//               >
//                 <Save className="w-4 h-4" />
//                 Save & Next
//                 <ChevronRight className="w-4 h-4" />
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Question } from '@/types/exam';
import { MultipleChoiceSingle } from './questions/MultipleChoiceSingle';
import { MultipleChoiceMultiple } from './questions/MultipleChoiceMultiple';
import { EssayQuestion } from './questions/EssayQuestion';
import { FillBlanksQuestion } from './questions/FillBlanksQuestion';
import { TrueFalseQuestion } from './questions/TrueFalseQuestion';
import { MatchFollowingQuestion } from './questions/MatchFollowingQuestion';
import { ImageBasedQuestion } from './questions/ImageBasedQuestion';
import { AudioBasedQuestion } from './questions/AudioBasedQuestion';
import { DiscRankingQuestion } from './questions/DiscRankingQuestion';
import { DiscBehavioralQuestion } from './questions/DiscBehavioralQuestion';
import { YesNoQuestion } from './questions/YesNoQuestions';
import { CodingQuestion } from './questions/CodingQuestion';
import { ChevronLeft, ChevronRight, BookmarkPlus, Eraser, Save } from 'lucide-react';

interface QuestionPanelProps {
  question: Question;
  response?: any;
  onResponseChange: (response: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  onClear: () => void;
  onMarkReview: () => void;
  isMarkedForReview: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  /**
   * UI-only index for display (0-based). This does NOT affect submission payload.
   * If provided, the header will show displayIndex + 1 instead of question.id.
   */
  displayIndex?: number;
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({
  question,
  response,
  onResponseChange,
  onNext,
  onPrevious,
  onClear,
  onMarkReview,
  isMarkedForReview,
  canGoNext,
  canGoPrevious,
  displayIndex
}) => {
  const renderQuestion = () => {
    switch (question.type) {
      case 'SingleSelect':
        return <MultipleChoiceSingle question={question} response={response} onChange={onResponseChange} />;
      case 'MultipleSelect':
        return <MultipleChoiceMultiple question={question} response={response} onChange={onResponseChange} />;
      case 'Essay':
        return <EssayQuestion question={question} response={response} onChange={onResponseChange} />;
      case 'Fillup':
        return <FillBlanksQuestion question={question} response={response} onChange={onResponseChange} />;
      case 'Coding':
        return <CodingQuestion question={question} response={response} onChange={onResponseChange} />;
      case 'True/False':
        return <TrueFalseQuestion question={question} response={response} onChange={onResponseChange} />;
      case 'Yes/No':
        return <YesNoQuestion question={question} response={response} onChange={onResponseChange} />;
      case 'match-following':
        return <MatchFollowingQuestion question={question} response={response} onChange={onResponseChange} />;
      case 'Image':
        return <ImageBasedQuestion question={question} response={response} onChange={onResponseChange} />;
      case 'audio-based':
        return <AudioBasedQuestion question={question} response={response} onChange={onResponseChange} />;
      case 'disc-ranking':
        return <DiscRankingQuestion question={question} response={response} onChange={onResponseChange} />;
      case 'disc-behavioral':
      case 'Disc':
        return <DiscBehavioralQuestion question={question} response={response} onChange={onResponseChange} />;
      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <div className="question-panel h-full flex flex-col">
      <Card className="h-full flex flex-col">
        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Question {typeof displayIndex === 'number' ? displayIndex + 1 : question.id}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Marks: {question.marks}</span>
              {isMarkedForReview && <BookmarkPlus className="w-4 h-4 text-yellow-600" />}
            </div>
          </div>
        </CardHeader>

        {/* Scrollable Question Area */}
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2 mb-4">
            {renderQuestion()}
          </div>

          {/* Fixed Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t">
            {/* Left buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={onPrevious}
                disabled={!canGoPrevious}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <Button
                variant="outline"
                onClick={onClear}
                className="flex items-center gap-2"
              >
                <Eraser className="w-4 h-4" />
                Clear Response
              </Button>

              <Button
                variant="outline"
                onClick={onMarkReview}
                className={`flex items-center gap-2 ${
                  isMarkedForReview ? 'bg-yellow-100 text-yellow-800' : ''
                }`}
              >
                <BookmarkPlus className="w-4 h-4" />
                {isMarkedForReview ? 'Unmark' : 'Mark for Review'}
              </Button>
            </div>

            {/* Right button */}
            <div>
              <Button
                onClick={onNext}
                disabled={!canGoNext}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save & Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
