import React, { useState } from 'react';
import { Word, EBBINGHAUS_STAGES } from '../types';
import { 
  Clock, 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  Sliders,
  RotateCcw
} from 'lucide-react';

interface ReviewScheduleProps {
  words: Word[];
  currentTime: Date;
  onSimulateTime: (hours: number) => void;
  onResetTime: () => void;
}

export default function ReviewSchedule({
  words,
  currentTime,
  onSimulateTime,
  onResetTime,
}: ReviewScheduleProps) {
  const [showSimulator, setShowSimulator] = useState(false);

  // Statistics calculation
  const totalWords = words.length;
  
  // Calculate total number of punch-in checkpoints
  const totalCheckpoints = totalWords * EBBINGHAUS_STAGES.length;
  
  let completedCount = 0;
  let dueCount = 0;
  let failedCount = 0;

  words.forEach((word) => {
    Object.values(word.checks).forEach((c) => {
      if (c.status === 'completed') completedCount++;
      else if (c.status === 'due') dueCount++;
      else if (c.status === 'failed') failedCount++;
    });
  });

  const overallProgressPercent = totalCheckpoints > 0 
    ? Math.round((completedCount / totalCheckpoints) * 100) 
    : 0;

  return (
    <div id="review-schedule-container" className="space-y-6">
      {/* Current simulated time strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-sans">当前记忆时钟 (模拟)</div>
            <div className="text-sm font-semibold font-mono tracking-wide text-indigo-300">
              {currentTime.toLocaleString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          </div>
        </div>

        {/* Time machine simulation launcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="px-4 py-2 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all bg-slate-800/40"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            快速调整时间 (测试复习效果)
            {showSimulator ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Simulator controller panel */}
      {showSimulator && (
        <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-2xl p-5 text-slate-300 space-y-4 animate-fadeIn">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-sans mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              艾宾浩斯时间加速器
            </h4>
            <p className="text-xs text-slate-400">
              由于艾宾浩斯周期的最大跨度为30天，本功能能让您瞬间“穿越”到未来，测试各个周期的复习打卡触发情况与智能测试题的刷新。
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onSimulateTime(1)}
              className="px-3.5 py-2 bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-800/50 rounded-lg text-xs font-mono font-medium hover:text-white transition-all"
            >
              +1 小时
            </button>
            <button
              onClick={() => onSimulateTime(24)}
              className="px-3.5 py-2 bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-800/50 rounded-lg text-xs font-mono font-medium hover:text-white transition-all"
            >
              +1 天 (24h)
            </button>
            <button
              onClick={() => onSimulateTime(24 * 2)}
              className="px-3.5 py-2 bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-800/50 rounded-lg text-xs font-mono font-medium hover:text-white transition-all"
            >
              +2 天
            </button>
            <button
              onClick={() => onSimulateTime(24 * 6)}
              className="px-3.5 py-2 bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-800/50 rounded-lg text-xs font-mono font-medium hover:text-white transition-all"
            >
              +6 天
            </button>
            <button
              onClick={() => onSimulateTime(24 * 14)}
              className="px-3.5 py-2 bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-800/50 rounded-lg text-xs font-mono font-medium hover:text-white transition-all"
            >
              +14 天
            </button>
            <button
              onClick={() => onSimulateTime(24 * 30)}
              className="px-3.5 py-2 bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-800/50 rounded-lg text-xs font-mono font-medium hover:text-white transition-all"
            >
              +30 天
            </button>
            <button
              onClick={onResetTime}
              className="px-3.5 py-2 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 hover:text-rose-100 border border-rose-900/50 rounded-lg text-xs font-semibold transition-all ml-auto flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              恢复到真实当前时间
            </button>
          </div>
        </div>
      )}

      {/* Progress Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Progress */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-400 font-sans">打卡覆盖率</div>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl font-extrabold text-slate-800 font-mono">{overallProgressPercent}%</span>
            <span className="text-xs text-slate-400">已打卡</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${overallProgressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Due Now */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-400 font-sans">当前到期/待打卡</div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className={`text-2xl font-extrabold font-mono ${dueCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {dueCount}
            </span>
            <span className="text-xs text-slate-400">个任务</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-3 font-sans truncate">
            {dueCount > 0 ? '💬 请查阅下方表格进行打卡或测试' : '✅ 暂无急需复习的内容！'}
          </div>
        </div>

        {/* Failed / Review Needed */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="text-xs font-medium text-slate-400 mb-1">测试待巩固单词</div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-extrabold font-mono ${failedCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                {failedCount}
              </span>
              <span className="text-xs text-slate-400">个</span>
            </div>
            {failedCount > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 font-medium text-[10px] rounded">
                重点关注
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-2.5">
            最近测试中选错的词
          </p>
        </div>

        {/* Total Completed */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="text-xs text-slate-400 font-medium mb-1">总计完成打卡</div>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {completedCount}
            <span className="text-xs text-slate-400 font-normal font-sans ml-1">次</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">每个单词需经历7个阶段复习打卡</p>
        </div>
      </div>

      {/* Due items quick action summary */}
      {dueCount > 0 && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
          <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
            ⚡
          </span>
          <div>
            <h4 className="text-xs font-semibold text-amber-900">今日有单词到达复习节点</h4>
            <p className="text-xs text-amber-800/80 mt-0.5 leading-relaxed font-sans">
              艾宾浩斯提醒：科学安排复习，点击下方打卡表中的<strong className="text-amber-900">“记”</strong>或<strong className="text-amber-900">“测”</strong>按钮完成今天周期的复习，或者直接通过下方的<strong className="text-amber-900">“词汇智能测试”</strong>，系统在您通过测试后也会自动为您完成该单词本阶段的掌握打卡！
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
