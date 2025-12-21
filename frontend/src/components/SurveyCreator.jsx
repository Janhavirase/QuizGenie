import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../socket'; 
import { QRCodeCanvas } from 'qrcode.react'; 
import toast from 'react-hot-toast'; // ✅ Added Toaster
import { 
  BarChart3, Cloud, MessageSquare, ListOrdered, MapPin, Play, Save, Plus, 
  Image as ImageIcon, Trash2, Layout, Type, Palette, Monitor, AlignLeft, 
  AlignCenter, Columns, Flag, CheckCircle2, X, History, PieChart, 
  CircleDashed, LayoutGrid, ToggleLeft, ToggleRight, 
  Cat, Heart, HelpCircle, ThumbsUp, ThumbsDown, Info, ArrowLeft, GripVertical
} from 'lucide-react';

// --- CONFIG ---
const SURVEY_TYPES = [
  { id: 'mcq', label: 'Multiple Choice', icon: <BarChart3 size={18}/> },
  { id: 'info', label: 'Info Slide', icon: <Info size={18}/> },
  { id: 'wordcloud', label: 'Word Cloud', icon: <Cloud size={18}/> },
  { id: 'open', label: 'Open Ended', icon: <MessageSquare size={18}/> },
  { id: 'ranking', label: 'Ranking', icon: <ListOrdered size={18}/> },
  { id: 'pin', label: 'Pin on Image', icon: <MapPin size={18}/> },
  { id: 'ending', label: 'Ending Screen', icon: <Flag size={18}/> },
];

const LAYOUTS = [
    { id: 'centered', icon: <AlignCenter size={18}/> },
    { id: 'left', icon: <AlignLeft size={18}/> },
    { id: 'split', icon: <Columns size={18}/> },
];

const THEMES = [
    { id: 'modern_dark', label: 'Modern Dark', bg: '#0f172a', text: '#f8fafc', preview: 'bg-slate-900' },
    { id: 'light_minimal', label: 'Minimal Light', bg: '#ffffff', text: '#0f172a', preview: 'bg-white' },
    { id: 'neon_purple', label: 'Neon Purple', bg: '#2e1065', text: '#e0e7ff', preview: 'bg-indigo-900' },
    { id: 'forest', label: 'Forest', bg: '#064e3b', text: '#d1fae5', preview: 'bg-emerald-900' },
    { id: 'sunset', label: 'Sunset', bg: '#7c2d12', text: '#ffedd5', preview: 'bg-orange-900' },
    { id: 'ocean', label: 'Ocean', bg: '#172554', text: '#dbeafe', preview: 'bg-blue-900' },
];

const VISUALIZATION_OPTS = [
    { id: 'bar', label: 'Bar Chart', icon: <BarChart3 size={20}/> },
    { id: 'donut', label: 'Donut Chart', icon: <CircleDashed size={20}/> },
    { id: 'pie', label: 'Pie Chart', icon: <PieChart size={20}/> },
    { id: 'dots', label: 'Dots', icon: <LayoutGrid size={20}/> },
];

const AVAILABLE_REACTIONS = [
    { id: 'cat', icon: <Cat size={20}/>, label: 'Cat' },
    { id: 'love', icon: <Heart size={20}/>, label: 'Love' },
    { id: 'question', icon: <HelpCircle size={20}/>, label: '?' },
    { id: 'like', icon: <ThumbsUp size={20}/>, label: 'Like' },
    { id: 'dislike', icon: <ThumbsDown size={20}/>, label: 'Dislike' },
];

const RenderMockChart = ({ type, options, showPercentage, textColor }) => {
    const colors = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const data = options.map((opt, i) => ({
        label: opt,
        value: 10 + (i * 5),
        color: colors[i % colors.length]
    }));
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    if (type === 'bar') {
        return (
            <div className="w-full h-full flex flex-col justify-center gap-4">
                {data.map((d, i) => (
                    <div key={i} className="relative w-full">
                        <div className="flex justify-between text-sm font-bold mb-1 opacity-90" style={{ color: textColor }}>
                            <span>{d.label}</span>
                            {showPercentage && <span>{Math.round((d.value/total)*100)}%</span>}
                        </div>
                        <div className="w-full h-5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                            <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `${(d.value/total)*100}%`, backgroundColor: d.color }}></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'pie' || type === 'donut') {
        let currentAngle = 0;
        const gradients = data.map(d => {
            const percentage = (d.value / total) * 100;
            const end = currentAngle + percentage;
            const str = `${d.color} ${currentAngle}% ${end}%`;
            currentAngle = end;
            return str;
        }).join(', ');

        return (
            <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="relative rounded-full transition-all duration-700 shadow-2xl border-4 border-white/5"
                    style={{ width: '220px', height: '220px', background: `conic-gradient(${gradients})` }}
                >
                    {type === 'donut' && (
                        <div className="absolute inset-0 m-auto rounded-full backdrop-blur-xl bg-black/10" style={{ width: '60%', height: '60%' }}></div>
                    )}
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {data.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md" style={{ color: textColor }}>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                            <span>{d.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'dots') {
        return (
            <div className="w-full h-full flex flex-col justify-center gap-6 overflow-hidden">
                 {data.map((d, i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm font-bold opacity-90" style={{ color: textColor }}>
                            <span>{d.label}</span>
                            {showPercentage && <span className="opacity-70">{Math.round((d.value/total)*100)}%</span>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {Array.from({ length: Math.ceil(d.value / 2) }).map((_, idx) => (
                                <div key={idx} className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: d.color }}></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const SurveyCreator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [roomCode, setRoomCode] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [sidebarTab, setSidebarTab] = useState('content');
  const [showHistory, setShowHistory] = useState(false);
  const [recentItems, setRecentItems] = useState([]);

  // ✅ CAPTURE MODE
  const [sessionMode, setSessionMode] = useState(location.state?.mode || 'survey');

  const BLANK_SLIDE = {
      id: 1,
      question: "",
      type: "mcq",
      visualization: 'bar', 
      showPercentage: true,
      reactions: ['cat', 'love', 'question', 'like', 'dislike'],
      options: ["Option 1", "Option 2", "Option 3"],
      image: null,
      layout: 'centered',
      bgImage: null,
      bgColor: '#0f172a', 
      textColor: '#f8fafc'
  };

  const [slides, setSlides] = useState([BLANK_SLIDE]);
  const currentSlide = slides[activeSlide] || slides[0];
  
  const updateSlide = (key, value) => {
      const newSlides = [...slides];
      newSlides[activeSlide][key] = value;
      setSlides(newSlides);
  };

  const applyTheme = (theme) => {
      const newSlides = slides.map(slide => ({
          ...slide,
          bgColor: theme.bg,
          textColor: theme.text
      }));
      setSlides(newSlides);
      toast.success(`Theme applied: ${theme.label}`);
  };

  const toggleReaction = (reactionId) => {
      const currentReactions = currentSlide.reactions || [];
      let newReactions;
      if (currentReactions.includes(reactionId)) {
          newReactions = currentReactions.filter(id => id !== reactionId);
      } else {
          newReactions = [...currentReactions, reactionId];
      }
      updateSlide('reactions', newReactions);
  };

  const addToHistory = (status) => {
    const newItem = {
        id: roomCode || Date.now().toString(),
        title: slides[0].question || "Untitled Session",
        type: slides.length > 1 ? "Presentation" : "Survey",
        date: new Date().toLocaleString(),
        status: status, 
        participants: 0,
        savedSlides: slides 
    };
    const existing = JSON.parse(localStorage.getItem("teacherHistory") || "[]");
    const filtered = existing.filter(item => item.id !== newItem.id);
    const updated = [newItem, ...filtered];
    localStorage.setItem("teacherHistory", JSON.stringify(updated));
    setRecentItems(updated);
  };

  const handleSaveDraft = () => {
      addToHistory('Draft');
      toast.success("Draft saved to history!", { icon: '💾' });
  };

  const loadHistory = () => {
      const history = JSON.parse(localStorage.getItem("teacherHistory") || "[]");
      setRecentItems(history);
      setShowHistory(true);
  };

  const handleRestoreSession = (item) => {
      if(window.confirm(`Load "${item.title}"? Unsaved changes will be lost.`)) {
          if (item.savedSlides && Array.isArray(item.savedSlides)) {
              setSlides(item.savedSlides);
              setActiveSlide(0);
              setRoomCode(item.id); 
              setShowHistory(false);
              toast.success("Session restored!");
          } else {
              toast.error("Error: Corrupted save file.");
          }
      }
  };

  const handleDeleteHistoryItem = (e, id) => {
      e.stopPropagation();
      const updated = recentItems.filter(item => item.id !== id);
      setRecentItems(updated);
      localStorage.setItem("teacherHistory", JSON.stringify(updated));
      toast.success("Deleted from history");
  };

  const handlePresent = () => {
    if (!currentSlide.question.trim()) return toast.error("Please add a question first!");
    
    const loadingToast = toast.loading("Starting session...");
    addToHistory('Live');
    
    const finalMode = sessionMode;

    socket.emit("create_room", { 
        roomCode, 
        topic: slides[0].question,
        questions: slides.map(s => ({
            questionText: s.question,
            type: s.type,
            options: s.options,
            image: s.image,
            correctAnswer: s.correctAnswer, 
            layout: s.layout, 
            style: { 
                bgColor: s.bgColor, 
                textColor: s.textColor,
                visualization: s.visualization,
                showPercentage: s.showPercentage
            },
            allowedReactions: s.reactions || []
        })) 
    });
    
    // Slight delay to allow socket to connect
    setTimeout(() => {
        toast.dismiss(loadingToast);
        navigate(`/game/${roomCode}`, { 
            state: { 
                role: 'host', 
                name: 'Presenter', 
                hasQuestions: true,
                mode: finalMode 
            } 
        });
    }, 500);
  };

  const handleAddSlide = () => {
      const newId = slides.length + 1;
      const prevSlide = slides[slides.length - 1];
      setSlides([...slides, { 
          ...BLANK_SLIDE, 
          id: newId, 
          question: "New Question",
          bgColor: prevSlide.bgColor,
          textColor: prevSlide.textColor,
          reactions: prevSlide.reactions
      }]);
      setActiveSlide(slides.length); 
      toast.success("Slide added");
  };

  const handleAddEnding = () => {
      const newId = slides.length + 1;
      const prevSlide = slides[slides.length - 1];
      setSlides([...slides, { 
          ...BLANK_SLIDE, 
          id: newId, 
          type: 'ending', 
          question: "Thank You!",
          options: ["Survey Complete."],
          bgColor: prevSlide.bgColor,
          textColor: prevSlide.textColor,
          reactions: ['love', 'like']
      }]);
      setActiveSlide(slides.length); 
      toast("Ending slide added", { icon: '🏁' });
  };

  const handleDeleteSlide = (e, indexToDelete) => {
      e.stopPropagation();
      if (slides.length <= 1) return toast.error("Presentation must have at least one slide.");
      
      const newSlides = slides.filter((_, i) => i !== indexToDelete);
      setSlides(newSlides);
      if (indexToDelete === activeSlide) {
          const newActive = indexToDelete >= newSlides.length ? newSlides.length - 1 : indexToDelete;
          setActiveSlide(newActive);
      } else if (indexToDelete < activeSlide) {
          setActiveSlide(activeSlide - 1);
      }
      toast.success("Slide deleted");
  };

  const handleImageUpload = (e, key = 'image') => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) return toast.error("Image too large (Max 2MB)");
        
        const loadingToast = toast.loading("Uploading image...");
        const reader = new FileReader();
        reader.onloadend = () => {
            updateSlide(key, reader.result);
            toast.success("Image uploaded", { id: loadingToast });
        };
        reader.readAsDataURL(file);
    }
  };

  // ✅ INITIALIZATION
  useEffect(() => {
    setRoomCode(Math.random().toString(36).substring(2, 6).toUpperCase());
    
    if (location.state?.template) {
        const t = location.state.template;
        const templateBg = t.bgColor || '#0f172a';
        const templateText = t.textColor || '#f8fafc';
        
        if (t.slides && Array.isArray(t.slides)) {
            const mappedSlides = t.slides.map((s, i) => ({
                ...BLANK_SLIDE, 
                id: i + 1,
                question: s.question,
                type: s.type,
                options: s.options || [],
                correctAnswer: s.correctAnswer, 
                image: null,
                layout: s.layout || 'centered',
                bgImage: null,
                bgColor: s.bgColor || templateBg,
                textColor: s.textColor || templateText,
                reactions: s.reactions || BLANK_SLIDE.reactions,
                visualization: s.visualization || 'bar',
                showPercentage: s.showPercentage !== undefined ? s.showPercentage : true
            }));
            setSlides(mappedSlides);
            toast.success("Template loaded successfully!");
        }
    }

    if (location.state?.mode) {
        setSessionMode(location.state.mode);
    }
  }, [location.state]);

  const HOST_URL = window.location.protocol + "//" + window.location.host;

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* RECENT ACTIVITY MODAL */}
      {showHistory && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-700 flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                        <History className="text-indigo-500"/> Recent Activity
                    </h3>
                    <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white">
                        <X size={20}/>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-950">
                    {recentItems.length === 0 ? (
                        <div className="text-center py-20 opacity-50 flex flex-col items-center">
                            <History size={48} className="mb-4 text-slate-600"/>
                            <p className="text-slate-500">No recent activity found.</p>
                        </div>
                    ) : (
                        recentItems.map((item) => (
                            <div key={item.id} onClick={() => handleRestoreSession(item)} className="group flex items-center justify-between p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/30 cursor-pointer transition-all hover:shadow-lg">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${item.status === 'Live' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : 'bg-amber-900/30 text-amber-400 border-amber-500/30'}`}>
                                            {item.status}
                                        </span>
                                        <span className="text-xs text-slate-500">{item.date}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-200 group-hover:text-indigo-400 transition">{item.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1">{item.type} • {item.savedSlides ? item.savedSlides.length : 0} Slides</p>
                                </div>
                                <button onClick={(e) => handleDeleteHistoryItem(e, item.id)} className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

      {/* LEFT: SLIDE THUMBNAILS */}
      <div className="w-28 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-3 z-10 overflow-y-auto custom-scrollbar">
        {slides.map((slide, index) => (
            <div key={slide.id} className="relative group w-full px-2">
                <button 
                    onClick={() => setActiveSlide(index)}
                    className={`relative w-full aspect-video rounded-lg border-2 transition flex flex-col items-center justify-center overflow-hidden shadow-sm hover:shadow-md
                        ${activeSlide === index ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-700 hover:border-slate-500'}`}
                    style={{ backgroundColor: slide.bgColor }}
                >
                    <div className="absolute top-1 left-1.5 text-[9px] font-bold opacity-70 bg-black/40 px-1 rounded backdrop-blur-sm text-white">{index + 1}</div>
                    <div style={{ color: slide.textColor }}>
                        {slide.type === 'mcq' 
                           ? VISUALIZATION_OPTS.find(v => v.id === (slide.visualization || 'bar'))?.icon 
                           : SURVEY_TYPES.find(t=>t.id === slide.type)?.icon
                       }
                    </div>
                </button>
                <button onClick={(e) => handleDeleteSlide(e, index)} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-rose-600 z-20 hover:scale-110">
                    <X size={10} strokeWidth={3}/>
                </button>
            </div>
        ))}
        
        <div className="flex flex-col gap-3 mt-4 w-full px-2">
            <button onClick={handleAddSlide} className="w-full aspect-square rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white border border-slate-700 hover:border-indigo-500 flex flex-col items-center justify-center gap-1 transition shadow-sm group">
                <Plus size={20}/>
                <span className="text-[9px] font-bold uppercase text-slate-500 group-hover:text-white">New</span>
            </button>
            <button onClick={handleAddEnding} className="w-full aspect-square rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 hover:border-emerald-500 flex flex-col items-center justify-center gap-1 transition shadow-sm group">
                <Flag size={20}/>
                <span className="text-[9px] font-bold uppercase text-slate-500 group-hover:text-white">End</span>
            </button>
        </div>
      </div>

      {/* CENTER: CANVAS */}
      <div className="flex-1 bg-slate-950 flex flex-col relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
        
        {/* Top Toolbar */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-md z-20">
            <div className="flex items-center gap-4 overflow-hidden">
                <button onClick={() => navigate('/teacher')} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                    <ArrowLeft size={20}/>
                </button>
                <div className="h-6 w-px bg-slate-800"></div>
                <h2 className="text-slate-200 font-bold text-sm truncate max-w-md flex items-center gap-2">
                    <span className="text-indigo-400">Slide {activeSlide + 1}:</span> 
                    <span className="opacity-80 truncate">{currentSlide.question || "Untitled Slide"}</span>
                    {sessionMode === 'quiz' && <span className="ml-2 px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] rounded font-bold uppercase tracking-wide">Quiz Mode</span>}
                </h2>
            </div>
            
            <div className="flex gap-3">
                <button onClick={loadHistory} className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><History size={18}/></button>
                <button onClick={handleSaveDraft} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition border border-slate-700"><Save size={16}/> Draft</button>
                <button onClick={handlePresent} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-500/20 active:scale-95 border border-indigo-400/20">
                    <Play size={16} fill="currentColor"/> Present
                </button>
            </div>
        </div>

       {/* Live Preview Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
            <div 
                className="aspect-video w-full max-w-5xl rounded-[1.5rem] shadow-2xl relative overflow-hidden flex flex-col transition-all duration-500 border border-white/5 ring-1 ring-black/50"
                style={{
                    backgroundColor: currentSlide.bgColor,
                    color: currentSlide.textColor,
                    backgroundImage: currentSlide.bgImage ? `url(${currentSlide.bgImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* --- CONTENT RENDERER --- */}
                {currentSlide.type === 'info' ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-16">
                        {currentSlide.layout === 'title' && (
                            <div className="animate-fade-in-up">
                                <h1 className="text-6xl md:text-7xl font-black mb-8 tracking-tight">{currentSlide.question || "Big Idea Here"}</h1>
                                <p className="text-3xl opacity-80 font-light max-w-4xl leading-relaxed">{currentSlide.options[0] || "Subtitle description"}</p>
                            </div>
                        )}
                        {currentSlide.layout === 'bullets' && (
                            <div className="w-full max-w-4xl text-left animate-fade-in-up bg-white/95 text-slate-900 p-12 rounded-[2rem] shadow-2xl">
                                <h1 className="text-5xl font-black mb-8 text-center border-b-4 border-slate-100 pb-6">{currentSlide.question || "Key Points"}</h1>
                                <ul className="space-y-6">
                                    {currentSlide.options.map((opt, i) => (
                                        <li key={i} className="flex items-start gap-4 text-2xl font-semibold text-slate-700">
                                            <span className="mt-2.5 w-3 h-3 bg-indigo-600 rounded-full shrink-0"></span>
                                            <span>{opt}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* 1. Header Bar (Join Info) */}
                        {currentSlide.type !== 'ending' && (
                            <div className="w-full bg-black/20 backdrop-blur-md p-4 flex justify-center items-center gap-4 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <span className="opacity-60 text-xs font-bold uppercase tracking-widest">Join at</span>
                                    <span className="font-bold text-lg opacity-90 tracking-tight">{HOST_URL}/game</span>
                                </div>
                                <div className="w-px h-4 bg-white/20"></div>
                                <div className="flex items-center gap-2">
                                    <span className="opacity-60 text-xs font-bold uppercase tracking-widest">Code</span>
                                    <span className="font-mono font-black text-2xl opacity-100 tracking-wider">{roomCode}</span>
                                </div>
                            </div>
                        )}

                        {/* 2. Main Content */}
                        <div className={`flex-1 p-16 flex relative z-10 ${
                            currentSlide.layout === 'centered' || currentSlide.type === 'ending' ? 'flex-col text-center' :
                            currentSlide.layout === 'left' ? 'flex-row text-left' :
                            currentSlide.layout === 'split' ? 'flex-row gap-16' : 'flex-col text-center'
                        }`}>
                            
                            {currentSlide.type === 'ending' ? (
                                <div className="flex-1 flex flex-col items-center justify-center animate-fade-in-up">
                                    <div className="mb-8 p-8 rounded-full bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 animate-bounce"><CheckCircle2 size={80} className="text-emerald-400"/></div>
                                    <h1 className="text-7xl font-black mb-6 tracking-tighter">{currentSlide.question || "All Done!"}</h1>
                                    <p className="text-2xl opacity-80 mb-12 max-w-xl leading-relaxed font-medium">{currentSlide.options[0] || "Thank you for participating."}</p>
                                </div>
                            ) : (
                                <>
                                    <div className={`flex flex-col justify-center ${currentSlide.layout === 'split' ? 'w-1/2' : 'w-full mb-10'}`}>
                                        <h1 className={`font-black leading-[1.1] break-words drop-shadow-lg ${currentSlide.layout === 'centered' ? 'text-6xl' : 'text-5xl'}`}>
                                            {currentSlide.question || "Start typing your question..."}
                                        </h1>
                                    </div>

                                    <div className={`flex flex-1 items-center justify-center gap-10 ${
                                        currentSlide.layout === 'split' ? 'w-1/2 flex-col' : 
                                        currentSlide.layout === 'left' ? 'flex-col-reverse' : 'flex-row'
                                    }`}>
                                            <div className={`bg-white p-4 rounded-2xl shadow-xl shrink-0 flex flex-col items-center transform -rotate-2 ${currentSlide.layout === 'centered' ? 'w-48' : 'w-40'}`}>
                                                <QRCodeCanvas value={`${HOST_URL}/game/${roomCode}`} size={currentSlide.layout === 'centered' ? 160 : 130} />
                                            </div>
                                            
                                            <div className={`flex-1 h-full w-full bg-black/10 rounded-[2rem] border-2 border-dashed border-current/20 flex flex-col items-center justify-center p-8 backdrop-blur-sm ${currentSlide.layout === 'split' ? 'h-64' : ''}`}>
                                                {currentSlide.type === 'mcq' ? (
                                                    <RenderMockChart 
                                                        type={currentSlide.visualization || 'bar'} 
                                                        options={currentSlide.options}
                                                        showPercentage={currentSlide.showPercentage}
                                                        textColor={currentSlide.textColor}
                                                    />
                                                ) : currentSlide.type === 'pin' && currentSlide.image ? (
                                                    <img src={currentSlide.image} className="h-full object-contain rounded-xl shadow-lg" alt="Preview"/>
                                                ) : (
                                                    <div className="flex flex-col items-center opacity-60">
                                                        <div className="mb-4 p-6 bg-white/10 rounded-full">
                                                            {SURVEY_TYPES.find(t=>t.id === currentSlide.type)?.icon}
                                                        </div>
                                                        <p className="text-sm font-bold uppercase tracking-widest">
                                                            {SURVEY_TYPES.find(t=>t.id === currentSlide.type)?.label} Preview
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
                
                {/* REACTION PREVIEW */}
                <div className="absolute bottom-6 right-6 bg-slate-900/80 backdrop-blur-xl p-2 rounded-full flex gap-3 border border-slate-700 shadow-2xl z-20 pl-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase self-center tracking-wider">Reactions</span>
                    {AVAILABLE_REACTIONS.map(r => (
                        <div key={r.id} className={`p-2 rounded-full transition-all duration-300 transform ${
                            (currentSlide.reactions || []).includes(r.id) 
                            ? 'bg-indigo-500 text-white scale-100 shadow-lg' 
                            : 'bg-transparent text-slate-600 scale-75 grayscale opacity-50'
                        }`}>
                            {React.cloneElement(r.icon, { size: 16 })}
                        </div>
                    ))}
                </div>

            </div>
        </div>
      </div>

      {/* RIGHT: EDITOR SIDEBAR */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-10 shadow-2xl">
        <div className="flex border-b border-slate-800">
            <button onClick={() => setSidebarTab('content')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition border-b-2 ${sidebarTab === 'content' ? 'text-white border-indigo-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>Content</button>
            <button onClick={() => setSidebarTab('design')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition border-b-2 ${sidebarTab === 'design' ? 'text-white border-emerald-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>Design</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-900">
            {sidebarTab === 'content' && (
                <>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Slide Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {SURVEY_TYPES.map(t => (
                            <button key={t.id} onClick={() => updateSlide('type', t.id)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${currentSlide.type === t.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                                {t.icon} <span className="text-[9px] mt-2 font-bold">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        {currentSlide.type === 'ending' ? 'Heading Text' : 'Question Text'}
                    </label>
                    <textarea 
                        value={currentSlide.question} 
                        onChange={(e) => updateSlide('question', e.target.value)}
                        className="w-full bg-slate-950 text-white p-4 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm h-32 placeholder-slate-600 resize-none font-medium"
                        placeholder={currentSlide.type === 'ending' ? "Thank You!" : "Type your question here..."}
                    />
                </div>

                {/* INFO SLIDE EDITOR */}
                {currentSlide.type === 'info' && (
                    <div className="space-y-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="flex gap-2 bg-slate-950 p-1 rounded-lg">
                            <button onClick={() => updateSlide('layout', 'title')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${currentSlide.layout === 'title' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Title</button>
                            <button onClick={() => updateSlide('layout', 'bullets')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${currentSlide.layout === 'bullets' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Bullets</button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase">
                                {currentSlide.layout === 'title' ? 'Subtitle' : 'Bullet Points'}
                            </label>
                            {currentSlide.options.map((opt, i) => (
                                <div key={i} className="flex gap-2">
                                    <input 
                                        value={opt} 
                                        onChange={(e) => {
                                            const newOpts = [...currentSlide.options];
                                            newOpts[i] = e.target.value;
                                            updateSlide('options', newOpts);
                                        }}
                                        className="flex-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none placeholder-slate-700"
                                        placeholder="List item..."
                                    />
                                    {currentSlide.layout === 'bullets' && (
                                        <button onClick={() => {
                                            const newOpts = currentSlide.options.filter((_, idx) => idx !== i);
                                            updateSlide('options', newOpts);
                                        }} className="text-slate-500 hover:text-rose-400 p-2 rounded hover:bg-slate-700"><Trash2 size={16}/></button>
                                    )}
                                </div>
                            ))}
                            {currentSlide.layout === 'bullets' && (
                                <button onClick={() => updateSlide('options', [...currentSlide.options, "New Point"])} className="w-full py-2 border border-dashed border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-500 rounded-lg text-xs font-bold transition">+ Add Item</button>
                            )}
                        </div>
                    </div>
                )}

                {/* REACTIONS */}
                <div className="space-y-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                          <span>Student Reactions</span>
                      </label>
                      <div className="flex justify-between gap-1">
                          {AVAILABLE_REACTIONS.map(reaction => {
                              const isActive = (currentSlide.reactions || []).includes(reaction.id);
                              return (
                                  <button 
                                      key={reaction.id}
                                      onClick={() => toggleReaction(reaction.id)}
                                      className={`p-2.5 rounded-lg border transition-all duration-200 flex items-center justify-center ${isActive ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-600'}`}
                                      title={reaction.label}
                                  >
                                      {reaction.icon}
                                  </button>
                              )
                          })}
                      </div>
                </div>

                {currentSlide.type === 'ending' && (
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Sub-text</label>
                        <input 
                            value={currentSlide.options[0] || ""} 
                            onChange={(e) => { const newOpts = [...currentSlide.options]; newOpts[0] = e.target.value; updateSlide('options', newOpts); }}
                            className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none text-sm"
                            placeholder="Optional message"
                        />
                    </div>
                )}

                {/* MCQ VISUALIZATION */}
                {currentSlide.type === 'mcq' && (
                    <div className="space-y-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chart Type</label>
                        <div className="flex gap-2">
                            {VISUALIZATION_OPTS.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => updateSlide('visualization', v.id)}
                                    className={`flex-1 py-2 rounded-lg border transition flex justify-center items-center ${currentSlide.visualization === v.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                    title={v.label}
                                >
                                    {v.icon}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                            <span className="text-xs font-bold text-slate-400">Show Percentages</span>
                            <button 
                                onClick={() => updateSlide('showPercentage', !currentSlide.showPercentage)}
                                className={`transition-colors duration-200 ${currentSlide.showPercentage ? 'text-emerald-400' : 'text-slate-600'}`}
                            >
                                {currentSlide.showPercentage ? <ToggleRight size={24} fill="currentColor" className="opacity-100"/> : <ToggleLeft size={24}/>}
                            </button>
                        </div>
                    </div>
                )}

                {(currentSlide.type === 'mcq' || currentSlide.type === 'ranking') && (
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Answer Options</label>
                        {currentSlide.options.map((opt, i) => (
                            <div key={i} className="flex gap-2 group">
                                <input 
                                    value={opt} 
                                    onChange={(e) => { const newOpts = [...currentSlide.options]; newOpts[i] = e.target.value; updateSlide('options', newOpts); }} 
                                    className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-slate-700"
                                    placeholder={`Option ${i+1}`}
                                />
                                <button onClick={() => { const newOpts = currentSlide.options.filter((_, idx) => idx !== i); updateSlide('options', newOpts); }} className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"><Trash2 size={16}/></button>
                            </div>
                        ))}
                        <button onClick={() => updateSlide('options', [...currentSlide.options, `Option ${currentSlide.options.length + 1}`])} className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 text-slate-400 text-xs font-bold rounded-xl transition hover:border-indigo-500 hover:text-indigo-400">+ Add Option</button>
                    </div>
                )}
                
                {currentSlide.type === 'pin' && (
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Reference Image</label>
                        <label className="w-full h-32 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition text-slate-500 hover:text-white bg-slate-900 hover:bg-slate-800">
                            <span className="text-xs font-bold flex flex-col items-center gap-2"><ImageIcon size={20}/> Upload Image</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                        </label>
                    </div>
                )}
                </>
            )}

            {sidebarTab === 'design' && (
                <>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Layout Style</label>
                    <div className="flex gap-2">
                        {LAYOUTS.map(l => (
                            <button key={l.id} onClick={() => updateSlide('layout', l.id)} className={`flex-1 p-3 rounded-xl border transition flex justify-center ${currentSlide.layout === l.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'}`}>
                                {l.icon}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Theme Presets</label>
                    <div className="grid grid-cols-2 gap-2">
                        {THEMES.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => applyTheme(t)} 
                                className="p-3 rounded-xl border border-slate-800 hover:border-slate-600 bg-slate-950 text-left transition group"
                            >
                                <div className={`w-full h-10 rounded-lg mb-2 border border-white/10 ${t.preview}`}></div>
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-white">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Custom Colors</label>
                    <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-xs font-bold text-slate-400">Background</span>
                        <input type="color" value={currentSlide.bgColor} onChange={(e) => updateSlide('bgColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent"/>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-xs font-bold text-slate-400">Text Color</span>
                        <input type="color" value={currentSlide.textColor} onChange={(e) => updateSlide('textColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent"/>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Background Image</label>
                    <label className="w-full h-32 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition text-slate-500 hover:text-white relative overflow-hidden bg-slate-900">
                        {currentSlide.bgImage ? (
                            <img src={currentSlide.bgImage} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                        ) : <ImageIcon size={24}/>}
                        <span className="text-xs font-bold z-10 relative bg-black/50 px-3 py-1 rounded backdrop-blur-sm">{currentSlide.bgImage ? "Change Image" : "Upload Wallpaper"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'bgImage')}/>
                    </label>
                    {currentSlide.bgImage && (
                        <button onClick={() => updateSlide('bgImage', null)} className="w-full py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition">Remove Image</button>
                    )}
                </div>
                </>
            )}
        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md">
             <button onClick={() => navigate('/teacher')} className="w-full py-3 text-xs font-bold text-slate-500 hover:text-white transition border border-slate-800 hover:border-slate-600 rounded-xl hover:bg-slate-800">Exit Editor</button>
        </div>

      </div> 
    </div>
  );
};

export default SurveyCreator;