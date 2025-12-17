import React from 'react';
import { useNavigate } from 'react-router-dom';
import { prebuiltQuizzes } from '../data/prebuiltQuizzes';
import { learningGames } from '../data/learningGames';
const SoloHub = () => {
  const navigate = useNavigate();

  const createOptions = [
    { title: "Create from Scratch", desc: "Type your own questions.", icon: "✍️", color: "bg-blue-600", path: "/create-manual" },
    { title: "Generate with AI", desc: "Enter topic & difficulty.", icon: "🧞‍♂️", color: "bg-purple-600", path: "/study" },
    { title: "Upload Notes (PDF)", desc: "Notes to Quiz instantly.", icon: "📄", color: "bg-green-600", path: "/upload-notes" }
  ];

  // --- KAHROT STYLE CARD COMPONENT (DARK MODE) ---
  const QuizCard = ({ quiz }) => (
    <div 
      onClick={() => navigate('/study', { state: { questions: quiz.questions } })}
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 border border-gray-700 min-w-[260px] w-full md:w-[23%] flex flex-col"
    >
      {/* IMAGE SECTION */}
      <div className="h-32 relative">
        <img src={quiz.image} alt={quiz.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" />
        
        {/* 'Quiz' Badge (Top Left) */}
        <div className="absolute top-2 left-2 bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
             <span className="text-yellow-400">?</span> Quiz
        </div>

       
      {/* ✅ RESTORED: Question Count Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded z-10">
            {quiz.count} Questions
        </div>
      </div>
      {/* TEXT CONTENT (Dark Background) */}
      <div className="p-3 flex flex-col justify-between flex-1 bg-gray-800 text-white">
        <h3 className="font-bold text-gray-100 text-sm leading-tight mb-2 line-clamp-2">
            {quiz.title}
        </h3>
        
        {/* Author / Metadata */}
        <div className="flex items-center gap-1 mt-auto text-gray-400">
            <div className="w-4 h-4 rounded-full bg-gray-600"></div> {/* Avatar Placeholder */}
            <span className="text-[10px] font-bold truncate">{quiz.author}</span>
            <span className="text-blue-400 text-[10px]">✔</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 pb-20 text-white">
      
      {/* --- HERO: CREATE OPTIONS (Dark Mode) --- */}
      <div className="p-8 pb-12 bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-extrabold text-white mb-2">Create & Learn</h1>
          <p className="text-gray-400 mb-8">Choose how you want to build your knowledge today.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {createOptions.map((opt, i) => (
              <div 
                key={i} 
                onClick={() => navigate(opt.path)}
                // ✅ ADDED: active:scale-95 for click effect
                className={`${opt.color} p-6 rounded-lg cursor-pointer hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all duration-200 shadow-md group relative overflow-hidden text-white h-40 flex flex-col justify-between`}
              >
                <div className="absolute top-2 right-2 opacity-20 text-6xl">{opt.icon}</div>
                <div className="text-4xl">{opt.icon}</div>
                <div>
                    <h3 className="text-xl font-bold">{opt.title}</h3>
                    <p className="opacity-90 text-sm">{opt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- DISCOVER SECTION --- */}
      <div className="max-w-7xl mx-auto p-8 space-y-10">
        
        {/* ROW 1: Learning for Everyone */}
        <section>
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-600 w-1 h-6 rounded"></div>
                <h2 className="text-xl font-bold text-white">Learning for everyone</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">Discover fun and engaging kahoots for learners of all ages!</p>
            <div className="flex flex-wrap gap-4">
                {prebuiltQuizzes.everyone.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}
            </div>
        </section>

        {/* ROW 2: For Kids */}
        <section>
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-green-600 w-1 h-6 rounded"></div>
                <h2 className="text-xl font-bold text-white">Quiz for Kids</h2>
            </div>
            <div className="flex flex-wrap gap-4">
                {prebuiltQuizzes.kids.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}
            </div>
        </section>

        {/* ROW 3: For Students */}
        <section>
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-purple-600 w-1 h-6 rounded"></div>
                <h2 className="text-xl font-bold text-white">Top Picks for Students</h2>
            </div>
            <div className="flex flex-wrap gap-4">
                {prebuiltQuizzes.students.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}
            </div>
        </section>

      </div>
      {/* ROW 4: LEARNING GAMES (New!) */}
       <section className="max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-6">
                <div className="bg-yellow-500 w-1 h-6 rounded"></div>
                <h2 className="text-xl font-bold text-white">Arcade & Learning Games 🎮</h2>
            </div>
            
           <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
                {learningGames.map((game, i) => (
                    <div 
                        key={i}
                        onClick={() => navigate(game.path)}
                        className="bg-gray-800 rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition-all shadow-lg border border-gray-700 flex items-center gap-6 group"
                    >
                        {/* Game Thumbnail */}
                        <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 relative">
                            <img src={game.image} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={game.title} />
                            <div className={`absolute top-0 left-0 ${game.color} text-white text-[10px] font-bold px-2 py-1 rounded-br-lg`}>
                                {game.badge}
                            </div>
                        </div>

                        {/* Game Info */}
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-400 transition">{game.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{game.description}</p>
                            <button className="mt-3 bg-white text-black text-xs font-bold px-4 py-2 rounded-full group-hover:bg-yellow-400 transition">
                                Play Now ▶
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
        
    </div>
  );
};

export default SoloHub;