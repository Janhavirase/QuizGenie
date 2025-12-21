import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, Save, ArrowLeft, CheckCircle, Clock, Type, Play, 
  Layout, Palette, AlignLeft, AlignCenter, MoreHorizontal, Settings,
  Layers, Image as ImageIcon, Copy
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

  // ✅ PROFESSIONAL TEMPLATES
  const TEMPLATES = {
    mcq: { 
        type: 'mcq', 
        questionText: "", 
        options: ["", "", "", ""], 
        correctAnswer: "", 
        timeLimit: 20, 
        style: { bgColor: '#0f172a', textColor: '#f8fafc', fontSize: 'text-4xl', layout: 'centered' } 
    },
    tf: { 
        type: 'tf', 
        questionText: "True or False?", 
        options: ["True", "False"], 
        correctAnswer: "", 
        timeLimit: 15, 
        style: { bgColor: '#1e1b4b', textColor: '#f8fafc', fontSize: 'text-4xl', layout: 'centered' } 
    },
    info: { 
        type: 'info', 
        questionText: "Did You Know?", 
        options: ["Enter your information here..."], 
        timeLimit: 0, 
        style: { bgColor: '#000000', textColor: '#f8fafc', fontSize: 'text-5xl', layout: 'centered' } 
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
    toast.success("New slide added", { icon: '✨' });
  };

  const deleteSlide = (e, index) => {
    e.stopPropagation();
    if (slides.length === 1) return toast.error("Project must have at least one slide!");
    
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (activeSlide >= newSlides.length) setActiveSlide(newSlides.length - 1);
    toast("Slide deleted", { icon: '🗑️' });
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
    toast.success("Answer set!", { duration: 1000 });
  };

  // --- HELPERS ---

  const getSlideLabel = (index) => {
    const s = slides[index];
    if (s.type === 'info') return 'Info';
    if (s.type === 'ending') return 'End';
    
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
    
    const saveToast = toast.loading("Saving project...");
    
    const newQuiz = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        creatorEmail: user?.email || "guest",
        date: new Date().toISOString(),
        questions: slides 
    };
    const existing = JSON.parse(localStorage.getItem('quizgenie_quizzes') || "[]");
    localStorage.setItem('quizgenie_quizzes', JSON.stringify([...existing, newQuiz]));
    
    toast.success("Project Saved!", { id: saveToast });
    setTimeout(() => navigate('/teacher'), 1000);
  };

  const current = slides[activeSlide];

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* 1. STUDIO HEADER */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/teacher')} className="p-2 hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-white">
                <ArrowLeft size={20}/>
            </button>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="group flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider group-hover:text-indigo-400 transition-colors">Project Name</span>
                <input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-transparent text-lg font-bold focus:outline-none text-white placeholder-slate-600"
                    placeholder="Untitled Project..."
                />
            </div>
        </div>

        <div className="flex items-center gap-3">
            <button onClick={handlePlayNow} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold transition border border-slate-700">
                <Play size={16} fill="currentColor" /> Preview
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-500/20">
                <Save size={18}/> Save Project
            </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* 2. SIDEBAR (Filmstrip) */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Timeline</span>
                <span className="text-xs font-bold text-slate-600 bg-slate-800 px-2 py-0.5 rounded-md">{slides.length} Slides</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-4">
                {slides.map((s, i) => (
                    <div 
                        key={s.id} 
                        onClick={() => setActiveSlide(i)}
                        className={`group relative aspect-video rounded-xl cursor-pointer transition-all duration-200 flex flex-col shadow-sm ${
                            activeSlide === i 
                            ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-[1.02]' 
                            : 'opacity-60 hover:opacity-100 hover:scale-[1.02]'
                        }`}
                        style={{ backgroundColor: s.style?.bgColor || '#1e293b' }}
                    >
                        {/* Slide Number Tag */}
                        <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white/90 z-10 border border-white/10 flex items-center gap-1">
                            {s.type === 'info' && <Type size={8} />}
                            {s.type === 'ending' && <CheckCircle size={8} />}
                            {(s.type === 'mcq' || s.type === 'tf') && <Layers size={8} />}
                            {getSlideLabel(i)}
                        </div>
                        
                        {/* Mini Preview */}
                        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                            <div className="text-[6px] text-white/70 text-center leading-tight line-clamp-3 w-full">
                                {s.questionText || "Empty Slide"}
                            </div>
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => deleteSlide(e, i)}
                                className="p-1.5 rounded-lg bg-rose-500/90 text-white hover:bg-rose-600 shadow-sm"
                            >
                                <Trash2 size={12}/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900">
                <button 
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${showAddMenu ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                >
                    <Plus size={18}/> {showAddMenu ? 'Close Menu' : 'Add Slide'}
                </button>
                
                {/* Add Menu Dropdown */}
                {showAddMenu && (
                    <div className="absolute bottom-20 left-4 w-56 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in-up p-2 space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2">Select Template</div>
                        <button onClick={() => addNewSlide('mcq')} className="w-full text-left px-3 py-2.5 hover:bg-slate-700 rounded-lg flex items-center gap-3 text-sm text-slate-200 transition">
                            <div className="p-1.5 bg-blue-500/20 rounded-md"><Layout size={14} className="text-blue-400"/></div> Quiz (MCQ)
                        </button>
                        <button onClick={() => addNewSlide('tf')} className="w-full text-left px-3 py-2.5 hover:bg-slate-700 rounded-lg flex items-center gap-3 text-sm text-slate-200 transition">
                            <div className="p-1.5 bg-purple-500/20 rounded-md"><CheckCircle size={14} className="text-purple-400"/></div> True/False
                        </button>
                        <button onClick={() => addNewSlide('info')} className="w-full text-left px-3 py-2.5 hover:bg-slate-700 rounded-lg flex items-center gap-3 text-sm text-slate-200 transition">
                            <div className="p-1.5 bg-emerald-500/20 rounded-md"><Type size={14} className="text-emerald-400"/></div> Info Slide
                        </button>
                        <button onClick={() => addNewSlide('ending')} className="w-full text-left px-3 py-2.5 hover:bg-slate-700 rounded-lg flex items-center gap-3 text-sm text-slate-200 transition">
                            <div className="p-1.5 bg-yellow-500/20 rounded-md"><Settings size={14} className="text-yellow-400"/></div> Ending
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* 3. CENTER CANVAS & TOOLBAR */}
        <div className="flex-1 flex flex-col relative bg-[#0f172a] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
            
            {/* TOOLBAR */}
            <div className="h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-8">
                
                {/* Style Tools */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2 cursor-pointer group relative">
                            <Palette size={16} className="text-indigo-400"/>
                            <span className="text-xs font-medium text-slate-400">Background</span>
                            <input 
                                type="color" 
                                value={current.style?.bgColor || '#000000'}
                                onChange={(e) => updateStyle('bgColor', e.target.value)}
                                className="w-6 h-6 rounded-md border-none p-0 bg-transparent cursor-pointer ml-1"
                            />
                        </div>
                        <div className="w-px h-4 bg-slate-700 mx-2"></div>
                        <div className="flex items-center gap-2 cursor-pointer relative">
                            <Type size={16} className="text-indigo-400"/>
                            <span className="text-xs font-medium text-slate-400">Text</span>
                            <input 
                                type="color" 
                                value={current.style?.textColor || '#ffffff'}
                                onChange={(e) => updateStyle('textColor', e.target.value)}
                                className="w-6 h-6 rounded-md border-none p-0 bg-transparent cursor-pointer ml-1"
                            />
                        </div>
                    </div>

                    {/* Typography & Layout */}
                    <div className="flex items-center gap-1 bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-700">
                        <select 
                            value={current.style?.fontSize}
                            onChange={(e) => updateStyle('fontSize', e.target.value)}
                            className="bg-transparent text-xs font-medium text-slate-300 focus:outline-none px-2 py-1 rounded hover:bg-slate-700 cursor-pointer"
                        >
                            <option value="text-2xl">Small Text</option>
                            <option value="text-4xl">Medium Text</option>
                            <option value="text-6xl">Large Text</option>
                            <option value="text-8xl">Huge Text</option>
                        </select>
                        <div className="w-px h-4 bg-slate-700 mx-2"></div>
                        <button onClick={() => updateStyle('layout', 'left')} className={`p-1.5 rounded-md transition ${current.style?.layout === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><AlignLeft size={16}/></button>
                        <button onClick={() => updateStyle('layout', 'centered')} className={`p-1.5 rounded-md transition ${current.style?.layout === 'centered' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><AlignCenter size={16}/></button>
                    </div>
                </div>

                {/* Timer (Only for Questions) */}
                {(current.type === 'mcq' || current.type === 'tf') && (
                    <div className="flex items-center gap-3 bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20 text-indigo-400">
                        <Clock size={16}/>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Timer:</span>
                        <select 
                            value={current.timeLimit}
                            onChange={(e) => updateSlideContent('timeLimit', Number(e.target.value))}
                            className="bg-transparent text-sm font-bold focus:outline-none text-indigo-400 cursor-pointer"
                        >
                            <option value={10}>10 Seconds</option>
                            <option value={20}>20 Seconds</option>
                            <option value={30}>30 Seconds</option>
                            <option value={60}>60 Seconds</option>
                        </select>
                    </div>
                )}
            </div>

            {/* CANVAS WRAPPER */}
            <div className="flex-1 flex items-center justify-center p-12 overflow-hidden">
                <div 
                    className={`w-full max-w-5xl aspect-video rounded-2xl shadow-2xl flex flex-col p-16 transition-all duration-300 relative border border-slate-700/50 group ${
                        current.style?.layout === 'left' ? 'items-start text-left' : 'items-center text-center'
                    }`}
                    style={{ backgroundColor: current.style?.bgColor || '#1e293b' }}
                >
                    {/* Hover Hint */}
                    <div className="absolute -top-10 left-0 w-full text-center text-slate-500 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        Editing Slide {activeSlide + 1}
                    </div>

                    {/* EDITABLE TITLE */}
                    <textarea
                        value={current.questionText}
                        onChange={(e) => updateSlideContent('questionText', e.target.value)}
                        placeholder="Start typing your question..."
                        className={`bg-transparent resize-none outline-none font-extrabold placeholder-white/20 w-full mb-8 leading-tight ${current.style?.fontSize || 'text-4xl'}`}
                        style={{ color: current.style?.textColor || '#fff' }}
                        rows={2}
                    />

                    {/* CONTENT AREA */}
                    {(current.type === 'mcq' || current.type === 'tf') && (
                        <div className="w-full grid grid-cols-2 gap-6 mt-auto">
                            {current.options.map((opt, i) => (
                                <div key={i} className="relative group/opt">
                                    <input
                                        value={opt}
                                        onChange={(e) => updateOption(i, e.target.value)}
                                        readOnly={current.type === 'tf'}
                                        placeholder={`Option ${i+1}`}
                                        className={`w-full p-6 rounded-xl border-2 font-bold text-xl outline-none transition-all shadow-lg ${
                                            current.correctAnswer === opt && opt !== "" 
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100'
                                            : 'bg-white/5 border-white/5 text-gray-100 focus:bg-white/10 focus:border-white/20'
                                        }`}
                                    />
                                    <button
                                        onClick={() => setCorrect(opt)}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-300 ${
                                            current.correctAnswer === opt && opt !== "" 
                                            ? 'bg-emerald-500 text-white scale-100 opacity-100' 
                                            : 'bg-slate-700 text-slate-400 scale-90 opacity-0 group-hover/opt:opacity-100 hover:bg-emerald-500 hover:text-white'
                                        }`}
                                        title="Mark as Correct Answer"
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {(current.type === 'info' || current.type === 'ending') && (
                         <textarea
                            value={current.options[0]}
                            onChange={(e) => updateOption(0, e.target.value)}
                            placeholder="Add your description or subtitle here..."
                            className="bg-transparent resize-none outline-none w-full text-2xl opacity-80 font-medium"
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