import React, { useState, useEffect, useRef } from 'react';
import { Word, EBBINGHAUS_STAGES, WordCheckState } from './types';
import { 
  createNewWord, 
  updateWordStatuses, 
  INITIAL_WORD_LIST 
} from './lib/ebbinghaus';
import WordTable from './components/WordTable';
import QuizSection from './components/QuizSection';
import WordForm from './components/WordForm';
import ReviewSchedule from './components/ReviewSchedule';
import { 
  Award, 
  BookOpen, 
  Download, 
  Upload, 
  RotateCcw, 
  Sparkles,
  HelpCircle,
  FileDown
} from 'lucide-react';

export default function App() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial State Loading & Auto-Translation Bootstrap
  useEffect(() => {
    const savedWords = localStorage.getItem('ebbinghaus_words');
    const savedTime = localStorage.getItem('ebbinghaus_simulated_time');

    let initialWords: Word[] = [];
    if (savedWords) {
      try {
        initialWords = JSON.parse(savedWords);
      } catch (e) {
        console.error("Failed to parse saved words:", e);
      }
    }

    // If no words found, initialize with the user's requested 24 words
    if (initialWords.length === 0) {
      initialWords = INITIAL_WORD_LIST.map((word) => createNewWord(word));
    }

    setWords(initialWords);

    if (savedTime) {
      setCurrentTime(new Date(savedTime));
    } else {
      setCurrentTime(new Date());
    }
  }, []);

  // 2. Synchronize localStorage & recalculate Ebbinghaus schedules automatically
  useEffect(() => {
    if (words.length > 0) {
      localStorage.setItem('ebbinghaus_words', JSON.stringify(words));
    }
  }, [words]);

  useEffect(() => {
    localStorage.setItem('ebbinghaus_simulated_time', currentTime.toISOString());
    // Auto-update word due statuses whenever simulated time shifts
    setWords((prevWords) => updateWordStatuses(prevWords, currentTime));
  }, [currentTime]);

  // Periodic standard time increment (1 second = 1 second) in background
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = new Date(prev.getTime() + 1000);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Batch Translate function
  const triggerBatchTranslation = async (targetWords: Word[]) => {
    const wordsToTranslate = targetWords.filter(w => !w.translation);
    if (wordsToTranslate.length === 0) return;

    setIsBatchLoading(true);
    // Mark all as loading
    const initialLoadingState = { ...isTranslating };
    wordsToTranslate.forEach(w => {
      initialLoadingState[w.id] = true;
    });
    setIsTranslating(initialLoadingState);

    try {
      const spellings = wordsToTranslate.map(w => w.word);
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: spellings }),
      });

      if (!response.ok) throw new Error("Translation request failed");

      const data = await response.json();
      const translations = data.translations || {};

      setWords((prevWords) => {
        return prevWords.map((w) => {
          const cleanW = w.word.toLowerCase().trim();
          if (translations[cleanW]) {
            return {
              ...w,
              translation: translations[cleanW].translation,
              example: translations[cleanW].example,
              exampleTranslation: translations[cleanW].exampleTranslation,
            };
          }
          return w;
        });
      });
    } catch (e) {
      console.error("Batch translation failed:", e);
    } finally {
      // Clear translating state
      setIsTranslating((prev) => {
        const next = { ...prev };
        wordsToTranslate.forEach(w => {
          delete next[w.id];
        });
        return next;
      });
      setIsBatchLoading(false);
    }
  };

  // Bootstrap initial translations once words are populated
  useEffect(() => {
    if (words.length > 0 && !isBatchLoading) {
      const untranslated = words.filter(w => !w.translation);
      if (untranslated.length > 0) {
        triggerBatchTranslation(words);
      }
    }
  }, [words]);

  // 4. Individual word handlers
  const handleToggleCheck = (wordId: string, stageId: string) => {
    setWords((prevWords) =>
      prevWords.map((w) => {
        if (w.id !== wordId) return w;

        const currentCheck = w.checks[stageId];
        if (!currentCheck) return w;

        // Toggle logic:
        // If completed -> toggle back to ready (due) or pending based on time
        // If due or failed or pending -> mark as completed!
        let newStatus: WordCheckState['status'] = 'completed';
        let completedAt: string | undefined = new Date().toISOString();

        if (currentCheck.status === 'completed') {
          const dueTime = new Date(currentCheck.dueTime);
          newStatus = currentTime >= dueTime ? 'due' : 'pending';
          completedAt = undefined;
        }

        const updatedChecks = {
          ...w.checks,
          [stageId]: {
            ...currentCheck,
            status: newStatus,
            completedAt,
          },
        };

        // Extra polish: If we complete stage0, automatically make stage1 due/ready
        return {
          ...w,
          checks: updatedChecks,
        };
      })
    );
  };

  const handleUpdateWord = (wordId: string, updatedFields: Partial<Word>) => {
    setWords((prevWords) =>
      prevWords.map((w) => {
        if (w.id === wordId) {
          // If spelling was modified, reset translations so it auto-translates again
          const hasSpellingChanged = updatedFields.word && updatedFields.word !== w.word;
          return {
            ...w,
            ...updatedFields,
            ...(hasSpellingChanged ? { translation: '', example: '', exampleTranslation: '' } : {}),
          };
        }
        return w;
      })
    );
  };

  const handleDeleteWord = (wordId: string) => {
    setWords((prevWords) => prevWords.filter((w) => w.id !== wordId));
  };

  const handleAutoTranslateSingle = async (wordId: string) => {
    const targetWord = words.find(w => w.id === wordId);
    if (!targetWord) return;

    setIsTranslating(prev => ({ ...prev, [wordId]: true }));
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: [targetWord.word] }),
      });

      if (!response.ok) throw new Error("Translation failed");

      const data = await response.json();
      const translations = data.translations || {};
      const cleanW = targetWord.word.toLowerCase().trim();

      if (translations[cleanW]) {
        handleUpdateWord(wordId, {
          translation: translations[cleanW].translation,
          example: translations[cleanW].example,
          exampleTranslation: translations[cleanW].exampleTranslation,
        });
      }
    } catch (e) {
      console.error(e);
      alert("智能获取失败，请手动编辑释义。");
    } finally {
      setIsTranslating(prev => ({ ...prev, [wordId]: false }));
    }
  };

  // 5. Add custom single or multiple words
  const handleAddWords = (wordList: string[]) => {
    const newWords = wordList.map((spelling) => createNewWord(spelling, "", "", "", currentTime));
    setWords((prev) => [...newWords, ...prev]);
    // Triggers auto-translate through useEffect
  };

  // 6. Time Simulation
  const handleSimulateTime = (hours: number) => {
    setCurrentTime((prev) => new Date(prev.getTime() + hours * 60 * 60 * 1000));
  };

  const handleResetTime = () => {
    setCurrentTime(new Date());
  };

  // 7. Test Results Sync with Ebbinghaus status
  const handleQuizCompleted = (incorrectWordIds: string[], correctWordIds: string[]) => {
    setWords((prevWords) => {
      return prevWords.map((w) => {
        const updatedChecks = { ...w.checks };
        let changed = false;

        // Correctly answered words: complete the earliest due or failed stage
        if (correctWordIds.includes(w.id)) {
          // Find the active Ebbinghaus stage (either 'due' or 'failed')
          const activeStage = EBBINGHAUS_STAGES.find(s => 
            updatedChecks[s.id]?.status === 'due' || updatedChecks[s.id]?.status === 'failed'
          );
          if (activeStage) {
            updatedChecks[activeStage.id] = {
              ...updatedChecks[activeStage.id],
              status: 'completed',
              completedAt: new Date().toISOString()
            };
            changed = true;
          }
        }

        // Incorrectly answered words: mark the earliest due stage as 'failed'
        if (incorrectWordIds.includes(w.id)) {
          const activeStage = EBBINGHAUS_STAGES.find(s => 
            updatedChecks[s.id]?.status === 'due'
          );
          if (activeStage) {
            updatedChecks[activeStage.id] = {
              ...updatedChecks[activeStage.id],
              status: 'failed'
            };
            changed = true;
          }
        }

        return changed ? { ...w, checks: updatedChecks } : w;
      });
    });
  };

  // 8. Backup Data management
  const exportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(words, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ebbinghaus_words_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].word && parsed[0].checks) {
            setWords(parsed);
            alert("备份导入成功！已成功恢复您的学习进度。");
          } else {
            alert("文件格式不正确，导入失败。请确保导入的是本软件导出的 JSON 备份文件。");
          }
        } catch (err) {
          alert("文件解析失败，请检查备份文件是否完整。");
        }
      };
    }
  };

  const resetToDefault = () => {
    if (confirm("确定要重置当前的学习打卡表吗？这将清除所有新增单词并重置所有打卡复习记录。")) {
      const resetWords = INITIAL_WORD_LIST.map((word) => createNewWord(word));
      setWords(resetWords);
      setCurrentTime(new Date());
      localStorage.removeItem('ebbinghaus_words');
      localStorage.removeItem('ebbinghaus_simulated_time');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans transition-all">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Branding Panel */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/10">
                <Award className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                艾宾浩斯英语单词记忆助手
              </h1>
              <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-semibold text-indigo-700 font-sans flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                AI 智能版
              </span>
            </div>
            <p className="text-slate-500 text-xs font-sans max-w-2xl leading-relaxed">
              根据您的初中单词复盘需求，内置您所提供的 24 个生词，遵循科学的<strong>艾宾浩斯遗忘曲线</strong>（立刻 / 1h / 1d / 2d / 6d / 14d / 30d）自动推算复习节点。结合 AI 自动生成释义、双语中英例句，并配合定制化定期记忆测试，形成高闭环记忆闭环。
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={exportBackup}
              className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all bg-white shadow-sm"
              title="导出当前所有学习进度与打卡记录"
            >
              <Download className="w-3.5 h-3.5" />
              导出备份
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all bg-white shadow-sm"
              title="导入之前备份的 JSON 文件"
            >
              <Upload className="w-3.5 h-3.5" />
              导入备份
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={importBackup} 
              accept=".json" 
              className="hidden" 
            />
            <button
              onClick={resetToDefault}
              className="px-4 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all bg-white shadow-sm"
              title="重置到最初的 24 个生词，并清除所有打卡"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置词库
            </button>
          </div>
        </header>

        {/* Dashboard Schedule Widgets */}
        <ReviewSchedule 
          words={words} 
          currentTime={currentTime} 
          onSimulateTime={handleSimulateTime} 
          onResetTime={handleResetTime}
        />

        {/* Body grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main word list (Left column - span 8) */}
          <div className="lg:col-span-8 space-y-6">
            <WordTable
              words={words}
              onToggleCheck={handleToggleCheck}
              onUpdateWord={handleUpdateWord}
              onDeleteWord={handleDeleteWord}
              onAutoTranslate={handleAutoTranslateSingle}
              isTranslating={isTranslating}
            />
          </div>

          {/* Actions & testing sidebars (Right column - span 4) */}
          <div className="lg:col-span-4 space-y-6">
            <QuizSection 
              words={words} 
              onQuizCompleted={handleQuizCompleted} 
            />
            <WordForm 
              onAddWords={handleAddWords} 
              isTranslating={isBatchLoading}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
