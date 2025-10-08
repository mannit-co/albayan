import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText, Award, CheckCircle } from 'lucide-react';
import Albayan from '../images/Albayan.jpg';

export interface TestCollection {
  tid: string;
  title: string;
  questions: any[];
  duration: number;
  totalMarks: number;
  questionTypes: string[];
  minQuestions?: number; // Add minQuestions field
  completed?: boolean;
}

interface TestSelectionProps {
  tests: TestCollection[];
  onStartUnifiedTest: () => void;
  candidateName?: string;
}

export const TestSelection: React.FC<TestSelectionProps> = ({
  tests,
  onStartUnifiedTest,
  candidateName
}) => {
  const totalTests = tests.length;
  const completedTests = tests.filter(test => test.completed).length;
  const [expandedTestTypes, setExpandedTestTypes] = React.useState<Record<number, boolean>>({});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Dark Navbar */}
      <nav className="bg-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <img
                src={Albayan}
                alt="Albayan Logo"
                className="w-7 h-8 object-contain"
              />
              <h1 className="text-lg font-semibold text-white">Albayan Assessment</h1>
            </div>
            {candidateName && (
              <div className="px-3 py-1 bg-slate-700 text-slate-200 border border-slate-600 rounded text-sm">
                Welcome, <span className="font-medium">{candidateName}</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-2">
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Assessment Overview</h2>
            <p className="text-gray-600">
              You have been assigned <strong>{totalTests}</strong> test{totalTests > 1 ? 's' : ''} to complete
            </p>
            
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalTests}</div>
                <div className="text-sm text-gray-500">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedTests}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{totalTests - completedTests}</div>
                <div className="text-sm text-gray-500">Remaining</div>
              </div>
            </div>
          </div>

          {/* Compact Test Cards */}
          <div className="space-y-4">
            {tests.map((test, index) => (
              <div key={test.tid} className={`bg-white rounded-lg shadow-sm border overflow-hidden relative ${test.completed ? 'opacity-75' : ''}`}>
                {test.completed && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </div>
                  </div>
                )}
                
                {/* Compact Card Header */}
                <div className="bg-slate-800 px-4 py-3">
                  <div className="flex items-center gap-2 text-white">
                    <Award className="w-4 h-4" />
                    <h3 className="text-lg font-medium">Test {index + 1}: {test.title}</h3>
                  </div>
                </div>
                
                {/* Compact Card Content */}
                <div className="p-4 space-y-3">
                  {/* Compact Stats Grid */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-lg font-semibold text-blue-600">{test.questions.length}</div>
                      <div className="text-xs text-gray-600">Questions</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-lg font-semibold text-green-600">{test.duration}</div>
                      <div className="text-xs text-gray-600">Minutes</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="text-lg font-semibold text-purple-600">{test.totalMarks}</div>
                      <div className="text-xs text-gray-600">Marks</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <div className="text-lg font-semibold text-orange-600">{test.questionTypes.length}</div>
                      <div className="text-xs text-gray-600">Types</div>
                    </div>
                  </div>

                  {/* Question Types */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Question Types:</h4>
                      <div className="flex flex-wrap gap-1">
                        {(expandedTestTypes[index] ? test.questionTypes : test.questionTypes.slice(0, 4)).map((type) => (
                          <span
                            key={type}
                            className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700"
                          >
                            {type}
                          </span>
                        ))}
                        {test.questionTypes.length > 4 && !expandedTestTypes[index] && (
                          <button
                            onClick={() => setExpandedTestTypes(prev => ({ ...prev, [index]: true }))}
                            className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            +{test.questionTypes.length - 4} more
                          </button>
                        )}
                        {expandedTestTypes[index] && test.questionTypes.length > 4 && (
                          <button
                            onClick={() => setExpandedTestTypes(prev => ({ ...prev, [index]: false }))}
                            className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Test Status Display */}
                    <div className="text-sm text-gray-600">
                      {test.completed ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Completed
                        </div>
                      ) : (
                        <span></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Unified Start Button */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-slate-800 px-6 py-4">
              <h3 className="font-semibold text-white text-center">Ready to Begin Assessment?</h3>
            </div>
            <div className="p-6 text-center space-y-4">
              <p className="text-gray-600 text-sm">
                Click below to start the complete assessment sequence. You will proceed through all {totalTests} tests one by one.
              </p>
              <Button
                onClick={onStartUnifiedTest}
                disabled={completedTests === totalTests}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
                size="lg"
              >
                {completedTests === totalTests ? 'Assessment Completed' : 'Start Test'}
              </Button>
            </div>
          </div>

          {/* Compact Instructions */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
              <h3 className="font-medium text-slate-900">Important Instructions</h3>
            </div>
            <div className="p-4">
              <ul className="text-sm space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-slate-500">•</span>
                  Complete each test in the given time limit
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-500">•</span>
                  Tests will be presented sequentially - you cannot go back to previous tests
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-500">•</span>
                  A 5-second break will be provided between tests
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-500">•</span>
                  Ensure stable internet connection throughout
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-500">•</span>
                  Camera monitoring may be enabled during tests
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};