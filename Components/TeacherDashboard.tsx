"use client";

import React, { useState, useMemo } from "react";

interface TeacherDashboardProps {
  onSave: (words: string[]) => void;
}

export default function TeacherDashboard({ onSave }: TeacherDashboardProps) {
  const [inputText, setInputText] = useState("");

  const previewWords = useMemo(() => {
    return inputText
      .split(/[\n,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
  }, [inputText]);

  const handleSave = () => {
    if (previewWords.length > 0) {
      onSave(previewWords);
      setInputText("");
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Educator Dashboard
        </h2>
        <p className="text-slate-500">
          Add new vocabulary words. Separate multiple words using <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">Enter</span> or <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">Commas</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Input Words
          </label>
          <textarea
            className="w-full h-64 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none text-slate-800 text-lg shadow-inner"
            placeholder="e.g., Photosynthesis, Algorithm, Paradigm"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            onClick={handleSave}
            disabled={previewWords.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-4 px-6 rounded-2xl transition-colors shadow-sm"
          >
            Save {previewWords.length > 0 ? previewWords.length : ""} Words to List
          </button>
        </div>

        <div className="flex flex-col gap-4 bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center justify-between">
            <span>Live Preview</span>
            <span className="bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full text-xs">
              {previewWords.length} Detected
            </span>
          </label>
          
          {previewWords.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
              Start typing to see words here...
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 content-start">
              {previewWords.map((word, idx) => (
                <span key={idx} className="bg-white border border-slate-200 text-slate-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                  {word}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}