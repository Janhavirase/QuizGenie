import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket'; 
import { 
  CheckCircle2, Circle, Play, Plus, Trash2, Layout, Type, Palette, 
  X, Clock, Trophy, AlertTriangle, BarChart3, Info, Flag, PieChart, 
  LayoutGrid, CircleDashed, AlignCenter, AlignLeft, Columns, List,
  GripVertical, Settings2, Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 
import toast from 'react-hot-toast'; // ✅ Added Toaster

// --- CONFIGURATION ---
const TIMERS = [10, 15, 20, 30, 60, 90];

const QUIZ_TYPES = [
  { id: 'mcq', label: 'Multiple Choice', icon: <List size={18}/> },
  { id: 'tf', label: 'True / False', icon: <CheckCircle2 size={18}/> },
  { id: 'info', label: 'Info Slide', icon: <Info size={18}/> },
];

// ✅ THEMES CONFIG
const THEMES = [
    { id: 'modern', label: 'Modern Dark', bg: '#0f172a', text: '#f8fafc', preview: 'bg-slate-900' },
    { id: 'royal', label: 'Royal Purple', bg: '#2e1065', text: '#f3e8ff', preview: 'bg-purple-900' },
    { id: 'forest', label: 'Deep Forest', bg: '#064e3b', text: '#d1fae5', preview: 'bg-emerald-900' },
    { id: 'crimson', label: 'Crimson Red', bg: '#7f1d1d', text: '#fee2e2', preview: 'bg-red-900' },
    { id: 'ocean', label: 'Ocean Blue', bg: '#172554', text: '#dbeafe', preview: 'bg-blue-950' },
    { id: 'midnight', label: 'Midnight', bg: '#020617', text: '#e2e8f0', preview: 'bg-black' },
];

const VISUALIZATIONS = [
    { id: 'bar', label: 'Bar Chart', icon: <BarChart3 size={18}/> },
    { id: 'pie', label: 'Pie Chart', icon: <PieChart size={18}/> },
    { id: 'donut', label: 'Donut Chart', icon: <CircleDashed size={18}/> },
    { id: 'dots', label: 'Dot Cluster', icon: <LayoutGrid size={18}/> },
];

const LAYOUTS = [
    { id: 'centered', label: 'Centered', icon: <AlignCenter size={18}/> },
    { id: 'left', label: 'Left Aligned', icon: <AlignLeft size={18}/> },
    { id: 'split', label: 'Split View', icon: <Columns size={18}/> },
];

// --- CHART RENDERER ---
const RenderMockChart = ({ type, options, correctAnswer, textColor }) => {
    const colors = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const data = options.map((opt, i) => ({
        label: opt,
        value: 1, 
        color: colors[i % colors.length]
    }));
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    if (type === 'bar') {
        return (
            <div className="w-full grid grid-cols-2 gap-4 mt-8">
                {options.map((opt, i) => (
                    <div key={i} className={`p-6 rounded-2xl border-2 flex items-center justify-between transition-all opacity-90 ${correctAnswer === opt ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
                        <span className="font-bold text-xl truncate">{opt}</span>
                        {correctAnswer === opt && <CheckCircle2 className="text-emerald-400" size={24}/>}
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
            <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in mt-4">
                <div className="relative rounded-full shadow-2xl transition-all duration-500 border-4 border-white/5"
                    style={{ width: '300px', height: '300px', background: `conic-gradient(${gradients})` }}
                >
                    {type === 'donut' && <div className="absolute inset-0 m-auto rounded-full backdrop-blur-xl bg-black/20" style={{ width: '65%', height: '65%' }}></div>}
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-8 max-w-2xl">
                    {options.map((opt, i) => (
                        <div key={i} className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full border ${correctAnswer === opt ? 'border-emerald-500 bg-emerald-900/30 text-emerald-400' : 'border-white/10 bg-black/20'}`} style={{ color: correctAnswer === opt ? undefined : textColor }}>
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: colors[i % colors.length] }}></div>
                            <span>{opt}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'dots') {
        return (
            <div className="w-full flex flex-col gap-6 mt-8">
                 {options.map((opt, i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <div className="flex justify-between text-lg font-bold opacity-90" style={{ color: textColor }}>
                            <span className={correctAnswer === opt ? 'text-emerald-400' : ''}>{opt}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <div key={idx} className="w-4 h-4 rounded-full opacity-80 shadow-sm" style={{ backgroundColor: colors[i % colors.length] }}></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const QuizCreator = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user context
  
  const [activeSlide, setActiveSlide] = useState(0);
  const [sidebarTab, setSidebarTab] = useState('content');
  const [quizTitle, setQuizTitle] = useState("Untitled Project");
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  // --- DEFAULT SLIDE TEMPLATES ---
  const createTitleSlide = () => ({
      id: Date.now(),
      type: 'info',
      layout: 'title',
      question: "Welcome to the Session!",
      options: ["Get your devices ready."], 
      bgColor: '#0f172a',
      textColor: '#f8fafc'
  });

  const createQuestionSlide = () => ({
      id: Date.now() + 1,
      type: 'mcq',
      layout: 'centered',
      question: "",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswer: "",
      timeLimit: 15,
      points: 'standard',
      visualization: 'bar', 
      bgColor: '#0f172a',
      textColor: '#f8fafc'
  });

  const createRulesSlide = () => ({
      id: Date.now() + 2,
      type: 'info',
      layout: 'bullets',
      question: "How to Play",
      options: ["Answer fast for more points.", "Check your phone for options.", "Have fun!"],
      bgColor: '#0f172a',
      textColor: '#f8fafc'
  });

  const createEndingSlide = () => ({
      id: Date.now() + 3,
      type: 'ending',
      layout: 'centered',
      question: "Session Complete!",
      options: ["Thanks for participating."],
      bgColor: '#0f172a',
      textColor: '#ffffff'
  });

  // ✅ INITIAL STATE
  const [slides, setSlides] = useState([
      createTitleSlide(),
      createRulesSlide(),
      createQuestionSlide(),
      createEndingSlide()
  ]);

  const currentSlide = slides[activeSlide];

  // --- ACTIONS ---
  const updateSlide = (key, value) => {
      const newSlides = [...slides];
      newSlides[activeSlide][key] = value;
      
      if (key === 'type' && value === 'tf') {
          newSlides[activeSlide].options = ['True', 'False'];
          newSlides[activeSlide].correctAnswer = 'True'; 
      }
      if (key === 'type' && value === 'mcq' && currentSlide.type === 'tf') {
          newSlides[activeSlide].options = ["Option 1", "Option 2", "Option 3", "Option 4"];
          newSlides[activeSlide].correctAnswer = "";
      }
      setSlides(newSlides);
  };

  const applyTheme = (theme) => {
      const newSlides = slides.map(s => ({ ...s, bgColor: theme.bg, textColor: theme.text }));
      setSlides(newSlides);
      toast.success(`Applied ${theme.label} theme to all slides!`, { icon: '🎨' });
  };

  const handleAddSlide = (type = 'question') => {
      let newSlide;
      if (type === 'question') newSlide = createQuestionSlide();
      else if (type === 'info') newSlide = { ...createTitleSlide(), question: "New Info", options: ["Subtitle"] };
      
      const prev = slides[activeSlide];
      if (prev) {
          newSlide.bgColor = prev.bgColor;
          newSlide.textColor = prev.textColor;
      }
      newSlide.id = Date.now() + Math.random(); 

      const newSlides = [...slides];
      newSlides.splice(activeSlide + 1, 0, newSlide); 
      setSlides(newSlides);
      setActiveSlide(activeSlide + 1);
      toast.success("Slide added");
  };

  const handleDeleteSlide = (e, index) => {
      e.stopPropagation();
      if (slides.length <= 1) return toast.error("Presentation must have at least one slide.");
      const newSlides = slides.filter((_, i) => i !== index);
      setSlides(newSlides);
      setActiveSlide(prev => (prev >= newSlides.length ? newSlides.length - 1 : prev));
      toast("Slide removed", { icon: '🗑️' });
  };

  // --- DRAG AND DROP LOGIC ---
  const onDragStart = (e, index) => {
      setDraggedItemIndex(index);
      e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, index) => {
      e.preventDefault(); 
  };

  const onDrop = (e, index) => {
      e.preventDefault();
      const newSlides = [...slides];
      const draggedItem = newSlides[draggedItemIndex];
      
      newSlides.splice(draggedItemIndex, 1);
      newSlides.splice(index, 0, draggedItem);
      
      setSlides(newSlides);
      setDraggedItemIndex(null);
      setActiveSlide(index); 
  };

  const handleLaunch = () => {
      // ✅ VALIDATION TOASTERS
      if (!quizTitle.trim()) return toast.error("Please name your session!");
      
      const invalidIndex = slides.findIndex(s => (s.type === 'mcq' || s.type === 'tf') && !s.correctAnswer);
      if (invalidIndex !== -1) {
          setActiveSlide(invalidIndex);
          return toast.error(`Slide ${invalidIndex + 1}: Select a correct answer!`, { icon: '⚠️' });
      }

      const launchToast = toast.loading("Launching session...");

      const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();

      const gameQuestions = slides.map(s => ({
          questionText: s.question || "Untitled",
          type: s.type === 'tf' ? 'mcq' : s.type, 
          layout: s.layout,
          options: s.options,
          correctAnswer: s.correctAnswer,
          timeLimit: s.timeLimit,
          style: { 
              bgColor: s.bgColor, 
              textColor: s.textColor, 
              visualization: s.visualization || 'bar',
              showPercentage: true
          }
      }));

      // ✅ SAVE QUIZ TO LOCALSTORAGE
      const newQuiz = {
          id: roomCode,
          title: quizTitle,
          date: new Date().toISOString(),
          creatorEmail: user?.email, 
          questions: gameQuestions,
          participants: 0 
      };

      const allQuizzes = JSON.parse(localStorage.getItem('quizgenie_quizzes') || "[]");
      allQuizzes.push(newQuiz);
      localStorage.setItem('quizgenie_quizzes', JSON.stringify(allQuizzes));

      socket.emit("create_room", { roomCode, topic: quizTitle, questions: gameQuestions });
      
      toast.success("Ready to play!", { id: launchToast });
      setTimeout(() => {
          navigate(`/game/${roomCode}?mode=quiz`, { state: { role: 'host', name: 'Teacher', hasQuestions: true } });
      }, 500);
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* --- LEFT SIDEBAR: SLIDE LIST --- */}
      <div className="w-32 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4 z-10 overflow-y-auto custom-scrollbar">
          {slides.map((slide, index) => (
              <div 
                  key={slide.id} 
                  className={`relative group w-full px-3 transition-all duration-200 ${draggedItemIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDrop={(e) => onDrop(e, index)}
              >
                  {/* Grip Handle */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-600 cursor-grab active:cursor-grabbing hover:text-slate-400 z-20 hidden group-hover:block pl-0.5">
                      <GripVertical size={14}/>
                  </div>

                  <button 
                      onClick={() => setActiveSlide(index)}
                      className={`relative w-full aspect-video rounded-lg border-2 transition flex flex-col items-center justify-center overflow-hidden shadow-sm hover:shadow-md
                          ${activeSlide === index ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-700 hover:border-slate-500'}`}
                      style={{ backgroundColor: slide.bgColor }}
                  >
                      <div className="absolute top-1 left-1.5 bg-black/40 px-1 rounded text-[9px] font-bold text-white/80 backdrop-blur-sm">
                          {index + 1}
                      </div>
                      <div className="text-white/80 drop-shadow-md">
                          {slide.type === 'mcq' || slide.type === 'tf' ? <BarChart3 size={16}/> : slide.type === 'ending' ? <Flag size={16}/> : <Info size={16}/>}
                      </div>
                      
                      {/* Warning if incomplete */}
                      {(slide.type === 'mcq' || slide.type === 'tf') && !slide.correctAnswer && (
                          <div className="absolute top-1 right-1 text-rose-500 animate-pulse bg-black/50 rounded-full p-0.5">
                              <AlertTriangle size={10}/>
                          </div>
                      )}
                  </button>

                  <button 
                    onClick={(e) => handleDeleteSlide(e, index)} 
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-rose-600 z-30"
                  >
                      <X size={10} strokeWidth={3} />
                  </button>
              </div>
          ))}
          
          <div className="w-full px-3 pt-2 border-t border-slate-800 space-y-2">
              <button onClick={() => handleAddSlide('question')} className="w-full aspect-square rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-400 border border-slate-700 hover:border-indigo-500 flex flex-col items-center justify-center gap-1 transition-all shadow-sm group">
                  <Plus size={24} className="group-hover:scale-110 transition-transform"/>
                  <span className="text-[10px] font-bold uppercase">Quiz</span>
              </button>
              <button onClick={() => handleAddSlide('info')} className="w-full aspect-square rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 border border-slate-700 hover:border-emerald-500 flex flex-col items-center justify-center gap-1 transition-all shadow-sm group">
                  <Info size={24} className="group-hover:scale-110 transition-transform"/>
                  <span className="text-[10px] font-bold uppercase">Info</span>
              </button>
          </div>
      </div>

      {/* --- CENTER: CANVAS --- */}
      <div className="flex-1 bg-slate-950 flex flex-col relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
          
          {/* Top Bar */}
          <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-md z-20">
              <div className="flex flex-col">
                  <input 
                    type="text" 
                    value={quizTitle} 
                    onChange={(e) => setQuizTitle(e.target.value)} 
                    className="bg-transparent text-slate-100 font-bold text-lg outline-none placeholder-slate-600 w-96 hover:bg-slate-800/50 rounded px-2 -ml-2 transition" 
                    placeholder="Enter Session Name..."
                  />
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-2">Editor Mode</span>
              </div>
              <div className="flex gap-3">
                  <button onClick={() => navigate('/teacher')} className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-white transition hover:bg-slate-800 rounded-lg">Exit</button>
                  <button onClick={handleLaunch} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-500/20 active:scale-95 border border-indigo-400/20">
                      <Play size={16} fill="currentColor"/> Launch Session
                  </button>
              </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center p-10 overflow-hidden">
              <div 
                  className="aspect-video w-full max-w-5xl rounded-[1.5rem] shadow-2xl relative flex flex-col p-16 transition-all duration-500 border border-white/5 ring-1 ring-black/50"
                  style={{ backgroundColor: currentSlide.bgColor, color: currentSlide.textColor }}
              >
                  <div className={`flex-1 flex flex-col ${currentSlide.layout === 'left' ? 'text-left items-start' : 'text-center items-center'} justify-center h-full`}>
                      <textarea
                          value={currentSlide.question}
                          onChange={(e) => updateSlide('question', e.target.value)}
                          placeholder={currentSlide.type === 'ending' ? "Closing Message" : "Type your question here..."}
                          className="bg-transparent resize-none outline-none font-extrabold text-5xl w-full mb-10 leading-tight placeholder-white/20"
                          style={{ color: currentSlide.textColor, textAlign: currentSlide.layout === 'left' ? 'left' : 'center' }}
                          rows={2}
                      />

                      {currentSlide.type === 'info' || currentSlide.type === 'ending' ? (
                          <div className="w-full text-2xl opacity-90">
                              {currentSlide.layout === 'bullets' ? (
                                  <div className="space-y-4">
                                      {currentSlide.options.map((opt, i) => (
                                          <div key={i} className="flex items-center gap-3">
                                              <span className="w-2 h-2 rounded-full bg-current opacity-60"></span>
                                              <input 
                                                value={opt}
                                                onChange={(e) => { const newOpts = [...currentSlide.options]; newOpts[i] = e.target.value; updateSlide('options', newOpts); }}
                                                className="bg-transparent outline-none w-full placeholder-white/30"
                                                placeholder="List Item"
                                              />
                                          </div>
                                      ))}
                                  </div>
                              ) : (
                                  <textarea
                                      value={currentSlide.options[0]}
                                      onChange={(e) => updateSlide('options', [e.target.value])}
                                      className="bg-transparent resize-none outline-none w-full placeholder-white/30 font-light"
                                      placeholder="Add description..."
                                      style={{ textAlign: currentSlide.layout === 'left' ? 'left' : 'center' }}
                                  />
                              )}
                          </div>
                      ) : (
                          <div className="w-full opacity-50 pointer-events-none scale-90 origin-top">
                              <RenderMockChart type={currentSlide.visualization || 'bar'} options={currentSlide.options} correctAnswer={currentSlide.correctAnswer} textColor={currentSlide.textColor}/>
                          </div>
                      )}
                  </div>

                  {/* Canvas Metadata Footer */}
                  {(currentSlide.type === 'mcq' || currentSlide.type === 'tf') && (
                      <div className="absolute bottom-6 right-6 flex gap-2 text-[10px] font-bold uppercase tracking-wider opacity-60">
                          <span className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full flex gap-1.5 items-center border border-white/10"><Clock size={12}/> {currentSlide.timeLimit}s</span>
                          <span className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full flex gap-1.5 items-center border border-white/10"><BarChart3 size={12}/> {currentSlide.visualization}</span>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* --- RIGHT: SETTINGS SIDEBAR --- */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-10 shadow-2xl">
          <div className="flex border-b border-slate-800">
              <button onClick={() => setSidebarTab('content')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition border-b-2 ${sidebarTab === 'content' ? 'text-white border-indigo-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>Content</button>
              <button onClick={() => setSidebarTab('design')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition border-b-2 ${sidebarTab === 'design' ? 'text-white border-emerald-500 bg-slate-800/50' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>Design</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-900">
              {sidebarTab === 'content' && (
                  <>
                      {currentSlide.type !== 'ending' && (
                          <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</label>
                              <div className="grid grid-cols-3 gap-2">
                                  {QUIZ_TYPES.map(t => (
                                      <button key={t.id} onClick={() => updateSlide('type', t.id)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${currentSlide.type === t.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                                          {t.icon} <span className="text-[9px] mt-2 font-bold">{t.label}</span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}

                      {/* MCQ OPTIONS */}
                      {currentSlide.type === 'mcq' && (
                          <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                  <span>Answer Options</span>
                                  <span className="text-emerald-400 text-[9px] flex items-center gap-1"><CheckCircle2 size={10}/> Mark Correct</span>
                              </label>
                              {currentSlide.options.map((opt, i) => (
                                  <div key={i} className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all group focus-within:ring-2 focus-within:ring-indigo-500/20 ${currentSlide.correctAnswer === opt && opt ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800'}`}>
                                      <button onClick={() => updateSlide('correctAnswer', opt)} className={`shrink-0 p-2 rounded-lg transition ${currentSlide.correctAnswer === opt ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-600 hover:text-emerald-400'}`}>
                                          {currentSlide.correctAnswer === opt ? <CheckCircle2 size={18}/> : <Circle size={18}/>}
                                      </button>
                                      <input 
                                        value={opt} 
                                        onChange={(e) => { const newOpts = [...currentSlide.options]; newOpts[i] = e.target.value; if (currentSlide.correctAnswer === opt) updateSlide('correctAnswer', e.target.value); updateSlide('options', newOpts); }} 
                                        className="flex-1 bg-transparent text-sm text-white outline-none font-medium placeholder-slate-600" 
                                        placeholder={`Option ${i+1}`}
                                      />
                                      <button onClick={() => { const newOpts = currentSlide.options.filter((_, idx) => idx !== i); updateSlide('options', newOpts); if(currentSlide.correctAnswer === opt) updateSlide('correctAnswer', ""); }} className="text-slate-600 hover:text-rose-400 p-2 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                                  </div>
                              ))}
                              <button onClick={() => updateSlide('options', [...currentSlide.options, `Option ${currentSlide.options.length + 1}`])} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-dashed border-slate-600 text-slate-400 text-xs font-bold rounded-xl transition">+ Add Option</button>
                          </div>
                      )}

                      {/* TRUE / FALSE */}
                      {currentSlide.type === 'tf' && (
                          <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Set Correct Answer</label>
                              <div className="grid grid-cols-2 gap-3">
                                  {['True', 'False'].map(val => (
                                      <button key={val} onClick={() => updateSlide('correctAnswer', val)} className={`py-4 rounded-xl border-2 font-bold text-sm transition-all ${currentSlide.correctAnswer === val ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>{val}</button>
                                  ))}
                              </div>
                          </div>
                      )}

                      {/* BULLET CONTROLS */}
                      {currentSlide.layout === 'bullets' && (
                          <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                              <div className="flex gap-2 items-center text-blue-400 mb-2">
                                  <Info size={16}/> <span className="text-xs font-bold">Bullet List Mode</span>
                              </div>
                              <p className="text-[10px] text-slate-400">Add or remove items directly in the canvas editor.</p>
                              <button onClick={() => updateSlide('options', [...currentSlide.options, "New Item"])} className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg">+ Add Bullet</button>
                          </div>
                      )}
                  </>
              )}

              {/* TAB 2: DESIGN */}
              {sidebarTab === 'design' && (
                  <>
                      {(currentSlide.type === 'mcq' || currentSlide.type === 'tf') && (
                          <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={12}/> Visualization</label>
                              <div className="grid grid-cols-4 gap-2">
                                  {VISUALIZATIONS.map(v => (
                                      <button key={v.id} onClick={() => updateSlide('visualization', v.id)} className={`flex items-center justify-center p-2.5 rounded-xl border transition-all ${currentSlide.visualization === v.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`} title={v.label}>{v.icon}</button>
                                  ))}
                              </div>
                          </div>
                      )}
                      
                      {/* THEMES */}
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Palette size={12}/> Color Themes</label>
                          <div className="grid grid-cols-2 gap-2">
                              {THEMES.map(t => (
                                  <button key={t.id} onClick={() => applyTheme(t)} className="p-3 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800 text-left transition group">
                                      <div className={`w-full h-8 rounded-md mb-2 border border-white/10 ${t.preview}`}></div>
                                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-white block truncate">{t.label}</span>
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Layout size={12}/> Layout Style</label>
                          <div className="flex gap-2">
                              {LAYOUTS.map(l => (
                                  <button key={l.id} onClick={() => updateSlide('layout', l.id)} className={`flex-1 p-3 rounded-xl border transition flex flex-col items-center justify-center gap-2 ${currentSlide.layout === l.id ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                                      {l.icon} <span className="text-[10px] font-bold">{l.label}</span>
                                  </button>
                              ))}
                          </div>
                      </div>

                      {(currentSlide.type === 'mcq' || currentSlide.type === 'tf') && (
                          <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Timer (Seconds)</label>
                              <div className="grid grid-cols-6 gap-1">
                                  {TIMERS.map(t => (
                                      <button key={t} onClick={() => updateSlide('timeLimit', t)} className={`py-2 rounded-lg text-xs font-bold transition ${currentSlide.timeLimit === t ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>{t}</button>
                                  ))}
                              </div>
                          </div>
                      )}
                  </>
              )}
          </div>
      </div>
    </div>
  );
};

export default QuizCreator;