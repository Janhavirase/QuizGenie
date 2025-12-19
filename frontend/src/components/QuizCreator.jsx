import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket'; 
import { 
  CheckCircle, Circle, Play, Plus, Trash2, Layout, Type, Palette, 
  X, Clock, Trophy, AlertTriangle, BarChart, Info, Flag, PieChart, 
  LayoutGrid, CircleDashed, AlignCenter, AlignLeft, Columns, List,
  GripVertical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // 1. Import Auth

// --- CONFIGURATION ---
const TIMERS = [10, 15, 20, 30, 60, 90];

const QUIZ_TYPES = [
  { id: 'mcq', label: 'Multiple Choice', icon: <List size={18}/> },
  { id: 'tf', label: 'True / False', icon: <CheckCircle size={18}/> },
  { id: 'info', label: 'Info Slide', icon: <Info size={18}/> },
];

// ✅ THEMES CONFIG
const THEMES = [
    { id: 'modern', label: 'Modern Dark', bg: '#111827', text: '#ffffff', preview: 'bg-gray-900' },
    { id: 'royal', label: 'Royal Purple', bg: '#2e1065', text: '#f3e8ff', preview: 'bg-purple-900' },
    { id: 'forest', label: 'Deep Forest', bg: '#064e3b', text: '#d1fae5', preview: 'bg-green-900' },
    { id: 'crimson', label: 'Crimson Red', bg: '#7f1d1d', text: '#fee2e2', preview: 'bg-red-900' },
    { id: 'ocean', label: 'Ocean Blue', bg: '#1e3a8a', text: '#bfdbfe', preview: 'bg-blue-900' },
    { id: 'midnight', label: 'Midnight', bg: '#0f172a', text: '#e2e8f0', preview: 'bg-slate-900' },
];

const VISUALIZATIONS = [
    { id: 'bar', label: 'Bar', icon: <BarChart size={18}/> },
    { id: 'pie', label: 'Pie', icon: <PieChart size={18}/> },
    { id: 'donut', label: 'Donut', icon: <CircleDashed size={18}/> },
    { id: 'dots', label: 'Dots', icon: <LayoutGrid size={18}/> },
];

const LAYOUTS = [
    { id: 'centered', label: 'Center', icon: <AlignCenter size={18}/> },
    { id: 'left', label: 'Left', icon: <AlignLeft size={18}/> },
    { id: 'split', label: 'Split', icon: <Columns size={18}/> },
];

// --- CHART RENDERER ---
const RenderMockChart = ({ type, options, correctAnswer, textColor }) => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    const data = options.map((opt, i) => ({
        label: opt,
        value: 1, 
        color: colors[i % colors.length]
    }));
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    if (type === 'bar') {
        return (
            <div className="w-full grid grid-cols-2 gap-4 mt-4">
                {options.map((opt, i) => (
                    <div key={i} className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all opacity-90 ${correctAnswer === opt ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
                        <span className="font-bold text-lg truncate">{opt}</span>
                        {correctAnswer === opt && <CheckCircle className="text-green-400" size={20}/>}
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
            <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in">
                <div className="relative rounded-full shadow-2xl transition-all duration-500"
                    style={{ width: '250px', height: '250px', background: `conic-gradient(${gradients})` }}
                >
                    {type === 'donut' && <div className="absolute inset-0 m-auto rounded-full backdrop-blur-sm bg-black/20" style={{ width: '60%', height: '60%' }}></div>}
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                    {options.map((opt, i) => (
                        <div key={i} className={`flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border ${correctAnswer === opt ? 'border-green-500 bg-green-900/30 text-green-400' : 'border-white/10 bg-black/20'}`} style={{ color: correctAnswer === opt ? undefined : textColor }}>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></div>
                            <span>{opt}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'dots') {
        return (
            <div className="w-full flex flex-col gap-4 mt-4">
                 {options.map((opt, i) => (
                    <div key={i} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-bold opacity-80" style={{ color: textColor }}>
                            <span className={correctAnswer === opt ? 'text-green-400' : ''}>{opt}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <div key={idx} className="w-3 h-3 rounded-full opacity-60" style={{ backgroundColor: colors[i % colors.length] }}></div>
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
  const [quizTitle, setQuizTitle] = useState("My Quiz");
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  // --- DEFAULT SLIDE TEMPLATES ---
  const createTitleSlide = () => ({
      id: Date.now(),
      type: 'info',
      layout: 'title',
      question: "Welcome to the Quiz!",
      options: ["Get your phones ready."], 
      bgColor: '#111827',
      textColor: '#ffffff'
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
      bgColor: '#111827',
      textColor: '#ffffff'
  });

  // ✅ NEW: Rules Slide Template
  const createRulesSlide = () => ({
      id: Date.now() + 2,
      type: 'info',
      layout: 'bullets',
      question: "Game Rules",
      options: ["Answer fast for more points.", "Keep your eyes on the screen.", "Have fun!"],
      bgColor: '#111827',
      textColor: '#ffffff'
  });

  const createEndingSlide = () => ({
      id: Date.now() + 3,
      type: 'ending',
      layout: 'centered',
      question: "Quiz Complete!",
      options: ["Thank you for playing."],
      bgColor: '#111827',
      textColor: '#ffffff'
  });

  // ✅ INITIAL STATE: Title -> Rules -> Question -> Ending
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
  };

  const handleAddSlide = (type = 'question') => {
      let newSlide;
      if (type === 'question') newSlide = createQuestionSlide();
      else if (type === 'info') newSlide = { ...createTitleSlide(), question: "New Info", options: ["Subtitle"] };
      
      // Copy styles
      const prev = slides[activeSlide];
      if (prev) {
          newSlide.bgColor = prev.bgColor;
          newSlide.textColor = prev.textColor;
      }
      newSlide.id = Date.now() + Math.random(); // Ensure unique ID

      const newSlides = [...slides];
      newSlides.splice(activeSlide + 1, 0, newSlide); 
      setSlides(newSlides);
      setActiveSlide(activeSlide + 1);
  };

  const handleDeleteSlide = (e, index) => {
      e.stopPropagation();
      if (slides.length <= 1) return alert("Quiz must have at least one slide.");
      const newSlides = slides.filter((_, i) => i !== index);
      setSlides(newSlides);
      setActiveSlide(prev => (prev >= newSlides.length ? newSlides.length - 1 : prev));
  };

  // --- DRAG AND DROP LOGIC ---
  const onDragStart = (e, index) => {
      setDraggedItemIndex(index);
      e.dataTransfer.effectAllowed = "move";
      // Hide default ghost image if possible or keep standard
  };

  const onDragOver = (e, index) => {
      e.preventDefault(); // Necessary to allow dropping
  };

  const onDrop = (e, index) => {
      e.preventDefault();
      const newSlides = [...slides];
      const draggedItem = newSlides[draggedItemIndex];
      
      // Remove from old pos
      newSlides.splice(draggedItemIndex, 1);
      // Insert at new pos
      newSlides.splice(index, 0, draggedItem);
      
      setSlides(newSlides);
      setDraggedItemIndex(null);
      setActiveSlide(index); // Focus on the moved slide
  };

  const applyThemeToAll = () => {
      const newSlides = slides.map(s => ({ ...s, bgColor: currentSlide.bgColor, textColor: currentSlide.textColor }));
      setSlides(newSlides);
      alert("Theme applied to all slides!");
  };

  const handleLaunch = () => {
      if (!quizTitle.trim()) return alert("Please give your quiz a title.");
      
      const invalidIndex = slides.findIndex(s => (s.type === 'mcq' || s.type === 'tf') && !s.correctAnswer);
      if (invalidIndex !== -1) {
          setActiveSlide(invalidIndex);
          return alert(`⚠️ Slide ${invalidIndex + 1} needs a Correct Answer!`);
      }

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

      // ✅ SAVE QUIZ TO "DATABASE" (LocalStorage) WITH CREATOR ID
      const newQuiz = {
          id: roomCode,
          title: quizTitle,
          date: new Date().toISOString(),
          creatorEmail: user?.email, // 👈 Tag with user email so dashboard can filter
          questions: gameQuestions,
          participants: 0 
      };

      const allQuizzes = JSON.parse(localStorage.getItem('quizgenie_quizzes') || "[]");
      allQuizzes.push(newQuiz);
      localStorage.setItem('quizgenie_quizzes', JSON.stringify(allQuizzes));

      socket.emit("create_room", { roomCode, topic: quizTitle, questions: gameQuestions });
      navigate(`/game/${roomCode}?mode=quiz`, { state: { role: 'host', name: 'Teacher', hasQuestions: true } });
  };

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* --- LEFT SIDEBAR: SLIDE LIST (DRAGGABLE) --- */}
      <div className="w-28 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-3 z-10 overflow-y-auto custom-scrollbar">
          {slides.map((slide, index) => (
              <div 
                  key={slide.id} 
                  className={`relative group w-full px-2 transition-all duration-200 ${draggedItemIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDrop={(e) => onDrop(e, index)}
              >
                  {/* Grip Handle (Visual Cue) */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-600 cursor-grab active:cursor-grabbing hover:text-gray-400 z-20 hidden group-hover:block">
                      <GripVertical size={16}/>
                  </div>

                  <button 
                      onClick={() => setActiveSlide(index)}
                      className={`relative w-full aspect-video rounded border-2 transition flex flex-col items-center justify-center overflow-hidden shadow-lg ml-1
                          ${activeSlide === index ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-700 hover:border-gray-500'}`}
                      style={{ backgroundColor: slide.bgColor }}
                  >
                      <span className="text-[10px] font-bold opacity-50 absolute top-1 left-1" style={{color: slide.textColor}}>{index + 1}</span>
                      <div style={{color: slide.textColor}}>
                          {slide.type === 'mcq' || slide.type === 'tf' ? <BarChart size={14}/> : slide.type === 'ending' ? <Flag size={14}/> : <Info size={14}/>}
                      </div>
                      {(slide.type === 'mcq' || slide.type === 'tf') && !slide.correctAnswer && <AlertTriangle size={12} className="text-red-500 absolute bottom-1 right-1 animate-pulse"/>}
                  </button>
                  <button onClick={(e) => handleDeleteSlide(e, index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-md hover:scale-110 z-20">
                      <X size={10} />
                  </button>
              </div>
          ))}
          
          <div className="flex flex-col gap-2 mt-2">
              <button onClick={() => handleAddSlide('question')} className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition shadow-lg" title="Add Question"><Plus size={20}/></button>
              <button onClick={() => handleAddSlide('info')} className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition shadow-lg" title="Add Info Slide"><Info size={20}/></button>
          </div>
      </div>

      {/* --- CENTER: CANVAS --- */}
      <div className="flex-1 bg-gray-950 flex flex-col relative">
          <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-md">
              <div className="flex flex-col">
                  <input type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="bg-transparent text-white font-bold text-lg outline-none placeholder-gray-600 w-96" placeholder="Enter Quiz Title..."/>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">Quiz Editor</span>
              </div>
              <div className="flex gap-3">
                  <button onClick={() => navigate('/teacher')} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition">Exit</button>
                  <button onClick={handleLaunch} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition shadow-lg shadow-green-500/20"><Play size={16} fill="currentColor"/> Launch</button>
              </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
              <div 
                  className="aspect-video w-full max-w-4xl rounded-2xl shadow-2xl relative flex flex-col p-12 transition-all duration-300 border border-white/10"
                  style={{ backgroundColor: currentSlide.bgColor, color: currentSlide.textColor }}
              >
                  <div className={`flex-1 flex flex-col ${currentSlide.layout === 'left' ? 'text-left items-start' : 'text-center items-center'} justify-center`}>
                      <h1 className="text-5xl font-extrabold mb-8 leading-tight w-full break-words">
                          {currentSlide.question || (currentSlide.type === 'ending' ? "Quiz Complete!" : "Enter Question...")}
                      </h1>

                      {currentSlide.type === 'info' || currentSlide.type === 'ending' ? (
                          <div className="text-2xl opacity-80">
                              {currentSlide.layout === 'bullets' ? (
                                  <ul className="text-left space-y-2 list-disc pl-6">
                                      {currentSlide.options.map((opt, i) => <li key={i}>{opt}</li>)}
                                  </ul>
                              ) : (
                                  <p>{currentSlide.options[0]}</p>
                              )}
                          </div>
                      ) : (
                          <RenderMockChart type={currentSlide.visualization || 'bar'} options={currentSlide.options} correctAnswer={currentSlide.correctAnswer} textColor={currentSlide.textColor}/>
                      )}
                  </div>

                  {(currentSlide.type === 'mcq' || currentSlide.type === 'tf') && (
                      <div className="absolute bottom-6 right-6 flex gap-2 text-xs font-bold opacity-50">
                          <span className="bg-black/20 px-2 py-1 rounded flex gap-1"><Clock size={12}/> {currentSlide.timeLimit}s</span>
                          <span className="bg-black/20 px-2 py-1 rounded flex gap-1"><BarChart size={12}/> {currentSlide.visualization}</span>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* --- RIGHT: SETTINGS SIDEBAR --- */}
      <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-10 shadow-xl">
          <div className="flex border-b border-gray-800">
              <button onClick={() => setSidebarTab('content')} className={`flex-1 py-4 text-sm font-bold transition ${sidebarTab === 'content' ? 'text-white border-b-2 border-blue-500 bg-gray-800/50' : 'text-gray-500'}`}>Content</button>
              <button onClick={() => setSidebarTab('design')} className={`flex-1 py-4 text-sm font-bold transition ${sidebarTab === 'design' ? 'text-white border-b-2 border-purple-500 bg-gray-800/50' : 'text-gray-500'}`}>Design</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {sidebarTab === 'content' && (
                  <>
                      {currentSlide.type !== 'ending' && (
                          <div className="space-y-3">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Slide Type</label>
                              <div className="grid grid-cols-3 gap-2">
                                  {QUIZ_TYPES.map(t => (
                                      <button key={t.id} onClick={() => updateSlide('type', t.id)} className={`flex flex-col items-center justify-center p-2 rounded-lg border transition ${currentSlide.type === t.id ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                                          {t.icon} <span className="text-[10px] mt-1 font-bold">{t.label}</span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}

                      <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest"><Type size={14} className="inline mr-2"/> Heading Text</label>
                          <textarea value={currentSlide.question} onChange={(e) => updateSlide('question', e.target.value)} className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-blue-500 outline-none text-sm h-24 resize-none" placeholder="Type here..."/>
                      </div>

                      {/* MCQ OPTIONS */}
                      {currentSlide.type === 'mcq' && (
                          <div className="space-y-3">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between"><span>Options</span><span className="text-green-400 text-[10px]">Select Correct</span></label>
                              {currentSlide.options.map((opt, i) => (
                                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${currentSlide.correctAnswer === opt ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-gray-800'}`}>
                                      <button onClick={() => updateSlide('correctAnswer', opt)} className={`shrink-0 ${currentSlide.correctAnswer === opt ? 'text-green-500' : 'text-gray-600 hover:text-green-500'}`}>{currentSlide.correctAnswer === opt ? <CheckCircle size={20}/> : <Circle size={20}/>}</button>
                                      <input value={opt} onChange={(e) => { const newOpts = [...currentSlide.options]; newOpts[i] = e.target.value; if (currentSlide.correctAnswer === opt) updateSlide('correctAnswer', e.target.value); updateSlide('options', newOpts); }} className="flex-1 bg-transparent text-sm text-white outline-none" placeholder={`Option ${i+1}`}/>
                                      <button onClick={() => { const newOpts = currentSlide.options.filter((_, idx) => idx !== i); updateSlide('options', newOpts); if(currentSlide.correctAnswer === opt) updateSlide('correctAnswer', ""); }} className="text-gray-500 hover:text-red-400"><Trash2 size={16}/></button>
                                  </div>
                              ))}
                              <button onClick={() => updateSlide('options', [...currentSlide.options, `Option ${currentSlide.options.length + 1}`])} className="w-full py-2 bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600 text-gray-400 text-xs font-bold rounded-lg">+ Add Option</button>
                          </div>
                      )}

                      {/* TRUE / FALSE */}
                      {currentSlide.type === 'tf' && (
                          <div className="space-y-3">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Correct Answer</label>
                              <div className="grid grid-cols-2 gap-3">
                                  {['True', 'False'].map(val => (
                                      <button key={val} onClick={() => updateSlide('correctAnswer', val)} className={`py-3 rounded-lg border font-bold text-sm transition ${currentSlide.correctAnswer === val ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>{val}</button>
                                  ))}
                              </div>
                          </div>
                      )}

                      {/* SUBTEXT / BULLETS */}
                      {(currentSlide.type === 'info' || currentSlide.type === 'ending') && (
                          <div className="space-y-3">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{currentSlide.layout === 'bullets' ? 'Bullet Points' : 'Subtitle'}</label>
                              {currentSlide.options.map((opt, i) => (
                                  <div key={i} className="flex gap-2">
                                      <input value={opt} onChange={(e) => { const newOpts = [...currentSlide.options]; newOpts[i] = e.target.value; updateSlide('options', newOpts); }} className="flex-1 bg-gray-800 p-2 rounded-lg border border-gray-700 text-sm text-white focus:border-blue-500 outline-none"/>
                                      {currentSlide.layout === 'bullets' && <button onClick={() => { const newOpts = currentSlide.options.filter((_, idx) => idx !== i); updateSlide('options', newOpts); }} className="text-gray-500 hover:text-red-400"><Trash2 size={16}/></button>}
                                  </div>
                              ))}
                              {currentSlide.layout === 'bullets' && <button onClick={() => updateSlide('options', [...currentSlide.options, "New Point"])} className="text-xs text-blue-400 font-bold">+ Add Point</button>}
                          </div>
                      )}
                  </>
              )}

              {/* TAB 2: DESIGN */}
              {sidebarTab === 'design' && (
                  <>
                      {(currentSlide.type === 'mcq' || currentSlide.type === 'tf') && (
                          <div className="space-y-3">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><BarChart size={14}/> Chart Type</label>
                              <div className="grid grid-cols-4 gap-2">
                                  {VISUALIZATIONS.map(v => (
                                      <button key={v.id} onClick={() => updateSlide('visualization', v.id)} className={`flex items-center justify-center p-2 rounded-lg border transition ${currentSlide.visualization === v.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`} title={v.label}>{v.icon}</button>
                                  ))}
                              </div>
                          </div>
                      )}
                      
                      {/* ✅ THEME PRESETS */}
                      <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Palette size={14}/> Themes</label>
                          <div className="grid grid-cols-2 gap-2">
                              {THEMES.map(t => (
                                  <button key={t.id} onClick={() => applyTheme(t)} className="p-3 rounded-lg border border-gray-700 hover:border-white text-left transition group">
                                      <div className={`w-full h-8 rounded mb-2 border border-gray-600 ${t.preview}`}></div>
                                      <span className="text-xs font-bold text-gray-400 group-hover:text-white">{t.label}</span>
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Layout size={14}/> Layout</label>
                          <div className="flex gap-2">
                              {LAYOUTS.map(l => (
                                  <button key={l.id} onClick={() => updateSlide('layout', l.id)} className={`flex-1 p-2 rounded-lg border transition flex items-center justify-center gap-2 ${currentSlide.layout === l.id ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>{l.icon} <span className="text-xs font-bold">{l.label}</span></button>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Palette size={14}/> Custom Colors</label>
                          <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700"><span className="text-sm font-medium text-gray-300">Background</span><input type="color" value={currentSlide.bgColor} onChange={(e) => updateSlide('bgColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"/></div>
                          <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700"><span className="text-sm font-medium text-gray-300">Text</span><input type="color" value={currentSlide.textColor} onChange={(e) => updateSlide('textColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"/></div>
                      </div>

                      {(currentSlide.type === 'mcq' || currentSlide.type === 'tf') && (
                          <div className="space-y-3">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Timer</label>
                              <div className="grid grid-cols-6 gap-1">
                                  {TIMERS.map(t => (
                                      <button key={t} onClick={() => updateSlide('timeLimit', t)} className={`py-1 rounded text-xs font-bold transition ${currentSlide.timeLimit === t ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{t}</button>
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