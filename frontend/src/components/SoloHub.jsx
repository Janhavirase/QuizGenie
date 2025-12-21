import React from 'react';
import { useNavigate } from 'react-router-dom';
import { prebuiltQuizzes } from '../data/prebuiltQuizzes';
import { learningGames } from '../data/learningGames';
import { 
    PenTool, Sparkles, FileUp, Play, Star, 
    Zap, Brain, GraduationCap, Gamepad2, ArrowRight
} from 'lucide-react';

const SoloHub = () => {
  const navigate = useNavigate();

  // --- CONFIGURATION ---
  const createOptions = [
    { 
        title: "Create from Scratch", 
        desc: "Build your own custom quiz slide by slide.", 
        icon: <PenTool size={24}/>, 
        color: "from-blue-600 to-blue-400", 
        shadow: "shadow-blue-500/20",
        path: "/create-manual" 
    },
    { 
        
      title: "Generate with AI", 
      desc: "Turn a simple topic into a full quiz instantly.", 
      icon: <Sparkles size={24}/>, 
      color: "from-purple-600 to-pink-500", 
      shadow: "shadow-purple-500/20",
      // 👇 CHANGE THIS LINE 👇
      path: "/student/ai" 
  },
    
    { 
        title: "Paste Paragraph/Notes and Practice with AI", 
        desc: "Paste the notes and solve the mcq", 
        icon: <FileUp size={24}/>, 
        color: "from-emerald-600 to-teal-400", 
        shadow: "shadow-emerald-500/20",
        path: "/upload-notes" 
    }
  ];

  // --- SUB-COMPONENT: ACTION CARD ---
  const ActionCard = ({ opt }) => (
    <div 
        onClick={() => navigate(opt.path)}
        className="group relative bg-slate-900 border border-slate-800 p-6 rounded-2xl cursor-pointer hover:border-slate-600 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${opt.color} opacity-10 rounded-bl-[100px] transition-opacity group-hover:opacity-20`}></div>
        
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center text-white shadow-lg ${opt.shadow} mb-4 group-hover:scale-110 transition-transform`}>
            {opt.icon}
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">{opt.title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{opt.desc}</p>
    </div>
  );

  // --- SUB-COMPONENT: QUIZ CARD (Netflix Style) ---
  const QuizCard = ({ quiz }) => (
    <div 
      onClick={() => navigate('/study', { state: { questions: quiz.questions } })}
      className="group bg-slate-900 rounded-xl overflow-hidden cursor-pointer border border-slate-800 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col h-full"
    >
      {/* IMAGE SECTION */}
      <div className="h-40 relative overflow-hidden">
        <img 
            src={quiz.image} 
            alt={quiz.title} 
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" 
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 flex items-center gap-1">
                <Brain size={10} className="text-yellow-400"/> Quiz
            </span>
        </div>

        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10">
            {quiz.count || 10} Qs
        </div>
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300">
                <Play size={24} className="ml-1 text-black fill-black"/>
            </div>
        </div>
      </div>

      {/* TEXT CONTENT */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
            <h3 className="font-bold text-slate-100 text-sm leading-snug mb-1 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                {quiz.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2">{quiz.description || "Test your knowledge on this topic."}</p>
        </div>
        
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[8px] font-bold text-white">
                {quiz.author ? quiz.author.charAt(0) : "Q"}
            </div>
            <span className="text-[10px] font-bold text-slate-400 truncate flex-1">{quiz.author || "QuizGenie"}</span>
            <div className="flex text-yellow-500 gap-0.5">
                <Star size={10} fill="currentColor"/>
                <span className="text-[10px] font-medium text-slate-400">4.8</span>
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-20 text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* --- HERO HEADER --- */}
      <div className="relative bg-slate-900 border-b border-slate-800">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-50%] right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Create & Learn
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl">
            Build your own quizzes or explore our curated collection of learning materials.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {createOptions.map((opt, i) => (
              <ActionCard key={i} opt={opt} />
            ))}
          </div>
        </div>
      </div>

      {/* --- DISCOVER SECTION --- */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        
        {/* ROW 1: Learning for Everyone */}
        <section>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><GraduationCap size={20}/></div>
                    <h2 className="text-2xl font-bold text-white">Featured Collections</h2>
                </div>
                <button className="text-sm font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1">View All <ArrowRight size={16}/></button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {prebuiltQuizzes?.everyone?.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}
            </div>
        </section>

        {/* ROW 2: For Kids */}
        <section>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><Star size={20}/></div>
                <h2 className="text-2xl font-bold text-white">QuizGenie Kids</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {prebuiltQuizzes?.kids?.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}
            </div>
        </section>

        {/* ROW 3: For Students */}
        <section>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Zap size={20}/></div>
                <h2 className="text-2xl font-bold text-white">Academic Zone</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {prebuiltQuizzes?.students?.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}
            </div>
        </section>

        {/* ROW 4: LEARNING GAMES (Arcade Style) */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400"><Gamepad2 size={24}/></div>
                <h2 className="text-2xl font-bold text-white">Arcade & Learning Games</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                {learningGames?.map((game, i) => (
                    <div 
                        key={i}
                        onClick={() => navigate(game.path)}
                        className="group bg-slate-950 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-yellow-500/50 transition-all duration-300 flex items-center gap-5 hover:shadow-lg hover:shadow-yellow-500/10"
                    >
                        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 relative border border-slate-700">
                            <img src={game.image} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={game.title} />
                            <div className={`absolute top-0 left-0 ${game.color || 'bg-yellow-600'} text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg`}>
                                {game.badge || "NEW"}
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">{game.title}</h3>
                            <p className="text-slate-400 text-xs leading-relaxed mb-3 line-clamp-2">{game.description}</p>
                            <button className="text-xs font-bold bg-white text-black px-4 py-1.5 rounded-full group-hover:bg-yellow-400 transition-colors flex items-center gap-1 w-fit">
                                Play Now <Play size={10} fill="currentColor"/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
        
      </div>
    </div>
  );
};

export default SoloHub;