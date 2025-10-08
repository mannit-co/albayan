import React,  {useState} from 'react';
import { useNavigate } from 'react-router-dom'; // <-- import useNavigate

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Question, QuestionState } from '@/types/exam';
import { ChevronLeft, Send, CheckCircle, XCircle, AlertCircle, Circle } from 'lucide-react';

interface ExamSummaryProps {
  questions: Question[];
  responses: Record<number, any>;
  questionStatus: Record<number, QuestionState>;
  onBack: () => void;
  onSubmit: () => void;
  onOk?: () => void;
}

export const ExamSummary: React.FC<ExamSummaryProps> = ({
  questions,
  responses,
  questionStatus,
  onBack,
  onSubmit,
  onOk
}) => {
    const [showSuccess, setShowSuccess] = useState(false); 

      const navigate = useNavigate(); // for redirect
    
      const handleFinalSubmit = () => {
        // Call existing onSubmit
        onSubmit();
    
        // Show success message
        setShowSuccess(true);
      };

      const handleOkClick = () => {
        setShowSuccess(false);
        if (onOk) {
          onOk();
        } else {
          navigate('/'); // fallback: navigate to Index page
        }
      };
    
  const getQuestionStatus = (index: number): string => {
    const status = questionStatus[index];
    if (!status?.visited) return 'not-visited';
    if (status.answered && status.markedForReview) return 'answered-marked';
    if (status.answered) return 'answered';
    if (status.markedForReview) return 'marked';
    return 'not-answered';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'answered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'answered-marked':
        return <AlertCircle className="w-5 h-5 text-purple-600" />;
      case 'marked':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'not-answered':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'answered':
        return 'Answered';
      case 'answered-marked':
        return 'Answered & Marked';
      case 'marked':
        return 'Marked for Review';
      case 'not-answered':
        return 'Not Answered';
      default:
        return 'Not Visited';
    }
  };

  const getStatusCounts = () => {
    const counts = {
      answered: 0,
      notAnswered: 0,
      markedForReview: 0,
      notVisited: 0
    };

    questions.forEach((_, index) => {
      const status = getQuestionStatus(index);
      switch (status) {
        case 'answered':
          counts.answered++;
          break;
        case 'answered-marked':
          counts.answered++;
          counts.markedForReview++;
          break;
        case 'marked':
          counts.markedForReview++;
          counts.notAnswered++;
          break;
        case 'not-answered':
          counts.notAnswered++;
          break;
        case 'not-visited':
          counts.notVisited++;
          break;
      }
    });

    return counts;
  };

  const counts = getStatusCounts();

  return (
    <div className="exam-container">
      <div className="exam-header">
        <h1 className="text-xl font-bold">Exam Summary</h1>
        <div className="text-sm opacity-90">
          Review your responses before final submission
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{counts.answered}</div>
                  <div className="text-sm text-green-600">Answered</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{counts.notAnswered}</div>
                  <div className="text-sm text-red-600">Not Answered</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{counts.markedForReview}</div>
                  <div className="text-sm text-yellow-600">Marked for Review</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{counts.notVisited}</div>
                  <div className="text-sm text-gray-600">Not Visited</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question-wise Status */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Question-wise Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {questions.map((question, index) => {
                  const status = getQuestionStatus(index);
                  const response = responses[index];
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">Q{index + 1}</span>
                        <span className="text-sm text-muted-foreground truncate max-w-md">
                          {question.question}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {question.marks} marks
                        </span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span className="text-sm font-medium">
                            {getStatusText(status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card> */}

          {/* Warning for unanswered questions */}
          {(counts.notAnswered > 0 || counts.notVisited > 0) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-yellow-800">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Incomplete Submission</p>
                    <p className="text-sm">
                      You have {counts.notAnswered + counts.notVisited} unanswered questions. 
                      You can go back to review them or submit as is.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Exam
            </Button>
            
            <Button
              onClick={handleFinalSubmit}
              className="flex items-center gap-2"
              size="lg"
            >
              <Send className="w-4 h-4" />
              Final Submit
            </Button>
          </div>

              {/* Success Message Popup */}
          {showSuccess && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                <h2 className="text-lg font-bold text-green-600">Success!</h2>
                <p>Your answers have been submitted successfully.</p>
                <Button
                  onClick={handleOkClick}
                  className="mt-4 px-8"
                >
                  OK
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};