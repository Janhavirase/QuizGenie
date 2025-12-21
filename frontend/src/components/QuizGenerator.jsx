import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, BrainCircuit, Zap, CheckCircle2, AlertCircle, Layers, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast'; // ✅ Added Toaster

const QuizGenerator = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);

  const handleGenerate = async () => {
    // ✅ VALIDATION TOASTER
    if (!topic.trim()) {
        return toast.error("Please enter a topic to start!", { icon: '✨' });
    }
    
    setLoading(true);
    setQuestions([]); // Clear previous questions
    
    // ✅ LOADING TOASTER
    const toastId = toast.loading("Summoning the AI Genie...");

    try {
      // Calling your Backend API
      const res = await axios.post('https://quizgenie-22xy.onrender.com/api/ai/generate', {
        topic,
        difficulty,
        amount: 5 // We ask for 5 questions
      });

      if (res.data.success) {
        setQuestions(res.data.data);
        toast.success("Magic complete! 5 Questions generated.", { id: toastId, icon: '🧞‍♂️' });
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      // ✅ ERROR TOASTER
      toast.error("The Genie is sleeping (Backend Error).", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 md:p-12 relative overflow-hidden selection:bg-indigo-500/30">
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* HEADER */}
        <div className="text-center mb-12 animate-fade-in-down">
            <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-2xl mb-6 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/20 backdrop-blur-md">
                <Sparkles size={40} className="text-indigo-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-tight mb-4">
                QuizGenie AI
            </h1>
            <p className="text-xl text-slate-400 font-light">Generate interactive quizzes in seconds.</p>
        </div>
      
        {/* INPUT CARD */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group mb-12">
            
            {/* Gradient Border Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50"></div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                
                {/* Topic Input */}
                <div className="flex-1 relative group/input">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors">
                        <BrainCircuit size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="What should we quiz about? (e.g., Photosynthesis)"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl py-5 pl-14 pr-4 text-white text-lg font-medium outline-none transition-all shadow-inner focus:ring-4 focus:ring-indigo-500/10 placeholder-slate-600"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                </div>

                {/* Difficulty Selector */}
                <div className="w-full md:w-48 relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                        <Layers size={20} />
                    </div>
                    <select 
                        className="w-full h-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-2xl py-5 pl-14 pr-4 text-white text-lg font-medium outline-none appearance-none cursor-pointer transition-all shadow-inner focus:ring-4 focus:ring-purple-500/10"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                    >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                </div>
            </div>
            
            <button 
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-lg transition-all transform ${
                    loading 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white hover:scale-[1.01] active:scale-[0.99] shadow-indigo-500/25'
                }`}
            >
                {loading ? (
                    <><Zap size={24} className="animate-spin text-yellow-400"/> Generating Magic...</>
                ) : (
                    <><Sparkles size={24} className="fill-yellow-400 text-yellow-400"/> Generate Quiz</>
                )}
            </button>
        </div>

        {/* RESULTS SECTION */}
        {questions.length > 0 && (
            <div className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-400" size={32}/> Generated Results
                    </h2>
                    <span className="bg-indigo-500/10 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold border border-indigo-500/20">
                        {questions.length} Questions
                    </span>
                </div>

                <div className="space-y-6">
                    {questions.map((q, index) => (
                        <div key={index} className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-8 rounded-3xl hover:border-indigo-500/30 transition-colors group">
                            
                            <h3 className="text-xl font-bold text-slate-100 mb-6 flex gap-4 leading-snug">
                                <span className="flex-shrink-0 w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-indigo-400 text-sm border border-slate-700">
                                    {index + 1}
                                </span>
                                {q.questionText}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {q.options.map((opt, i) => (
                                    <div 
                                        key={i} 
                                        className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium transition-all ${
                                            opt === q.correctAnswer 
                                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                            : "bg-slate-950 border-slate-800 text-slate-400 group-hover:border-slate-700"
                                        }`}
                                    >
                                        {opt === q.correctAnswer ? (
                                            <CheckCircle2 size={18} className="text-emerald-400 shrink-0"/>
                                        ) : (
                                            <div className="w-4.5 h-4.5 rounded-full border border-slate-600 shrink-0"></div>
                                        )}
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center pb-20">
                    <p className="text-slate-500 mb-4 font-medium">Happy with these?</p>
                    <button className="bg-white text-slate-950 hover:bg-slate-200 px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-white/5 transition transform hover:scale-105 inline-flex items-center gap-2">
                        Save to Library <ArrowRight size={20}/>
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default QuizGenerator;