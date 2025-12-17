import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, BrainCircuit, Target, Layers, FileText, ArrowLeft } from 'lucide-react';

const AIQuizGenerator = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    topic: "",
    amount: 5,
    difficulty: "Medium",
    purpose: "Assessment", // e.g., Summary, Team Event, Test
    type: "Multiple Choice" // MCQ, Mixed, etc.
  });

  const handleGenerate = async () => {
    if (!formData.topic.trim()) return alert("Please enter a topic!");
    
    setLoading(true);

    try {
        // 1. Prepare Prompt Context for the AI
        // We append context to the topic so the AI understands the vibe without changing backend logic
        const enhancedTopic = `${formData.topic} (Context: ${formData.purpose}, Style: ${formData.type})`;

        // 2. Call API
        const res = await axios.post('http://localhost:5000/api/ai/generate', { 
            topic: enhancedTopic, 
            difficulty: formData.difficulty, 
            amount: parseInt(formData.amount) 
        });

        if (res.data.success) {
            const aiQuestions = res.data.data;

            // 3. GENERATE FIXED SLIDES
            
            // Slide 1: Dynamic Title Screen
            const slideTitle = {
                id: 1,
                type: 'info',
                layout: 'title',
                question: formData.topic,
                options: [`A ${formData.difficulty} level ${formData.purpose.toLowerCase()}.`], 
                bgColor: '#111827',
                textColor: '#ffffff'
            };

            // Slide 2: Dynamic Rules Screen
            const slideRules = {
                id: 2,
                type: 'info',
                layout: 'bullets',
                question: "Game Rules",
                options: [
                    `This quiz contains ${formData.amount} questions.`,
                    "You have 20 seconds per question.",
                    "Points are awarded for speed and accuracy.",
                    "Good luck and have fun!"
                ],
                bgColor: '#ffffff',
                textColor: '#000000'
            };

            // 4. Map AI Questions to Editor Format
            const questionSlides = aiQuestions.map((q, index) => ({
                id: index + 3,
                type: 'mcq',
                question: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer,
                layout: 'centered',
                bgColor: '#111827',
                textColor: '#ffffff',
                visualization: 'bar',
                showPercentage: true,
                reactions: ['like', 'love', 'cat'] // Default reactions
            }));

            // 5. Navigate to Editor
            const fullTemplate = {
                slides: [slideTitle, slideRules, ...questionSlides]
            };

            navigate('/create-survey', { state: { template: fullTemplate } });
        }
    } catch (error) {
        console.error(error);
        alert("AI Generation failed. Ensure backend is running.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans flex items-center justify-center relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full bg-gray-900/80 backdrop-blur-xl border border-gray-800 p-10 rounded-3xl shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate('/teacher')} className="p-3 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                <ArrowLeft size={20}/>
            </button>
            <div>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-3">
                    <Sparkles className="text-yellow-400 fill-yellow-400" /> AI Quiz Wizard
                </h1>
                <p className="text-gray-400 mt-1">Configure your session and let AI do the work.</p>
            </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* 1. Topic */}
            <div className="col-span-2 space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={16} /> Topic
                </label>
                <input 
                    type="text" 
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    placeholder="e.g. Thermodynamics, The Office TV Show, Capital Cities..."
                    className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white text-lg focus:border-blue-500 outline-none transition"
                />
            </div>

            {/* 2. Purpose */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Target size={16} /> Purpose
                </label>
                <select 
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white focus:border-blue-500 outline-none appearance-none"
                >
                    <option>Summary Quiz</option>
                    <option>Team Building Event</option>
                    <option>Professional Assessment</option>
                    <option>Ice Breaker</option>
                    <option>Fun Trivia</option>
                </select>
            </div>

            {/* 3. Difficulty */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <BrainCircuit size={16} /> Difficulty
                </label>
                <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
                    {['Easy', 'Medium', 'Hard'].map(level => (
                        <button 
                            key={level}
                            onClick={() => setFormData({...formData, difficulty: level})}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold transition ${formData.difficulty === level ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. Question Count */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Layers size={16} /> Questions: <span className="text-blue-400">{formData.amount}</span>
                </label>
                <input 
                    type="range" 
                    min="3" 
                    max="15" 
                    value={formData.amount} 
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                    <span>3</span>
                    <span>15</span>
                </div>
            </div>

             {/* 5. Question Type */}
             <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <BrainCircuit size={16} /> Type
                </label>
                <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white focus:border-blue-500 outline-none appearance-none"
                >
                    <option>Multiple Choice</option>
                    <option>True / False</option>
                    <option>Funny / Witty Options</option>
                </select>
            </div>

        </div>

        {/* Action Button */}
        <button 
            onClick={handleGenerate} 
            disabled={loading}
            className={`w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                loading 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl shadow-purple-500/20'
            }`}
        >
            {loading ? (
                <>Generating your Quiz... <Sparkles className="animate-spin"/></>
            ) : (
                <>Generate & Preview <Sparkles/></>
            )}
        </button>

      </div>
    </div>
  );
};

export default AIQuizGenerator;