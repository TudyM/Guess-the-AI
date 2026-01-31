import { useState, useEffect } from "react";
import "./App.css";
import data from "./data.json";
import personas from "./personas.json"; // <--- 1. Import the personas file
import ReactMarkdown from "react-markdown";

function App() {
  const [currentItem, setCurrentItem] = useState(null);
  const [selected, setSelected] = useState(null);
  const [currentCategory, setCurrentCategory] = useState("All");
  const [learnModel, setLearnModel] = useState("Gemini"); // <--- Already here, good.

  const categories = [
    "All",
    "Creative Writing",
    "Science & Physics",
    "Politics & Ethics",
    "Logic & Math",
    "Pop Culture",
    "History",
    "Philosophy",
    "Business & Professional",
    "Learn the Models",
  ];

  const models = ["Gemini", "ChatGPT", "Claude", "Deepseek"];
  const logoMap = {
    Gemini: "gemini.jpg",
    ChatGPT: "chatgpt.jpg",
    Claude: "claude.jpg",
    Deepseek: "deepseek.png",
  };

  const getQuestion = (category) => {
    let pool = data;
    if (category !== "All" && category !== "Learn the Models") {
      // <--- 2. Exclude Learn category from filtering
      pool = data.filter((q) => q.category === category);
    }
    if (pool.length === 0) pool = data;

    let selected = null;
    do {
      selected = pool[Math.floor(Math.random() * pool.length)];
    } while (currentItem && selected.id === currentItem.id);
    return selected;
  };

  useEffect(() => {
    const firstQ = getQuestion(currentCategory);
    setCurrentItem(firstQ);
  }, []); // Run once on mount

  const nextRound = (category) => {
    const nextQ = getQuestion(category);
    setCurrentItem(nextQ);
    setSelected(null);
  };

  const handleCategoryClick = (cat) => {
    setCurrentCategory(cat);
    if (cat !== "Learn the Models") {
      nextRound(cat);
    }
  };

  const handleGuess = (option) => {
    setSelected(option);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-10 px-4 font-sans relative">
      {/* --- 1. BIG TITLE --- */}
      <h1 className="text-white text-6xl md:text-8xl font-black tracking-tighter text-center mb-12 drop-shadow-[0_0_25px_rgba(255,255,255,0.7)] z-10">
        Can you guess the AI?
      </h1>

      {/* --- 2. FLOATING WINDOW --- */}
      <div className="w-full max-w-7xl bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden relative min-h-[70vh]">
        {/* A. Categories Bar */}
        <div className="bg-gray-850 border-b border-gray-800 p-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer border border-transparent
                  ${
                    currentCategory === cat
                      ? "bg-white text-black shadow-lg scale-105"
                      : "text-gray-400 hover:bg-gray-800 hover:border-gray-700 hover:text-white"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* B. Content Area (THIS IS WHERE THE LOGIC SPLITS) */}
        <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center relative">
          {currentCategory === "Learn the Models" ? (
            /* ===================================================
               MODE 1: LEARN THE MODELS DASHBOARD
               =================================================== */
            (() => {
              const activePersona = personas.find(
                (p) => p.model_name === learnModel,
              );
              return (
                <div className="w-full max-w-5xl flex flex-col gap-6 h-full animate-fadeIn">
                  {/* 1. Model Selector */}
                  <div className="flex flex-wrap justify-center gap-6 mb-2">
                    {Object.keys(logoMap).map((modelName) => (
                      <button
                        key={modelName}
                        onClick={() => setLearnModel(modelName)}
                        className={`w-16 h-16 rounded-full border-2 relative overflow-hidden transition-all transform hover:scale-110 
                          ${
                            learnModel === modelName
                              ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-110"
                              : "border-gray-600 opacity-50 grayscale hover:grayscale-0 hover:opacity-100"
                          }`}
                      >
                        <img
                          src={logoMap[modelName]}
                          alt={modelName}
                          className="absolute top-0 left-0 w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>

                  {/* 2. Info Card */}
                  {activePersona ? (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-3xl p-8 shadow-xl backdrop-blur-sm">
                      {/* Header */}
                      <div className="text-center mb-8 border-b border-gray-700 pb-6">
                        <h2 className="text-4xl font-black text-white mb-2">
                          {activePersona.model_name}
                        </h2>
                        <p className="text-blue-400 text-lg italic font-medium">
                          "{activePersona.core_identity}"
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        {/* Left Column */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-gray-300 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>{" "}
                              Common Structure
                            </h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                              {activePersona.common_structure}
                            </p>
                          </div>
                          <div className="bg-blue-900/20 border border-blue-500/30 p-5 rounded-xl">
                            <h3 className="text-blue-300 font-bold uppercase tracking-wider text-xs mb-2">
                              🕵️ Telltale Sign
                            </h3>
                            <p className="text-gray-300 text-sm italic">
                              {activePersona.telltale_signs}
                            </p>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-gray-300 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>{" "}
                              Writing Quirks
                            </h3>
                            <ul className="space-y-2">
                              {activePersona.writing_quirks.map((quirk, i) => (
                                <li
                                  key={i}
                                  className="text-gray-400 text-sm flex gap-3"
                                >
                                  <span className="text-gray-600">•</span>
                                  <span>{quirk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h3 className="text-gray-300 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>{" "}
                              Weakness
                            </h3>
                            <p className="text-red-300/80 text-sm leading-relaxed">
                              {activePersona.weaknesses}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 mt-20">
                      Select a model above.
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            /* ===================================================
               MODE 2: THE GUESSING GAME (Your original code)
               =================================================== */
            <div className="w-full flex flex-col gap-8 h-full">
              {/* Chat Bubbles Container */}
              <div className="flex-1 flex flex-col gap-6 justify-center">
                {/* User Prompt (Right) */}
                <div className="flex justify-end max-w-full">
                  <div className="bg-blue-600 text-white px-6 py-4 rounded-3xl rounded-tr-sm shadow-md max-w-[85%] text-lg leading-relaxed text-left">
                    {currentItem?.prompt}
                  </div>
                </div>

                {/* AI Response (Left) */}
                <div className="flex justify-start w-full">
                  <div className="bg-gray-800 text-gray-100 px-6 py-4 rounded-3xl rounded-tl-sm border border-gray-700 shadow-md max-w-2xl overflow-hidden w-full">
                    {currentItem?.response ? (
                      <div className="prose prose-invert max-w-none text-left w-full prose-p:leading-relaxed prose-pre:bg-gray-950 prose-pre:shadow-inner prose-p:my-2 prose-ul:my-2">
                        <ReactMarkdown>{currentItem.response}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="italic text-gray-500 text-left block">
                        [Response placeholder]
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Logos / Options (Bottom) */}
              <div className="mt-auto pt-8 border-t border-gray-800">
                <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                  {models.map((option) => {
                    let btnClass =
                      "bg-white border-gray-300 hover:border-blue-400";
                    if (selected) {
                      if (option === currentItem.model) {
                        btnClass =
                          "bg-white border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.6)] ring-4 ring-green-900";
                      } else if (option === selected) {
                        btnClass =
                          "bg-white border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)]";
                      } else {
                        btnClass = "bg-white opacity-20 grayscale";
                      }
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleGuess(option)}
                        disabled={!!selected}
                        className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-4 relative overflow-hidden transition-all transform duration-300 ease-out
                          ${!selected && "hover:scale-110 hover:-translate-y-2"}
                          ${btnClass}`}
                      >
                        {logoMap[option] ? (
                          <img
                            src={logoMap[option]}
                            alt={option}
                            className="absolute top-0 left-0 w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-black text-xs">{option}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <div className="h-16 mt-6 flex items-center justify-center">
                  {selected && (
                    <button
                      onClick={() => nextRound(currentCategory)}
                      className="group flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]"
                    >
                      <span>Next Question</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
