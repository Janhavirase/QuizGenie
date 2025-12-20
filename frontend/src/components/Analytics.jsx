import React, { useState } from 'react';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  List, 
  Home, 
  BarChart3, 
  AlertCircle, 
  Share2, 
  Medal,
  Activity 
} from 'lucide-react';
import { socket } from '../socket'; 
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Analytics = ({ players, history, hostHistory, isTeacher, onExit }) => {
  const [activeTab, setActiveTab] = useState('leaderboard');
  
  // --- LOGIC PRESERVED ---
  const totalQuestions = history ? history.length : 0;
  const correctAnswers = history ? history.filter(h => h.isCorrect).length : 0;
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // --- NEW FEATURE: COPY RESULTS ---
  const handleCopyResults = () => {
    const resultsText = players
      .map((p, i) => `${i + 1}. ${p.name} - ${p.score} pts`)
      .join('\n');
    
    const clipboardText = `🏆 QuizGenie Results \n\n${resultsText}`;
    
    navigator.clipboard.writeText(clipboardText);
    toast.success("Leaderboard copied to clipboard!", {
        icon: '📋',
        style: {
            borderRadius: '10px',
            background: '#1e293b',
            color: '#fff',
        },
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 pb-20">
      
      {/* Decorative Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 pt-12">
        
        {/* HERO SECTION */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full mb-6 ring-1 ring-yellow-500/30 shadow-lg shadow-yellow-500/10">
            <Trophy size={48} className="text-yellow-400 drop-shadow-md" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
            Session Complete
          </h1>
          
          {!isTeacher ? (
            <div className="flex items-center justify-center gap-2 text-slate-400">
                <span>Accuracy:</span>
                <span className={`text-xl font-bold ${accuracy >= 80 ? 'text-emerald-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-rose-400'}`}>
                    {accuracy}%
                </span>
            </div>
          ) : (
            <p className="text-slate-400">Great job leading the class!</p>
          )}
        </div>

        {/* NAVIGATION TABS (Segmented Control Style) */}
        <div className="flex justify-center mb-10">
            <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 flex gap-1 shadow-xl backdrop-blur-md">
                <button 
                    onClick={() => setActiveTab('leaderboard')} 
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                        activeTab === 'leaderboard' 
                        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                >
                    <Trophy size={16} /> Leaderboard
                </button>
                
                <button 
                    onClick={() => setActiveTab('review')} 
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                        activeTab === 'review' 
                        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                >
                    {isTeacher ? <><BarChart3 size={16}/> Class Insights</> : <><List size={16}/> My Answers</>}
                </button>
            </div>
        </div>

        {/* MAIN CONTENT CARD */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
            
            {/* TAB 1: LEADERBOARD */}
            {activeTab === 'leaderboard' && (
                <div className="flex flex-col h-full">
                    <div className="px-8 py-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <Medal size={20} className="text-indigo-400"/> Final Standings
                        </h3>
                        <span className="text-xs font-medium px-2 py-1 bg-slate-800 rounded-md text-slate-400 border border-slate-700">
                            {players.length} Players
                        </span>
                    </div>
                    
                    <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
                        {players.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                <Activity size={48} className="mb-4 opacity-20"/>
                                <p>No players joined this session.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 p-4">
                                {players.map((player, index) => {
                                    // Rank Styling
                                    let rankColor = "bg-slate-800 text-slate-400 border-slate-700"; // Default
                                    if (index === 0) rankColor = "bg-gradient-to-br from-yellow-400 to-orange-500 text-black border-yellow-500/50 shadow-lg shadow-yellow-500/20";
                                    if (index === 1) rankColor = "bg-gradient-to-br from-slate-300 to-slate-400 text-black border-slate-400/50";
                                    if (index === 2) rankColor = "bg-gradient-to-br from-orange-400 to-red-400 text-black border-orange-400/50";

                                    return (
                                        <div key={player.id} className="group flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-800/60 border border-transparent hover:border-slate-700 rounded-2xl transition-all duration-300">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border ${rankColor}`}>
                                                    {index === 0 ? <Trophy size={18}/> : index + 1}
                                                </div>
                                                <div>
                                                    <span className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                                                        {player.name}
                                                    </span>
                                                    {player.id === socket.id && (
                                                        <span className="ml-2 text-xs font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-xl font-bold text-white tabular-nums tracking-tight">
                                                    {player.score}
                                                </span>
                                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Points</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: TEACHER REVIEW */}
            {activeTab === 'review' && isTeacher && hostHistory && (
                <div className="flex flex-col h-full">
                    <div className="px-8 py-6 border-b border-slate-800 bg-slate-900/50">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <Activity size={20} className="text-indigo-400"/> Performance Breakdown
                        </h3>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-4">
                        {hostHistory.map((data, i) => {
                            const correctCount = data.stats[data.correctAnswer] || 0;
                            const totalVotes = Object.values(data.stats).reduce((a, b) => a + b, 0);
                            const percentCorrect = totalVotes === 0 ? 0 : Math.round((correctCount / totalVotes) * 100);
                            const isHard = percentCorrect < 50;

                            return (
                                <div key={i} className={`p-6 rounded-2xl border transition-all ${isHard ? 'bg-rose-950/10 border-rose-500/20' : 'bg-slate-800/40 border-slate-800'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-semibold text-slate-200 text-lg w-3/4 leading-snug">
                                            <span className="text-slate-500 mr-2">Q{i+1}.</span> {data.question}
                                        </h4>
                                        {isHard && (
                                            <span className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                                                <AlertCircle size={12}/> Hard
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <div className="flex-1 bg-slate-950/50 px-4 py-3 rounded-xl border border-slate-800/50">
                                            <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Correct Answer</span>
                                            <span className="text-emerald-400 font-medium">{data.correctAnswer}</span>
                                        </div>
                                        <div className="flex-1 bg-slate-950/50 px-4 py-3 rounded-xl border border-slate-800/50">
                                            <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Accuracy</span>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${isHard ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                                        style={{width: `${percentCorrect}%`}}
                                                    />
                                                </div>
                                                <span className={`text-sm font-bold ${isHard ? 'text-rose-400' : 'text-emerald-400'}`}>{percentCorrect}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {hostHistory.length === 0 && <div className="text-center p-10 text-slate-500">No data available.</div>}
                    </div>
                </div>
            )}

            {/* TAB 2: STUDENT REVIEW */}
            {activeTab === 'review' && !isTeacher && history && (
                <div className="flex flex-col h-full">
                    <div className="px-8 py-6 border-b border-slate-800 bg-slate-900/50">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <List size={20} className="text-indigo-400"/> My Answers
                        </h3>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-4">
                        {history.map((item, i) => (
                            <div key={i} className={`p-5 rounded-2xl border transition-all ${item.isCorrect ? 'bg-emerald-950/10 border-emerald-500/20' : 'bg-rose-950/10 border-rose-500/20'}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 p-1 rounded-full ${item.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {item.isCorrect ? <CheckCircle2 size={20}/> : <XCircle size={20}/>}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-slate-200 text-lg mb-3">{item.question}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                                                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Your Answer</span>
                                                <span className={`font-semibold ${item.isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                                                    {item.myAnswer || "Timed Out"}
                                                </span>
                                            </div>
                                            {!item.isCorrect && (
                                                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                                                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Correct Answer</span>
                                                    <span className="font-semibold text-emerald-400">{item.correctAnswer}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            
            {/* The New SHARE Button (Only for Teachers) */}
            {isTeacher && (
                <button 
                    onClick={handleCopyResults}
                    className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-indigo-400/20"
                >
                    <Share2 size={20} strokeWidth={2.5} /> Share Results
                </button>
            )}

            <button 
                onClick={onExit} 
                className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-slate-700 hover:border-slate-600"
            >
                <Home size={20} strokeWidth={2.5} /> Return Dashboard
            </button>
        </div>

      </div>
    </div>
  );
};

export default Analytics;