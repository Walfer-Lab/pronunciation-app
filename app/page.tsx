"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

// --- Types ---
type ToastMessage = { id: number; text: string; type: "success" | "error" | "info" };

export default function PronunciationApp() {
  // --- State ---
  const [mounted, setMounted] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  
  // Speech Settings
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // UI State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Initialization & Hydration ---
  useEffect(() => {
    setMounted(true);
    const savedWords = localStorage.getItem("vocab-words");
    const savedSettings = localStorage.getItem("vocab-settings");
    
    if (savedWords) {
      try { setWords(JSON.parse(savedWords)); } catch (e) { console.error("Corrupted words data"); }
    }
    if (savedSettings) {
      try {
        const { rate: r, pitch: p, voiceURI: v } = JSON.parse(savedSettings);
        if (r) setRate(r);
        if (p) setPitch(p);
        if (v) setSelectedVoiceURI(v);
      } catch (e) { console.error("Corrupted settings data"); }
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const englishVoices = availableVoices.filter(v => v.lang.startsWith("en"));
      setVoices(englishVoices.length > 0 ? englishVoices : availableVoices);
      if (!selectedVoiceURI && englishVoices.length > 0) {
        setSelectedVoiceURI(englishVoices[0].voiceURI);
      }
    };

    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // --- Persistence ---
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("vocab-words", JSON.stringify(words));
      localStorage.setItem("vocab-settings", JSON.stringify({ rate, pitch, voiceURI: selectedVoiceURI }));
    }
  }, [words, rate, pitch, selectedVoiceURI, mounted]);

  // --- Helpers ---
  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // --- Vocabulary Management ---
  const handleAddWords = () => {
    if (!inputText.trim()) return;
    const newWords = inputText.split("\n").map(w => w.trim()).filter(w => w.length > 0);
    
    setWords(prev => {
      const currentSet = new Set(prev.map(w => w.toLowerCase()));
      const toAdd = newWords.filter(w => !currentSet.has(w.toLowerCase()));
      
      if (toAdd.length === 0) {
        showToast("No new words added (duplicates ignored).", "info");
        return prev;
      }
      showToast(`Added ${toAdd.length} new word(s).`, "success");
      return [...prev, ...toAdd];
    });
    setInputText("");
  };

  const handleDeleteWord = (wordToDelete: string) => {
    setWords(prev => prev.filter(w => w !== wordToDelete));
    if (selectedWord === wordToDelete) setSelectedWord(null);
    showToast(`Removed "${wordToDelete}"`, "info");
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete all vocabulary words? This cannot be undone.")) {
      setWords([]);
      setSelectedWord(null);
      showToast("Vocabulary cleared.", "info");
    }
  };

  // --- Pronunciation Engine ---
  const playPronunciation = useCallback((wordToSpeak: string) => {
    if (!window.speechSynthesis) {
      showToast("Speech Synthesis is not supported in this browser.", "error");
      return;
    }

    window.speechSynthesis.cancel(); // Stop current speech
    const utterance = new SpeechSynthesisUtterance(wordToSpeak);
    
    if (selectedVoiceURI) {
      const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [voices, selectedVoiceURI, rate, pitch]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (e.code === "Space" && selectedWord) {
        e.preventDefault();
        playPronunciation(selectedWord);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedWord, playPronunciation]);

  // --- Import / Export ---
  const handleExport = (format: "json" | "txt") => {
    if (words.length === 0) return showToast("No words to export.", "error");
    const content = format === "json" ? JSON.stringify(words, null, 2) : words.join("\n");
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vocabulary.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported vocabulary as ${format.toUpperCase()}`, "success");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let imported: string[] = [];
        if (file.name.endsWith(".json")) imported = JSON.parse(content);
        else imported = content.split("\n");

        const cleaned = imported.map(w => w.trim()).filter(w => w.length > 0);
        setWords(prev => {
          const currentSet = new Set(prev.map(w => w.toLowerCase()));
          const toAdd = cleaned.filter(w => !currentSet.has(w.toLowerCase()));
          showToast(`Imported ${toAdd.length} new words.`, "success");
          return [...prev, ...toAdd];
        });
      } catch (err) {
        showToast("Failed to parse file. Ensure it is valid JSON or TXT.", "error");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filteredWords = words.filter(w => w.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!mounted) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading Application...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 font-sans text-gray-200">
      {/* --- Toasts --- */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-green-900/50 border-green-800 text-green-200' : toast.type === 'error' ? 'bg-red-900/50 border-red-800 text-red-200' : 'bg-gray-800 border-gray-700 text-gray-200'}`}>
            {toast.text}
          </div>
        ))}
      </div>

      {/* --- Sidebar --- */}
      <aside className="w-80 flex flex-col bg-gray-900/80 border-r border-gray-800 shadow-xl z-10">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Pronounce Pro
          </h1>
          <p className="text-xs text-gray-500 mt-1">{words.length} Total Words</p>
        </div>
        
        <div className="p-4 border-b border-gray-800">
          <input
            type="text"
            placeholder="Search vocabulary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {filteredWords.length === 0 ? (
            <div className="text-center text-sm text-gray-500 mt-8">No words found.</div>
          ) : (
            filteredWords.map((word) => (
              <div
                key={word}
                onClick={() => setSelectedWord(word)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${selectedWord === word ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "hover:bg-gray-800/50 text-gray-300 border border-transparent"}`}
              >
                <span className="font-medium truncate pr-4">{word}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteWord(word); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                  title="Remove word"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          )}
        </div>

        {words.length > 0 && (
          <div className="p-4 border-t border-gray-800">
            <button onClick={handleClearAll} className="w-full text-sm text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/40 border border-red-900/50 py-2 rounded-lg transition-colors">
              Clear All Data
            </button>
          </div>
        )}
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col overflow-y-auto p-8 lg:p-12 gap-8">
        
        {/* Top Controls / Import Export */}
        <header className="flex justify-end gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".txt,.json" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import
          </button>
          <div className="flex bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <button onClick={() => handleExport("txt")} className="px-4 py-2 text-sm hover:bg-gray-800 border-r border-gray-700 transition-colors">Export TXT</button>
            <button onClick={() => handleExport("json")} className="px-4 py-2 text-sm hover:bg-gray-800 transition-colors">Export JSON</button>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
          
          {/* Left Column: Add Words */}
          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col h-full">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Vocabulary
            </h2>
            <p className="text-sm text-gray-400 mb-4">Paste multiple words below. Each word on a new line.</p>
            <textarea
              className="flex-1 w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none placeholder:text-gray-700 min-h-[200px]"
              placeholder="e.g.&#10;Ephemeral&#10;Ubiquitous&#10;Mellifluous"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              onClick={handleAddWords}
              disabled={!inputText.trim()}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98]"
            >
              Add Words to List
            </button>
          </section>

          {/* Right Column: Player */}
          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
            <h2 className="text-lg font-semibold mb-6 text-white">Pronunciation Player</h2>
            
            {/* Word Display */}
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 border border-gray-800 rounded-xl mb-6 p-8 relative">
              {selectedWord ? (
                <>
                  <h3 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-2 text-center break-words w-full">
                    {selectedWord}
                  </h3>
                  <p className="text-sm text-gray-500">Press <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 font-mono text-xs">Space</kbd> to play</p>
                </>
              ) : (
                <div className="text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <p>Select a word from the list to start.</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => selectedWord && playPronunciation(selectedWord)}
                  disabled={!selectedWord || isSpeaking}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white py-3 rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  Play
                </button>
                <button
                  onClick={() => selectedWord && playPronunciation(selectedWord)}
                  disabled={!selectedWord || isSpeaking}
                  className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white py-3 border border-gray-700 rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Repeat
                </button>
              </div>

              {/* Advanced Settings */}
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Voice Selector</label>
                  <select
                    value={selectedVoiceURI}
                    onChange={(e) => setSelectedVoiceURI(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {voices.map(voice => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-gray-400 uppercase tracking-wider">Speed</label>
                      <span className="text-xs text-indigo-400">{rate}x</span>
                    </div>
                    <input
                      type="range" min="0.5" max="2" step="0.1" value={rate}
                      onChange={(e) => setRate(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-gray-400 uppercase tracking-wider">Pitch</label>
                      <span className="text-xs text-indigo-400">{pitch}</span>
                    </div>
                    <input
                      type="range" min="0.5" max="2" step="0.1" value={pitch}
                      onChange={(e) => setPitch(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}