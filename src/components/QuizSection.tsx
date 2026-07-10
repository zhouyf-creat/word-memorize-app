import React, { useState } from 'react';
import { Word, Quiz, QuizQuestion } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Award, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  HelpCircle,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizSectionProps {
  words: Word[];
  onQuizCompleted: (incorrectWordIds: string[], correctWordIds: string[]) => void;
}

export default function QuizSection({ words, onQuizCompleted }: QuizSectionProps) {
  const [loading, setLoading] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);

  // Eligible words for testing
  const eligibleWords = words.filter(w => w.translation);

  const startNewQuiz = async () => {
    if (eligibleWords.length < 4) {
      alert("请至少拥有4个已翻译的单词，才能进行词汇测试！");
      return;
    }

    setLoading(true);
    try {
      // Pick a smart mix of words: prioritize words that are due or failed
      const dueOrFailed = eligibleWords.filter(w => 
        Object.values(w.checks).some(c => c.status === 'due' || c.status === 'failed')
      );
      
      let testPool = [...dueOrFailed];
      if (testPool.length < 6) {
        // pad with other random words
        const remaining = eligibleWords.filter(w => !testPool.some(tp => tp.id === w.id));
        const shuffledRemaining = remaining.sort(() => 0.5 - Math.random());
        testPool = [...testPool, ...shuffledRemaining.slice(0, 6 - testPool.length)];
      }

      // Shuffle and limit to max 8 words for the backend to build questions from
      const finalPool = testPool.sort(() => 0.5 - Math.random()).slice(0, 8);
      
      const payload = finalPool.map(w => ({ word: w.word, translation: w.translation }));

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: payload }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch quiz from AI server");
      }

      const data = await response.json();
      
      // Map server questions and match back to wordId
      const questions: QuizQuestion[] = data.questions.map((q: any, i: number) => {
        // Find corresponding wordId
        const foundWord = eligibleWords.find(w => w.word.toLowerCase() === q.word.toLowerCase());
        return {
          id: `q_${i}`,
          wordId: foundWord?.id || '',
          word: q.word,
          type: q.type,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
        };
      });

      setActiveQuiz({
        id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString(),
        questions,
        completed: false
      });
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setQuizFinished(false);
    } catch (error) {
      console.error("Quiz creation error:", error);
      alert("创建测试失败，请重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option: string) => {
    if (selectedAnswer !== null) return; // already answered this question
    setSelectedAnswer(option);
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;

    // Save answer to active quiz questions state
    const updatedQuestions = [...activeQuiz.questions];
    const curQ = updatedQuestions[currentQuestionIndex];
    curQ.userAnswer = selectedAnswer || '';
    curQ.isCorrect = selectedAnswer === curQ.correctAnswer;

    setActiveQuiz({
      ...activeQuiz,
      questions: updatedQuestions,
    });

    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      // Finish Quiz!
      setQuizFinished(true);
      
      // Calculate correct and incorrect word IDs
      const incorrectWordIds: string[] = [];
      const correctWordIds: string[] = [];

      updatedQuestions.forEach(q => {
        if (q.wordId) {
          if (q.isCorrect) {
            correctWordIds.push(q.wordId);
          } else {
            incorrectWordIds.push(q.wordId);
          }
        }
      });

      // Notify parent component to update word check-in state
      onQuizCompleted(incorrectWordIds, correctWordIds);
    }
  };

  const handleReset = () => {
    setActiveQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setQuizFinished(false);
  };

  const scoreCount = activeQuiz?.questions.filter(q => q.isCorrect).length || 0;
  const totalQuestions = activeQuiz?.questions.length || 0;

  return (
    <div id="quiz-section-container" className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl border border-indigo-950 p-6 md:p-8 shadow-xl relative overflow-hidden transition-all duration-300">
      {/* Dynamic light background glowing bubble */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {!activeQuiz && !loading && (
        <div className="text-center py-8 max-w-lg mx-auto">
          <div className="inline-flex p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-400 mb-5 ring-1 ring-indigo-500/20">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            艾宾浩斯智能测试系统
          </h2>
          <p className="text-indigo-200/80 text-sm leading-relaxed mb-6 font-sans">
            本系统由人工智能驱动，根据您当前的记忆状况，智能挑选当前处于复习期（Due）或待巩固的单词，生成中英双向选择题。
            测试结果将<strong className="text-indigo-300">自动同步并更新</strong>您的遗忘曲线打卡表！
          </p>
          <button
            onClick={startNewQuiz}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 active:scale-95 transition-all text-white font-semibold rounded-xl inline-flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            开始今日记忆诊断测试
          </button>
          <div className="mt-4 text-[11px] text-indigo-300/60">
            * 答对的单词对应到期节点会自动打卡标记，答错的单词会变红提醒您重新记忆
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <div className="relative inline-block w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-400 animate-spin"></div>
          </div>
          <p className="text-indigo-200 font-medium">老师正在用 AI 为您精心组卷中...</p>
          <p className="text-indigo-300/60 text-xs mt-1">根据您的复习进度，定制专属的中译英与英译中测试</p>
        </div>
      )}

      {activeQuiz && !quizFinished && (
        <div>
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-indigo-850/60 mb-6">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-mono tracking-wider uppercase text-indigo-300">
                进度：{currentQuestionIndex + 1} / {totalQuestions}
              </span>
            </div>
            <button 
              onClick={handleReset}
              className="text-xs text-indigo-300/70 hover:text-white transition-colors"
            >
              放弃本次测试
            </button>
          </div>

          {/* Question card */}
          <div className="mb-8">
            <span className="inline-block px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-md mb-3">
              {activeQuiz.questions[currentQuestionIndex].type === 'en-zh' ? '英译中 (中选英)' : '中译英 (英选中)'}
            </span>
            <h3 className="text-xl md:text-2xl font-bold leading-snug tracking-tight text-white/95">
              {activeQuiz.questions[currentQuestionIndex].question}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {activeQuiz.questions[currentQuestionIndex].options?.map((option, idx) => {
              const alphabet = ['A', 'B', 'C', 'D'];
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === activeQuiz.questions[currentQuestionIndex].correctAnswer;
              
              // Styling based on answered state
              let btnStyle = "p-4 rounded-xl border text-left font-sans transition-all text-sm relative flex items-center justify-between ";
              if (selectedAnswer === null) {
                btnStyle += "bg-indigo-950/40 border-indigo-800/50 hover:bg-indigo-900/60 hover:border-indigo-600 text-white cursor-pointer active:scale-[0.99]";
              } else {
                if (isSelected) {
                  btnStyle += isCorrectOption 
                    ? "bg-emerald-950/70 border-emerald-500 text-emerald-200" 
                    : "bg-rose-950/70 border-rose-500 text-rose-200";
                } else if (isCorrectOption) {
                  btnStyle += "bg-emerald-950/40 border-emerald-500/70 text-emerald-300";
                } else {
                  btnStyle += "bg-indigo-950/20 border-indigo-950/50 text-indigo-300/40 cursor-not-allowed";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(option)}
                  disabled={selectedAnswer !== null}
                  className={btnStyle}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-mono font-bold ${
                      selectedAnswer === null 
                        ? 'bg-indigo-800/40 text-indigo-300' 
                        : isCorrectOption 
                          ? 'bg-emerald-50 text-white' 
                          : isSelected 
                            ? 'bg-rose-500 text-white' 
                            : 'bg-indigo-900/40 text-indigo-500'
                    }`}>
                      {alphabet[idx]}
                    </span>
                    <span className="font-medium text-[15px]">{option}</span>
                  </div>

                  {selectedAnswer !== null && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {selectedAnswer !== null && isSelected && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Navigation footer */}
          <AnimatePresence>
            {selectedAnswer !== null && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-indigo-950/50 border border-indigo-850 p-4 rounded-xl"
              >
                <div className="text-sm">
                  {selectedAnswer === activeQuiz.questions[currentQuestionIndex].correctAnswer ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      🎉 答对了！继续保持！
                    </span>
                  ) : (
                    <div className="text-left">
                      <span className="text-rose-400 font-semibold flex items-center gap-1.5 mb-0.5">
                        ❌ 答错了
                      </span>
                      <span className="text-indigo-200/70 text-xs">
                        正确答案是：<strong className="text-emerald-400 font-medium">{activeQuiz.questions[currentQuestionIndex].correctAnswer}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-xs font-bold tracking-wide uppercase inline-flex items-center gap-1.5 active:scale-95 transition-all text-white"
                >
                  {currentQuestionIndex === totalQuestions - 1 ? '完成并看结果' : '下一题'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Quiz finished card */}
      {quizFinished && activeQuiz && (
        <div className="text-center py-6">
          <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-400 rounded-3xl mb-4 border border-emerald-500/20">
            <Award className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-1">测试完成！</h2>
          <p className="text-indigo-200/70 text-sm mb-6">本次成绩与您的艾宾浩斯复习表格实时同步</p>

          {/* Score display */}
          <div className="flex justify-center items-center gap-8 bg-indigo-950/50 border border-indigo-850 rounded-xl p-5 max-w-sm mx-auto mb-8 text-left">
            <div>
              <div className="text-[10px] text-indigo-400 uppercase font-mono tracking-wider font-bold">答对题数</div>
              <div className="text-3xl font-extrabold text-white mt-1">
                {scoreCount} <span className="text-indigo-400 text-lg">/ {totalQuestions}</span>
              </div>
            </div>
            <div className="border-l border-indigo-850 h-10"></div>
            <div>
              <div className="text-[10px] text-indigo-400 uppercase font-mono tracking-wider font-bold">正确率</div>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                {Math.round((scoreCount / totalQuestions) * 100)}%
              </div>
            </div>
          </div>

          {/* Correct / Incorrect Summary Details */}
          <div className="max-w-md mx-auto mb-8 text-left space-y-2.5">
            <h4 className="text-xs font-semibold text-indigo-300 font-mono tracking-wider uppercase mb-1">答题分析</h4>
            {activeQuiz.questions.map((q, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/40 p-2.5 border border-indigo-950 rounded-lg">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-white font-mono">{q.word}</span>
                  <span className="text-indigo-300/70">{q.type === 'en-zh' ? '英译中' : '中译英'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {q.isCorrect ? (
                    <span className="text-emerald-400 flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-full font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      已打卡
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 rounded-full font-medium">
                      <XCircle className="w-3 h-3" />
                      须强化
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={startNewQuiz}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-xs font-bold text-white transition-all active:scale-95 shadow-md shadow-indigo-500/10"
            >
              再测一次
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-all active:scale-95"
            >
              返回我的计划表
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
