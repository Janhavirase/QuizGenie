import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { BrainCircuit, Sparkles, ArrowLeft, PlayCircle, Layers, BarChart } from 'lucide-react';

const SoloAI = () => {
  const navigate = useNavigate();
  
  // --- STATE FOR INPUTS ---
  const [topic, setTopic] = useState("");
  const [amount, setAmount] = useState(5); // Default 5 questions
  const [difficulty, setDifficulty] = useState("Medium"); // Default Medium
  const [loading, setLoading] = useState(false);

  const handleGenerateAndPlay = async () => {
    // 1. Validation
    if (!topic.trim()) return toast.error("Please enter a topic!");
    if (amount < 1 || amount > 20) return toast.error("Questions must be between 1 and 20.");
    
    setLoading(true);
    const loadingToast = toast.loading("AI is crafting your quiz...");

    try {
      // 2. Send Request to Server
      const res = await axios.post('http://localhost:5000/api/ai/generate', {
        topic, 
        count: Number(amount), // ⚠️ FORCE NUMBER TYPE
        difficulty
      });

      // 3. Handle Success
      if (res.data.success && res.data.data.length > 0) {
        toast.dismiss(loadingToast);
        toast.success("Challenge Ready!");

        // Navigate to GameRoom with 'SOLO' mode
        navigate('/game/solo-ai', { 
          state: { 
            mode: 'solo',        
            questions: res.data.data, 
            topic: topic
          } 
        });
      } else {
        throw new Error("AI returned no questions.");
      }
    } catch (error) {
      console.error("Solo AI Error:", error);
      toast.dismiss(loadingToast);
      
      // 4. SHOW REAL SERVER ERROR
      const serverMessage = error.response?.data?.message || error.message || "Connection failed.";
      toast.error(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1f2937', color: '#fff' } }} />
      
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg bg-gray-900/60 p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative z-10">
        
        {/* Back Button */}
        <button onClick={() => navigate('/solohub')} className="text-gray-400 mb-8 flex gap-2 items-center hover:text-white transition group">
            <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10">
                <ArrowLeft size={16} />
            </div>
            <span className="font-medium text-sm">Back to Hub</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl mb-4 border border-white/5 shadow-inner">
                <BrainCircuit className="text-blue-400" size={40} />
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                Solo Challenge
            </h2>
            <p className="text-gray-400 text-sm">Customize your learning session.</p>
        </div>

        <div className="space-y-5">
            {/* 1. Topic Input */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1.5 block">Topic</label>
                <input 
                    className="w-full bg-black/20 border border-white/10 focus:border-blue-500/50 p-4 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500/50 transition-all text-lg placeholder-gray-600"
                    placeholder="e.g. The Solar System"
                    value={topic} 
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={loading}
                />
            </div>

            {/* 2. Settings Grid (Count & Difficulty) */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1.5 block">Questions</label>
                    <div className="relative">
                        <Layers className="absolute left-3 top-3.5 text-gray-500" size={18} />
                        <input 
                            type="number" min="1" max="20"
                            className="w-full bg-black/20 border border-white/10 focus:border-blue-500/50 p-3 pl-10 rounded-xl text-white outline-none font-bold"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1.5 block">Difficulty</label>
                    <div className="relative">
                        <BarChart className="absolute left-3 top-3.5 text-gray-500" size={18} />
                        <select 
                            className="w-full bg-black/20 border border-white/10 focus:border-blue-500/50 p-3 pl-10 rounded-xl text-white outline-none font-bold appearance-none cursor-pointer"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            disabled={loading}
                        >
                            <option className="bg-gray-900" value="easy">Easy</option>
                            <option className="bg-gray-900" value="medium">Medium</option>
                            <option className="bg-gray-900" value="hard">Hard</option>
                        </select>
                        {/* Custom Arrow */}
                        <div className="absolute right-3 top-4 pointer-events-none text-gray-500">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M0.5 0.5L5 5.5L9.5 0.5H0.5Z"/></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Action Button */}
            <button 
                onClick={handleGenerateAndPlay}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all transform shadow-xl mt-4
                ${loading 
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5" 
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] hover:shadow-blue-500/25 text-white"}`}
            >
                {loading ? (
                    <>
                        <Sparkles className="animate-spin" size={20} />
                        <span>Creating Quiz...</span>
                    </>
                ) : (
                    <>
                        <PlayCircle size={20} className="fill-current" />
                        <span>Start Quiz</span>
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SoloAI;