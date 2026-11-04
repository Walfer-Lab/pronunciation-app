
"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [words, setWords] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState("");
  const [ready, setReady] = useState(false);

  // Load saved words
  useEffect(() => {
    const saved = localStorage.getItem("pronunciation-words");
    if (saved) {
      const parsed = JSON.parse(saved);
      setWords(parsed);
      setSelected(parsed[0] || "");
    }
    setReady(true);
  }, []);

  // Save words automatically
  useEffect(() => {
    if (ready) {
      localStorage.setItem("pronunciation-words", JSON.stringify(words));
    }
  }, [words, ready]);

  // Add multiple words
  function addWords() {
    const newWords = input
      .split(/\n/)
      .map((w) => w.trim())
      .filter(Boolean);

    const unique = new Set(
      words.map((w) => w.toLowerCase())
    );

    const filtered = newWords.filter((w) => {
      if (unique.has(w.toLowerCase())) return false;
      unique.add(w.toLowerCase());
      return true;
    });

    setWords((prev) => [...prev, ...filtered]);

    if (!selected && filtered.length) {
      setSelected(filtered[0]);
    }

    setInput("");
  }

  // Remove a word
  function removeWord(word: string) {
    const updated = words.filter((w) => w !== word);
    setWords(updated);

    if (selected === word) {
      setSelected(updated[0] || "");
    }
  }

  // Built-in pronunciation
  function speak(word: string) {
    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported.");
      return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(word);
    speech.lang = "en-US";
    speech.rate = 0.85;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  }

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-[#0b0d12] text-white p-6">

      <div className="max-w-7xl mx-auto">

        <header className="mb-8">
          <h1 className="text-3xl font-bold">
            Word Pronunciation Studio
          </h1>
          <p className="text-zinc-400 mt-2">
            Your personal vocabulary and pronunciation workspace.
          </p>
        </header>

        {/* ADD WORDS */}
        <section className="bg-[#151821] border border-zinc-800 rounded-2xl p-5 mb-6">

          <h2 className="font-semibold text-lg mb-3">
            Add Words
          </h2>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Add multiple words, one per line...\nBeautiful\nEntrepreneur\nPsychology"}
            className="w-full h-32 bg-[#0b0d12] border border-zinc-700 rounded-xl p-4 outline-none focus:border-blue-500 resize-y"
          />

          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-zinc-500">
              {input.split(/\n/).filter((w) => w.trim()).length} words entered
            </span>

            <button
              onClick={addWords}
              disabled={!input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-5 py-2 rounded-lg font-medium"
            >
              + Add Words
            </button>
          </div>

        </section>

        {/* MAIN TWO-PANEL SYSTEM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LEFT: WORDS */}
          <section className="bg-[#151821] border border-zinc-800 rounded-2xl overflow-hidden">

            <div className="p-5 border-b border-zinc-800 flex justify-between">
              <h2 className="font-semibold">Vocabulary</h2>
              <span className="text-zinc-500 text-sm">
                {words.length} words
              </span>
            </div>

            <div className="max-h-[600px] overflow-y-auto">

              {words.length === 0 && (
                <p className="p-8 text-zinc-500 text-center">
                  Add words above to get started.
                </p>
              )}

              {words.map((word, index) => (
                <button
                  key={word}
                  onClick={() => setSelected(word)}
                  className={`w-full flex items-center justify-between p-4 border-b border-zinc-800 text-left ${
                    selected === word
                      ? "bg-blue-600/10 border-l-2 border-l-blue-500"
                      : "hover:bg-zinc-800/50"
                  }`}
                >
                  <span>
                    <span className="text-zinc-500 text-xs mr-3">
                      {index + 1}
                    </span>
                    {word}
                  </span>

                  <span className="text-zinc-500">→</span>
                </button>
              ))}

            </div>
          </section>

          {/* RIGHT: PRONUNCIATION */}
          <section className="bg-[#151821] border border-zinc-800 rounded-2xl overflow-hidden">

            <div className="p-5 border-b border-zinc-800">
              <h2 className="font-semibold">Pronunciation</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Built-in speech synthesis
              </p>
            </div>

            <div className="p-6">

              {!selected ? (
                <p className="text-zinc-500 text-center py-16">
                  Select a word from the vocabulary.
                </p>
              ) : (
                <>
                  <div className="text-center py-10">

                    <p className="text-sm text-blue-400 mb-3">
                      SELECTED WORD
                    </p>

                    <h1 className="text-4xl font-bold break-words">
                      {selected}
                    </h1>

                    <button
                      onClick={() => speak(selected)}
                      className="mt-8 bg-blue-600 hover:bg-blue-500 rounded-xl px-8 py-4 font-medium text-lg"
                    >
                      ▶ Play Pronunciation
                    </button>

                    <p className="text-zinc-500 text-sm mt-4">
                      US English · Built-in voice
                    </p>

                  </div>

                  <div className="border-t border-zinc-800 pt-5">
                    <h3 className="text-sm font-medium mb-3">
                      Word Actions
                    </h3>

                    <button
                      onClick={() => speak(selected)}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-lg p-3 mb-3"
                    >
                      Repeat pronunciation
                    </button>

                    <button
                      onClick={() => removeWord(selected)}
                      className="w-full text-red-400 hover:bg-red-400/10 rounded-lg p-3"
                    >
                      Remove word
                    </button>
                  </div>
                </>
              )}

            </div>
          </section>

        </div>

      </div>
    </main>
  );
}
