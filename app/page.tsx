"use client";

import React, { useState, useEffect } from "react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [words, setWords] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Load saved words on initial render
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("simple-vocab");
    if (saved) {
      try {
        setWords(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load words");
      }
    }
  }, []);

  // Save words whenever they change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("simple-vocab", JSON.stringify(words));
    }
  }, [words, isMounted]);

  const handleAddWords = () => {
    if (!inputText.trim()) return;
    const newWords = inputText
      .split("\n")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    setWords((prev) => {
      const currentSet = new Set(prev.map((w) => w.toLowerCase()));
      const toAdd = newWords.filter((w) => !currentSet.has(w.toLowerCase()));
      return [...toAdd, ...prev];
    });
    
    setInputText("");
    setActiveTab("list");
  };

  const deleteWord = (wordToDelete: string) => {
    setWords((prev) => prev.filter((w) => w !== wordToDelete));
  };

  const playAudio = (word: string) => {
    if (!window.speechSynthesis) {
      alert("Your browser does not support audio playback.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8">
            <button
              onClick={() => setActiveTab("list")}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "list"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Vocabulary List
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "add"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Add New Words
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "list" ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {words.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="mb-4">Your vocabulary list is empty.</p>
                <button
                  onClick={() => setActiveTab("add")}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Add some words to get started
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-4 px-6 font-semibold text-gray-700 w-2/3">
                      Word
                    </th>
                    <th className="py-4 px-6 font-semibold text-gray-700 text-right">
                      Audio
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {words.map((word) => (
                    <tr key={word} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-4 px-6">
                        <span className="text-lg font-medium text-gray-900">
                          {word}
                        </span>
                        <button
                          onClick={() => deleteWord(word)}
                          className="ml-4 text-sm text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Delete
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => playAudio(word)}
                          className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          title={`Play audio for ${word}`}
                        >
                          <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Add New Words
            </h2>
            <p className="text-gray-500 mb-6">
              Type or paste your words below. Put each word on a new line.
            </p>
            <textarea
              className="w-full h-64 p-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-800"
              placeholder="apple&#10;banana&#10;cherry"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              onClick={handleAddWords}
              disabled={!inputText.trim()}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Save Words to List
            </button>
          </div>
        )}
      </main>
    </div>
  );
}