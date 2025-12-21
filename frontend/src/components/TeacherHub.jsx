import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, Plus, Clock, Edit3, 
  Activity, Users, FileText, Sparkles, 
  BrainCircuit, Trash2, PlayCircle, LogOut 
} from 'lucide-react';
import TemplateGallery from './TemplateGallary'; 
import { useAuth } from '../context/AuthContext';
import SkeletonCard from './SkeletonCard'; 

const TeacherHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // ✅ STATE (Functionality Preserved)
  const [recents, setRecents] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 

  // --- LOAD HISTORY (Logic Preserved) ---
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);

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

        setRecents(allActivities.reverse());
        setIsLoading(false); 
    }, 800); 

    return () => clearTimeout(timer);
  }, [user]);

  // --- HANDLERS (Logic Preserved) ---
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

  // Visual Configuration for cards
  const createOptions = [
    { 
        title: "Quiz Creator", 
        desc: "Build competitive, timed quizzes manually.", 
        icon: <Activity size={48} />, 
        color: "from-blue-600 to-blue-800", 
        hoverColor: "group-hover:text-blue-200",
        path: "/create-quiz" 
    },
    { 
        title: "AI Generator", 
        desc: "Magically generate quizzes in seconds.", 
        icon: <Sparkles size={48} />, 
        color: "from-purple-600 to-fuchsia-800", 
        hoverColor: "group-hover:text-purple-200",
        path: "/teacher/ai" 
    },
    { 
        title: "Interactive Survey", 
        desc: "Polls, Word Clouds & live Q&A.", 
        icon: <Users size={48} />, 
        color: "from-pink-600 to-rose-800", 
        hoverColor: "group-hover:text-pink-200",
        path: "/create-survey" 
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12 font-sans pb-40 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        <div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight text-white">
                Teacher<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Hub</span>
            </h1>
            <p className="text-gray-400 text-lg">Welcome back, {user?.name}. Ready to engage your class?</p>
        </div>
        <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full font-semibold transition border border-white/10 text-sm backdrop-blur-sm"
        >
            <LogOut size={16} /> Exit
        </button>
      </div>

      {/* Main Options Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative z-10">
        {createOptions.map((opt, i) => (
          <div 
            key={i} 
            onClick={() => opt.path === "/teacher/ai" ? handleGenerateAIQuiz() : navigate(opt.path)} 
            className={`
                group relative h-64 rounded-3xl p-6 cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-900/20 border border-white/5 bg-gray-900/40
            `}
          >
            {/* Gradient Background Layer */}
            <div className={`absolute inset-0 bg-gradient-to-br ${opt.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            {/* Default Background Layer */}
            <div className="absolute inset-0 bg-gray-800/50 opacity-100 group-hover:opacity-0 transition-opacity duration-500" />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <div className={`mb-4 text-white/80 ${opt.hoverColor} transition-colors`}>
                        {opt.path === "/teacher/ai" && isGenerating ? <div className="animate-spin"><BrainCircuit size={48}/></div> : opt.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{opt.title}</h3>
                    <p className="text-gray-400 group-hover:text-white/90 text-sm font-medium leading-relaxed max-w-[90%]">
                        {opt.desc}
                    </p>
                </div>
                
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                    Launch Tool <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
            </div>

            {/* Decorative Icon Watermark */}
            <div className="absolute -bottom-4 -right-4 text-white/5 group-hover:text-white/10 transform scale-[2.5] group-hover:rotate-12 transition-transform duration-500 pointer-events-none">
                {opt.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Template Gallery */}
      <div className="relative z-10 mb-16">
         <div className="max-w-7xl mx-auto">
            <TemplateGallery onSelect={(t) => navigate('/create-survey', { state: { template: t } })} />
         </div>
      </div>

      {/* Recent Activity Section */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Clock size={24} className="text-blue-400"/> Recent Activity
            </h2>
            
            {/* Create New Small Button */}
            <button 
                onClick={() => navigate('/create-quiz')}
                className="md:hidden flex items-center gap-2 text-sm text-blue-400 font-bold"
            >
                <Plus size={16} /> New Quiz
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* 'Create New' Card (Desktop) */}
            <button 
                onClick={() => navigate('/create-quiz')}
                className="hidden md:flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-800 hover:border-gray-600 bg-gray-900/20 hover:bg-gray-900/50 rounded-2xl p-6 transition group min-h-[160px]"
            >
                <div className="p-4 bg-gray-800 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Plus size={24}/>
                </div>
                <span className="font-bold text-gray-500 group-hover:text-gray-300">Create New Quiz</span>
            </button>

            {/* Loading State */}
            {isLoading ? (
                <>
                    <SkeletonCard />
                    <SkeletonCard />
                </>
            ) : recents.length === 0 ? (
                 <div className="col-span-full md:col-span-2 flex flex-col items-center justify-center text-gray-500 py-12 border border-gray-800 rounded-2xl bg-gray-900/20">
                      <Sparkles size={32} className="mb-3 opacity-20" />
                      <p>No recent activity. Start by creating a quiz!</p>
                 </div>
            ) : (
                /* Activity Cards */
                recents.map((item, i) => (
                    <div 
                        key={i} 
                        onClick={() => handleResume(item)} 
                        className="group bg-gray-900 border border-gray-800 hover:border-gray-600 hover:bg-gray-800 rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col gap-4 shadow-lg hover:shadow-xl relative overflow-hidden"
                    >
                        {/* Status Strip */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${item.status === 'Ready' ? 'bg-green-500' : 'bg-yellow-500'}`} />

                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${
                                    item.type === 'Quiz' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'
                                }`}>
                                    {item.type === 'Quiz' ? <PlayCircle size={20}/> : <Edit3 size={20}/>}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-200 group-hover:text-white transition truncate w-40 text-lg">{item.title}</h4>
                                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                                        <FileText size={12} /> {item.type} • {item.slideCount} Slides
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer & Actions */}
                        <div className="mt-auto pt-4 border-t border-gray-800 flex items-center justify-between">
                            <span className="text-xs font-mono text-gray-600">{item.date}</span>
                            
                            <div className="flex gap-2">
                                {/* Analytics (Quiz Only) */}
                                {item.type === 'Quiz' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); navigate(`/report/${item.id}`); }}
                                        className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                                        title="View Analytics"
                                    >
                                        <BarChart2 size={18}/>
                                    </button>
                                )}
                                
                                {/* Delete */}
                                <button 
                                    onClick={(e) => handleDeleteItem(e, item.id, item.type)}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                    title="Delete"
                                >
                                    <Trash2 size={18}/>
                                </button>
                            </div>
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