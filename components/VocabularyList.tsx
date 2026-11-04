"use client";

import React from "react";

interface VocabularyListProps {
  words: string[];
  onDelete: (word: string) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
}

export default function VocabularyList({ words, onDelete, speechRate, setSpeechRate }: VocabularyListProps) {
  const playAudio = (word: string) => {
    if (!window.speechSynthesis) return alert("Browser does not support audio.");
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = speechRate;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Vocabulary</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">{words.length} Words Total</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
          <label htmlFor="speed" className="text-sm text-slate-600 font-semibold">
            Pronunciation Speed
          </label>
          <select
            id="speed"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="text-sm border-none bg-slate-50 text-indigo-700 font-bold rounded-lg py-1.5 px-3 focus:ring-0 cursor-pointer"
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1.0x</option>
            <option value={1.25}>1.25x</option>
          </select>
        </div>
      </div>

      {words.length === 0 ? (
        <div className="p-16 text-center text-slate-400">
          <p className="text-lg">The vocabulary list is currently empty.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {words.map((word) => (
            <li key={word} className="flex items-center justify-between px-8 py-5 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {word}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onDelete(word)}
                  className="text-sm font-medium text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                >
                  Remove
                </button>
                <button
                  onClick={() => playAudio(word)}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-5 py-2.5 rounded-full transition-all font-semibold shadow-sm focus:ring-4 focus:ring-indigo-100"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                  </svg>
                  Listen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}