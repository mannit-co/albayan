  import React, { useState, useEffect } from 'react';
  import { useParams } from 'react-router-dom';
  import { Button } from '@/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  import { ExamDashboard } from '@/components/ExamDashboard';
  import { sampleQuestions as defaultQuestions, examConfig as defaultConfig, fetchSampleQuestions } from '@/data/sampleExam';
  import Albayan from '../images/Albayan.jpg'
  import {
    Monitor,
    Camera,
    Shield,
    Clock,
    FileText,
    CheckCircle,
    Users,
    Award
  } from 'lucide-react';

  const Index = () => {
    const [examStarted, setExamStarted] = useState(false);
    const [examConfig, setExamConfig] = useState(defaultConfig);
    const [sampleQuestions, setSampleQuestions] = useState(defaultQuestions);
    const [examCompleted, setExamCompleted] = useState(false);
    const [candidateName, setCandidateName] = useState<string | null>(null);

    // 👇 Read uniqueTestId from URL if present
    const { uniqueTestId } = useParams();
    console.log('uniqueTestId', uniqueTestId)
    // Load from sessionStorage on mount
    useEffect(() => {
      const storedConfig = sessionStorage.getItem("examConfig");
      const storedQuestions = sessionStorage.getItem("sampleQuestions");

      if (storedConfig && storedQuestions) {
        setExamConfig(JSON.parse(storedConfig));
        setSampleQuestions(JSON.parse(storedQuestions));
      }
      // Check if exam is already completed
      setExamCompleted(sessionStorage.getItem('examCompleted') === 'true');

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
      }
    }, [examStarted]);


    // Fetch questions from API if uniqueTestId is present
    useEffect(() => {
      if (uniqueTestId) {
        fetchSampleQuestions(uniqueTestId).then((questions) => {
          setSampleQuestions(questions);

          // load updated config from sessionStorage
          const storedConfig = sessionStorage.getItem("examConfig");
          if (storedConfig) {
            setExamConfig(JSON.parse(storedConfig));
          }
        });
      }
    }, [uniqueTestId]);

    if (examStarted) {
      return (
        <ExamDashboard
          examTitle={examConfig.title}
          duration={examConfig.duration}
          questions={sampleQuestions}
          onExit={() => setExamStarted(false)}
        />
      );
    }

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="exam-header">
          <div className="flex items-center gap-3">
            <img
              src={Albayan}   // ✅ use curly braces since Albayan is an imported variable
              alt="Albayan Logo"
              className="w-8 h-10 object-contain"
            />
            <h1 className="text-2xl font-bold">Albayan Assessment</h1>
          </div>
          <div className="text-sm opacity-90">Online Assessment System</div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-8">


            {/* Hero Section */}
            <div className="text-center space-y-4 py-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Advanced Online Proctoring Platform
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Experience secure, user-friendly online assessments with live camera monitoring,
                fullscreen security, and comprehensive question types.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="text-center p-6">
                <CardContent className="space-y-3">
                  <Camera className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="font-semibold">Live Proctoring</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time camera monitoring with recording capabilities
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="space-y-3">
                  <Monitor className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="font-semibold">Fullscreen Security</h3>
                  <p className="text-sm text-muted-foreground">
                    Prevents tab switching and unauthorized activities
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="space-y-3">
                  <FileText className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="font-semibold">Multiple Question Types</h3>
                  <p className="text-sm text-muted-foreground">
                    MCQ, Essay, Fill-blanks, Audio/Image based questions
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="space-y-3">
                  <CheckCircle className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="font-semibold">Smart Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time response tracking with color-coded status
                  </p>
                </CardContent>
              </Card>
            </div>


            
              <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl flex items-center justify-center gap-3">
                    <Award className="w-6 h-6 text-primary" />
                    {examConfig.title} {/* Dynamic title */}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-accent/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{examConfig.totalQuestions}</div>
                      <div className="text-sm text-muted-foreground">Questions</div>
                    </div>
                    <div className="bg-accent/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{examConfig.duration}</div>
                      <div className="text-sm text-muted-foreground">Minutes</div>
                    </div>
                    <div className="bg-accent/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{examConfig.totalMarks}</div>
                      <div className="text-sm text-muted-foreground">Total Marks</div>
                    </div>
                    <div className="bg-accent/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {Array.from(new Set(sampleQuestions.map(q => q.type))).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Question Types</div>
                    </div>
                  </div>


                {/* Question Types Legend */}
                <div>
                  <h3 className="font-semibold text-center mb-3">Included Question Types</h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {Array.from(new Set(sampleQuestions.map(q => q.type))).map((type) => (
                      <span
                        key={type}
                        className="px-4 py-1 text-sm rounded-full bg-green-100 text-green-700 border border-green-300"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
                  <p className="text-blue-800">
                    <strong>Note:</strong> This is an assessment to showcase the platform's capabilities.
                    Camera permission and fullscreen mode will be requested upon starting the exam.
                  </p>
                </div>

                {examCompleted ? (
                  <div className="text-center space-y-3 p-6 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-center gap-2 text-green-700 font-semibold">
                      <CheckCircle className="w-5 h-5" />
                      Thank you for attending the exam.
                    </div>
                    <p className="text-sm text-green-700">You have already submitted your responses. The exam cannot be started again.</p>
                  </div>
                ) : (
                  <Button
                    onClick={() => setExamStarted(true)}
                    className="w-full"
                    size="lg"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Start Assessment
                  </Button>
                )}
              </CardContent>
            </Card>



            {/* Platform Features */}
            <div className="text-center space-y-4 py-8">
              <h2 className="text-2xl font-bold">Platform Features</h2>
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <Shield className="w-8 h-8 text-primary" />
                    <h3 className="font-semibold">Advanced Security</h3>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive security monitoring including tab switching detection,
                      fullscreen enforcement, and camera surveillance.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-3">
                    <Clock className="w-8 h-8 text-primary" />
                    <h3 className="font-semibold">Real-time Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      Live response tracking with color-coded question palette showing
                      answered, unanswered, and marked questions.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <h3 className="font-semibold">Flexible Content</h3>
                    <p className="text-sm text-muted-foreground">
                      Support for various question types including multimedia content,
                      ensuring comprehensive assessment capabilities.
                    </p>
                  </CardContent>
                </Card>
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


