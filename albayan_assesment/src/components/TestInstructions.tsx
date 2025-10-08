import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestCollection } from './TestSelection';
import { Clock, FileText, Award, AlertTriangle, Monitor, Camera } from 'lucide-react';
import Albayan from '../images/Albayan.jpg';

interface TestInstructionsProps {
  test: TestCollection;
  testNumber: number;
  onStartTest: () => void;
  onBackToSelection: () => void;
}

export const TestInstructions: React.FC<TestInstructionsProps> = ({
  test,
  testNumber,
  onStartTest,
  onBackToSelection
}) => {
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
            <div className="text-sm text-slate-300">Test Instructions</div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-2">
        <div className="space-y-6">
          {/* Test Overview */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-3">
                <Award className="w-6 h-6 text-primary" />
                Test {testNumber}: {test.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Test Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-accent/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{test.questions.length}</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="bg-accent/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{test.duration}</div>
                  <div className="text-sm text-muted-foreground">Minutes</div>
                </div>
                <div className="bg-accent/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{test.totalMarks}</div>
                  <div className="text-sm text-muted-foreground">Total Marks</div>
                </div>
                <div className="bg-accent/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{test.questionTypes.length}</div>
                  <div className="text-sm text-muted-foreground">Question Types</div>
                </div>
              </div>

              {/* Question Types Legend */}
              <div>
                <h3 className="font-semibold text-center mb-3">Included Question Types</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {test.questionTypes.map((type) => (
                    <span
                      key={type}
                      className="px-4 py-1 text-sm rounded-full bg-green-100 text-green-700 border border-green-300"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security and System Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Security & System Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Camera className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">
                    Camera monitoring <strong>(optional)</strong> will be enabled if allowed.
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">Fullscreen mode will be activated</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm">Tab switching is not allowed during the test</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Test Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">During the Test:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Read each question carefully</li>
                      <li>• Use the question palette to navigate</li>
                      <li>• Mark questions for review if needed</li>
                      <li>• Submit the test before time runs out</li>
                      <li>• Keep track of remaining time</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Important Notes:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Ensure stable internet connection</li>
                      <li>• Do not refresh or close the browser</li>
                      <li>• Switching tabs may be detected</li>
                      <li>• Save answers frequently</li>
                      <li>• Submit early if you finish before time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={onBackToSelection}
              className="flex items-center gap-2"
            >
              ← Back to Test Selection
            </Button>
            
            <Button
              onClick={onStartTest}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              size="lg"
            >
              Start Exam
            </Button>
          </div>

          {/* Final Warning */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-red-800">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Important Warning:</p>
                  <p className="text-sm mt-1">
                    Once you start this test, the timer will begin and you cannot pause or restart it.
                    Make sure you are ready and have sufficient time to complete the test.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};