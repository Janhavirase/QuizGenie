import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../socket'; 
import { QRCodeCanvas } from 'qrcode.react'; 
import { 
  BarChart, Cloud, MessageSquare, ListOrdered, MapPin, Play, Save, Plus, 
  Image as ImageIcon, Trash2, Layout, Type, Palette, Monitor, AlignLeft, 
  AlignCenter, Columns, Flag, CheckCircle, LogOut, X, History, PieChart, 
  CircleDashed, LayoutGrid, ToggleLeft, ToggleRight, 
  Cat, Heart, HelpCircle, ThumbsUp, ThumbsDown, Info 
} from 'lucide-react';

// --- CONFIG ---
const SURVEY_TYPES = [
  { id: 'mcq', label: 'Multiple Choice', icon: <BarChart size={18}/> },
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
    { id: 'modern_dark', label: 'Modern Dark', bg: '#111827', text: '#ffffff', preview: 'bg-gray-900' },
    { id: 'light_minimal', label: 'Minimal Light', bg: '#ffffff', text: '#111827', preview: 'bg-white' },
    { id: 'neon_purple', label: 'Neon Purple', bg: '#312e81', text: '#e0e7ff', preview: 'bg-indigo-900' },
    { id: 'forest', label: 'Forest', bg: '#064e3b', text: '#d1fae5', preview: 'bg-emerald-900' },
    { id: 'sunset', label: 'Sunset', bg: '#7c2d12', text: '#ffedd5', preview: 'bg-orange-900' },
    { id: 'ocean', label: 'Ocean', bg: '#1e3a8a', text: '#bfdbfe', preview: 'bg-blue-900' },
];

const VISUALIZATION_OPTS = [
    { id: 'bar', label: 'Bar Chart', icon: <BarChart size={20}/> },
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
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    const data = options.map((opt, i) => ({
        label: opt,
        value: 10 + (i * 5),
        color: colors[i % colors.length]
    }));
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    if (type === 'bar') {
        return (
            <div className="w-full h-full flex flex-col justify-center gap-3">
                {data.map((d, i) => (
                    <div key={i} className="relative w-full">
                        <div className="flex justify-between text-xs font-bold mb-1 opacity-80" style={{ color: textColor }}>
                            <span>{d.label}</span>
                            {showPercentage && <span>{Math.round((d.value/total)*100)}%</span>}
                        </div>
                        <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(d.value/total)*100}%`, backgroundColor: d.color }}></div>
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
            const start = currentAngle;
            const end = currentAngle + percentage;
            currentAngle = end;
            return `${d.color} ${start}% ${end}%`;
        }).join(', ');

        return (
            <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="relative rounded-full transition-all duration-500 shadow-xl"
                    style={{ width: '200px', height: '200px', background: `conic-gradient(${gradients})` }}
                >
                    {type === 'donut' && (
                        <div className="absolute inset-0 m-auto rounded-full backdrop-blur-sm" style={{ width: '60%', height: '60%', backgroundColor: 'rgba(0,0,0,0.3)' }}></div>
                    )}
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                    {data.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-bold" style={{ color: textColor }}>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                            <span>{d.label} {showPercentage && `(${Math.round((d.value/total)*100)}%)`}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'dots') {
        return (
            <div className="w-full h-full flex flex-col justify-center gap-4 overflow-hidden">
                 {data.map((d, i) => (
                    <div key={i} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-bold opacity-80" style={{ color: textColor }}>
                            <span>{d.label}</span>
                            {showPercentage && <span>{Math.round((d.value/total)*100)}%</span>}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {Array.from({ length: Math.ceil(d.value / 2) }).map((_, idx) => (
                                <div key={idx} className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: d.color, animationDelay: `${idx * 50}ms` }}></div>
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

  // ✅ CAPTURE MODE: Defaults to 'survey', but respects 'quiz' if passed
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
      bgColor: '#111827', 
      textColor: '#ffffff'
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
      alert("✅ Draft saved to Recent Activity!");
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
          } else {
              alert("⚠️ Error: This history item does not contain slide data.");
          }
      }
  };

  const handleDeleteHistoryItem = (e, id) => {
      e.stopPropagation();
      const updated = recentItems.filter(item => item.id !== id);
      setRecentItems(updated);
      localStorage.setItem("teacherHistory", JSON.stringify(updated));
  };

  const handlePresent = () => {
    if (!currentSlide.question.trim()) return alert("⚠️ Slide is empty!");
    addToHistory('Live');
    
    // ✅ CRITICAL FIX: Use the STATE variable 'sessionMode', NOT location.state directly
    // This ensures that if we are in 'quiz' mode, we stay in 'quiz' mode.
    const finalMode = sessionMode;

    socket.emit("create_room", { 
        roomCode, 
        topic: slides[0].question,
        questions: slides.map(s => ({
            questionText: s.question,
            type: s.type,
            options: s.options,
            image: s.image,
            correctAnswer: s.correctAnswer, // ✅ This must be passed!
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
    
    // ✅ PASS THE MODE TO GAME ROOM
    navigate(`/game/${roomCode}`, { 
        state: { 
            role: 'host', 
            name: 'Presenter', 
            hasQuestions: true,
            mode: finalMode // <--- Sending the correct mode
        } 
    });
  };

  const handleSimulatedExit = () => {
      if(window.confirm("This button will exit the survey for students. Return to dashboard?")) {
          navigate('/teacher');
      }
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
  };

  const handleDeleteSlide = (e, indexToDelete) => {
      e.stopPropagation();
      if (slides.length <= 1) return alert("⚠️ You must have at least one slide.");
      const newSlides = slides.filter((_, i) => i !== indexToDelete);
      setSlides(newSlides);
      if (indexToDelete === activeSlide) {
          const newActive = indexToDelete >= newSlides.length ? newSlides.length - 1 : indexToDelete;
          setActiveSlide(newActive);
      } else if (indexToDelete < activeSlide) {
          setActiveSlide(activeSlide - 1);
      }
  };

  const handleImageUpload = (e, key = 'image') => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) return alert("⚠️ Max 2MB");
        const reader = new FileReader();
        reader.onloadend = () => updateSlide(key, reader.result);
        reader.readAsDataURL(file);
    }
  };

  // ✅ INITIALIZATION: Load template and set MODE
  useEffect(() => {
    setRoomCode(Math.random().toString(36).substring(2, 6).toUpperCase());
    
    if (location.state?.template) {
        const t = location.state.template;
        const templateBg = t.bgColor || '#111827';
        const templateText = t.textColor || '#ffffff';
        
        if (t.slides && Array.isArray(t.slides)) {
            const mappedSlides = t.slides.map((s, i) => ({
                ...BLANK_SLIDE, 
                id: i + 1,
                question: s.question,
                type: s.type,
                options: s.options || [],
                correctAnswer: s.correctAnswer, // ✅ Keep correct answer!
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
        }
    }

    // ✅ Set Session Mode from Previous Screen (Manual/AI Creator)
    if (location.state?.mode) {
        setSessionMode(location.state.mode);
    }
  }, [location.state]);

  const HOST_URL = window.location.protocol + "//" + window.location.host;

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden font-sans selection:bg-purple-500/30">
      
      {/* RECENT ACTIVITY MODAL */}
      {showHistory && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-800 flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <History className="text-blue-500"/> Recent Activity
                    </h3>
                    <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-800 rounded-full transition">
                        <X size={20}/>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {recentItems.length === 0 ? (
                        <div className="text-center py-12 opacity-50">
                            <History size={48} className="mx-auto mb-4"/>
                            <p>No recent activity found.</p>
                        </div>
                    ) : (
                        recentItems.map((item) => (
                            <div key={item.id} onClick={() => handleRestoreSession(item)} className="group flex items-center justify-between p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-blue-500/50 cursor-pointer transition-all">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${item.status === 'Live' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                            {item.status}
                                        </span>
                                        <span className="text-xs text-gray-500">{item.date}</span>
                                    </div>
                                    <h4 className="font-bold text-white group-hover:text-blue-400 transition">{item.title}</h4>
                                    <p className="text-xs text-gray-400 mt-1">{item.type} • {item.savedSlides ? item.savedSlides.length : 0} Slides</p>
                                </div>
                                <button onClick={(e) => handleDeleteHistoryItem(e, item.id)} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"><Trash2 size={16}/></button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

      {/* LEFT: SLIDE THUMBNAILS */}
      <div className="w-24 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-4 z-10 overflow-y-auto custom-scrollbar">
        {slides.map((slide, index) => (
            <div key={slide.id} className="relative group">
                <button 
                    onClick={() => setActiveSlide(index)}
                    className={`relative w-16 h-12 rounded border-2 transition flex flex-col items-center justify-center overflow-hidden
                        ${activeSlide === index ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-700 hover:border-gray-500'}`}
                    style={{ backgroundColor: slide.bgColor }}
                >
                    <div className="absolute top-0.5 left-1 text-[8px] opacity-70 font-bold" style={{ color: slide.textColor }}>{index + 1}</div>
                    <div style={{ color: slide.textColor }}>
                         {slide.type === 'mcq' 
                            ? VISUALIZATION_OPTS.find(v => v.id === (slide.visualization || 'bar'))?.icon 
                            : SURVEY_TYPES.find(t=>t.id === slide.type)?.icon
                        }
                    </div>
                </button>
                <button onClick={(e) => handleDeleteSlide(e, index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 hover:scale-110">
                    <X size={10} />
                </button>
            </div>
        ))}
        
        <div className="flex flex-col gap-2 mt-2">
            <button onClick={handleAddSlide} className="w-12 h-12 rounded-full bg-gray-800 hover:bg-blue-600 border border-gray-700 hover:border-blue-500 flex items-center justify-center transition shadow-lg group relative">
                <Plus size={20}/>
            </button>
            <button onClick={handleAddEnding} className="w-12 h-12 rounded-full bg-gray-800 hover:bg-red-600 border border-gray-700 hover:border-red-500 flex items-center justify-center transition shadow-lg">
                <Flag size={20}/>
            </button>
        </div>
      </div>

      {/* CENTER: CANVAS */}
      <div className="flex-1 bg-gray-950 relative flex flex-col">
        <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-md">
            <h2 className="text-gray-400 font-bold text-sm truncate max-w-md">
                Slide {activeSlide + 1}: <span className="text-white">{currentSlide.question || "Untitled"}</span>
                {sessionMode === 'quiz' && <span className="ml-2 px-2 py-0.5 bg-blue-600 text-[10px] rounded text-white font-bold uppercase">Quiz Mode</span>}
            </h2>
            <div className="flex gap-3">
                <button onClick={loadHistory} className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"><History size={18}/></button>
                <button onClick={handleSaveDraft} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-bold transition border border-gray-700"><Save size={16}/> Draft</button>
                <button onClick={handlePresent} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 text-white text-sm font-bold transition shadow-lg shadow-purple-500/20"><Play size={16} fill="currentColor"/> Present</button>
            </div>
        </div>

       {/* Live Preview Area */}
        <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
            
            <div 
                className="aspect-video w-full max-w-4xl rounded-xl shadow-2xl relative overflow-hidden flex flex-col transition-all duration-300"
                style={{
                    backgroundColor: currentSlide.bgColor,
                    color: currentSlide.textColor,
                    backgroundImage: currentSlide.bgImage ? `url(${currentSlide.bgImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* --- CONDITIONAL RENDER START --- */}
                {currentSlide.type === 'info' ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        {currentSlide.layout === 'title' && (
                            <div className="animate-fade-in-up">
                                <h1 className="text-6xl font-extrabold mb-6 tracking-tight">{currentSlide.question || "Topic Title"}</h1>
                                <p className="text-2xl opacity-80 font-light max-w-3xl leading-relaxed">{currentSlide.options[0] || "Subtitle goes here"}</p>
                            </div>
                        )}
                        {currentSlide.layout === 'bullets' && (
                            <div className="w-full max-w-4xl text-left animate-fade-in-up bg-white text-black p-10 rounded-3xl shadow-xl">
                                <h1 className="text-5xl font-bold mb-8 text-center border-b-2 border-gray-200 pb-4">{currentSlide.question || "Rules"}</h1>
                                <ul className="space-y-4">
                                    {currentSlide.options.map((opt, i) => (
                                        <li key={i} className="flex items-start gap-3 text-xl font-medium"><span className="mt-1.5 w-2 h-2 bg-black rounded-full shrink-0"></span><span>{opt}</span></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* 1. Join Info Bar */}
                        {currentSlide.type !== 'ending' && (
                            <div className="w-full bg-black/10 backdrop-blur-sm p-3 flex justify-center items-center gap-2 border-b border-black/5">
                                <span className="opacity-70 text-xs font-bold uppercase tracking-widest">Join at</span>
                                <span className="font-bold text-sm opacity-90">{HOST_URL}/game</span>
                                <span className="opacity-50">|</span>
                                <span className="opacity-70 text-xs font-bold uppercase tracking-widest">Code</span>
                                <span className="font-mono font-bold text-lg opacity-100">{roomCode}</span>
                            </div>
                        )}

                        {/* 2. Main Slide Content */}
                        <div className={`flex-1 p-12 flex relative z-10 ${
                            currentSlide.layout === 'centered' || currentSlide.type === 'ending' ? 'flex-col text-center' :
                            currentSlide.layout === 'left' ? 'flex-row text-left' :
                            currentSlide.layout === 'split' ? 'flex-row gap-12' : 'flex-col text-center'
                        }`}>
                            
                            {currentSlide.type === 'ending' ? (
                                <div className="flex-1 flex flex-col items-center justify-center animate-fade-in-up">
                                    <div className="mb-6 p-6 rounded-full bg-white/10 backdrop-blur-md shadow-xl border border-white/20"><CheckCircle size={64} className="opacity-90"/></div>
                                    <h1 className="text-6xl font-extrabold mb-4 tracking-tight">{currentSlide.question || "Thank You!"}</h1>
                                    <p className="text-xl opacity-70 mb-12 max-w-lg leading-relaxed font-medium">{currentSlide.options[0] || "The survey has ended."}</p>
                                </div>
                            ) : (
                                <>
                                    <div className={`flex flex-col justify-center ${currentSlide.layout === 'split' ? 'w-1/2' : 'w-full mb-8'}`}>
                                        <h1 className={`font-extrabold leading-tight break-words ${currentSlide.layout === 'centered' ? 'text-5xl' : 'text-4xl'}`}>{currentSlide.question || "Start typing..."}</h1>
                                    </div>

                                    <div className={`flex flex-1 items-center justify-center gap-8 ${
                                        currentSlide.layout === 'split' ? 'w-1/2 flex-col' : 
                                        currentSlide.layout === 'left' ? 'flex-col-reverse' : 'flex-row'
                                    }`}>
                                            <div className={`bg-white p-3 rounded-xl shadow-lg shrink-0 flex flex-col items-center ${currentSlide.layout === 'centered' ? 'w-40' : 'w-32'}`}>
                                                <QRCodeCanvas value={`${HOST_URL}/game/${roomCode}`} size={currentSlide.layout === 'centered' ? 145 : 115} />
                                                {/* ✅ VISUAL FIX: SHOW CODE UNDER QR */}
                                                <p className="text-black font-mono font-bold text-lg mt-2 tracking-widest">{roomCode}</p>
                                            </div>
                                            <div className={`flex-1 h-full w-full bg-black/5 rounded-2xl border-2 border-dashed border-current/20 flex flex-col items-center justify-center p-6 opacity-80 ${currentSlide.layout === 'split' ? 'h-64' : ''}`}>
                                                {currentSlide.type === 'mcq' ? (
                                                    <RenderMockChart 
                                                        type={currentSlide.visualization || 'bar'} 
                                                        options={currentSlide.options}
                                                        showPercentage={currentSlide.showPercentage}
                                                        textColor={currentSlide.textColor}
                                                    />
                                                ) : currentSlide.type === 'pin' && currentSlide.image ? (
                                                    <img src={currentSlide.image} className="h-full object-contain rounded-lg shadow-md" alt="Preview"/>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <div className="mb-4 opacity-70 p-4 bg-white/20 rounded-full backdrop-blur-md">
                                                            {SURVEY_TYPES.find(t=>t.id === currentSlide.type)?.icon}
                                                        </div>
                                                        <p className="text-sm font-bold uppercase tracking-widest opacity-70">
                                                            {SURVEY_TYPES.find(t=>t.id === currentSlide.type)?.label} Mode
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
                
                {/* STUDENT REACTION PREVIEW */}
                <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full flex gap-2 border border-white/10 z-20">
                    <span className="text-[10px] text-gray-300 font-bold uppercase self-center px-2">Student View</span>
                    {AVAILABLE_REACTIONS.map(r => (
                        <div key={r.id} className={`p-1.5 rounded-full transition-all ${(currentSlide.reactions || []).includes(r.id) ? 'bg-white/20 text-white opacity-100' : 'bg-transparent text-gray-500 opacity-20'}`}>
                            {React.cloneElement(r.icon, { size: 14 })}
                        </div>
                    ))}
                </div>

            </div>
        </div>
      </div>

      {/* RIGHT: EDITOR SIDEBAR */}
      <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-10 shadow-xl">
        <div className="flex border-b border-gray-800">
            <button onClick={() => setSidebarTab('content')} className={`flex-1 py-4 text-sm font-bold transition ${sidebarTab === 'content' ? 'text-white border-b-2 border-blue-500 bg-gray-800/50' : 'text-gray-500'}`}>Content</button>
            <button onClick={() => setSidebarTab('design')} className={`flex-1 py-4 text-sm font-bold transition ${sidebarTab === 'design' ? 'text-white border-b-2 border-green-500 bg-gray-800/50' : 'text-gray-500'}`}>Design</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {sidebarTab === 'content' && (
                <>
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Layout size={14}/> Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {SURVEY_TYPES.map(t => (
                            <button key={t.id} onClick={() => updateSlide('type', t.id)} className={`flex flex-col items-center justify-center p-2 rounded-lg border transition ${currentSlide.type === t.id ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                                {t.icon} <span className="text-[10px] mt-1 font-bold">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Type size={14}/> {currentSlide.type === 'ending' ? 'Heading Text' : 'Question'}
                    </label>
                    <textarea 
                        value={currentSlide.question} 
                        onChange={(e) => updateSlide('question', e.target.value)}
                        className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-blue-500 outline-none text-sm h-24"
                        placeholder={currentSlide.type === 'ending' ? "Thank You!" : "Type your question..."}
                    />
                </div>

                {/* INFO SLIDE EDITOR */}
                {currentSlide.type === 'info' && (
                    <div className="space-y-4 animate-fade-in p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                        <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
                            <button onClick={() => updateSlide('layout', 'title')} className={`flex-1 py-1 text-xs font-bold rounded ${currentSlide.layout === 'title' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Title</button>
                            <button onClick={() => updateSlide('layout', 'bullets')} className={`flex-1 py-1 text-xs font-bold rounded ${currentSlide.layout === 'bullets' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Bullets</button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">
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
                                        className="flex-1 bg-gray-800 p-2 rounded-lg border border-gray-700 text-sm text-white focus:border-blue-500 outline-none"
                                    />
                                    {currentSlide.layout === 'bullets' && (
                                        <button onClick={() => {
                                            const newOpts = currentSlide.options.filter((_, idx) => idx !== i);
                                            updateSlide('options', newOpts);
                                        }} className="text-red-400 hover:bg-red-900/20 p-2 rounded"><Trash2 size={14}/></button>
                                    )}
                                </div>
                            ))}
                            {currentSlide.layout === 'bullets' && (
                                <button onClick={() => updateSlide('options', [...currentSlide.options, "New Rule"])} className="text-xs text-blue-400 font-bold">+ Add Item</button>
                            )}
                        </div>
                    </div>
                )}

                {/* REACTIONS SELECTOR */}
                <div className="space-y-3 animate-fade-in p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">Reactions <HelpCircle size={12}/></label>
                      <div className="flex justify-between gap-1">
                          {AVAILABLE_REACTIONS.map(reaction => {
                              const isActive = (currentSlide.reactions || []).includes(reaction.id);
                              return (
                                  <button 
                                      key={reaction.id}
                                      onClick={() => toggleReaction(reaction.id)}
                                      className={`p-3 rounded-lg border transition-all duration-200 flex items-center justify-center ${isActive ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'}`}
                                      title={reaction.label}
                                  >
                                      {reaction.icon}
                                  </button>
                              )
                          })}
                      </div>
                </div>

                {currentSlide.type === 'ending' && (
                    <div className="space-y-3 animate-fade-in">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={14}/> Sub-text</label>
                        <input 
                            value={currentSlide.options[0] || ""} 
                            onChange={(e) => { const newOpts = [...currentSlide.options]; newOpts[0] = e.target.value; updateSlide('options', newOpts); }}
                            className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-blue-500 outline-none text-sm"
                            placeholder="Optional message"
                        />
                    </div>
                )}

                {/* VISUALIZATION SETTINGS (MCQ) */}
                {currentSlide.type === 'mcq' && (
                    <div className="space-y-4 animate-fade-in p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">Visualization type</label>
                        <div className="flex gap-2">
                            {VISUALIZATION_OPTS.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => updateSlide('visualization', v.id)}
                                    className={`flex-1 py-2 rounded-lg border transition flex justify-center items-center ${currentSlide.visualization === v.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                                    title={v.label}
                                >
                                    {v.icon}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-300">Show percentages</span>
                                <span className="text-[10px] text-gray-500">Display % along with counts</span>
                            </div>
                            <button 
                                onClick={() => updateSlide('showPercentage', !currentSlide.showPercentage)}
                                className={`transition-colors duration-200 ${currentSlide.showPercentage ? 'text-green-400' : 'text-gray-600 hover:text-gray-400'}`}
                            >
                                {currentSlide.showPercentage ? <ToggleRight size={28} fill="currentColor" className="opacity-100"/> : <ToggleLeft size={28}/>}
                            </button>
                        </div>
                    </div>
                )}

                {(currentSlide.type === 'mcq' || currentSlide.type === 'ranking') && (
                    <div className="space-y-3 animate-fade-in">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><ListOrdered size={14}/> Options</label>
                        {currentSlide.options.map((opt, i) => (
                            <div key={i} className="flex gap-2">
                                <input value={opt} onChange={(e) => { const newOpts = [...currentSlide.options]; newOpts[i] = e.target.value; updateSlide('options', newOpts); }} className="flex-1 bg-gray-800 p-2 rounded-lg border border-gray-700 text-sm text-white focus:border-blue-500 outline-none"/>
                                <button onClick={() => { const newOpts = currentSlide.options.filter((_, idx) => idx !== i); updateSlide('options', newOpts); }} className="p-2 text-gray-500 hover:text-red-400"><Trash2 size={16}/></button>
                            </div>
                        ))}
                        <button onClick={() => updateSlide('options', [...currentSlide.options, `Option ${currentSlide.options.length + 1}`])} className="w-full py-2 bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600 text-gray-400 text-xs font-bold rounded-lg">+ Add Option</button>
                    </div>
                )}
                
                {currentSlide.type === 'pin' && (
                    <div className="space-y-3 animate-fade-in">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14}/> Pin Image</label>
                        <label className="w-full h-24 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition text-gray-500 hover:text-white">
                            <span className="text-xs font-bold">Upload</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                        </label>
                    </div>
                )}
                </>
            )}

            {sidebarTab === 'design' && (
                <>
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Monitor size={14}/> Layout</label>
                    <div className="flex gap-2">
                        {LAYOUTS.map(l => (
                            <button key={l.id} onClick={() => updateSlide('layout', l.id)} className={`flex-1 p-3 rounded-lg border transition flex justify-center ${currentSlide.layout === l.id ? 'bg-green-600/20 border-green-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                                {l.icon}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Palette size={14}/> Themes</label>
                    <div className="grid grid-cols-2 gap-2">
                        {THEMES.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => applyTheme(t)} 
                                className="p-3 rounded-lg border border-gray-700 hover:border-white text-left transition group"
                            >
                                <div className={`w-full h-8 rounded mb-2 border border-gray-600 ${t.preview}`}></div>
                                <span className="text-xs font-bold text-gray-400 group-hover:text-white">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Palette size={14}/> Custom Colors</label>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700">
                        <span className="text-sm font-medium text-gray-300">Background</span>
                        <div className="flex items-center gap-2">
                             <input type="color" value={currentSlide.bgColor} onChange={(e) => updateSlide('bgColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent"/>
                        </div>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700">
                        <span className="text-sm font-medium text-gray-300">Text Color</span>
                        <div className="flex items-center gap-2">
                             <input type="color" value={currentSlide.textColor} onChange={(e) => updateSlide('textColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent"/>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14}/> Background Image</label>
                    <label className="w-full h-32 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition text-gray-500 hover:text-white relative overflow-hidden bg-gray-800">
                        {currentSlide.bgImage ? (
                            <img src={currentSlide.bgImage} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                        ) : <ImageIcon size={24}/>}
                        <span className="text-xs font-bold z-10">{currentSlide.bgImage ? "Change Image" : "Upload Wallpaper"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'bgImage')}/>
                    </label>
                    {currentSlide.bgImage && (
                        <button onClick={() => updateSlide('bgImage', null)} className="w-full py-2 text-xs text-red-400 hover:text-red-300">Remove Background</button>
                    )}
                </div>
                </>
            )}
        </div>
        
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
             <button onClick={() => navigate('/teacher')} className="w-full py-2 text-xs font-bold text-gray-500 hover:text-white transition border border-transparent hover:border-gray-700 rounded-lg">Exit Editor</button>
        </div>

      </div>

    </div>
  );
};

export default SurveyCreator;