"use client";

import React, { useState, useEffect } from "react";
import TeacherDashboard from "@/Components/TeacherDashboard";
import VocabularyList from "@/Components/VocabularyList";

export default function App() {
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [words, setWords] = useState<string[]>([]);
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedWords = localStorage.getItem("provocab-words");
    const savedRate = localStorage.getItem("provocab-rate");
    
    if (savedWords) {
      try { setWords(JSON.parse(savedWords)); } 
      catch (e) { console.error("Failed to load words"); }
    }
    if (savedRate) setSpeechRate(parseFloat(savedRate));
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("provocab-words", JSON.stringify(words));
      localStorage.setItem("provocab-rate", speechRate.toString());
    }
  }, [words, speechRate, isMounted]);

  const handleAddWords = (newWords: string[]) => {
    setWords((prev) => {
      const currentSet = new Set(prev.map((w) => w.toLowerCase()));
      const toAdd = newWords.filter((w) => !currentSet.has(w.toLowerCase()));
      return [...toAdd, ...prev];
    });
    setActiveTab("list");
  };

  const deleteWord = (wordToDelete: string) => {
    setWords((prev) => prev.filter((w) => w !== wordToDelete));
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Navigation Pills */}
      <div className="flex justify-center mb-10">
        <div className="bg-white p-1.5 rounded-full shadow-sm border border-slate-200 inline-flex">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === "list"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Student View (List)
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === "add"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Teacher View (Add)
          </button>
        </div>
      </div>

      {/* Render Component based on active tab */}
      <main className="transition-all duration-300 ease-in-out">
        {activeTab === "list" ? (
          <VocabularyList 
            words={words} 
            onDelete={deleteWord} 
            speechRate={speechRate} 
            setSpeechRate={setSpeechRate} 
          />
        ) : (
          <TeacherDashboard onSave={handleAddWords} />
        )}
      </main>
      
    </div>
  );
}