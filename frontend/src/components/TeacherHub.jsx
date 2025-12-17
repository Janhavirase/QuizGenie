import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Clock, MoreHorizontal, Edit3, Activity, Users, FileText, Sparkles, BrainCircuit,Trash2 } from 'lucide-react';
import TemplateGallery from './TemplateGallary'; 
const TeacherHub = () => {
  const navigate = useNavigate();
  const [recents, setRecents] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- 1. LOAD HISTORY (Same as before) ---
  useEffect(() => {
    const realHistory = [];
    const savedDraft = localStorage.getItem("surveyDraft");
    if (savedDraft) {
        try {
            const parsed = JSON.parse(savedDraft);
            if (parsed.question || parsed.questionText) {
                realHistory.push({
                    id: 'draft',
                    title: parsed.question || "Untitled Draft",
                    type: "Draft",
                    date: "In Progress",
                    status: "Editing",
                    savedSlides: [{ ...parsed, id: 1 }]
                });
            }
        } catch (e) {}
    }
    const pastActivity = localStorage.getItem("teacherHistory");
    if (pastActivity) {
        try {
            const parsedHistory = JSON.parse(pastActivity);
            realHistory.push(...parsedHistory);
        } catch (e) {}
    }
    setRecents(realHistory);
  }, []);

  // --- 2. NEW: AI QUIZ GENERATION HANDLER ---
  // Updated logic: Navigate to the configuration page instead of alerting
  const handleGenerateAIQuiz = () => {
      // Navigate to the new wizard page
      navigate('/teacher/ai');
  };

  const handleResume = (item) => {
      if (item.savedSlides) {
          navigate('/create-survey', { state: { template: { slides: item.savedSlides } } });
      } else {
          navigate('/create-survey');
      }
  };
// ✅ NEW: Handle Delete Item
  const handleDeleteItem = (e, id) => {
      e.stopPropagation(); // Prevent opening the quiz when clicking delete
      if(window.confirm("Are you sure you want to remove this from history?")) {
          const updated = recents.filter(item => item.id !== id);
          setRecents(updated);
          
          // Update LocalStorage based on what we removed
          const drafts = updated.filter(i => i.id === 'draft');
          const history = updated.filter(i => i.id !== 'draft');
          
          if (drafts.length === 0) localStorage.removeItem("surveyDraft");
          localStorage.setItem("teacherHistory", JSON.stringify(history));
      }
  };
  const createOptions = [
    { title: "Quiz Creator", desc: "Type manually or Upload PDF.", icon: "✍️", color: "bg-blue-600", path: "/create-manual" },
    
    // ✅ This button now triggers the new navigate function
    { title: "AI Generator", desc: "Auto-generate quizzes in seconds.", icon: "🧞‍♂️", color: "bg-purple-600", path: "/teacher/ai" },
    
    { title: "Interactive Survey", desc: "Polls, Word Clouds & Q&A.", icon: "📊", color: "bg-pink-600", path: "/create-survey" }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans pb-40">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 flex justify-between items-center animate-fade-in-up">
        <div>
            <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                Teacher Dashboard
            </h1>
            <p className="text-gray-400">Select a tool to engage your classroom.</p>
        </div>
        <button onClick={() => navigate('/')} className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg font-bold transition border border-gray-700">
            Exit
        </button>
      </div>

      {/* Main Options */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-fade-in-up delay-100">
        {createOptions.map((opt, i) => (
          // Updated onClick to handle both direct paths and the special AI handler
          <div 
            key={i} 
            onClick={() => opt.path === "/teacher/ai" ? handleGenerateAIQuiz() : navigate(opt.path)} 
            className={`${opt.color} p-6 rounded-3xl cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition duration-300 relative overflow-hidden group h-56 flex flex-col justify-between border border-white/10`}
          >
            <div className="absolute -right-6 -top-6 text-9xl opacity-20 group-hover:rotate-12 group-hover:scale-110 transition pointer-events-none">{opt.icon}</div>
            <div className="text-5xl z-10">
                {/* Show spinner only if generating is active (though we navigate away now, good to keep for transitions) */}
                {opt.path === "/teacher/ai" && isGenerating ? <div className="animate-spin">⏳</div> : opt.icon}
            </div>
            <div className="z-10">
                <h3 className="text-2xl font-bold mb-1">{opt.title}</h3>
                <p className="opacity-90 font-medium text-white/80 text-sm">{opt.desc}</p>
            </div>
            <div className="z-10 mt-4 bg-black/20 w-fit px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-sm group-hover:bg-black/40 transition flex items-center gap-2">Launch Tool 🚀</div>
          </div>
        ))}
      </div>

      {/* Template Gallery */}
      <TemplateGallery onSelect={(t) => navigate('/create-survey', { state: { template: t } })} />

      {/* Recent Activity */}
      <div className="max-w-7xl mx-auto mt-20 animate-fade-in-up delay-300">
        <div className="flex items-center gap-3 mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock size={20} className="text-blue-400"/> Recent Activity
            </h2>
            <div className="h-px bg-gray-800 flex-1"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Create New Button */}
            <button 
                onClick={() => navigate('/create-manual')}
                className="border-2 border-dashed border-gray-800 hover:border-gray-600 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-white transition group h-full min-h-[140px]"
            >
                <div className="p-3 bg-gray-900 rounded-full group-hover:bg-gray-800 transition border border-gray-800 group-hover:border-gray-700">
                    <Plus size={24}/>
                </div>
                <span className="font-bold text-sm">Create New</span>
            </button>

            {/* Real Recents */}
            {recents.map((item, i) => (
                <div key={i} onClick={() => handleResume(item)} className="group bg-gray-900 border border-gray-800 hover:border-blue-500/30 hover:bg-gray-800/80 rounded-xl p-5 cursor-pointer transition-all duration-200 flex flex-col gap-4 relative overflow-hidden shadow-sm">
                    <div className="flex items-start justify-between gap-3 relative z-10">
                        <div className="flex items-center gap-3">
                          {/* ✅ DELETE BUTTON (Top Right, Visible on Hover) */}
                    <button 
                        onClick={(e) => handleDeleteItem(e, item.id)}
                        className="absolute top-3 right-3 p-2 bg-gray-900 hover:bg-red-600 text-gray-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 shadow-lg border border-gray-700"
                        title="Delete Session"
                    >
                        <Trash2 size={16}/>
                    </button>
                            <div className={`p-2.5 rounded-lg border border-white/5 ${
                                item.status === 'Editing' || item.status === 'Draft' ? 'bg-yellow-500/10 text-yellow-500' : 
                                item.status === 'Live' ? 'bg-green-500/10 text-green-500' :
                                'bg-gray-800 text-gray-400'
                            }`}>
                                {item.status === 'Editing' || item.status === 'Draft' ? <Edit3 size={18}/> : <Activity size={18}/>}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-200 group-hover:text-blue-400 transition truncate w-40 text-base">{item.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                    <FileText size={10} />
                                    <span>{item.type}</span>
                                    <span>•</span>
                                    <span>{item.date}</span>
                                </div>
                            </div>
                        </div>
                        <button className="text-gray-600 hover:text-white p-1 rounded-full hover:bg-white/10 transition">
                            <MoreHorizontal size={16}/>
                        </button>
                    </div>

                    <div className="flex items-center justify-between mt-auto relative z-10 border-t border-white/5 pt-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                            item.status === 'Live' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            item.status === 'Editing' || item.status === 'Draft' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                            'bg-gray-800 text-gray-500 border-gray-700'
                        }`}>
                            {item.status === 'Live' ? 'Completed' : item.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherHub;