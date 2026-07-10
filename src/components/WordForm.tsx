import React, { useState } from 'react';
import { Plus, Sparkles, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface WordFormProps {
  onAddWords: (wordList: string[]) => void;
  isTranslating: boolean;
}

export default function WordForm({ onAddWords, isTranslating }: WordFormProps) {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inputText.trim()) {
      setError('请输入至少一个英文单词！');
      return;
    }

    // Split words by commas, spaces, Chinese commas, or newlines
    const words = inputText
      .split(/[\s,，、\n]+/)
      .map(w => w.trim().replace(/[^a-zA-Z-]/g, '')) // Allow letters and hyphens
      .filter(w => w.length > 0);

    if (words.length === 0) {
      setError('未能识别出有效的英文单词，请确认拼写并用逗号或空格隔开。');
      return;
    }

    onAddWords(words);
    setInputText('');
  };

  return (
    <div id="word-form-container" className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
          <FileSpreadsheet className="w-4 h-4" />
        </div>
        <h3 className="text-base font-bold text-slate-800">导入/添加新单词</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            输入英文单词（支持批量导入）
          </label>
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="例如: library, orange, balloon (支持逗号、空格、分行隔开)"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-sans"
          />
        </div>

        {error && (
          <div className="flex items-start gap-1.5 text-xs text-rose-600 bg-rose-50/50 px-3 py-2 rounded-lg border border-rose-100">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 pt-1">
          <span className="text-[11px] text-slate-400 font-sans leading-relaxed">
            * 单词加入后将<strong className="text-slate-500 font-semibold">自动通过 AI 智能生成</strong>对应中文释义、词性与双语中英例句，免除您繁琐的查询。
          </span>

          <button
            type="submit"
            disabled={isTranslating}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 active:scale-95 transition-all text-white font-semibold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap shadow-indigo-600/10"
          >
            {isTranslating ? (
              <>
                <span className="animate-spin">🌀</span>
                AI 正在努力生成中...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                导入我的单词库
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
