import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, BookOpen, Award, Zap } from "lucide-react";
import { toast } from "sonner";

export interface LessonContent {
  id: string;
  title: string;
  reading: string;
  keyPoints: string[];
  quiz: QuizQuestion[];
  xpReward: number;
  skyReward: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface InteractiveLessonProps {
  lesson: LessonContent;
  onComplete: (score: number) => void;
}

export function InteractiveLesson({ lesson, onComplete }: InteractiveLessonProps) {
  const [stage, setStage] = useState<"reading" | "quiz" | "results">("reading");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleQuizStart = () => {
    setStage("quiz");
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer(null);
  };

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      toast.error("Please select an answer");
      return;
    }

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (currentQuestion < lesson.quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      // Quiz complete
      const score = calculateScore(newAnswers);
      setStage("results");
      onComplete(score);
    }
  };

  const calculateScore = (userAnswers: number[]) => {
    let correct = 0;
    userAnswers.forEach((answer, idx) => {
      if (answer === lesson.quiz[idx].correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / lesson.quiz.length) * 100);
  };

  if (stage === "reading") {
    return (
      <div className="space-y-6">
        {/* Reading Material */}
        <Card className="bg-[#0e0a1a]/90 border border-white/5">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">{lesson.title}</h2>
            
            <div className="prose prose-invert max-w-none mb-6">
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {lesson.reading}
              </p>
            </div>

            {/* Key Points */}
            <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Key Takeaways
              </h3>
              <ul className="space-y-2">
                {lesson.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                    <span className="text-cyan-400 font-bold mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Rewards Preview */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-400 font-semibold mb-1">
                  <Zap className="w-4 h-4" />
                  SKY4 Reward
                </div>
                <p className="text-2xl font-bold text-yellow-300">+{lesson.skyReward}</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-purple-400 font-semibold mb-1">
                  <Award className="w-4 h-4" />
                  XP Reward
                </div>
                <p className="text-2xl font-bold text-purple-300">+{lesson.xpReward}</p>
              </div>
            </div>

            <Button
              onClick={handleQuizStart}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3"
            >
              Take Quiz ({lesson.quiz.length} questions)
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "quiz") {
    const question = lesson.quiz[currentQuestion];
    const progress = ((currentQuestion + 1) / lesson.quiz.length) * 100;

    return (
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-400">
            Question {currentQuestion + 1} of {lesson.quiz.length}
          </span>
          <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="bg-[#0e0a1a]/90 border border-white/5">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">{question.question}</h3>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {question.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAnswer === idx
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswer === idx
                          ? "border-cyan-500 bg-cyan-500"
                          : "border-slate-600"
                      }`}
                    >
                      {selectedAnswer === idx && (
                        <span className="text-white font-bold text-sm">✓</span>
                      )}
                    </div>
                    <span className="text-white">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3 disabled:opacity-50"
            >
              {currentQuestion === lesson.quiz.length - 1 ? "Submit Quiz" : "Next Question"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "results") {
    const score = calculateScore(answers);
    const passed = score >= 70;

    return (
      <div className="space-y-6">
        {/* Results Card */}
        <Card className="bg-[#0e0a1a]/90 border border-white/5">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              {passed ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              )}
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              {passed ? "Congratulations! 🎉" : "Keep Learning"}
            </h2>
            <p className="text-slate-400 mb-6">
              {passed
                ? "You've successfully completed this lesson!"
                : "Review the material and try again."}
            </p>

            {/* Score */}
            <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
              <p className="text-slate-400 text-sm mb-2">Your Score</p>
              <p className="text-5xl font-bold text-cyan-400">{score}%</p>
              <p className="text-slate-400 text-sm mt-2">
                {answers.filter((ans, idx) => ans === lesson.quiz[idx].correctAnswer).length} of{" "}
                {lesson.quiz.length} correct
              </p>
            </div>

            {/* Rewards */}
            {passed && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="text-yellow-400 font-semibold text-sm mb-1">SKY4 Earned</div>
                  <p className="text-2xl font-bold text-yellow-300">+{lesson.skyReward}</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="text-purple-400 font-semibold text-sm mb-1">XP Earned</div>
                  <p className="text-2xl font-bold text-purple-300">+{lesson.xpReward}</p>
                </div>
              </div>
            )}

            {/* Answer Review */}
            <div className="bg-slate-800/30 rounded-lg p-6 text-left mb-6">
              <h3 className="font-semibold text-white mb-4">Answer Review</h3>
              <div className="space-y-4">
                {lesson.quiz.map((q, idx) => {
                  const isCorrect = answers[idx] === q.correctAnswer;
                  return (
                    <div key={idx} className="pb-4 border-b border-slate-700 last:border-0">
                      <div className="flex items-start gap-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-white font-semibold text-sm">{q.question}</p>
                          <p className="text-slate-400 text-xs mt-1">
                            Your answer: <span className={isCorrect ? "text-green-400" : "text-red-400"}>{q.options[answers[idx]]}</span>
                          </p>
                          {!isCorrect && (
                            <p className="text-slate-400 text-xs mt-1">
                              Correct: <span className="text-green-400">{q.options[q.correctAnswer]}</span>
                            </p>
                          )}
                          <p className="text-slate-500 text-xs mt-2 italic">{q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={() => {
                setStage("reading");
                setCurrentQuestion(0);
                setAnswers([]);
                setSelectedAnswer(null);
              }}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3"
            >
              {passed ? "Next Lesson" : "Try Again"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
