import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    Trophy, Users, Home, Download, CheckCircle2, XCircle, 
    BarChart3, BrainCircuit, AlertCircle 
} from 'lucide-react';

const Analytics = ({ players, history, hostHistory, isTeacher, onExit, isQuizMode = true }) => {
  
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'leaderboard', 'questions'

  // --- DATA PROCESSING ---
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  // Student Specific Data
  // (We use localStorage to find 'my' name if not passed explicitly, or just find by matching name)
  const myName = localStorage.getItem('quiz_name') || 'You';
  const myData = !isTeacher ? sortedPlayers.find(p => p.name === myName) : null;
  const myRank = !isTeacher ? sortedPlayers.findIndex(p => p.name === myName) + 1 : 0;
  
  const correctAnswers = history ? history.filter(h => h.isCorrect).length : 0;
  const totalAnswered = history ? history.length : 0;
  const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;

  // Teacher Specific Data
  const totalPlayers = players.length;
  const classAvgScore = totalPlayers > 0 ? Math.round(players.reduce((a,b) => a + b.score, 0) / totalPlayers) : 0;
  
  // Calculate Toughest Question (Lowest % correct)
  let toughestQuestion = "N/A";
  if (isTeacher && hostHistory && hostHistory.length > 0) {
      const qStats = hostHistory.map(h => {
          const totalVotes = Object.values(h.stats || {}).reduce((a, b) => a + Number(b), 0);
          const correct = h.stats && h.correctAnswer ? (Number(h.stats[h.correctAnswer]) || 0) : 0;
          return { q: h.question, pct: totalVotes === 0 ? 0 : (correct/totalVotes) };
      });
      qStats.sort((a,b) => a.pct - b.pct);
      toughestQuestion = qStats[0]?.q || "N/A";
  }

  // --- DOWNLOAD PDF ---
  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(isQuizMode ? "Class Performance Report" : "Survey Results", 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    if(isQuizMode) doc.text(`Average Score: ${classAvgScore}`, 14, 36);

    const tableData = sortedPlayers.map((p, i) => [
      i + 1, p.name, isQuizMode ? p.score : "Completed"
    ]);

    autoTable(doc, {
      head: [['Rank', 'Name', isQuizMode ? 'Score' : 'Status']],
      body: tableData,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });
    
    doc.save("session_report.pdf");
  };

  // ===========================================
  // 🎓 STUDENT VIEW (Personal Results)
  // ===========================================
  if (!isTeacher) {
      return (
        <div className="w-full min-h-screen p-6 flex flex-col items-center animate-fade-in pb-20">
            {/* Score Card */}
            <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-indigo-500"></div>
                
                <div className="text-center mb-6">
                    <div className="inline-flex p-4 bg-slate-800 rounded-full mb-4 shadow-inner border border-slate-700">
                        {isQuizMode ? (
                            accuracy >= 80 ? <Trophy size={48} className="text-yellow-400 animate-bounce"/> : 
                            accuracy >= 50 ? <BarChart3 size={48} className="text-indigo-400"/> :
                            <AlertCircle size={48} className="text-slate-400"/>
                        ) : (
                            <CheckCircle2 size={48} className="text-emerald-400"/>
                        )}
                    </div>
                    
                    <h1 className="text-4xl font-black text-white mb-2">
                        {isQuizMode ? (accuracy >= 50 ? "Great Job!" : "Completed!") : "Thank You!"}
                    </h1>
                    
                    {/* ✅ HIDE RANK FOR SURVEYS */}
                    {isQuizMode && (
                        <p className="text-slate-400">You placed <span className="text-white font-bold">#{myRank || '-'}</span> out of {totalPlayers}</p>
                    )}
                    {!isQuizMode && <p className="text-slate-400">Your response has been recorded.</p>}
                </div>

                {isQuizMode && (
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                            <div className="text-xs text-slate-500 uppercase font-bold">Score</div>
                            <div className="text-2xl font-black text-indigo-400">{myData?.score || 0}</div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                            <div className="text-xs text-slate-500 uppercase font-bold">Correct</div>
                            <div className="text-2xl font-black text-emerald-400">{correctAnswers}/{totalAnswered}</div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                            <div className="text-xs text-slate-500 uppercase font-bold">Accuracy</div>
                            <div className="text-2xl font-black text-purple-400">{accuracy}%</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Question Review List */}
            <div className="w-full max-w-md space-y-4">
                <h3 className="text-lg font-bold text-slate-400 ml-2">Review Your Answers</h3>
                {history && history.map((h, i) => (
                    <div key={i} className={`p-5 rounded-2xl border transition-all ${h.isCorrect ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-slate-800/30 border-slate-700/30'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded">Q{i+1}</span>
                            {/* Only show check/x for Quizzes */}
                            {isQuizMode ? (
                                h.isCorrect ? <CheckCircle2 size={20} className="text-emerald-500"/> : <XCircle size={20} className="text-rose-500"/>
                            ) : <CheckCircle2 size={20} className="text-slate-500"/>}
                        </div>
                        <p className="font-bold text-lg mb-3 leading-snug">{h.question}</p>
                        
                        <div className="flex flex-col gap-2 text-sm">
                            <div className={`flex items-center gap-2 ${isQuizMode ? (h.isCorrect ? 'text-emerald-400' : 'text-rose-400 line-through opacity-70') : 'text-indigo-300'}`}>
                                <span className="font-mono opacity-50">You:</span> {h.myAnswer || "Skipped"}
                            </div>
                            {/* Only show correct answer for Quizzes */}
                            {!h.isCorrect && isQuizMode && (
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <span className="font-mono opacity-50">Ans:</span> {h.correctAnswer}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={onExit} className="mt-8 px-12 py-4 bg-white text-slate-900 rounded-full font-black text-lg hover:scale-105 transition shadow-xl">
                Return Home
            </button>
        </div>
      );
  }

  // ===========================================
  // 👨‍🏫 TEACHER VIEW (Class Analytics)
  // ===========================================
  return (
    <div className="w-full min-h-screen p-8 flex flex-col items-center animate-fade-in text-slate-200">
      
      {/* Header & Tabs */}
      <div className="w-full max-w-5xl flex justify-between items-end mb-8 border-b border-slate-700 pb-6">
         <div>
            <h1 className="text-4xl font-black text-white mb-2">{isQuizMode ? "Class Performance" : "Session Results"}</h1>
            <p className="text-slate-400">Overview & Insights</p>
         </div>
         <div className="flex bg-slate-800 p-1 rounded-xl">
             {['overview', 'leaderboard', 'questions'].map(tab => (
                 <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                 >
                    {tab === 'leaderboard' && !isQuizMode ? 'Responses' : tab}
                 </button>
             ))}
         </div>
      </div>

      <div className="w-full max-w-5xl">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                  {/* Card 1: Avg Score (Hide if Survey) */}
                  {isQuizMode && (
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 bg-indigo-500/10 w-32 h-32 rounded-full group-hover:scale-150 transition duration-700"></div>
                        <BarChart3 className="text-indigo-400 mb-4" size={32}/>
                        <h3 className="text-4xl font-black text-white mb-1">{classAvgScore}</h3>
                        <p className="text-slate-500 font-bold uppercase text-xs tracking-wider">Class Average</p>
                    </div>
                  )}

                  {/* Card 2: Participants */}
                  <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 bg-emerald-500/10 w-32 h-32 rounded-full group-hover:scale-150 transition duration-700"></div>
                      <Users className="text-emerald-400 mb-4" size={32}/>
                      <h3 className="text-4xl font-black text-white mb-1">{totalPlayers}</h3>
                      <p className="text-slate-500 font-bold uppercase text-xs tracking-wider">Participants</p>
                  </div>

                  {/* Card 3: Toughest Question (Hide if Survey) */}
                  {isQuizMode && (
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl relative overflow-hidden group col-span-1 md:col-span-1">
                        <div className="absolute -right-4 -top-4 bg-rose-500/10 w-32 h-32 rounded-full group-hover:scale-150 transition duration-700"></div>
                        <BrainCircuit className="text-rose-400 mb-4" size={32}/>
                        <p className="text-white font-bold mb-1 line-clamp-2 leading-tight h-[3rem]">{toughestQuestion}</p>
                        <p className="text-slate-500 font-bold uppercase text-xs tracking-wider">Toughest Question</p>
                    </div>
                  )}
              </div>
          )}

          {/* TAB 2: LEADERBOARD / RESPONSES */}
          {activeTab === 'leaderboard' && (
              <div className="bg-slate-900/50 border border-slate-700 rounded-3xl overflow-hidden animate-fade-in-up">
                  <div className="p-6 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold text-lg">{isQuizMode ? "Ranking" : "Participant List"}</h3>
                      <button onClick={downloadReport} className="text-xs bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition">
                          <Download size={14}/> PDF
                      </button>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto">
                      {sortedPlayers.map((p, i) => (
                          <div key={i} className="flex items-center justify-between p-4 border-b border-slate-800 hover:bg-slate-800/30 transition">
                              <div className="flex items-center gap-4">
                                  {isQuizMode ? (
                                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i===1 ? 'bg-slate-300 text-black' : i===2 ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                          {i + 1}
                                      </span>
                                  ) : (
                                      <CheckCircle2 size={20} className="text-emerald-500" />
                                  )}
                                  <span className="font-medium text-white">{p.name}</span>
                              </div>
                              {isQuizMode ? (
                                  <span className="font-mono font-bold text-indigo-300">{p.score} pts</span>
                              ) : (
                                  <span className="text-xs font-bold text-slate-500 uppercase">Submitted</span>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* TAB 3: QUESTIONS BREAKDOWN */}
          {activeTab === 'questions' && (
              <div className="space-y-4 animate-fade-in-up">
                  {hostHistory.map((h, i) => {
                      const totalVotes = Object.values(h.stats || {}).reduce((a, b) => a + Number(b), 0);
                      const correctCount = h.stats && h.correctAnswer ? (Number(h.stats[h.correctAnswer]) || 0) : 0;
                      // If survey, accuracy is just "participation"
                      const accuracy = totalVotes === 0 ? 0 : Math.round((correctCount / totalVotes) * 100);
                      
                      return (
                          <div key={i} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl flex items-center gap-6">
                               {isQuizMode && (
                                   <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold ${accuracy > 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : accuracy > 40 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                       {accuracy}%
                                   </div>
                               )}
                               <div className="flex-1">
                                   <p className="text-xs text-slate-500 font-bold uppercase mb-1">Question {i+1}</p>
                                   <p className="font-bold text-lg text-white mb-2">{h.question}</p>
                                   {isQuizMode && (
                                       <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                           <div className="h-full bg-indigo-500" style={{width: `${accuracy}%`}}></div>
                                       </div>
                                   )}
                               </div>
                               <div className="text-right">
                                    <p className="text-2xl font-black text-white">{isQuizMode ? correctCount : totalVotes}</p>
                                    <p className="text-xs text-slate-500 font-bold">{isQuizMode ? "Correct" : "Responses"}</p>
                               </div>
                          </div>
                      );
                  })}
              </div>
          )}

      </div>
      
      {/* Footer Action */}
      <div className="mt-12">
           <button onClick={onExit} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-bold transition flex items-center gap-2">
                <Home size={20}/> Exit to Hub
           </button>
      </div>

    </div>
  );
};

export default Analytics;