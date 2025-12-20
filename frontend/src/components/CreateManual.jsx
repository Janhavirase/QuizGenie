import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, Save, ArrowLeft, CheckCircle, Clock, Type, Play, 
  Layout, Palette, AlignLeft, AlignCenter, MoreHorizontal, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CreateManual = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- STATE ---
  const [title, setTitle] = useState("Untitled Project");
  const [activeSlide, setActiveSlide] = useState(0);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // ✅ PROFESSIONAL TEMPLATES (No Ugly Green)
  const TEMPLATES = {
    mcq: { 
        type: 'mcq', 
        questionText: "", 
        options: ["", "", "", ""], 
        correctAnswer: "", 
        timeLimit: 20, 
        style: { bgColor: '#18181b', textColor: '#ffffff', fontSize: 'text-4xl', layout: 'centered' } 
    },
    tf: { 
        type: 'tf', 
        questionText: "True or False?", 
        options: ["True", "False"], 
        correctAnswer: "", 
        timeLimit: 15, 
        style: { bgColor: '#1e1b4b', textColor: '#ffffff', fontSize: 'text-4xl', layout: 'centered' } 
    },
    info: { 
        type: 'info', 
        questionText: "Did You Know?", 
        options: ["Enter your information here..."], 
        timeLimit: 0, 
        style: { bgColor: '#000000', textColor: '#ffffff', fontSize: 'text-5xl', layout: 'centered' } 
    },
    ending: { 
        type: 'ending', 
        questionText: "Thank You!", 
        options: ["You have completed the session."], 
        timeLimit: 0, 
        style: { bgColor: '#000000', textColor: '#fbbf24', fontSize: 'text-6xl', layout: 'centered' } 
    }
  };

  const [slides, setSlides] = useState([
    { ...TEMPLATES.mcq, id: Date.now(), questionText: "" } 
  ]);

  // --- ACTIONS ---

  const addNewSlide = (type) => {
    const newSlide = { ...TEMPLATES[type], id: Date.now() + Math.random() };
    const newSlides = [...slides];
    newSlides.splice(activeSlide + 1, 0, newSlide);
    setSlides(newSlides);
    setActiveSlide(activeSlide + 1);
    setShowAddMenu(false);
  };

  const deleteSlide = (e, index) => {
    e.stopPropagation();
    if (slides.length === 1) return toast.error("Project must have at least one slide!");
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (activeSlide >= newSlides.length) setActiveSlide(newSlides.length - 1);
  };

  const updateSlideContent = (field, value) => {
    const updated = [...slides];
    updated[activeSlide][field] = value;
    setSlides(updated);
  };

  const updateStyle = (field, value) => {
    const updated = [...slides];
    updated[activeSlide].style[field] = value;
    setSlides(updated);
  };

  const updateOption = (idx, val) => {
    const updated = [...slides];
    updated[activeSlide].options[idx] = val;
    setSlides(updated);
  };

  const setCorrect = (val) => {
    updateSlideContent('correctAnswer', val);
  };

  // --- HELPERS ---

  // ✅ SMART NUMBERING: Don't count Info/Ending as "Questions"
  const getSlideLabel = (index) => {
    const s = slides[index];
    if (s.type === 'info') return 'ℹ️ Info';
    if (s.type === 'ending') return '🏁 End';
    
    // Count how many actual questions appear before this one
    let qCount = 0;
    for(let i=0; i<=index; i++) {
        if(slides[i].type === 'mcq' || slides[i].type === 'tf') qCount++;
    }
    return `Q${qCount}`;
  };

  // --- PLAY / SAVE ---

  const validateProject = () => {
    if (!title.trim()) { toast.error("Please name your project"); return false; }
    
    for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        if (!s.questionText.trim()) { toast.error(`Slide ${i+1}: Missing main text`); return false; }
        
        // Only validate answers for actual Questions
        if (s.type === 'mcq' || s.type === 'tf') {
            if (!s.correctAnswer) { toast.error(`Slide ${i+1}: Select a correct answer`); return false; }
            if (s.options.some(o => !o.trim())) { toast.error(`Slide ${i+1}: Fill all options`); return false; }
        }
    }
    return true;
  };

  const handlePlayNow = () => {
    if (!validateProject()) return;
    const playableData = slides.map(s => ({ ...s, question: s.questionText }));
    navigate('/study', { state: { questions: playableData, title: title, id: "draft-play" } });
  };

  const handleSave = () => {
    if (!validateProject()) return;
    const newQuiz = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        creatorEmail: user?.email || "guest",
        date: new Date().toISOString(),
        questions: slides 
    };
    const existing = JSON.parse(localStorage.getItem('quizgenie_quizzes') || "[]");
    localStorage.setItem('quizgenie_quizzes', JSON.stringify([...existing, newQuiz]));
    toast.success("Project Saved!");
    navigate('/teacher');
  };

  const current = slides[activeSlide];

  return (
    <div className="h-screen bg-[#09090b] text-white flex flex-col font-sans overflow-hidden">
      
      {/* 1. STUDIO HEADER */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-[#09090b] z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/solo')} className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white">
                <ArrowLeft size={18}/>
            </button>
            <div className="h-6 w-px bg-white/10"></div>
            <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent text-sm font-bold focus:outline-none focus:bg-white/5 px-2 py-1 rounded w-64 text-gray-200"
                placeholder="Untitled Project..."
            />
        </div>

        <div className="flex items-center gap-2">
            <button onClick={handlePlayNow} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-md text-sm font-bold transition">
                <Play size={14} fill="currentColor" /> Preview
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-4 py-1.5 rounded-md text-sm font-bold transition">
                <Save size={14}/> Save
            </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* 2. SIDEBAR (Filmstrip) */}
        <div className="w-56 bg-[#09090b] border-r border-white/5 flex flex-col">
            <div className="p-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Slides</div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-3">
                {slides.map((s, i) => (
                    <div 
                        key={s.id} 
                        onClick={() => setActiveSlide(i)}
                        className={`group relative aspect-video rounded-lg cursor-pointer border transition-all duration-200 flex flex-col ${
                            activeSlide === i 
                            ? 'border-blue-500 ring-1 ring-blue-500/50' 
                            : 'border-white/10 hover:border-white/30'
                        }`}
                        style={{ backgroundColor: s.style?.bgColor || '#18181b' }}
                    >
                        {/* Slide Number / Label */}
                        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white/80 z-10">
                            {getSlideLabel(i)}
                        </div>
                        
                        {/* Mini Preview */}
                        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                            <div className="text-[6px] text-white/50 text-center leading-tight">
                                {s.questionText || "Empty Slide"}
                            </div>
                        </div>

                        {/* Delete Button */}
                        <button 
                            onClick={(e) => deleteSlide(e, i)}
                            className="absolute top-1 right-1 p-1 rounded hover:bg-red-500/80 hover:text-white text-transparent group-hover:text-gray-400 transition"
                        >
                            <Trash2 size={12}/>
                        </button>
                    </div>
                ))}
            </div>
            
            <div className="p-3 border-t border-white/5 bg-[#09090b]">
                <button 
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                >
                    <Plus size={16}/> Add Slide
                </button>
                
                {/* Add Menu Dropdown */}
                {showAddMenu && (
                    <div className="absolute bottom-16 left-3 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                        <button onClick={() => addNewSlide('mcq')} className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 text-sm text-gray-300">
                            <Layout size={14} className="text-blue-400"/> Quiz (MCQ)
                        </button>
                        <button onClick={() => addNewSlide('tf')} className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 text-sm text-gray-300">
                            <CheckCircle size={14} className="text-purple-400"/> True/False
                        </button>
                        <button onClick={() => addNewSlide('info')} className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 text-sm text-gray-300">
                            <Type size={14} className="text-green-400"/> Info Slide
                        </button>
                        <button onClick={() => addNewSlide('ending')} className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 text-sm text-gray-300">
                            <Settings size={14} className="text-yellow-400"/> Ending
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* 3. CENTER CANVAS & TOOLBAR */}
        <div className="flex-1 flex flex-col relative bg-[#121212]">
            
            {/* TOOLBAR */}
            <div className="h-12 bg-[#09090b] border-b border-white/5 flex items-center justify-center gap-6 px-4">
                
                {/* Style Tools */}
                <div className="flex items-center gap-3 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 cursor-pointer group relative">
                        <Palette size={14} className="text-gray-400"/>
                        <input 
                            type="color" 
                            value={current.style?.bgColor || '#000000'}
                            onChange={(e) => updateStyle('bgColor', e.target.value)}
                            className="w-4 h-4 rounded-full border-none p-0 bg-transparent cursor-pointer"
                        />
                    </div>
                    <div className="w-px h-4 bg-white/10"></div>
                    <div className="flex items-center gap-2 cursor-pointer relative">
                        <Type size={14} className="text-gray-400"/>
                        <input 
                            type="color" 
                            value={current.style?.textColor || '#ffffff'}
                            onChange={(e) => updateStyle('textColor', e.target.value)}
                            className="w-4 h-4 rounded-full border-none p-0 bg-transparent cursor-pointer"
                        />
                    </div>
                </div>

                {/* Typography & Layout */}
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                    <select 
                        value={current.style?.fontSize}
                        onChange={(e) => updateStyle('fontSize', e.target.value)}
                        className="bg-transparent text-xs font-medium text-gray-300 focus:outline-none"
                    >
                        <option value="text-2xl">Small</option>
                        <option value="text-4xl">Medium</option>
                        <option value="text-6xl">Large</option>
                        <option value="text-8xl">Huge</option>
                    </select>
                    <div className="w-px h-4 bg-white/10 mx-2"></div>
                    <button onClick={() => updateStyle('layout', 'left')} className={`p-1 rounded ${current.style?.layout === 'left' ? 'bg-white/20 text-white' : 'text-gray-500'}`}><AlignLeft size={14}/></button>
                    <button onClick={() => updateStyle('layout', 'centered')} className={`p-1 rounded ${current.style?.layout === 'centered' ? 'bg-white/20 text-white' : 'text-gray-500'}`}><AlignCenter size={14}/></button>
                </div>

                {/* Timer (Only for Questions) */}
                {(current.type === 'mcq' || current.type === 'tf') && (
                    <div className="flex items-center gap-2 bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-500/30 text-blue-400">
                        <Clock size={14}/>
                        <select 
                            value={current.timeLimit}
                            onChange={(e) => updateSlideContent('timeLimit', Number(e.target.value))}
                            className="bg-transparent text-xs font-bold focus:outline-none text-blue-400"
                        >
                            <option value={10}>10s</option>
                            <option value={20}>20s</option>
                            <option value={30}>30s</option>
                            <option value={60}>60s</option>
                        </select>
                    </div>
                )}
            </div>

            {/* CANVAS WRAPPER */}
            <div className="flex-1 flex items-center justify-center p-8 bg-grid-white/[0.02]">
                <div 
                    className={`w-full max-w-5xl aspect-video rounded-xl shadow-2xl flex flex-col p-12 transition-all duration-300 relative border border-white/5 ${
                        current.style?.layout === 'left' ? 'items-start text-left' : 'items-center text-center'
                    }`}
                    style={{ backgroundColor: current.style?.bgColor || '#18181b' }}
                >
                    {/* EDITABLE TITLE */}
                    <textarea
                        value={current.questionText}
                        onChange={(e) => updateSlideContent('questionText', e.target.value)}
                        placeholder="Type question here..."
                        className={`bg-transparent resize-none outline-none font-extrabold placeholder-white/10 w-full mb-8 leading-tight ${current.style?.fontSize || 'text-4xl'}`}
                        style={{ color: current.style?.textColor || '#fff' }}
                        rows={2}
                    />

                    {/* CONTENT AREA */}
                    {(current.type === 'mcq' || current.type === 'tf') && (
                        <div className="w-full grid grid-cols-2 gap-4 mt-auto">
                            {current.options.map((opt, i) => (
                                <div key={i} className="relative group">
                                    <input
                                        value={opt}
                                        onChange={(e) => updateOption(i, e.target.value)}
                                        readOnly={current.type === 'tf'}
                                        placeholder={`Option ${i+1}`}
                                        className={`w-full p-6 rounded-xl border font-bold text-xl outline-none transition-all shadow-lg ${
                                            current.correctAnswer === opt && opt !== "" 
                                            ? 'bg-green-500/20 border-green-500 text-green-100'
                                            : 'bg-white/5 border-white/10 text-gray-200 focus:bg-white/10 focus:border-white/30'
                                        }`}
                                    />
                                    <button
                                        onClick={() => setCorrect(opt)}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition ${
                                            current.correctAnswer === opt && opt !== "" 
                                            ? 'text-green-400 opacity-100' 
                                            : 'text-gray-600 opacity-0 group-hover:opacity-100 hover:text-white'
                                        }`}
                                    >
                                        <CheckCircle size={24} fill={current.correctAnswer === opt && opt !== "" ? "currentColor" : "none"}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {(current.type === 'info' || current.type === 'ending') && (
                         <textarea
                            value={current.options[0]}
                            onChange={(e) => updateOption(0, e.target.value)}
                            placeholder="Add your description here..."
                            className="bg-transparent resize-none outline-none w-full text-2xl opacity-70"
                            style={{ color: current.style?.textColor || '#fff', textAlign: current.style?.layout === 'left' ? 'left' : 'center' }}
                            rows={5}
                        />
                    )}

                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CreateManual;