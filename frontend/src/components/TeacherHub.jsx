import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Plus, Clock, MoreHorizontal, Edit3, Activity, Users, FileText, Sparkles, BrainCircuit, Trash2, PlayCircle } from 'lucide-react';
import TemplateGallery from './TemplateGallary'; 
import { useAuth } from '../context/AuthContext';
import SkeletonCard from './SkeletonCard'; // Ensure path is correct

const TeacherHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // ✅ Define all state hooks at the top level
  const [recents, setRecents] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 

  // --- LOAD HISTORY (Combined Logic) ---
  useEffect(() => {
    if (!user) return;

    // 1. Start Loading
    setIsLoading(true);

    // 2. Simulate Network Delay (0.8s) to show Skeleton
    const timer = setTimeout(() => {
        const allActivities = [];

        // A. Load Real Quizzes
        try {
            const savedQuizzes = JSON.parse(localStorage.getItem('quizgenie_quizzes') || "[]");
            const myQuizzes = savedQuizzes
                .filter(q => q.creatorEmail === user.email)
                .map(q => ({
                    id: q.id,
                    title: q.title,
                    type: "Quiz",
                    date: new Date(q.date).toLocaleDateString(),
                    status: "Ready",
                    slideCount: q.questions.length,
                    raw: q 
                }));
            allActivities.push(...myQuizzes);
        } catch (e) { console.error("Error loading quizzes", e); }

        // B. Load Survey Draft
        const savedDraft = localStorage.getItem("surveyDraft");
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed.question || parsed.questionText) {
                    allActivities.push({
                        id: 'draft',
                        title: parsed.question || "Untitled Draft",
                        type: "Survey Draft",
                        date: "Unsaved",
                        status: "Editing",
                        slideCount: 1,
                        raw: parsed
                    });
                }
            } catch (e) {}
        }

        // 3. Set Data & Stop Loading
        setRecents(allActivities.reverse());
        setIsLoading(false); 
    }, 800); 

    // Cleanup timer
    return () => clearTimeout(timer);
  }, [user]);

  // --- HANDLERS ---
  const handleGenerateAIQuiz = () => navigate('/teacher/ai');

  const handleResume = (item) => {
      if (item.type === 'Quiz') {
          navigate(`/game/${item.id}?mode=quiz`, { 
              state: { role: 'host', name: 'Teacher', hasQuestions: true } 
          });
      } else if (item.type === 'Survey Draft') {
          navigate('/create-survey', { state: { template: { slides: [item.raw] } } });
      }
  };

  const handleDeleteItem = (e, id, type) => {
      e.stopPropagation(); 
      if(!window.confirm("Are you sure you want to delete this?")) return;

      if (type === 'Quiz') {
          const allQuizzes = JSON.parse(localStorage.getItem('quizgenie_quizzes') || "[]");
          const updated = allQuizzes.filter(q => q.id !== id);
          localStorage.setItem('quizgenie_quizzes', JSON.stringify(updated));
      } else if (type === 'Survey Draft') {
          localStorage.removeItem("surveyDraft");
      }
      setRecents(prev => prev.filter(item => item.id !== id));
  };

  const createOptions = [
    { title: "Quiz Creator", desc: "Competitive, timed quizzes.", icon: "🏆", color: "bg-blue-600", path: "/create-quiz" },
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
            <p className="text-gray-400">Welcome back, {user?.name}! Select a tool to engage your classroom.</p>
        </div>
        <button onClick={() => navigate('/')} className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg font-bold transition border border-gray-700">
            Exit
        </button>
      </div>

      {/* Main Options */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-fade-in-up delay-100">
        {createOptions.map((opt, i) => (
          <div 
            key={i} 
            onClick={() => opt.path === "/teacher/ai" ? handleGenerateAIQuiz() : navigate(opt.path)} 
            className={`${opt.color} p-6 rounded-3xl cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition duration-300 relative overflow-hidden group h-56 flex flex-col justify-between border border-white/10`}
          >
            <div className="absolute -right-6 -top-6 text-9xl opacity-20 group-hover:rotate-12 group-hover:scale-110 transition pointer-events-none">{opt.icon}</div>
            <div className="text-5xl z-10">
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
                onClick={() => navigate('/create-quiz')}
                className="border-2 border-dashed border-gray-800 hover:border-gray-600 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-white transition group h-full min-h-[140px]"
            >
                <div className="p-3 bg-gray-900 rounded-full group-hover:bg-gray-800 transition border border-gray-800 group-hover:border-gray-700">
                    <Plus size={24}/>
                </div>
                <span className="font-bold text-sm">Create New</span>
            </button>

            {/* Real Recents List */}
            {isLoading ? (
                // ✅ SHOW SKELETONS WHILE LOADING
                <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </>
            ) : recents.length === 0 ? (
                 <div className="col-span-2 flex items-center justify-center text-gray-500 text-sm italic border border-dashed border-gray-800 rounded-xl bg-gray-900/30 min-h-[140px]">
                     No quizzes yet. Create one above!
                 </div>
            ) : (
                recents.map((item, i) => (
                    <div key={i} onClick={() => handleResume(item)} className="group bg-gray-900 border border-gray-800 hover:border-blue-500/30 hover:bg-gray-800/80 rounded-xl p-5 cursor-pointer transition-all duration-200 flex flex-col gap-4 relative overflow-hidden shadow-sm">
                        
                        {/* Card Content */}
                        <div className="flex items-start justify-between gap-3 relative z-10">
                            <div className="flex items-center gap-3">
                                
                                {/* Status Icon */}
                                <div className={`p-2.5 rounded-lg border border-white/5 ${
                                    item.status === 'Editing' ? 'bg-yellow-500/10 text-yellow-500' : 
                                    item.status === 'Ready' ? 'bg-green-500/10 text-green-500' :
                                    'bg-gray-800 text-gray-400'
                                }`}>
                                    {item.type === 'Quiz' ? <PlayCircle size={18}/> : <Edit3 size={18}/>}
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-200 group-hover:text-blue-400 transition truncate w-40 text-base">{item.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                        <FileText size={10} />
                                        <span>{item.type}</span>
                                        <span>•</span>
                                        <span>{item.slideCount} Slides</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* ACTION BUTTONS */}
                            <div className="flex gap-2"> 
                                {/* 1. Report Button (Only for Quizzes) */}
                                {item.type === 'Quiz' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); navigate(`/report/${item.id}`); }}
                                        className="text-gray-600 hover:text-blue-400 p-1 rounded-full hover:bg-white/10 transition z-20"
                                        title="View Analytics"
                                    >
                                        <BarChart2 size={16}/>
                                    </button>
                                )}

                                {/* 2. Delete Button */}
                                <button 
                                    onClick={(e) => handleDeleteItem(e, item.id, item.type)}
                                    className="text-gray-600 hover:text-red-400 p-1 rounded-full hover:bg-white/10 transition z-20"
                                    title="Delete"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between mt-auto relative z-10 border-t border-white/5 pt-3">
                            <span className="text-[10px] text-gray-500">{item.date}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                item.status === 'Ready' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            }`}>
                                {item.status}
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default TeacherHub;