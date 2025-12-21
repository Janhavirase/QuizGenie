import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react'; 
import { socket } from '../socket'; 
import { playSound, stopSound } from '../utils/sounds'; 
import Analytics from './Analytics'; 
import { useAuth } from '../context/AuthContext'; // ✅ ADDED: For Smart Name Detection
import toast, { Toaster } from 'react-hot-toast'; 
import { 
  Users, ArrowRight, Trophy, Cat, Heart, HelpCircle, ThumbsUp, ThumbsDown, 
  CheckCircle2, XCircle, BarChart3, PieChart, Loader2, Clock, Share2, Play
} from 'lucide-react'; 

const GameRoom = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeRoomId = params.roomId || params.roomCode; 
  const location = useLocation();
  const { user } = useAuth(); // ✅ ADDED: Get logged in user
  
  const REACTION_ICONS = {
    cat: <Cat size={24} />,
    love: <Heart size={24} />,
    question: <HelpCircle size={24} />,
    like: <ThumbsUp size={24} />,
    dislike: <ThumbsDown size={24} />
  };

  // ✅ SOLO UPDATE: Detect Mode & Data
  const isSolo = location.state?.mode === 'solo';
  const soloQuestions = location.state?.questions || [];

  const isTeacher = location.state?.role === 'host';
  const role = location.state?.role; 
  
  // ------------------------------------------------------------------
  // ✅ SMART NAME LOGIC (Replaces the old const name = ... line)
  // ------------------------------------------------------------------
  // 1. Try State (if typed in home) -> 2. Try Auth (if logged in) -> 3. Empty (Trigger Modal)
  const [playerName, setPlayerName] = useState(location.state?.name || user?.name || "");
  // Only open modal if we don't have a name AND we are not the host AND not in solo mode
  const [isNameModalOpen, setIsNameModalOpen] = useState(!playerName && !isTeacher && !isSolo); 
  const [hasJoined, setHasJoined] = useState(false);
  
  // Maintain 'name' variable for compatibility with rest of your code
  const name = playerName; 
  // ------------------------------------------------------------------

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
  
  // ✅ Live Quiz Detection
  const [isQuizDetected, setIsQuizDetected] = useState(false);

  // ✅ SOLO UPDATE: Track index locally
  const [soloIndex, setSoloIndex] = useState(0);

  const gameDataRef = useRef({ role, topic: "", hostHistory: [], players: [], stats: {} });

  // 1. Initial Check: Is URL explicit?
  const isUrlQuizMode = searchParams.get('mode') === 'quiz';

  // ✅ 2. FINAL ROBUST CHECK (Used for Rendering)
  const finalIsQuizMode = isUrlQuizMode || isQuizDetected || hostHistory.some(h => h.correctAnswer);

  useEffect(() => {
      gameDataRef.current = { 
          role, 
          topic: topic || "Untitled Session", 
          hostHistory,
          players,
          stats 
      };
  }, [role, topic, hostHistory, players, stats]);

  // --- THEME HELPER ---
  const getThemeStyle = () => {
      if (currentQuestion && currentQuestion.style) {
          return {
              backgroundColor: currentQuestion.style.bgColor || '#0f172a',
              color: currentQuestion.style.textColor || '#f8fafc',
              transition: 'background-color 0.5s ease, color 0.5s ease'
          };
      }
      return { backgroundColor: '#0f172a', color: '#f8fafc' }; 
  };

  // --- SAVE REPORT LOGIC (Multiplayer Only) ---
  const saveGameReport = (incomingLeaderboard) => {
    const { topic, hostHistory, players } = gameDataRef.current;

    const leaderboard = (incomingLeaderboard && incomingLeaderboard.length > 0) 
        ? incomingLeaderboard 
        : players;

    if (leaderboard.length === 0) {
        console.warn("⚠️ Warning: Saving report with 0 players.");
    }

    const totalPlayers = leaderboard.length;
    const avgScore = totalPlayers > 0 
        ? Math.round(leaderboard.reduce((acc, p) => acc + p.score, 0) / totalPlayers) 
        : 0;

    const questionStats = hostHistory.map((h, i) => {
        const totalVotes = Object.values(h.stats || {}).reduce((a, b) => a + Number(b), 0);
        const correctCount = h.stats && h.correctAnswer ? (Number(h.stats[h.correctAnswer]) || 0) : 0;
        return {
            name: `Q${i+1}`,
            correct: correctCount,
            wrong: totalVotes - correctCount
        };
    });
    
    const toughest = questionStats.reduce((min, q) => q.correct < min.correct ? q : min, questionStats[0]);

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

    const allReports = JSON.parse(localStorage.getItem('quizgenie_reports') || "[]");
    const filtered = allReports.filter(r => r.quizId !== activeRoomId);
    filtered.push(newReport);
    localStorage.setItem('quizgenie_reports', JSON.stringify(filtered));
    
    toast.success("Session Report Saved Successfully!", { icon: '📊', duration: 4000 });
  };

  // --- SOCKET & INIT LISTENERS ---

  useEffect(() => {
      // ✅ SOLO UPDATE: Initialize Solo Mode immediately
      if (isSolo) {
          setTopic(location.state?.topic || "Solo Challenge");
          setGameStatus('playing');
          if (soloQuestions.length > 0) {
              const startQ = soloQuestions[0];
              setCurrentQuestion(startQ);
              setTimeLeft(startQ.timeLimit || 20);
              // Check if first question makes it a quiz
              if (startQ.correctAnswer) setIsQuizDetected(true);
          }
          return; 
      }

      // Multiplayer Logic - Logic to restore session (if name exists)
      const savedSession = localStorage.getItem("quiz_session");
      if (savedSession && !isTeacher) {
          const { roomCode, savedName } = JSON.parse(savedSession);
          if (roomCode === activeRoomId && !name && savedName) {
               // If we found a saved name, update state so logic proceeds
               setPlayerName(savedName);
          }
      }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // ✅ SOLO UPDATE: Bypass socket listeners if playing solo
    if (isSolo) return;

    // ✅ SMART NAME CHECK: Stop here if modal is open
    if (isNameModalOpen) return;
    
    // ✅ PREVENT DOUBLE JOIN: Stop if already joined
    if (hasJoined) return;

    // Wait until we have a name (or are teacher)
    if (!name && !isTeacher) return;

    if (!isTeacher && name !== 'Guest') {
        localStorage.setItem("quiz_session", JSON.stringify({
            roomCode: activeRoomId,
            savedName: name
        }));
    }

    // ✅ JOIN ROOM (Now uses the specific name from state)
    socket.emit("join_room", { roomCode: activeRoomId, playerName: isTeacher ? "___HOST___" : name });
    setHasJoined(true); // Mark as joined so we don't emit again

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

        // ✅ CHECK EVERY NEW QUESTION
        if (question.correctAnswer) {
            setIsQuizDetected(true);
        }
    });

    socket.on("update_stats", (newStats) => setStats(newStats));
    
    socket.on("game_over", (finalLeaderboard) => {
        setGameStatus("finished");
        stopSound("tick");
        playSound("win");
        if (gameDataRef.current.role === 'host') {
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
  // ✅ ADDED DEPENDENCIES: name, isNameModalOpen, hasJoined
  }, [activeRoomId, isSolo, name, isNameModalOpen, hasJoined]);

  // --- 2. TIMER & LOGIC ---
  useEffect(() => {
      // ✅ SOLO UPDATE: Stop timer if revealing in solo
      if (isSolo && isRevealing) {
        setTimeLeft(null);
        return;
      }

      if (!currentQuestion || gameStatus !== 'playing' || isRevealing || currentQuestion.type === 'info' || currentQuestion.type === 'ending') {
          if (!isRevealing) setTimeLeft(null);
          return;
      }

      const hasTimer = (currentQuestion.timeLimit && currentQuestion.timeLimit > 0);

      if (hasTimer) {
          const startLimit = currentQuestion.timeLimit;
          setTimeLeft(prev => prev === null ? startLimit : prev);

          const timer = setInterval(() => {
              setTimeLeft((prev) => {
                  if (prev <= 1) {
                      clearInterval(timer);
                      setIsRevealing(true); 
                      
                      // ✅ SOLO UPDATE: Handle Time's Up locally
                      if (isSolo) {
                          setHasAnswered(true); 
                          setAnswerHistory(prev => [...prev, {
                             question: currentQuestion.questionText,
                             myAnswer: null,
                             correctAnswer: currentQuestion.correctAnswer,
                             isCorrect: false,
                             type: currentQuestion.type
                          }]);
                          return 0;
                      }

                      // Multiplayer Host Logic
                      if (gameDataRef.current.role === 'host') {
                          const currentStats = gameDataRef.current.stats; 
                          setHostHistory(prevH => {
                              if (prevH.some(h => h.question === currentQuestion.questionText)) return prevH;
                              return [...prevH, { 
                                  question: currentQuestion.questionText, 
                                  correctAnswer: currentQuestion.correctAnswer, 
                                  stats: currentStats 
                              }];
                          });
                          
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
  }, [currentQuestion, gameStatus, isRevealing, isSolo]); 

  // --- ACTIONS ---
  const handleNext = () => socket.emit("next_question", { roomId: activeRoomId });
  
  // ✅ SOLO UPDATE: Local "Next" handler
  const handleSoloNext = () => {
      const nextIdx = soloIndex + 1;
      
      if (nextIdx < soloQuestions.length) {
          setSoloIndex(nextIdx);
          const nextQ = soloQuestions[nextIdx];
          setCurrentQuestion(nextQ);
          // Check if next question makes it a quiz
          if (nextQ.correctAnswer) setIsQuizDetected(true);
          
          setIsRevealing(false);
          setHasAnswered(false);
          setTimeLeft(nextQ.timeLimit || 20);
      } else {
          // End of Solo Game
          setGameStatus("finished");
          playSound("win");
      }
  };

  const handleAnswer = (val) => {
      if (hasAnswered || isTeacher || isRevealing) return;
      setHasAnswered(true);

      // ✅ SOLO UPDATE: Local Answer Logic
      if (isSolo) {
          setIsRevealing(true);
          const isCorrect = currentQuestion.correctAnswer === val;
          if(isCorrect) playSound("correct"); else playSound("wrong");
          
          toast(isCorrect ? "Correct!" : "Wrong!", { icon: isCorrect ? '🎉' : '❌' });

          setAnswerHistory(prev => [...prev, {
              question: currentQuestion.questionText,
              myAnswer: val,
              correctAnswer: currentQuestion.correctAnswer,
              isCorrect: isCorrect,
              type: currentQuestion.type
          }]);
          return;
      }

      // Multiplayer Logic
      socket.emit("submit_answer", { roomId: activeRoomId, playerName: name, answer: val, timeLeft: timeLeft });
      toast.success("Answer Submitted!", { icon: '🚀', position: 'bottom-center' });

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
  
  const handleReaction = (id) => {
      if(isSolo) return; 
      socket.emit('send_reaction', { roomCode: activeRoomId, reactionId: id });
  };

  const HOST_URL = window.location.protocol + "//" + window.location.host; 

  // ==========================================
  // 🎨 RENDERERS (Info, Chart, etc.)
  // ==========================================

  const renderInfoSlide = () => {
      if (currentQuestion.type === 'ending') {
          return (
              <div className="text-center p-12 animate-fade-in-up">
                  <div className="bg-gradient-to-br from-yellow-400/20 to-orange-500/20 p-8 rounded-full mb-8 border border-yellow-500/30 inline-block shadow-[0_0_60px_rgba(234,179,8,0.2)]">
                      <Trophy size={120} className="text-yellow-400 drop-shadow-2xl" />
                  </div>
                  <h1 className="text-7xl font-black mb-6 tracking-tight text-white">
                      {/* ✅ USE FINAL CHECK FOR TEXT */}
                      {finalIsQuizMode ? "Quiz Complete!" : "Session Closed"}
                  </h1>
                  <p className="text-3xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
                      {currentQuestion.options && currentQuestion.options[0]}
                  </p>
                  {finalIsQuizMode && <p className="mt-8 text-xl text-slate-500 font-medium bg-slate-900/50 inline-block px-6 py-2 rounded-full border border-slate-800">Check the main screen for the podium 🏆</p>}
              </div>
          );
      }

      const layout = currentQuestion.layout || 'centered';
      
      return (
          <div className={`w-full h-full flex flex-col justify-center animate-fade-in-up p-12 ${layout === 'left' ? 'items-start text-left' : 'items-center text-center'}`}>
              <div className="mb-8">
                  {layout === 'title' ? 
                    <span className="text-6xl filter drop-shadow-lg">✨</span> : 
                    <div className="p-4 bg-indigo-500/20 rounded-2xl"><HelpCircle size={60} className="text-indigo-400"/></div>
                  }
              </div>
              
              <h1 className="text-6xl font-extrabold mb-10 leading-[1.1] drop-shadow-xl max-w-6xl text-white">
                  {currentQuestion.questionText}
              </h1>

              {layout === 'bullets' ? (
                  <div className="bg-black/30 backdrop-blur-md p-10 rounded-3xl border border-white/10 shadow-2xl">
                      <ul className="text-left space-y-6 text-3xl font-medium text-slate-200">
                          {currentQuestion.options && currentQuestion.options.map((o, i) => (
                              <li key={i} className="flex gap-6 items-start">
                                  <span className="mt-3 w-3 h-3 bg-indigo-400 rounded-full shrink-0 shadow-[0_0_10px_rgba(129,140,248,0.8)]"></span>
                                  <span>{o}</span>
                              </li>
                          ))}
                      </ul>
                  </div>
              ) : (
                  <p className="text-4xl text-slate-200 font-light max-w-5xl leading-relaxed">
                      {currentQuestion.options && currentQuestion.options[0]}
                  </p>
              )}
          </div>
      );
  };

  const renderLiveChart = () => {
      const vizType = currentQuestion.style?.visualization || 'bar';
      const totalVotes = Object.values(stats).reduce((a, b) => a + (Number(b) || 0), 0);
      const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

      if (vizType === 'bar') {
          return (
              <div className="w-full space-y-5 mt-8">
                  {currentQuestion.options.map((opt, i) => {
                      const count = Number(stats[opt]) || 0;
                      const pct = totalVotes === 0 ? 0 : Math.round((count/totalVotes)*100);
                      const isCorrect = isRevealing && opt === currentQuestion.correctAnswer;
                      const isWrong = isRevealing && !isCorrect;
                      const barColor = isCorrect ? '#10b981' : isWrong ? '#334155' : '#6366f1';
                      const textColor = isWrong ? 'text-slate-500' : 'text-white';
                      
                      return (
                          <div key={i} className="relative w-full h-20 bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50 shadow-inner">
                              <div className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(0,0,0,0.2)]" style={{width: `${pct}%`, backgroundColor: barColor}}></div>
                              <div className={`absolute inset-0 flex items-center justify-between px-8 font-bold z-10 text-2xl ${textColor}`}>
                                  <div className="flex items-center gap-4">
                                      {isCorrect && <CheckCircle2 className="text-white fill-green-500 drop-shadow-md" size={32}/>}
                                      <span className="truncate drop-shadow-md">{opt}</span>
                                  </div>
                                  <span className="font-mono">{count} <span className="text-lg opacity-60 ml-1">({pct}%)</span></span>
                              </div>
                          </div>
                      );
                  })}
              </div>
          );
      }
      
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
                  <div className="relative rounded-full transition-all duration-700 shadow-[0_0_50px_rgba(99,102,241,0.2)] border-8 border-slate-800"
                      style={{ 
                          width: '400px', 
                          height: '400px', 
                          background: totalVotes === 0 ? '#1e293b' : `conic-gradient(${gradients})` 
                      }}
                  >
                      {vizType === 'donut' && (
                          <div className="absolute inset-0 m-auto rounded-full backdrop-blur-xl bg-slate-900/90 flex items-center justify-center flex-col border border-slate-700" style={{ width: '65%', height: '65%' }}>
                               {isRevealing && (
                                   <>
                                     <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-2">Correct Answer</p>
                                     <div className="text-3xl font-black text-emerald-400 text-center px-4 leading-tight">{currentQuestion.correctAnswer}</div>
                                   </>
                               )}
                               {!isRevealing && <div className="text-6xl font-black text-white">{totalVotes}</div>}
                          </div>
                      )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-10 w-full max-w-4xl">
                      {currentQuestion.options.map((opt, i) => {
                          const count = Number(stats[opt]) || 0;
                          const pct = totalVotes === 0 ? 0 : Math.round((count/totalVotes)*100);
                          const isCorrect = isRevealing && opt === currentQuestion.correctAnswer;
                          return (
                              <div key={i} className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all ${isCorrect ? 'bg-emerald-900/20 border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'bg-slate-800/50 border-slate-700/50'}`}>
                                  <div className="flex items-center gap-3">
                                      <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: colors[i % colors.length] }}></div>
                                      <span className={`text-lg font-bold ${isCorrect ? 'text-emerald-300' : 'text-slate-200'}`}>{opt}</span>
                                  </div>
                                  <span className="font-mono font-bold opacity-70 text-slate-400">{count} ({pct}%)</span>
                              </div>
                          )
                      })}
                  </div>
              </div>
          );
      }

      if (vizType === 'dots') {
          return (
              <div className="w-full space-y-6 mt-8">
                    {currentQuestion.options.map((opt, i) => {
                      const count = Number(stats[opt]) || 0;
                      const isCorrect = isRevealing && opt === currentQuestion.correctAnswer;
                      return (
                          <div key={i} className={`flex flex-col gap-3 p-6 rounded-2xl border transition-all ${isCorrect ? 'bg-emerald-900/10 border-emerald-500/40' : 'bg-slate-800/30 border-slate-700/30'}`}>
                              <div className="flex justify-between text-xl font-bold">
                                  <span className={isCorrect ? 'text-emerald-400' : 'text-white'}>{opt}</span>
                                  <span className="opacity-60 font-mono">{count}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                  {Array.from({ length: count }).map((_, idx) => (
                                      <div key={idx} className="w-6 h-6 rounded-full animate-bounce-in shadow-md border border-white/10" style={{ backgroundColor: isCorrect ? '#10B981' : colors[i % colors.length], animationDelay: `${idx * 50}ms` }}></div>
                                  ))}
                                  {count === 0 && <span className="text-sm text-slate-600 italic">No responses</span>}
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
    <div className="min-h-screen bg-slate-950 text-slate-200 flex overflow-hidden relative font-sans">
      <Toaster />
      
      {/* Floating Emojis */}
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {floatingEmojis.map(e => (
            <div 
                key={e.id} 
                className="absolute text-6xl animate-float-up filter drop-shadow-lg will-change-transform" 
                style={{ 
                    left: e.left, 
                    bottom: '-10%' // ✅ Force them to start below the screen
                }}
            >
                {e.icon}
            </div>
        ))}
     </div>

      {isTeacher ? (
        <>
            {/* --- TEACHER SIDEBAR (Command Center) --- */}
            <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col items-center p-6 shadow-2xl z-20">
                <div className="w-full bg-indigo-600 rounded-2xl p-5 text-center shadow-[0_0_30px_rgba(79,70,229,0.3)] mb-8 transform hover:scale-[1.02] transition cursor-default border border-indigo-400/30">
                    <p className="text-[10px] font-extrabold text-indigo-100 uppercase tracking-[0.2em] mb-2 opacity-80">Join At</p>
                    <p className="text-xl font-bold text-white mb-3 tracking-tight">{HOST_URL}/game</p>
                    <div className="h-px bg-indigo-400/30 w-full mb-3"></div>
                    <p className="text-5xl font-mono font-black text-white tracking-widest drop-shadow-md">{activeRoomId}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl mb-8 shadow-xl"><QRCodeCanvas value={`${HOST_URL}/game/${activeRoomId}`} size={180} /></div>

                <div className="flex items-center gap-3 text-slate-300 bg-slate-800 px-6 py-3 rounded-full mb-8 font-bold border border-slate-700 shadow-inner">
                    <Users size={20} className="text-indigo-400"/> <span>{players.length} Ready</span>
                </div>

                {timeLeft !== null && !isRevealing && (
                    <div className="mb-8 w-full text-center">
                        <div className={`text-8xl font-black font-mono tabular-nums leading-none tracking-tighter ${timeLeft < 5 ? 'text-rose-500 animate-pulse' : 'text-indigo-400'}`}>
                            {timeLeft}
                        </div>
                        <p className="text-xs text-slate-500 mt-2 uppercase tracking-[0.2em] font-bold">Seconds Remaining</p>
                    </div>
                )}
                {isRevealing && (
                    <div className="mb-8 w-full text-center bg-yellow-500/10 py-4 rounded-xl border border-yellow-500/30 text-yellow-400 font-bold text-xl animate-pulse flex items-center justify-center gap-2">
                        <Clock size={24}/> Time's Up!
                    </div>
                )}

                <div className="mt-auto w-full">
                    {gameStatus === 'playing' && (
                        <button 
                            onClick={handleNext} 
                            disabled={isRevealing || (timeLeft !== null)} 
                            className={`w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-3 shadow-lg ${
                                isRevealing || (timeLeft !== null) 
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                            }`}
                        >
                            {isRevealing ? <><Loader2 size={24} className="animate-spin"/> Saving Stats...</> : <>Next Slide <ArrowRight size={24}/></>}
                        </button>
                    )}
                    {gameStatus === 'finished' && (
                        <button onClick={() => window.location.reload()} className="w-full bg-slate-800 text-slate-200 py-4 rounded-xl font-bold hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2">
                            <Play size={20}/> Restart Session
                        </button>
                    )}
                </div>
            </div>

            {/* --- TEACHER MAIN DISPLAY (Cinema Mode) --- */}
            <div className="flex-1 p-16 flex flex-col relative transition-colors duration-700 overflow-y-auto" style={getThemeStyle()}>
                {gameStatus === 'lobby' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <h1 className="text-9xl font-black mb-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-2xl tracking-tight">
                            {topic || "QuizGenie"}
                        </h1>
                        <p className="text-3xl text-slate-400 mb-16 max-w-3xl leading-relaxed font-light">
                            Grab your devices. The session is about to begin.
                        </p>
                        <button 
                            onClick={() => socket.emit("start_game", { roomId: activeRoomId })} 
                            className="group relative px-16 py-6 bg-emerald-500 hover:bg-emerald-400 rounded-full font-black text-3xl shadow-[0_0_50px_rgba(16,185,129,0.4)] text-white transition-all transform hover:scale-105 active:scale-95 flex items-center gap-4"
                        >
                            Start Session <Play size={36} className="fill-current"/>
                            <div className="absolute inset-0 rounded-full ring-4 ring-white/20 group-hover:ring-white/40 animate-pulse"></div>
                        </button>
                    </div>
                )}

                {gameStatus === 'playing' && currentQuestion && (
                    <div className="flex-1 flex-col items-center justify-center w-full max-w-[90rem] mx-auto flex">
                        {currentQuestion.type !== 'info' && currentQuestion.type !== 'ending' && (
                            <h2 className="text-6xl font-extrabold mb-12 text-center leading-tight drop-shadow-2xl px-8 text-white">
                                {currentQuestion.questionText}
                            </h2>
                        )}
                        <div className={`w-full transition-all duration-500 ${currentQuestion.type === 'info' || currentQuestion.type === 'ending' ? '' : 'bg-slate-900/60 backdrop-blur-xl p-16 rounded-[3rem] border border-white/5 shadow-2xl'}`}>
                            {(currentQuestion.type === 'info' || currentQuestion.type === 'ending') ? renderInfoSlide() : renderLiveChart()}
                        </div>
                        {currentQuestion.type !== 'info' && currentQuestion.type !== 'ending' && (
                             <div className="mt-10 text-center">
                                 <div className="text-2xl font-bold bg-slate-900/80 text-indigo-200 px-10 py-4 rounded-full inline-flex items-center gap-3 border border-indigo-500/30 shadow-lg">
                                     <Users size={28} className="text-indigo-400"/>
                                     <span>{Object.values(stats).reduce((a,b)=>a+(Number(b)||0), 0)} Responses</span>
                                 </div>
                             </div>
                         )}
                    </div>
                )}

                {/* ✅ FIX: Pass the ROBUST final check to Analytics */}
                {gameStatus === 'finished' && <Analytics players={players} hostHistory={hostHistory} isTeacher={true} onExit={() => navigate('/teacher')} isQuizMode={finalIsQuizMode} />}
            </div>
        </>
      ) : (
        /* --- STUDENT / SOLO VIEW (Mobile Optimized) --- */
        <div className="w-full flex flex-col items-center justify-center min-h-screen p-6 relative transition-colors duration-500 font-sans" style={getThemeStyle()}>
            
            {/* ✅ SOLO UPDATE: Solo Header (Question Count) */}
            {isSolo && gameStatus === 'playing' && (
                <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
                    <div className="bg-black/30 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                        <span className="text-sm font-bold text-slate-400">Question</span>
                        <span className="text-xl font-black text-white ml-2">{soloIndex + 1} <span className="text-slate-500">/ {soloQuestions.length}</span></span>
                    </div>
                </div>
            )}

            {/* ✅ FIXED: Only show "You're In" if it is MULTIPLAYER. Hide it for Solo. */}
            {gameStatus === 'lobby' && !isSolo && !isNameModalOpen && (
                <div className="text-center animate-fade-in flex flex-col items-center">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-green-500/30 animate-bounce">
                        <CheckCircle2 size={48} className="text-white"/>
                    </div>
                    <h1 className="text-5xl font-black mb-4 tracking-tight">You're In!</h1>
                    <div className="w-16 h-1.5 bg-white/20 mx-auto rounded-full mb-6"></div>
                    <p className="opacity-70 text-xl font-medium">Keep your eyes on the big screen.</p>
                </div>
            )}

            {/* ✅ ADDED: Loading state for Solo while questions load */}
            {isSolo && !currentQuestion && (
                <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 size={48} className="animate-spin text-blue-400 mb-4" />
                    <h2 className="text-2xl font-bold">Loading Challenge...</h2>
                </div>
            )}
            
            {/* GAME PLAYING SECTION */}
            {gameStatus === 'playing' && currentQuestion && (
                <div className="w-full max-w-md pb-32">
                    
                    {/* TIMER UI */}
                    {timeLeft !== null && !isRevealing && (
                        <div className="w-full mb-8 bg-slate-900/50 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                            <div className="flex justify-between items-end mb-2 px-1">
                                <span className="text-xs font-bold uppercase text-slate-400 tracking-widest">Time Remaining</span>
                                <span className={`font-mono font-bold text-2xl ${timeLeft < 5 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</span>
                            </div>
                            <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                <div className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 5 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{width: `${(timeLeft/(currentQuestion.timeLimit || 15))*100}%`}}></div>
                            </div>
                        </div>
                    )}

                    {currentQuestion.type === 'info' ? (
                        <div className="text-center bg-slate-900/40 p-10 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl">
                            {currentQuestion.layout === 'title' && <div className="text-6xl mb-8 animate-pulse">✨</div>}
                            <h3 className="text-3xl font-bold mb-6 leading-snug">{currentQuestion.questionText}</h3>
                            {currentQuestion.options && currentQuestion.options.map((o,i)=><p key={i} className="text-slate-300 mb-2 text-lg font-medium">{o}</p>)}
                        </div>
                    ) : currentQuestion.type === 'ending' ? (
                        <div className="text-center bg-slate-900/40 p-12 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl">
                            <Trophy size={100} className="mx-auto mb-8 text-yellow-400 drop-shadow-xl animate-bounce"/>
                            <h3 className="text-4xl font-black mb-3">{finalIsQuizMode ? "Quiz Over!" : "Finished!"}</h3>
                            <p className="text-slate-400 text-lg font-medium">Check your results.</p>
                        </div>
                    ) : isRevealing ? (
                        <div className="text-center animate-scale-up">
                            {/* Result Card */}
                            {answerHistory[answerHistory.length-1]?.isCorrect ? (
                                <div className="bg-emerald-600 p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(16,185,129,0.3)]">
                                    <CheckCircle2 size={100} className="mx-auto text-white mb-6 drop-shadow-md"/>
                                    <h2 className="text-5xl font-black text-white mb-2 tracking-tight">Correct!</h2>
                                </div>
                            ) : (
                                <div className="bg-rose-600 p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(225,29,72,0.3)]">
                                    <XCircle size={100} className="mx-auto text-white mb-6 drop-shadow-md"/>
                                    <h2 className="text-5xl font-black text-white mb-2 tracking-tight">Wrong</h2>
                                </div>
                            )}

                             {/* ✅ SOLO UPDATE: Next Button for Solo Mode */}
                             {isSolo && (
                                <button 
                                    onClick={handleSoloNext}
                                    className="mt-8 w-full py-4 bg-white text-slate-900 rounded-xl font-black text-xl hover:scale-105 transition shadow-xl flex items-center justify-center gap-2"
                                >
                                    Next Question <ArrowRight />
                                </button>
                             )}
                        </div>
                    ) : (
                        !hasAnswered ? (
                            <div className="flex flex-col gap-4">
                                <h3 className="text-2xl font-bold mb-4 text-center text-white drop-shadow-md leading-snug">{currentQuestion.questionText}</h3>
                                {currentQuestion.options.map((o, i)=>(
                                    <button 
                                        key={i} 
                                        onClick={()=>handleAnswer(o)} 
                                        className="p-6 bg-slate-800/80 hover:bg-indigo-600 active:scale-[0.98] transition-all duration-200 rounded-2xl border-2 border-slate-700/50 hover:border-indigo-400 font-bold text-xl text-center shadow-lg hover:shadow-indigo-500/20 backdrop-blur-sm"
                                    >
                                        {o}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-12 bg-slate-900/60 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl">
                                <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/30 animate-pulse">
                                    <CheckCircle2 size={48} className="text-white"/>
                                </div>
                                <h3 className="text-3xl font-black mb-2">Answer Sent</h3>
                                <p className="text-slate-400 font-medium">Wait for the reveal...</p>
                            </div>
                        )
                    )}
                </div>
            )}
            
            {/* REACTION BAR (Hidden during reveal/solo) */}
            {currentQuestion?.allowedReactions && !isRevealing && currentQuestion.type !== 'ending' && !isSolo && (
                <div className="fixed bottom-10 left-0 right-0 flex justify-center pointer-events-none z-50">
                    <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-700 rounded-full px-8 py-4 flex gap-8 shadow-2xl pointer-events-auto transform hover:scale-105 transition ring-1 ring-white/10">
                        {currentQuestion.allowedReactions.map(r => (
                            <button key={r} onClick={()=>handleReaction(r)} className="text-4xl hover:scale-125 transition active:scale-90 filter drop-shadow-md">
                                {REACTION_ICONS[r] || <ThumbsUp/>}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* SOLO FINISH SCREEN */}
            {gameStatus === 'finished' && <Analytics players={players} history={answerHistory} isTeacher={false} onExit={() => navigate('/')} isQuizMode={finalIsQuizMode} />}

            {/* ✅ NAME ENTRY MODAL (Added for QR Code Users) */}
            {isNameModalOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                         
                         <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400 ring-1 ring-indigo-500/30">
                            <Users size={32} />
                        </div>

                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Who are you?</h2>
                        <p className="text-slate-400 text-sm mb-6 font-medium">Enter your name to join the session.</p>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const val = e.target.name.value.trim();
                            if(val) {
                                setPlayerName(val);
                                setIsNameModalOpen(false);
                            }
                        }}>
                            <input 
                                name="name" 
                                autoFocus 
                                placeholder="Your Name" 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mb-4 text-center font-bold text-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-700" 
                                required 
                                autoComplete="off"
                            />
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]">
                                Join Game 🚀
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default GameRoom;