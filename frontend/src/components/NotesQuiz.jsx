import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, BookOpen, Layers, BrainCircuit, Play, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const NotesQuiz = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // --- STATES ---
  const [text, setText] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");

  const handleGenerate = async () => {
    // 1. Validation
    if (!text.trim() || text.length < 50) {
        return toast.error("Please paste at least a few sentences (50+ chars).");
    }

    setLoading(true);
    const toastId = toast.loading("🤖 Reading your notes...");

    try {
      // 2. Prepare Payload (Updated for /upload route)
      const payload = {
        text: text, // ✅ Sending raw text as 'text'
        count: parseInt(count),
        difficulty: difficulty,
        type: 'MCQ'
      };

      // 3. API Call (✅ Updated Endpoint)
      const res = await axios.post('https://quizgenie-22xy.onrender.com/api/ai/upload', payload);

      if (res.data.success) {
        toast.success("Quiz Ready!", { id: toastId });
        
        // 4. Navigate to Game (Solo Mode)
        navigate(`/game/solo-${Date.now()}`, { 
            state: { 
                mode: 'solo',
                questions: res.data.data,
                topic: "My Study Notes" 
            } 
        });
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to generate. Try a shorter text.";
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl w-full relative z-10">
        
        {/* Header */}
        <div className="mb-8 text-center">
            <div className="inline-flex p-3 bg-emerald-500/10 rounded-2xl mb-4 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <BookOpen size={32} className="text-emerald-400" />
            </div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 mb-2 tracking-tight">
                Study from Notes
            </h1>
            <p className="text-gray-400 text-lg">Paste your study material below. AI will create a practice test instantly.</p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition duration-500"></div>
            
            {/* 1. TEXT AREA (Paste Paragraph) */}
            <div className="mb-8 space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                    <FileText size={14} /> Paste Paragraph / Notes
                </label>
                <div className="relative">
                    <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste your chapter summary, article, or raw notes here..."
                        className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-5 text-slate-200 text-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition resize-none custom-scrollbar leading-relaxed"
                    ></textarea>
                    <div className={`absolute bottom-4 right-4 text-xs font-bold px-2 py-1 rounded bg-black/50 backdrop-blur ${text.length > 4000 ? 'text-rose-400' : 'text-gray-500'}`}>
                        {text.length} chars
                    </div>
                </div>
            </div>

            {/* 2. CONTROLS (Grid Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                
                {/* Question Count */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex justify-between">
                        <span className="flex items-center gap-2"><Layers size={14}/> Question Count</span>
                        <span className="text-emerald-400 font-mono text-sm">{count}</span>
                    </label>
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                        <span className="text-xs text-gray-500 font-bold">3</span>
                        <input 
                            type="range" min="3" max="15" 
                            value={count} onChange={(e) => setCount(e.target.value)}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <span className="text-xs text-gray-500 font-bold">15</span>
                    </div>
                </div>

                {/* Difficulty Selector */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                        <BrainCircuit size={14}/> Difficulty
                    </label>
                    <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/5">
                        {['easy', 'medium', 'hard'].map(d => (
                            <button 
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                                    difficulty === d 
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-100' 
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. GENERATE BUTTON */}
            <button 
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] ${
                    loading 
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5" 
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/20 border border-emerald-500/20"
                }`}
            >
                {loading ? (
                    <>
                        <Sparkles className="animate-spin" />
                        <span>Generating...</span>
                    </>
                ) : (
                    <>
                        <Play fill="currentColor" size={24} />
                        <span>Start Practice Session</span>
                    </>
                )}
            </button>

        </div>
      </div>
    </div>
  );
};

export default NotesQuiz;