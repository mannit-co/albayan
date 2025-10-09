  import React, { useState, useEffect } from 'react';
  import { useParams } from 'react-router-dom';
  import { Button } from '@/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  import { ExamDashboard } from '@/components/ExamDashboard';
  import { TestSelection, TestCollection } from '@/components/TestSelection';
  import { sampleQuestions as defaultQuestions, examConfig as defaultConfig, fetchSampleQuestions, testCollections } from '@/data/sampleExam';
  import Albayan from '../images/Albayan.jpg'
  import {
    Monitor,
    Camera,
    Shield,
    Clock,
    FileText,
    CheckCircle,
    Users,
    Award,
    AlertCircle
  } from 'lucide-react';

  const Index = () => {
    const [examStarted, setExamStarted] = useState(false);
    const [examConfig, setExamConfig] = useState(defaultConfig);
    const [sampleQuestions, setSampleQuestions] = useState(defaultQuestions);
    const [examCompleted, setExamCompleted] = useState(false);
    const [examExpired, setExamExpired] = useState(false);
    const [candidateName, setCandidateName] = useState<string | null>(null);
    
    // New state for multi-test workflow
    const [tests, setTests] = useState<TestCollection[]>([]);
    const [currentView, setCurrentView] = useState<'selection' | 'instructions' | 'exam' | 'transition'>('selection');
    const [currentTestIndex, setCurrentTestIndex] = useState<number>(0);
    const [completedTests, setCompletedTests] = useState<number[]>([]);
    const [unifiedTestStarted, setUnifiedTestStarted] = useState(false);
    const [transitionCountdown, setTransitionCountdown] = useState<number>(5);
    
    // State to accumulate responses from all tests
    const [accumulatedResponses, setAccumulatedResponses] = useState<any[]>([]);

    // 👇 Read uniqueTestId from URL if present
    const { uniqueTestId } = useParams();
    console.log('uniqueTestId', uniqueTestId)
    // Load from sessionStorage on mount
    useEffect(() => {
      const storedConfig = sessionStorage.getItem("examConfig");
      const storedQuestions = sessionStorage.getItem("sampleQuestions");
      const storedTests = sessionStorage.getItem("testCollections");
      const storedCompletedTests = sessionStorage.getItem("completedTests");
      const storedAccumulatedResponses = sessionStorage.getItem("accumulatedTestResponses");

      if (storedConfig && storedQuestions) {
        setExamConfig(JSON.parse(storedConfig));
        setSampleQuestions(JSON.parse(storedQuestions));
      }
      
      if (storedTests) {
        const parsedTests = JSON.parse(storedTests);
        setTests(parsedTests);
      }
      
      if (storedCompletedTests) {
        setCompletedTests(JSON.parse(storedCompletedTests));
      }
      
      if (storedAccumulatedResponses) {
        setAccumulatedResponses(JSON.parse(storedAccumulatedResponses));
      }

      // Check if exam is already completed
      setExamCompleted(sessionStorage.getItem('examCompleted') === 'true');
      
      // Check if exam is expired
      setExamExpired(sessionStorage.getItem('examExpired') === 'true');

      // Load candidate name if available
      try {
        const info = JSON.parse(sessionStorage.getItem('candidateInfo') || '{}');
        setCandidateName(info?.name || null);
      } catch {}
    }, []);

    // Re-check completion status when returning from exam
    useEffect(() => {
      if (!examStarted) {
        setExamCompleted(sessionStorage.getItem('examCompleted') === 'true');
        setExamExpired(sessionStorage.getItem('examExpired') === 'true');
      }
    }, [examStarted]);


    // Fetch questions from API if uniqueTestId is present
    useEffect(() => {
      if (uniqueTestId) {
        // Clear previous exam completion status when new test ID is loaded
        sessionStorage.removeItem('examCompleted');
        sessionStorage.removeItem('examExpired');
        sessionStorage.removeItem('completedTests');
        sessionStorage.removeItem('accumulatedTestResponses');
        setExamCompleted(false);
        setExamExpired(false);
        setCompletedTests([]);
        setAccumulatedResponses([]);
        
        fetchSampleQuestions(uniqueTestId).then((questions) => {
          setSampleQuestions(questions);

          // Load updated config and tests from sessionStorage
          const storedConfig = sessionStorage.getItem("examConfig");
          const storedTests = sessionStorage.getItem("testCollections");
          
          if (storedConfig) {
            const config = JSON.parse(storedConfig);
            setExamConfig(config);
            
            // Check if assessment is completed
            if (config.title === "Assessment Completed") {
              setExamCompleted(true);
              
              // Create mock completed tests for proper display
              const mockTests = [
                { tid: '1', title: 'MIXEDQUESTION', questions: [], duration: 0, totalMarks: 0, questionTypes: [], completed: true },
                { tid: '2', title: 'EssayAnd Mul', questions: [], duration: 0, totalMarks: 0, questionTypes: [], completed: true },
                { tid: '3', title: 'Test 3', questions: [], duration: 0, totalMarks: 0, questionTypes: [], completed: true }
              ];
              setTests(mockTests);
              setCompletedTests([0, 1, 2]); // Mark all as completed
            }
            
            // Check if assessment is expired
            if (config.title === "Assessment Expired") {
              setExamExpired(true);
            }
          }
          
          if (storedTests) {
            const parsedTests = JSON.parse(storedTests);
            setTests(parsedTests);
          }
        });
      }
    }, [uniqueTestId]);

    // New handlers for unified multi-test workflow
    const handleStartUnifiedTest = () => {
      // Clear any previous accumulated responses
      setAccumulatedResponses([]);
      sessionStorage.removeItem('accumulatedTestResponses');
      
      setUnifiedTestStarted(true);
      setCurrentTestIndex(0);
      setCurrentView('instructions');
    };

    const handleStartExamFromInstructions = () => {
      const currentTest = tests[currentTestIndex];
      setSampleQuestions(currentTest.questions);
      setExamConfig({
        title: currentTest.title,
        duration: currentTest.duration,
        totalQuestions: currentTest.questions.length,
        totalMarks: currentTest.totalMarks
      });
      setCurrentView('exam');
      setExamStarted(true);
    };

    const handleStartTest = (testIndex: number) => {
      setCurrentTestIndex(testIndex);
      // Skip instructions and go directly to exam
      handleStartExam(testIndex);
    };

    const handleStartExam = (testIndex?: number) => {
      const currentTest = tests[testIndex !== undefined ? testIndex : currentTestIndex];
      setSampleQuestions(currentTest.questions);
      setExamConfig({
        title: currentTest.title,
        duration: currentTest.duration,
        totalQuestions: currentTest.questions.length,
        totalMarks: currentTest.totalMarks
      });
      setCurrentView('exam');
      setExamStarted(true);
    };

    const handleExamComplete = () => {
      // Mark current test as completed
      const updatedCompletedTests = [...completedTests, currentTestIndex];
      setCompletedTests(updatedCompletedTests);
      sessionStorage.setItem('completedTests', JSON.stringify(updatedCompletedTests));
      
      // Update test collections to mark as completed
      const updatedTests = tests.map((test, index) => ({
        ...test,
        completed: updatedCompletedTests.includes(index)
      }));
      setTests(updatedTests);
      sessionStorage.setItem('testCollections', JSON.stringify(updatedTests));
      
      setExamStarted(false);
      
      // Check if all tests are completed
      if (updatedCompletedTests.length === tests.length) {
        setExamCompleted(true);
        sessionStorage.setItem('examCompleted', 'true');
        // Clear accumulated responses as they have been submitted
        sessionStorage.removeItem('accumulatedTestResponses');
        setAccumulatedResponses([]);
        setCurrentView('selection');
        setUnifiedTestStarted(false);
        // Clear unified test states to ensure proper navigation to completed view
        sessionStorage.removeItem('unifiedTestStarted');
        sessionStorage.removeItem('currentTestIndex');
        sessionStorage.removeItem('currentView');
      } else {
        // If more tests remain, start transition
        setCurrentTestIndex(currentTestIndex + 1);
        setCurrentView('transition');
        setTransitionCountdown(5);
      }
    };
    
    // Handler to accumulate test responses from intermediate tests
    const handleTestComplete = (testResponses: any[]) => {
      const updatedResponses = [...accumulatedResponses, ...testResponses];
      setAccumulatedResponses(updatedResponses);
      sessionStorage.setItem('accumulatedTestResponses', JSON.stringify(updatedResponses));
    };

    // Handle transition countdown
    useEffect(() => {
      if (currentView === 'transition' && transitionCountdown > 0) {
        const timer = setTimeout(() => {
          setTransitionCountdown(transitionCountdown - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else if (currentView === 'transition' && transitionCountdown === 0) {
        // Move to next test instructions
        setCurrentView('instructions');
        setTransitionCountdown(5);
      }
    }, [currentView, transitionCountdown]);

    // Check for expired or completed states first (highest priority)
    if (examExpired || examCompleted) {
      // These states should bypass all other logic and show their respective views
      // The actual UI rendering is handled in the main return statement below
    }
    // Multi-test workflow rendering with transition screen
    else if (tests.length > 0 && unifiedTestStarted) {
      // Show transition screen between tests
      if (currentView === 'transition') {
        const previousTest = tests[currentTestIndex - 1];
        const nextTest = tests[currentTestIndex];
        
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  The Test {previousTest.title} is completed
                </h2>
                <p className="text-gray-600">
                  Great job! Preparing next test...
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="text-lg font-semibold text-gray-700">
                  Next: Test{currentTestIndex + 1}
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {transitionCountdown}
                </div>
                <p className="text-sm text-gray-500">
                  Automatically starting in {transitionCountdown} seconds...
                </p>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((5 - transitionCountdown) / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        );
      }
      
      // Show test instructions
      if (currentView === 'instructions') {
        const currentTest = tests[currentTestIndex];
        const isLastTest = currentTestIndex === tests.length - 1;
        
        return (
          <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
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
                  <div className="text-white text-sm">
                    Test {currentTestIndex + 1} of {tests.length}
                  </div>
                </div>
              </div>
            </nav>
            
            {/* Instructions Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-slate-800 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white text-center">
                    {currentTest.title} - Instructions
                  </h2>
                </div>
                
                <div className="p-8 space-y-6">
                  {/* Test Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{currentTest.questions.length}</div>
                      <div className="text-sm text-gray-600">Questions</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{currentTest.duration}</div>
                      <div className="text-sm text-gray-600">Minutes</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{currentTest.totalMarks}</div>
                      <div className="text-sm text-gray-600">Marks</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{currentTest.questionTypes.length}</div>
                      <div className="text-sm text-gray-600">Types</div>
                    </div>
                  </div>
                  
                  {/* Instructions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-600">Test Instructions:</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        Read each question carefully before answering
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        You have {currentTest.duration} minutes to complete this test
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        You can navigate between questions using the question palette
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        Mark questions for review if you want to revisit them
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        {isLastTest 
                          ? 'Click "Final Submit" after the last question to complete the assessment'
                          : 'Click "Save & Next" on the last question to proceed to the next test'
                        }
                      </li>
                    </ul>
                  </div>
                  
                  {/* Question Types */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-blue-600">Question Types in this Test:</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentTest.questionTypes.map((type) => (
                        <span
                          key={type}
                          className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Start Button */}
                  <div className="text-center pt-6">
                    <Button
                      onClick={handleStartExamFromInstructions}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
                      size="lg"
                    >
                      Start Test
                    </Button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        );
      }
      
      // Show exam
      if (currentView === 'exam' && examStarted) {
        const currentTest = tests[currentTestIndex];
        const isLastTest = currentTestIndex === tests.length - 1;
        const isFirstTest = currentTestIndex === 0; // Identify first test
        
        return (
          <ExamDashboard
            examTitle={examConfig.title}
            duration={examConfig.duration}
            questions={sampleQuestions}
            onExit={handleExamComplete}
            isLastTest={isLastTest}
            onTestComplete={handleTestComplete}
            isFirstTest={isFirstTest}
            currentTest={currentTest}
          />
        );
      }
    }

    // Test selection view (for unified workflow) - only if not expired/completed
    if (tests.length > 0 && !examExpired && !examCompleted) {
      const testsWithCompletion = tests.map((test, index) => ({
        ...test,
        completed: completedTests.includes(index)
      }));
      
      return (
        <TestSelection
          tests={testsWithCompletion}
          onStartUnifiedTest={handleStartUnifiedTest}
          candidateName={candidateName}
        />
      );
    }

    // Fallback to single exam view (backward compatibility) - only if not expired/completed
    if (examStarted && !examExpired && !examCompleted) {
      return (
        <ExamDashboard
          examTitle={examConfig.title}
          duration={examConfig.duration}
          questions={sampleQuestions}
          onExit={() => setExamStarted(false)}
          isLastTest={true}
          isFirstTest={true}
        />
      );
    }

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
              <div className="text-sm text-slate-300">Online Assessment System</div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-2">
          {/* Hero Section */}
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Advanced Online Proctoring Platform
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Experience secure, user-friendly online assessments with live camera monitoring,
              fullscreen security, and comprehensive question types.
            </p>
          </div>

          {/* Key Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Live Proctoring</h3>
                <p className="text-sm text-gray-600">
                  Real-time camera monitoring with recording capabilities
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                  <Monitor className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Fullscreen Security</h3>
                <p className="text-sm text-gray-600">
                  Prevents tab switching and unauthorized activities
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Multiple Question Types</h3>
                <p className="text-sm text-gray-600">
                  MCQ, Essay, Fill-blanks, Audio/Image based questions
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Smart Tracking</h3>
                <p className="text-sm text-gray-600">
                  Real-time response tracking with color-coded status
                </p>
              </div>
            </div>
          </div>

          {/* Assessment Overview Section - Modified for completed and expired states */}
          {examExpired ? (
            /* Centered Assessment Expired Section */
            <div className="flex justify-center items-center min-h-[400px] mb-8">
              <div className="bg-white rounded-lg shadow-lg border overflow-hidden max-w-2xl w-full">
                <div className="bg-slate-800 px-6 py-6">
                  <div className="flex items-center justify-center gap-3 text-white">
                    <AlertCircle className="w-6 h-6" />
                    <h2 className="text-2xl font-semibold">Assessment Link Expired</h2>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                      <AlertCircle className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900">The assessment link has expired</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      This assessment is no longer available. The link you used has expired and cannot be accessed anymore.
                    </p>
                   
                  </div>
                </div>
              </div>
            </div>
          ) : examCompleted ? (
            /* Centered Assessment Completed Section */
            <div className="flex justify-center items-center min-h-[400px] mb-8">
              <div className="bg-white rounded-lg shadow-lg border overflow-hidden max-w-2xl w-full">
                <div className="bg-slate-800 px-6 py-6">
                  <div className="flex items-center justify-center gap-3 text-white">
                    <Award className="w-6 h-6" />
                    <h2 className="text-2xl font-semibold">Assessment Completed</h2>
                  </div>
                </div>
                
                <div className="p-8">
                  {/* Completed Tests */}
                  <div className="text-center space-y-6">
                    {tests && tests.length > 0 ? (
                      <>
                        <h3 className="text-xl font-medium text-gray-900">Completed Tests</h3>
                        <div className="flex flex-wrap justify-center gap-3">
                          {tests.filter(test => test.completed).map((test, index) => (
                            <span key={test.tid || index} className="px-5 py-3 text-sm rounded-full bg-green-100 text-green-700 border border-green-300 font-medium">
                              {test.title} - Completed
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-600 text-lg">
                          All tests have been successfully completed and submitted.
                        </p>
                      </>
                    ) : (
                      // Just show success message when tests array is empty (after refresh)
                      <p className="text-gray-600 text-lg">
                        All tests have been successfully completed and submitted.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Original Assessment Overview for Active Tests */
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Compact Test Details Card */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="bg-slate-800 px-4 py-3">
                    <div className="flex items-center gap-2 text-white">
                      <Award className="w-5 h-5" />
                      <h2 className="text-lg font-medium">{examConfig.title}</h2>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {/* Compact Stats Grid */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl font-semibold text-blue-600">{examConfig.totalQuestions}</div>
                        <div className="text-xs text-gray-600">Questions</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xl font-semibold text-green-600">{examConfig.duration}</div>
                        <div className="text-xs text-gray-600">Minutes</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-xl font-semibold text-purple-600">{examConfig.totalMarks}</div>
                        <div className="text-xs text-gray-600">Marks</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-xl font-semibold text-orange-600">
                          {Array.from(new Set(sampleQuestions.map(q => q.type))).length}
                        </div>
                        <div className="text-xs text-gray-600">Types</div>
                      </div>
                    </div>

                    {/* Question Types */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Question Types</h3>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(new Set(sampleQuestions.map(q => q.type))).map((type) => (
                          <span
                            key={type}
                            className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Start Assessment Card - Only show if not completed */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Ready to Start?</h3>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>Duration: {examConfig.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FileText className="w-3 h-3" />
                      <span>{examConfig.totalQuestions} questions</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setExamStarted(true)}
                    className="w-full bg-slate-800 hover:bg-slate-700"
                    size="sm"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Start Assessment
                  </Button>
                </div>

                {/* Compact Notice */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-slate-900 mb-1">Notice</h4>
                  <p className="text-xs text-slate-700">
                    Camera permission and fullscreen mode required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Platform Features */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Platform Features</h2>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Advanced Security</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Comprehensive security monitoring including tab switching detection,
                    fullscreen enforcement, and camera surveillance.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Real-time Tracking</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Live response tracking with color-coded question palette showing
                    answered, unanswered, and marked questions.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Flexible Content</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Support for various question types including multimedia content,
                    ensuring comprehensive assessment capabilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  };

  export default Index;
   //   <CardContent className="p-8 space-y-8">
          //     {/* Exam Stats */}
          //     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          //       <div className="flex flex-col items-center bg-accent/40 p-4 rounded-xl shadow-sm hover:shadow-md transition">
          //         <FileText className="w-6 h-6 text-primary mb-2" />
          //         <div className="text-xl font-bold text-primary">{examConfig.totalQuestions}</div>
          //         <span className="text-sm text-muted-foreground">Questions</span>
          //       </div>
          //       <div className="flex flex-col items-center bg-accent/40 p-4 rounded-xl shadow-sm hover:shadow-md transition">
          //         <Clock className="w-6 h-6 text-primary mb-2" />
          //         <div className="text-xl font-bold text-primary">{examConfig.duration}</div>
          //         <span className="text-sm text-muted-foreground">Minutes</span>
          //       </div>
          //       <div className="flex flex-col items-center bg-accent/40 p-4 rounded-xl shadow-sm hover:shadow-md transition">
          //         <CheckCircle className="w-6 h-6 text-primary mb-2" />
          //         <div className="text-xl font-bold text-primary">{examConfig.totalMarks}</div>
          //         <span className="text-sm text-muted-foreground">Total Marks</span>
          //       </div>
          //       <div className="flex flex-col items-center bg-accent/40 p-4 rounded-xl shadow-sm hover:shadow-md transition">
          //         <Monitor className="w-6 h-6 text-primary mb-2" />
          //         <div className="text-xl font-bold text-primary">
          //           {Array.from(new Set(sampleQuestions.map(q => q.type))).length}
          //         </div>
          //         <span className="text-sm text-muted-foreground">Question Types</span>
          //       </div>
          //     </div>

          //     {/* Question Types Legend */}
          //     <div>
          //       <h3 className="font-semibold text-center mb-3">Included Question Types</h3>
          //       <div className="flex flex-wrap justify-center gap-3">
          //         {Array.from(new Set(sampleQuestions.map(q => q.type))).map((type) => (
          //           <span
          //             key={type}
          //             className="px-4 py-1 text-sm rounded-full bg-green-100 text-green-700 border border-green-300"
          //           >
          //             {type}
          //           </span>
          //         ))}
          //       </div>
          //     </div>

          //     {/* Info Note */}
          //     <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-center">
          //       <p className="text-blue-800">
          //         <strong>Note:</strong> Camera permission & fullscreen mode will be requested once you
          //         start the assessment.
          //       </p>
          //     </div>

          //     {/* Start Button */}
          //     <div className="text-center">
          //       <Button
          //         onClick={() => setExamStarted(true)}
          //         className="w-full md:w-1/2 font-semibold py-6 text-lg"
          //         size="lg"
          //       >
          //         <Users className="w-5 h-5 mr-2" />
          //         Start Assessment
          //       </Button>
          //     </div>
          //   </CardContent>
          // </Card>


