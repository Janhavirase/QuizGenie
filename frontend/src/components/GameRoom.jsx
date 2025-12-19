import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react'; 
import { socket } from '../socket'; 
import { playSound, stopSound } from '../utils/sounds'; 
import Analytics from './Analytics'; 
import { 
  Users, ArrowRight, Trophy, Cat, Heart, HelpCircle, ThumbsUp, ThumbsDown, 
  CheckCircle, XCircle, BarChart, PieChart, CircleDashed, LayoutGrid, Clock 
} from 'lucide-react'; 

const GameRoom = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeRoomId = params.roomId || params.roomCode; 
  const location = useLocation();
  
  const REACTION_ICONS = {
    cat: <Cat size={24} />,
    love: <Heart size={24} />,
    question: <HelpCircle size={24} />,
    like: <ThumbsUp size={24} />,
    dislike: <ThumbsDown size={24} />
  };

  const isTeacher = location.state?.role === 'host';
  const role = location.state?.role; // ✅ Defined role here for the Ref
  const name = location.state?.name || 'Guest';
  
  // ✅ READ MODE FROM URL
  const isQuizMode = searchParams.get('mode') === 'quiz'; 

  // --- STATE ---
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [topic, setTopic] = useState(""); 
  const [gameStatus, setGameStatus] = useState("lobby"); 
  const [hasAnswered, setHasAnswered] = useState(false);
  const [stats, setStats] = useState({}); 
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  
  const [answerHistory, setAnswerHistory] = useState([]);
  const [hostHistory, setHostHistory] = useState([]); 
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);

  // ✅ REF TO STORE LATEST DATA (Fixes "role is not defined" & Empty Data)
  // Added 'players' here to ensure the socket listener sees the latest list
  const gameDataRef = useRef({ role, topic: "", hostHistory: [], players: [] });

  // ✅ Keep Ref Synced
  useEffect(() => {
      gameDataRef.current = { 
          role, 
          topic: topic || "Untitled Session", 
          hostHistory,
          players // <--- KEY FIX: Sync players state to Ref
      };
  }, [role, topic, hostHistory, players]);

  // --- THEME HELPER ---
  const getThemeStyle = () => {
      if (currentQuestion && currentQuestion.style) {
          return {
              backgroundColor: currentQuestion.style.bgColor || '#111827',
              color: currentQuestion.style.textColor || '#ffffff',
              transition: 'background-color 0.5s ease, color 0.5s ease'
          };
      }
      return { backgroundColor: '#111827', color: '#ffffff' }; 
  };

  // ✅ NEW LOGIC: SAVE REPORT
  const saveGameReport = (incomingLeaderboard) => {
    // Get latest data from Ref (safe from stale closures)
    const { topic, hostHistory, players } = gameDataRef.current;

    // KEY FIX: Use the incoming data, OR fallback to the Ref's player list
    // This ensures we never save an empty list if the state is there
    const leaderboard = (incomingLeaderboard && incomingLeaderboard.length > 0) 
        ? incomingLeaderboard 
        : players;

    if (leaderboard.length === 0) {
        console.warn("⚠️ Warning: Saving report with 0 players.");
    }

    // 1. Calculate Statistics
    const totalPlayers = leaderboard.length;
    const avgScore = totalPlayers > 0 
        ? Math.round(leaderboard.reduce((acc, p) => acc + p.score, 0) / totalPlayers) 
        : 0;

    // 2. Generate Question Stats from hostHistory
    const questionStats = hostHistory.map((h, i) => {
        // Calculate correct/wrong based on the stats stored during the game
        const totalVotes = Object.values(h.stats || {}).reduce((a, b) => a + Number(b), 0);
        const correctCount = h.stats && h.correctAnswer ? (Number(h.stats[h.correctAnswer]) || 0) : 0;
        
        return {
            name: `Q${i+1}`,
            correct: correctCount,
            wrong: totalVotes - correctCount
        };
    });
    
    // Find toughest question
    const toughest = questionStats.reduce((min, q) => q.correct < min.correct ? q : min, questionStats[0]);

    // 3. Create Report Object
    const newReport = {
        quizId: activeRoomId,
        title: topic,
        date: new Date().toLocaleDateString(),
        totalPlayers,
        avgScore,
        toughestQuestion: toughest ? toughest.name : "N/A",
        students: leaderboard,
        questionStats
    };

    // 4. Save to Storage
    const allReports = JSON.parse(localStorage.getItem('quizgenie_reports') || "[]");
    const filtered = allReports.filter(r => r.quizId !== activeRoomId);
    filtered.push(newReport);
    localStorage.setItem('quizgenie_reports', JSON.stringify(filtered));
    
    console.log("✅ Game Report Saved Successfully!", newReport);
  };

  // --- 1. SOCKET LISTENERS ---
  useEffect(() => {
    socket.emit("join_room", { roomCode: activeRoomId, playerName: isTeacher ? "___HOST___" : name });

    socket.on("update_players", (list) => setPlayers(list.filter(p => p.name !== "___HOST___").sort((a,b) => b.score - a.score)));
    
    socket.on("new_question", ({ question, topic }) => {
        setCurrentQuestion(question);
        if(topic) setTopic(topic);
        setGameStatus("playing");
        setHasAnswered(false);
        setStats({}); 
        setIsRevealing(false); 
        setTimeLeft(null); 
        if (question.type === 'mcq' && question.correctAnswer) playSound("tick");
    });

    socket.on("update_stats", (newStats) => setStats(newStats));
    
    // ✅ FIXED GAME OVER LISTENER
    socket.on("game_over", (finalLeaderboard) => {
        setGameStatus("finished");
        stopSound("tick");
        playSound("win");

        // Use Ref to check role (No more ReferenceError)
        if (gameDataRef.current.role === 'host') {
            // Pass whatever the server sent, or null to force using the Ref
            saveGameReport(finalLeaderboard);
        }
    });

    const handleEmoji = (data) => {
        setFloatingEmojis(prev => [...prev, { id: Date.now()+Math.random(), icon: REACTION_ICONS[data.reactionId] || <ThumbsUp/>, left: Math.random()*80+10+'%' }]);
    };
    socket.on("reaction_received", handleEmoji);

    return () => {
        socket.off("update_players");
        socket.off("new_question");
        socket.off("update_stats");
        socket.off("game_over");
        socket.off("reaction_received");
        stopSound("tick");
    };
  }, [activeRoomId]);

  // --- 2. TIMER & LOGIC ---
  useEffect(() => {
      if (!currentQuestion || gameStatus !== 'playing' || isRevealing || currentQuestion.type === 'info' || currentQuestion.type === 'ending') {
          if (!isRevealing) setTimeLeft(null);
          return;
      }

      // ✅ Force Timer for Quiz Mode
      if (isQuizMode) {
          const startLimit = currentQuestion.timeLimit || (currentQuestion.type === 'open' ? 30 : 15);
          setTimeLeft(startLimit);

          const timer = setInterval(() => {
              setTimeLeft((prev) => {
                  if (prev <= 1) {
                      clearInterval(timer);
                      setIsRevealing(true); 
                      
                      if (isTeacher) {
                          // Save Stats
                          setHostHistory(prevH => {
                              if (prevH.some(h => h.question === currentQuestion.questionText)) return prevH;
                              return [...prevH, { question: currentQuestion.questionText, correctAnswer: currentQuestion.correctAnswer, stats: stats }];
                          });
                          // Wait 5s then Next
                          setTimeout(() => socket.emit("next_question", { roomId: activeRoomId }), 5000);
                      }
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
          return () => clearInterval(timer);
      } else {
          setTimeLeft(null);
      }
  }, [currentQuestion, gameStatus, isTeacher, isQuizMode, isRevealing, stats]);

  // --- ACTIONS ---
  const handleNext = () => socket.emit("next_question", { roomId: activeRoomId });
  
  const handleAnswer = (val) => {
      if (hasAnswered || isTeacher || isRevealing) return;
      setHasAnswered(true);
      socket.emit("submit_answer", { roomId: activeRoomId, playerName: name, answer: val, timeLeft: timeLeft });
      
      if (currentQuestion && currentQuestion.type !== 'info') {
          setAnswerHistory(prev => [...prev, {
              question: currentQuestion.questionText,
              myAnswer: val,
              correctAnswer: currentQuestion.correctAnswer,
              isCorrect: currentQuestion.correctAnswer === val,
              type: currentQuestion.type
          }]);
      }
  };
  
  const handleReaction = (id) => socket.emit('send_reaction', { roomCode: activeRoomId, reactionId: id });

  const HOST_URL = window.location.protocol + "//" + window.location.host; 

  // ==========================================
  // 🎨 RENDERERS (UPDATED)
  // ==========================================

  const renderInfoSlide = () => {
      // 1. ENDING SCREEN
      if (currentQuestion.type === 'ending') {
          return (
              <div className="text-center p-12 animate-fade-in-up">
                  <div className="bg-green-500/20 p-6 rounded-full mb-6 border border-green-500/50 inline-block shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                      <Trophy size={100} className="text-green-400 drop-shadow-lg" />
                  </div>
                  <h1 className="text-7xl font-black mb-4 tracking-tight">
                      {isQuizMode ? "Quiz Complete!" : "Survey Complete!"}
                  </h1>
                  <p className="text-3xl opacity-80 font-light">
                      {currentQuestion.options && currentQuestion.options[0]}
                  </p>
                  {isQuizMode && <p className="mt-4 text-xl opacity-60">Check the big screen for the podium!</p>}
              </div>
          );
      }

      // 2. INFO / TITLE SLIDES
      const layout = currentQuestion.layout || 'centered';
      
      return (
          <div className={`w-full h-full flex flex-col justify-center animate-fade-in-up p-12 ${layout === 'left' ? 'items-start text-left' : 'items-center text-center'}`}>
              <div className="mb-8 opacity-80">
                  {layout === 'title' ? <span className="text-6xl">✨</span> : <HelpCircle size={60} />}
              </div>
              
              <h1 className="text-6xl font-extrabold mb-8 leading-tight drop-shadow-xl max-w-5xl">
                  {currentQuestion.questionText}
              </h1>

              {layout === 'bullets' ? (
                  <div className="bg-black/20 p-10 rounded-3xl backdrop-blur-sm border border-white/10">
                      <ul className="text-left space-y-4 text-2xl font-medium">
                          {currentQuestion.options && currentQuestion.options.map((o, i) => (
                              <li key={i} className="flex gap-4 items-start">
                                  <span className="mt-2 w-3 h-3 bg-current rounded-full shrink-0 opacity-50"></span>
                                  <span>{o}</span>
                              </li>
                          ))}
                      </ul>
                  </div>
              ) : (
                  <p className="text-3xl opacity-80 font-light max-w-4xl leading-relaxed">
                      {currentQuestion.options && currentQuestion.options[0]}
                  </p>
              )}
          </div>
      );
  };

  const renderLiveChart = () => {
      const vizType = currentQuestion.style?.visualization || 'bar';
      const totalVotes = Object.values(stats).reduce((a, b) => a + (Number(b) || 0), 0);
      const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

      // --- BAR CHART ---
      if (vizType === 'bar') {
          return (
              <div className="w-full space-y-4 mt-6">
                  {currentQuestion.options.map((opt, i) => {
                      const count = Number(stats[opt]) || 0;
                      const pct = totalVotes === 0 ? 0 : Math.round((count/totalVotes)*100);
                      const isCorrect = isRevealing && opt === currentQuestion.correctAnswer;
                      const isWrong = isRevealing && !isCorrect;
                      
                      // Highlight Logic
                      const barColor = isCorrect ? '#10B981' : isWrong ? '#374151' : '#3B82F6';
                      const textColor = isWrong ? 'text-gray-500' : 'text-white';
                      
                      return (
                          <div key={i} className="relative w-full h-16 bg-black/20 rounded-xl overflow-hidden border border-white/10 transition-all duration-500">
                              <div className="absolute top-0 left-0 h-full transition-all duration-700 ease-out" style={{width: `${pct}%`, backgroundColor: barColor}}></div>
                              <div className={`absolute inset-0 flex items-center justify-between px-6 font-bold z-10 text-xl ${textColor}`}>
                                  <div className="flex items-center gap-3">
                                      {isCorrect && <CheckCircle className="text-white fill-green-500" size={24}/>}
                                      <span className="truncate">{opt}</span>
                                  </div>
                                  <span>{count} ({pct}%)</span>
                              </div>
                          </div>
                      );
                  })}
              </div>
          );
      }
      
      // --- PIE / DONUT ---
      if (vizType === 'pie' || vizType === 'donut') {
          let currentAngle = 0;
          const gradients = currentQuestion.options.map((opt, i) => {
              const count = Number(stats[opt]) || 0;
              const percentage = totalVotes === 0 ? 0 : (count / totalVotes) * 100;
              const start = currentAngle;
              const end = currentAngle + percentage;
              currentAngle = end;
              return `${colors[i % colors.length]} ${start}% ${end}%`;
          }).join(', ');

          return (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 animate-scale-up">
                  <div className="relative rounded-full transition-all duration-700 shadow-2xl border-4 border-white/10"
                      style={{ 
                          width: '350px', 
                          height: '350px', 
                          background: totalVotes === 0 ? '#374151' : `conic-gradient(${gradients})` 
                      }}
                  >
                      {vizType === 'donut' && (
                          <div className="absolute inset-0 m-auto rounded-full backdrop-blur-xl bg-black/40 flex items-center justify-center flex-col" style={{ width: '60%', height: '60%' }}>
                               {isRevealing && (
                                   <>
                                     <p className="text-xs text-gray-300 uppercase font-bold tracking-widest mb-1">Correct</p>
                                     <div className="text-2xl font-black text-green-400 text-center px-2">{currentQuestion.correctAnswer}</div>
                                   </>
                               )}
                               {!isRevealing && <div className="text-4xl font-black">{totalVotes}</div>}
                          </div>
                      )}
                  </div>
                  
                  {/* Legend Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-8 w-full">
                      {currentQuestion.options.map((opt, i) => {
                          const count = Number(stats[opt]) || 0;
                          const pct = totalVotes === 0 ? 0 : Math.round((count/totalVotes)*100);
                          const isCorrect = isRevealing && opt === currentQuestion.correctAnswer;
                          return (
                              <div key={i} className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-all ${isCorrect ? 'bg-green-500/20 border-green-500' : 'bg-black/20 border-white/5'}`}>
                                  <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></div>
                                      <span className={`text-sm font-bold ${isCorrect ? 'text-green-300' : 'text-white'}`}>{opt}</span>
                                  </div>
                                  <span className="font-mono font-bold opacity-70">{count} ({pct}%)</span>
                              </div>
                          )
                      })}
                  </div>
              </div>
          );
      }

      // --- DOTS (PEOPLE ARRAY) ---
      if (vizType === 'dots') {
          return (
              <div className="w-full space-y-6 mt-6">
                   {currentQuestion.options.map((opt, i) => {
                      const count = Number(stats[opt]) || 0;
                      const isCorrect = isRevealing && opt === currentQuestion.correctAnswer;
                      return (
                          <div key={i} className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${isCorrect ? 'bg-green-900/20 border-green-500/50' : 'bg-transparent border-transparent'}`}>
                              <div className="flex justify-between text-lg font-bold">
                                  <span className={isCorrect ? 'text-green-400' : 'text-white'}>{opt}</span>
                                  <span className="opacity-60">{count}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                  {Array.from({ length: count }).map((_, idx) => (
                                      <div 
                                          key={idx} 
                                          className="w-5 h-5 rounded-full animate-bounce-in shadow-lg" 
                                          style={{ 
                                              backgroundColor: isCorrect ? '#10B981' : colors[i % colors.length], 
                                              animationDelay: `${idx * 50}ms` 
                                          }}
                                      ></div>
                                  ))}
                                  {count === 0 && <span className="text-xs text-gray-600 italic">No votes yet</span>}
                              </div>
                          </div>
                      )
                  })}
              </div>
          );
      }

      return null;
  };

  // ==========================================
  // 🖥️ MAIN RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden relative font-sans">
      
      {/* Floating Emojis */}
      <div className="fixed inset-0 pointer-events-none z-[9999]">
          {floatingEmojis.map(e => <div key={e.id} className="absolute text-4xl animate-float-up" style={{left:e.left}}>{e.icon}</div>)}
      </div>

      {isTeacher ? (
        <>
            {/* --- TEACHER SIDEBAR --- */}
            <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col items-center p-6 shadow-2xl z-20">
                
                {/* ROOM CODE - HIGH VISIBILITY */}
                <div className="w-full bg-blue-600 rounded-2xl p-4 text-center shadow-[0_0_20px_rgba(37,99,235,0.3)] mb-6 transform hover:scale-105 transition cursor-default">
                    <p className="text-[10px] font-bold text-blue-100 uppercase tracking-[0.2em] mb-1">Join At</p>
                    <p className="text-xl font-bold text-white mb-2">{HOST_URL}/game</p>
                    <div className="h-px bg-blue-400/50 w-full mb-2"></div>
                    <p className="text-5xl font-mono font-black text-white tracking-widest drop-shadow-md">{activeRoomId}</p>
                </div>

                <div className="bg-white p-3 rounded-xl mb-6 shadow-md"><QRCodeCanvas value={`${HOST_URL}/game/${activeRoomId}`} size={160} /></div>

                <div className="flex items-center gap-2 text-gray-300 bg-gray-800 px-4 py-2 rounded-full mb-6 font-bold border border-gray-700">
                    <Users size={18} /> <span>{players.length} Joined</span>
                </div>

                {timeLeft !== null && !isRevealing && (
                    <div className="mb-6 w-full text-center">
                        <div className={`text-7xl font-black font-mono animate-pulse ${timeLeft < 5 ? 'text-red-500' : 'text-blue-400'}`}>{timeLeft}</div>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Seconds Left</p>
                    </div>
                )}
                {isRevealing && <div className="mb-6 w-full text-center bg-yellow-600/20 py-3 rounded-xl border border-yellow-500/50 text-yellow-400 font-bold text-xl animate-pulse">Time's Up!</div>}

                <div className="mt-auto w-full">
                    {gameStatus === 'playing' && (
                        /* Hide 'Next' button if Quiz Timer is running */
                        <button 
                            onClick={handleNext} 
                            disabled={isRevealing || (isQuizMode && timeLeft !== null)} 
                            className={`w-full py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 transition flex items-center justify-center gap-2 shadow-lg ${isQuizMode && timeLeft !== null ? 'hidden' : ''}`}
                        >
                            {isRevealing ? 'Loading...' : 'Next Slide'} <ArrowRight size={20}/>
                        </button>
                    )}
                    {gameStatus === 'finished' && <button onClick={() => window.location.reload()} className="w-full bg-gray-700 py-3 rounded-xl font-bold hover:bg-gray-600">Restart Session 🔄</button>}
                </div>
            </div>

            {/* --- TEACHER MAIN DISPLAY --- */}
            <div className="flex-1 p-12 flex flex-col relative transition-colors duration-700" style={getThemeStyle()}>
                {gameStatus === 'lobby' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <h1 className="text-8xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 drop-shadow-2xl">
                            {topic || "Interactive Session"}
                        </h1>
                        <p className="text-3xl opacity-60 mb-12 max-w-2xl leading-relaxed">
                            Join on your phone to play along!
                        </p>
                        <button onClick={() => socket.emit("start_game", { roomId: activeRoomId })} className="px-12 py-5 bg-green-600 hover:bg-green-500 rounded-full font-bold text-3xl shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-pulse text-white transform hover:scale-105 transition border-4 border-green-400">
                            Start Game 🚀
                        </button>
                    </div>
                )}

                {gameStatus === 'playing' && currentQuestion && (
                    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto">
                        
                        {/* Question Text (Only if not ending/info) */}
                        {currentQuestion.type !== 'info' && currentQuestion.type !== 'ending' && (
                            <h2 className="text-5xl font-extrabold mb-10 text-center leading-tight drop-shadow-xl px-4">
                                {currentQuestion.questionText}
                            </h2>
                        )}
                        
                        {/* Dynamic Content Container */}
                        <div className={`w-full transition-all duration-500 ${
                            currentQuestion.type === 'info' || currentQuestion.type === 'ending' 
                            ? '' 
                            : 'bg-black/30 backdrop-blur-md p-12 rounded-[3rem] border border-white/10 shadow-2xl'
                        }`}>
                            {(currentQuestion.type === 'info' || currentQuestion.type === 'ending') 
                                ? renderInfoSlide() 
                                : renderLiveChart()
                            }
                        </div>
                        
                        {/* Response Counter */}
                        {currentQuestion.type !== 'info' && currentQuestion.type !== 'ending' && (
                             <div className="mt-8 text-center">
                                 <div className="text-xl font-bold bg-black/40 px-8 py-3 rounded-full inline-flex items-center gap-2 border border-white/10">
                                     <Users size={20} className="text-blue-400"/>
                                     <span>{Object.values(stats).reduce((a,b)=>a+(Number(b)||0), 0)} Answers</span>
                                 </div>
                             </div>
                         )}
                    </div>
                )}

                {gameStatus === 'finished' && <Analytics players={players} hostHistory={hostHistory} isTeacher={true} onExit={() => navigate('/teacher')} />}
            </div>
        </>
      ) : (
        /* --- STUDENT VIEW --- */
        <div className="w-full flex flex-col items-center justify-center min-h-screen p-6 relative transition-colors duration-500" style={getThemeStyle()}>
            {gameStatus === 'lobby' && (
                <div className="text-center animate-fade-in">
                    <h1 className="text-4xl font-black mb-4">You're In!</h1>
                    <div className="w-20 h-1 bg-white/20 mx-auto rounded-full mb-4"></div>
                    <p className="opacity-70 text-lg">Watch the big screen.</p>
                </div>
            )}
            
            {gameStatus === 'playing' && currentQuestion && (
                <div className="w-full max-w-md pb-24">
 {/* ✅ FIXED: Removed 'isQuizMode' check so manual joiners see the timer too */}
{timeLeft !== null && !isRevealing && (
    <div className="w-full mb-8">
        <div className="flex justify-between items-end mb-2 px-1">
            <span className="text-xs font-bold uppercase opacity-60 tracking-widest">Time Left</span>
            <span className={`font-mono font-bold text-xl ${timeLeft < 5 ? 'text-red-500 animate-ping' : ''}`}>{timeLeft}s</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div className="h-full bg-blue-500 transition-all duration-1000 ease-linear" style={{width: `${(timeLeft/(currentQuestion.timeLimit || 15))*100}%`}}></div>
        </div>
    </div>
)}
                    {currentQuestion.type === 'info' ? (
                        <div className="text-center bg-white/10 p-8 rounded-3xl border border-white/20 shadow-xl backdrop-blur-md">
                            {currentQuestion.layout === 'title' && <div className="text-5xl mb-6">✨</div>}
                            <h3 className="text-3xl font-bold mb-6 leading-tight">{currentQuestion.questionText}</h3>
                            {currentQuestion.options && currentQuestion.options.map((o,i)=><p key={i} className="opacity-80 mb-2 text-lg">{o}</p>)}
                        </div>
                    ) : currentQuestion.type === 'ending' ? (
                        <div className="text-center bg-white/10 p-10 rounded-3xl border border-white/20 shadow-xl backdrop-blur-md">
                            <Trophy size={80} className="mx-auto mb-6 text-yellow-400 drop-shadow-lg"/>
                            <h3 className="text-4xl font-black mb-2">{isQuizMode ? "Quiz Over!" : "Done!"}</h3>
                            <p className="opacity-80 text-lg">Look up for results.</p>
                        </div>
                    ) : isRevealing ? (
                        // FEEDBACK SCREEN
                        <div className="text-center animate-fade-in-up">
                            {answerHistory[answerHistory.length-1]?.isCorrect ? (
                                <div className="bg-green-500/20 border-2 border-green-500 p-10 rounded-[2rem] shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                    <CheckCircle size={80} className="mx-auto text-green-400 mb-6"/>
                                    <h2 className="text-4xl font-black text-white mb-2">Correct!</h2>
                                    <p className="text-green-300 font-bold tracking-widest uppercase">+ Points</p>
                                </div>
                            ) : (
                                <div className="bg-red-500/20 border-2 border-red-500 p-10 rounded-[2rem]">
                                    <XCircle size={80} className="mx-auto text-red-400 mb-6"/>
                                    <h2 className="text-4xl font-black text-white mb-2">Wrong!</h2>
                                    <p className="opacity-70 mt-4 text-sm uppercase font-bold">Better luck next time</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        // OPTIONS GRID
                        !hasAnswered ? (
                            <div className="flex flex-col gap-4">
                                <h3 className="text-xl font-bold mb-2 text-center opacity-90">{currentQuestion.questionText}</h3>
                                {currentQuestion.options.map((o, i)=>(
                                    <button 
                                        key={i} 
                                        onClick={()=>handleAnswer(o)} 
                                        className="p-6 bg-white/10 hover:bg-white/20 active:scale-95 transition-all duration-150 rounded-2xl border-2 border-white/10 hover:border-white/40 font-bold text-xl text-center shadow-lg"
                                    >
                                        {o}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-12 bg-black/20 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                                <div className="text-7xl mb-6 animate-bounce">✅</div>
                                <h3 className="text-3xl font-black">Answer Sent!</h3>
                                <p className="opacity-60 mt-2">Wait for the reveal...</p>
                            </div>
                        )
                    )}
                </div>
            )}
            
            {/* Reaction Bar */}
            {currentQuestion?.allowedReactions && !isRevealing && currentQuestion.type !== 'ending' && (
                <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-600 rounded-full px-6 py-3 flex gap-6 shadow-2xl pointer-events-auto transform hover:scale-105 transition">
                        {currentQuestion.allowedReactions.map(r => (
                            <button key={r} onClick={()=>handleReaction(r)} className="text-3xl hover:scale-125 transition active:scale-90">
                                {REACTION_ICONS[r] || <ThumbsUp/>}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {gameStatus === 'finished' && <Analytics players={players} history={answerHistory} isTeacher={false} onExit={() => navigate('/')} />}
        </div>
      )}
    </div>
  );
};

export default GameRoom;