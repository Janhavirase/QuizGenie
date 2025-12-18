import React, { useState } from 'react';
import { Trophy, CheckCircle, XCircle, List, Home, BarChart2, AlertCircle } from 'lucide-react';
import { socket } from '../socket'; 
import { useNavigate } from 'react-router-dom';

const Analytics = ({ players, history, hostHistory, isTeacher, onExit }) => {
  const [activeTab, setActiveTab] = useState('leaderboard');
  
  // Stats for Student
  const totalQuestions = history ? history.length : 0;
  const correctAnswers = history ? history.filter(h => h.isCorrect).length : 0;
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto p-6 animate-fade-in-up pb-20">
      
      <div className="text-center mb-8">
        <Trophy size={64} className="mx-auto text-yellow-400 mb-4 animate-bounce" />
        <h1 className="text-5xl font-extrabold text-white mb-2">Session Complete!</h1>
        {!isTeacher && <p className="text-gray-400 text-xl">You scored <span className="text-blue-400 font-bold">{accuracy}%</span></p>}
      </div>

      {/* TABS */}
      <div className="flex justify-center mb-8">
          <div className="bg-gray-800 p-1 rounded-xl flex gap-2">
              <button onClick={() => setActiveTab('leaderboard')} className={`px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 ${activeTab === 'leaderboard' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  <Trophy size={18} /> Leaderboard
              </button>
              
              {/* Teacher sees "Class Review", Student sees "My Answers" */}
              <button onClick={() => setActiveTab('review')} className={`px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 ${activeTab === 'review' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {isTeacher ? <><BarChart2 size={18}/> Class Review</> : <><List size={18}/> My Answers</>}
              </button>
          </div>
      </div>

      <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* TAB 1: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="p-6 border-b border-gray-800 bg-gray-800/50"><h3 className="text-xl font-bold text-white">🏆 Final Standings</h3></div>
                {players.map((player, index) => (
                    <div key={player.id} className={`flex items-center justify-between p-6 border-b border-gray-800 ${index === 0 ? 'bg-yellow-500/10' : ''}`}>
                        <div className="flex items-center gap-6">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'}`}>{index + 1}</div>
                            <span className="text-xl font-bold text-white">{player.name} {player.id === socket.id ? '(You)' : ''}</span>
                        </div>
                        <span className="text-2xl font-extrabold text-blue-400">{player.score} pts</span>
                    </div>
                ))}
                {players.length === 0 && <div className="p-10 text-center text-gray-500">No players joined yet.</div>}
            </div>
        )}

        {/* TAB 2: TEACHER REVIEW (CLASS PERFORMANCE) */}
        {activeTab === 'review' && isTeacher && hostHistory && (
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-6 space-y-4">
                {hostHistory.map((data, i) => {
                    // Calculate Difficulty (How many got it wrong)
                    const correctCount = data.stats[data.correctAnswer] || 0;
                    const totalVotes = Object.values(data.stats).reduce((a, b) => a + b, 0);
                    const percentCorrect = totalVotes === 0 ? 0 : Math.round((correctCount / totalVotes) * 100);
                    const isHard = percentCorrect < 50;

                    return (
                        <div key={i} className={`p-5 rounded-xl border ${isHard ? 'bg-red-900/10 border-red-500/30' : 'bg-gray-800 border-gray-700'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-white text-lg w-3/4">{i+1}. {data.question}</h4>
                                {isHard && <span className="flex items-center gap-1 text-red-400 text-xs font-bold uppercase bg-red-900/30 px-2 py-1 rounded"><AlertCircle size={12}/> Hard Topic</span>}
                            </div>
                            <div className="flex gap-4 text-sm">
                                <div className="bg-black/30 px-3 py-2 rounded flex-1 border border-white/5">
                                    <span className="block text-gray-500 text-[10px] uppercase">Correct Answer</span>
                                    <span className="text-green-400 font-bold">{data.correctAnswer}</span>
                                </div>
                                <div className="bg-black/30 px-3 py-2 rounded flex-1 border border-white/5">
                                    <span className="block text-gray-500 text-[10px] uppercase">Class Accuracy</span>
                                    <span className={`font-bold ${isHard ? 'text-red-400' : 'text-blue-400'}`}>{percentCorrect}% ({correctCount}/{totalVotes})</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {hostHistory.length === 0 && <div className="text-center text-gray-500">No question data recorded.</div>}
            </div>
        )}

        {/* TAB 2: STUDENT REVIEW (PERSONAL) */}
        {activeTab === 'review' && !isTeacher && history && (
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-6 space-y-4">
                {history.map((item, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${item.isCorrect ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                        <div className="flex items-start gap-4">
                            <div className="mt-1">{item.isCorrect ? <CheckCircle className="text-green-500" size={24}/> : <XCircle className="text-red-500" size={24}/>}</div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white text-lg mb-2">{item.question}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="bg-black/30 p-3 rounded-lg"><span className="block text-gray-500 text-xs uppercase font-bold mb-1">Your Answer</span><span className={item.isCorrect ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{item.myAnswer || "Skipped"}</span></div>
                                    {!item.isCorrect && <div className="bg-black/30 p-3 rounded-lg"><span className="block text-gray-500 text-xs uppercase font-bold mb-1">Correct Answer</span><span className="text-green-400 font-bold">{item.correctAnswer}</span></div>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
          <button onClick={onExit} className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-full shadow-lg flex items-center gap-3 transition transform hover:scale-105 border border-gray-700">
              <Home size={20} /> Return to Dashboard
          </button>
      </div>
    </div>
  );
};

export default Analytics;