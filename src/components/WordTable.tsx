import React, { useState } from 'react';
import { Word, EBBINGHAUS_STAGES } from '../types';
import { 
  Check, 
  X, 
  Trash2, 
  Sparkles, 
  Search, 
  BookOpen, 
  HelpCircle,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface WordTableProps {
  words: Word[];
  onToggleCheck: (wordId: string, stageId: string) => void;
  onUpdateWord: (wordId: string, updatedFields: Partial<Word>) => void;
  onDeleteWord: (wordId: string) => void;
  onAutoTranslate: (wordId: string) => void;
  isTranslating: Record<string, boolean>;
}

export default function WordTable({
  words,
  onToggleCheck,
  onUpdateWord,
  onDeleteWord,
  onAutoTranslate,
  isTranslating,
}: WordTableProps) {
  const [searchTerm, setSearchString] = useState('');
  const [editingCell, setEditingCell] = useState<{ wordId: string; field: 'word' | 'translation' | 'example' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const filteredWords = words.filter(
    (w) =>
      w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.translation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEditing = (wordId: string, field: 'word' | 'translation' | 'example', value: string) => {
    setEditingCell({ wordId, field });
    setEditValue(value);
  };

  const handleSaveEdit = (wordId: string) => {
    if (editingCell) {
      onUpdateWord(wordId, { [editingCell.field]: editValue });
      setEditingCell(null);
    }
  };

  const formatDueDate = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    
    // If due today
    if (d.toDateString() === now.toDateString()) {
      return `今天 ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) {
      return `明天 ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div id="word-table-container" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
      {/* Search & Actions */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-800 font-sans">
            艾宾浩斯复习打卡表
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-medium">
            共 {words.length} 个单词
          </span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索单词或中文释义..."
            value={searchTerm}
            onChange={(e) => setSearchString(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table stage legend detail */}
      <div className="px-5 py-3 bg-amber-50/40 border-b border-amber-100/50 flex flex-wrap gap-4 text-xs text-amber-800">
        <span className="font-medium">打卡说明：</span>
        <span>🕒 灰色虚线：未到期</span>
        <span>⚡ 橙/蓝脉冲：可打卡/已到期</span>
        <span>✅ 绿色背景：已复习打卡</span>
        <span>❌ 红色高亮：测试不通过/待强化</span>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
              <th className="py-4 px-4 w-12 font-medium">序号</th>
              <th className="py-4 px-4 font-medium w-40">单词 (Word)</th>
              <th className="py-4 px-4 font-medium w-48">英译中 (释义)</th>
              <th className="py-4 px-4 font-medium min-w-[200px]">示例句子</th>
              {EBBINGHAUS_STAGES.map((stage) => (
                <th 
                  key={stage.id} 
                  className="py-4 px-2 text-center font-medium w-20 group relative cursor-help"
                  title={`${stage.label}复习`}
                >
                  <div className="text-slate-800 font-mono text-xs">{stage.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{stage.label}</div>
                </th>
              ))}
              <th className="py-4 px-4 text-center w-14 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredWords.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-slate-400">
                  没有找到符合条件的单词
                </td>
              </tr>
            ) : (
              filteredWords.map((w, index) => {
                const isWordTranslating = isTranslating[w.id];
                const hasTypoWarning = w.word.toLowerCase() === 'nagative';

                return (
                  <tr key={w.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Index */}
                    <td className="py-4 px-4 text-slate-400 font-mono font-medium">
                      {index + 1}
                    </td>

                    {/* Word Column */}
                    <td className="py-4 px-4 font-medium text-slate-900 relative">
                      {editingCell?.wordId === w.id && editingCell?.field === 'word' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(w.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(w.id)}
                          className="w-full px-2 py-1 text-sm bg-white border border-indigo-500 rounded focus:outline-none ring-2 ring-indigo-500/10"
                          autoFocus
                        />
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div 
                            className="hover:bg-slate-100 cursor-pointer rounded px-1 -ml-1 transition-colors relative inline-block py-0.5 group-hover:text-indigo-600"
                            onClick={() => startEditing(w.id, 'word', w.word)}
                            title="点击可直接编辑单词"
                          >
                            <span className="font-semibold tracking-tight">{w.word}</span>
                          </div>
                          {hasTypoWarning && (
                            <span className="text-[10px] text-amber-600 flex items-center gap-0.5 font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              拼写建议: negative
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Translation Column */}
                    <td className="py-4 px-4 text-slate-600">
                      {editingCell?.wordId === w.id && editingCell?.field === 'translation' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(w.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(w.id)}
                          className="w-full px-2 py-1 text-sm bg-white border border-indigo-500 rounded focus:outline-none ring-2 ring-indigo-500/10"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 min-h-[1.5rem]">
                          <div 
                            className="hover:bg-slate-100 cursor-pointer rounded px-1 -ml-1 transition-colors flex-1 py-0.5 text-slate-700"
                            onClick={() => startEditing(w.id, 'translation', w.translation)}
                            title="点击可直接编辑翻译"
                          >
                            {w.translation || (
                              <span className="text-slate-300 italic text-xs">暂无释义</span>
                            )}
                          </div>
                          {!w.translation && !isWordTranslating && (
                            <button
                              onClick={() => onAutoTranslate(w.id)}
                              className="p-1 hover:bg-indigo-50 text-indigo-500 hover:text-indigo-700 rounded transition-all"
                              title="智能获取释义和例句"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isWordTranslating && (
                            <span className="animate-spin text-indigo-500">
                              <Sparkles className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Example Column */}
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {editingCell?.wordId === w.id && editingCell?.field === 'example' ? (
                        <div className="flex flex-col gap-1">
                          <input
                            type="text"
                            placeholder="英文例句"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-white border border-indigo-500 rounded focus:outline-none"
                            autoFocus
                          />
                          <input
                            type="text"
                            placeholder="中文翻译"
                            value={w.exampleTranslation || ''}
                            onChange={(e) => onUpdateWord(w.id, { exampleTranslation: e.target.value })}
                            onBlur={() => handleSaveEdit(w.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(w.id)}
                            className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div 
                          className="hover:bg-slate-100 cursor-pointer rounded px-1 -ml-1 transition-colors py-1 text-slate-600 leading-relaxed"
                          onClick={() => startEditing(w.id, 'example', w.example || '')}
                          title="点击可直接编辑例句"
                        >
                          {w.example ? (
                            <div className="space-y-0.5">
                              <p className="font-medium text-slate-700 font-sans italic">“{w.example}”</p>
                              <p className="text-slate-400">{w.exampleTranslation}</p>
                            </div>
                          ) : (
                            <span className="text-slate-300 italic">点击添加示例句子</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Ebbinghaus Stages Columns */}
                    {EBBINGHAUS_STAGES.map((stage) => {
                      const check = w.checks[stage.id];
                      if (!check) return <td key={stage.id} className="p-2"></td>;

                      const isCompleted = check.status === 'completed';
                      const isFailed = check.status === 'failed';
                      const isDue = check.status === 'due';
                      const isPending = check.status === 'pending';

                      // Style of cell based on status
                      let cellClass = "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 mx-auto border ";
                      let icon = null;
                      let tooltip = "";

                      if (isCompleted) {
                        cellClass += "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm shadow-emerald-100/50 hover:bg-emerald-100";
                        icon = <Check className="w-4 h-4 stroke-[3]" />;
                        tooltip = `已打卡复习时间: ${check.completedAt ? new Date(check.completedAt).toLocaleString() : '已确认'}`;
                      } else if (isFailed) {
                        cellClass += "bg-rose-50 border-rose-500 text-rose-600 hover:bg-rose-100 animate-pulse";
                        icon = <X className="w-4 h-4 stroke-[3]" />;
                        tooltip = `测试未掌握，需强化！复习基准时间: ${formatDueDate(check.dueTime)}`;
                      } else if (isDue) {
                        // High prominence due cell
                        if (stage.id === 'stage0') {
                          cellClass += "bg-indigo-50/50 border-indigo-400 text-indigo-600 ring-4 ring-indigo-500/10 cursor-pointer animate-pulse hover:bg-indigo-100";
                          icon = <span className="text-[10px] font-bold">记</span>;
                        } else {
                          cellClass += "bg-amber-50/50 border-amber-400 text-amber-600 ring-4 ring-amber-500/10 cursor-pointer animate-pulse hover:bg-amber-100";
                          icon = <span className="text-[10px] font-bold">测</span>;
                        }
                        tooltip = `已到期！应复习时间: ${formatDueDate(check.dueTime)}。点击确认掌握打卡`;
                      } else {
                        cellClass += "border-dashed border-slate-200 text-slate-300 bg-white hover:border-slate-300 hover:bg-slate-50 cursor-help";
                        icon = <span className="text-[9px] font-mono font-medium text-slate-400">🕒</span>;
                        tooltip = `计划复习时间: ${formatDueDate(check.dueTime)}`;
                      }

                      return (
                        <td key={stage.id} className="py-4 px-2 text-center align-middle">
                          <div className="relative group/cell inline-block">
                            <button
                              onClick={() => {
                                // Can toggle if is due or completed or failed
                                onToggleCheck(w.id, stage.id);
                              }}
                              className={cellClass}
                              title={tooltip}
                            >
                              {icon}
                            </button>
                            
                            {/* Custom hovering tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:flex flex-col items-center z-20 w-44">
                              <div className="bg-slate-800 text-white text-[11px] rounded py-1.5 px-2.5 shadow-lg leading-normal font-sans text-center">
                                {tooltip}
                              </div>
                              <div className="w-2.5 h-2.5 bg-slate-800 rotate-45 -mt-1.5"></div>
                            </div>
                          </div>
                        </td>
                      );
                    })}

                    {/* Actions Column */}
                    <td className="py-4 px-4 text-center align-middle">
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            if (confirm(`确认要删除单词 "${w.word}" 吗？`)) {
                              onDeleteWord(w.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-all"
                          title="删除单词"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
