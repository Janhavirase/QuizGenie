import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { socket } from '../socket';
import toast, { Toaster } from 'react-hot-toast';
import { Sparkles, ArrowLeft, BrainCircuit, Layers, BarChart, Rocket } from 'lucide-react';

const TeacherAI = () => {
  const navigate = useNavigate();
  
  const [topic, setTopic] = useState("");
  const [amount, setAmount] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");
  const [loading, setLoading] = useState(false);

  const handleGenerateAndHost = async () => {
    if (!topic.trim()) return toast.error("Please enter a topic!");
    if (amount < 1 || amount > 20) return toast.error("Questions must be between 1 and 20.");
    
    setLoading(true);
    const loadingToast = toast.loading("Brewing magic..."); 

    try {
      const res = await axios.post('http://localhost:5000/api/ai/generate', {
        topic, 
        amount: Number(amount), 
        difficulty
      });

      if (res.data.success && res.data.data.length > 0) {
        toast.dismiss(loadingToast); 
        toast.success("Room Created Successfully!"); 

        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        socket.emit("create_room", { 
          roomCode, 
          topic, 
          questions: res.data.data 
        });

        navigate(`/game/${roomCode}`, { 
          state: { 
            role: 'host', 
            name: 'Teacher',
            hasQuestions: true,
            questionData: res.data.data 
          } 
        });
      } else {
        toast.dismiss(loadingToast);
        toast.error("AI couldn't generate questions. Try a different topic.");
      }
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingToast);
      toast.error("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#1f2937', color: '#fff' } }} />

      {/* Background Ambience (Matches Hub) */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/20 via-black to-blue-900/10 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-lg">
        
        {/* Navigation / Header */}
        <div className="mb-8 flex items-center justify-between">
            <button 
                onClick={() => navigate('/teacher')} 
                className="flex items-center gap-2 text-gray-400 hover:text-white transition group"
            >
                <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10">
                    <ArrowLeft size={18} />
                </div>
                <span className="text-sm font-medium">Back to Hub</span>
            </button>
        </div>

        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            {/* Decorative gradient inside card */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/10 rounded-2xl border border-white/10 mb-4">
                    <Sparkles className="text-purple-400" size={32} />
                </div>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-white">
                    AI Quiz Generator
                </h2>
                <p className="text-gray-400 mt-2 text-sm">Enter a topic and let our AI build the classroom experience.</p>
            </div>
            
            <div className="space-y-6">
                
                {/* Topic Input */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Topic</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <BrainCircuit className="text-gray-500 group-focus-within:text-purple-400 transition" size={20} />
                        </div>
                        <input 
                            className="w-full bg-black/20 border border-white/10 focus:border-purple-500/50 p-4 pl-12 rounded-xl text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                            placeholder="e.g. Thermodynamics, The Cold War..."
                            value={topic} 
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>
                
                {/* Settings Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Questions</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Layers className="text-gray-500 group-focus-within:text-blue-400 transition" size={18} />
                            </div>
                            <input 
                                type="number" min="1" max="20"
                                value={amount} onChange={(e) => setAmount(e.target.value)} 
                                className="w-full bg-black/20 border border-white/10 focus:border-blue-500/50 p-3 pl-12 rounded-xl font-bold outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Difficulty</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <BarChart className="text-gray-500 group-focus-within:text-pink-400 transition" size={18} />
                            </div>
                            <select 
                                value={difficulty} onChange={(e) => setDifficulty(e.target.value)} 
                                className="w-full bg-black/20 border border-white/10 focus:border-pink-500/50 p-3 pl-12 rounded-xl font-bold outline-none focus:ring-1 focus:ring-pink-500/50 transition-all appearance-none text-white"
                            >
                                <option className="bg-gray-900">Easy</option>
                                <option className="bg-gray-900">Medium</option>
                                <option className="bg-gray-900">Hard</option>
                            </select>
                            {/* Custom Arrow for Select */}
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button 
                    onClick={handleGenerateAndHost}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-bold text-lg mt-6 flex items-center justify-center gap-2 transition-all transform shadow-xl
                    ${loading 
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5" 
                        : "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:shadow-purple-500/25 hover:scale-[1.02] text-white border border-transparent"}`}
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Generating...</span>
                        </>
                    ) : (
                        <>
                            <Rocket size={20} />
                            <span>Launch Classroom</span>
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAI;