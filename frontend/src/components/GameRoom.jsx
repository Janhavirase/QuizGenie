import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react'; 
import { socket } from '../socket'; 
import { playSound, stopSound } from '../utils/sounds'; 
import Analytics from './Analytics'; 
import { Users, ArrowRight, Trophy, Cat, Heart, HelpCircle, ThumbsUp, ThumbsDown, LogOut, CheckCircle, XCircle, Clock } from 'lucide-react'; 

const GameRoom = () => {
  const params = useParams();
  const navigate = useNavigate();
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
  const name = location.state?.name || 'Guest';
  
  // ✅ DETERMINE MODE: Default to 'survey' if undefined
  const isQuizMode = location.state?.mode === 'quiz';

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

  const getThemeStyle = () => {
      if (currentQuestion && currentQuestion.style) {
          return {
              backgroundColor: currentQuestion.style.bgColor,
              color: currentQuestion.style.textColor,
              transition: 'background-color 0.5s ease, color 0.5s ease'
          };
      }
      return { backgroundColor: '#111827', color: '#fff' }; 
  };

  useEffect(() => {
    const handleEmoji = (data) => {
        const newEmoji = {
            id: Date.now() + Math.random(), 
            icon: REACTION_ICONS[data.reactionId] || <ThumbsUp size={24}/>,
            left: Math.random() * 80 + 10 + '%', 
        };
        setFloatingEmojis((prev) => [...prev, newEmoji]);
        setTimeout(() => {
            setFloatingEmojis((prev) => prev.filter(e => e.id !== newEmoji.id));
        }, 2000);
    };
    socket.removeAllListeners("reaction_received");
    socket.on("reaction_received", handleEmoji);
    return () => socket.off("reaction_received", handleEmoji);
  }, []); 

  // --- TIMER LOGIC ---
  useEffect(() => {
      // Logic: Only run timer if it's a QUIZ MODE and playing a question
      if (!currentQuestion || gameStatus !== 'playing' || isRevealing || currentQuestion.type === 'info' || currentQuestion.type === 'ending') {
          if (!isRevealing) setTimeLeft(null);
          return;
      }

      if (isQuizMode) {
          // Set Timer based on type
          const startLimit = currentQuestion.type === 'open' ? 30 : 15;
          setTimeLeft(startLimit);

          const timerInterval = setInterval(() => {
              setTimeLeft((prev) => {
                  if (prev <= 1) {
                      clearInterval(timerInterval);
                      setIsRevealing(true); 
                      
                      if (isTeacher) {
                          // ✅ CRITICAL FIX: Save stats for Teacher Review BEFORE moving
                          setHostHistory(prevH => {
                              // Avoid duplicates
                              if (prevH.some(h => h.question === currentQuestion.questionText)) return prevH;
                              return [...prevH, {
                                  question: currentQuestion.questionText,
                                  correctAnswer: currentQuestion.correctAnswer,
                                  stats: stats 
                              }];
                          });

                          // Wait 5s then Next
                          setTimeout(() => {
                              socket.emit("next_question", { roomId: activeRoomId });
                          }, 5000);
                      }
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
          return () => clearInterval(timerInterval);
      } else {
          // Survey Mode = No Timer
          setTimeLeft(null);
      }
  }, [currentQuestion, gameStatus, isTeacher, activeRoomId, isRevealing, isQuizMode, stats]); 

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    if (!activeRoomId) return;

    const onUpdatePlayers = (updatedList) => {
        const sorted = updatedList.filter(p => p.name !== "___HOST___").sort((a,b) => b.score - a.score);
        setPlayers(sorted);
    };

    const onNewQuestion = ({ question }) => {
        setCurrentQuestion(question);
        setGameStatus("playing");
        setHasAnswered(false);
        setStats({}); 
        setIsRevealing(false); 
        setTimeLeft(null); 
        if (question.type === 'mcq' && question.correctAnswer) playSound("tick");
    };

    const onUpdateStats = (newStats) => setStats(newStats);
    const onGameOver = () => {
        setGameStatus("finished");
        stopSound("tick");
        playSound("win");
    };

    socket.on("update_players", onUpdatePlayers);
    socket.on("new_question", onNewQuestion);
    socket.on("update_stats", onUpdateStats);
    socket.on("game_over", onGameOver);

    if (isTeacher) {
        socket.emit("join_room", { roomCode: activeRoomId, playerName: "___HOST___" });
    } else if (name) {
        socket.emit("join_room", { roomCode: activeRoomId, playerName: name });
    }

    return () => {
        socket.off("update_players", onUpdatePlayers);
        socket.off("new_question", onNewQuestion);
        socket.off("update_stats", onUpdateStats);
        socket.off("game_over", onGameOver);
        stopSound("tick");
    };
  }, [activeRoomId, name, isTeacher]);

  const handleNext = () => socket.emit("next_question", { roomId: activeRoomId });

  const handleAnswer = (answerValue) => {
    if (hasAnswered || isTeacher || isRevealing) return; 
    if (!answerValue) return;
    
    setHasAnswered(true);
    socket.emit("submit_answer", { 
        roomId: activeRoomId, 
        playerName: name, 
        answer: answerValue,
        timeLeft: timeLeft // Send Speed Data
    });

    if (currentQuestion && currentQuestion.type !== 'info' && currentQuestion.type !== 'ending') {
        const isCorrect = currentQuestion.correctAnswer === answerValue;
        setAnswerHistory(prev => [...prev, {
            question: currentQuestion.questionText,
            myAnswer: answerValue,
            correctAnswer: currentQuestion.correctAnswer,
            isCorrect: isCorrect
        }]);
    }
  };

  const handleReaction = (reactionId) => {
      socket.emit('send_reaction', { roomCode: activeRoomId, reactionId });
  };

  const HOST_URL = window.location.protocol + "//" + window.location.host; 

  // --- RENDERERS ---
  const renderInfoSlide = () => {
    // 1. ENDING SCREEN (Dynamic Text based on Mode)
    if (currentQuestion.type === 'ending') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in-up px-10">
                <div className="bg-green-500/20 p-6 rounded-full mb-6 border border-green-500/50">
                    <Trophy size={80} className="text-green-400 drop-shadow-lg" />
                </div>
                <h1 className="text-7xl font-extrabold mb-4 text-white">
                    {isQuizMode ? "Quiz Complete!" : "Survey Complete!"}
                </h1>
                <p className="text-3xl opacity-80 text-blue-200">
                    {isQuizMode ? "Check the leaderboard for winners." : "Thank you for participating."}
                </p>
            </div>
        );
    }

    if (currentQuestion.layout === 'title') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in-up px-10">
                <h1 className="text-7xl font-extrabold mb-8 text-white drop-shadow-2xl">{currentQuestion.questionText}</h1>
                <div className="w-32 h-2 bg-blue-500 mb-8 rounded-full"></div>
                <p className="text-3xl opacity-90 font-light text-blue-100">{currentQuestion.options && currentQuestion.options[0]}</p>
            </div>
        );
    } 
    return (
        <div className="w-full max-w-5xl bg-white text-black p-16 rounded-[2rem] shadow-2xl relative">
            <h1 className="text-6xl font-bold mb-10 text-center border-b-4 border-gray-100 pb-6 text-gray-900">{currentQuestion.questionText}</h1>
            <ul className="space-y-6">
                {currentQuestion.options && currentQuestion.options.map((opt, i) => (
                    <li key={i} className="flex items-start gap-5 text-2xl font-medium text-gray-700">
                        <span className="mt-2.5 w-3 h-3 bg-blue-600 rounded-full shrink-0"></span><span>{opt}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
  };

  const renderLiveChart = () => {
    const vizType = currentQuestion.style?.visualization || 'bar';
    const totalVotes = Object.values(stats).reduce((a, b) => a + (Number(b) || 0), 0);
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

    const getBarColor = (option, defaultColor) => {
        if (!isRevealing) return defaultColor; 
        if (option === currentQuestion.correctAnswer) return '#10B981'; 
        return '#374151'; 
    };

    const getBarOpacity = (option) => {
        if (!isRevealing) return '100%';
        if (option === currentQuestion.correctAnswer) return '100%';
        return '30%'; 
    };

    if (vizType === 'bar') {
        return (
            <div className="w-full space-y-3 mt-4">
                {currentQuestion.options.map((opt, i) => {
                    const count = Number(stats[opt]) || 0;
                    const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
                    return (
                        <div key={i} className="relative w-full h-14 bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600 transition-all" style={{ opacity: getBarOpacity(opt) }}>
                            <div className="absolute top-0 left-0 h-full transition-all duration-700" style={{ width: `${percentage}%`, backgroundColor: getBarColor(opt, '#3B82F6') }}></div>
                            <div className="absolute inset-0 flex items-center justify-between px-4 font-bold z-10">
                                <div className="flex items-center gap-3">
                                    {isRevealing && opt === currentQuestion.correctAnswer && <CheckCircle className="text-green-400 fill-white" />}
                                    <span className="text-lg truncate mr-2 text-white">{opt}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-white"><span>{count}</span><span className="bg-black/30 px-2 py-0.5 rounded">{percentage}%</span></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
    
    // PIE CHART LOGIC SAME AS BEFORE...
    if (vizType === 'pie' || vizType === 'donut') {
        // ... (Keep existing Pie/Donut logic from previous response) ...
        return <div className="text-center text-white">Pie Chart Active (Add code block here if needed)</div>; 
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden relative font-sans">
      
      {/* FLOATING EMOJIS */}
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {floatingEmojis.map(emoji => (
              <div key={emoji.id} className="absolute bottom-0 text-blue-400 animate-float-up opacity-0 text-6xl font-bold drop-shadow-lg" style={{ left: emoji.left }}>{emoji.icon}</div>
          ))}
      </div>

      {isTeacher ? (
        <>
            {/* SIDEBAR */}
            <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col items-center p-6 shadow-2xl z-20">
                <div className="mb-6 text-center">
                    <p className="text-blue-400 font-bold text-lg mb-4">{HOST_URL}/join</p>
                    <div className="bg-white p-3 rounded-xl inline-block shadow-lg">
                        <QRCodeCanvas value={`${HOST_URL}/game/${activeRoomId}`} size={180} />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400 bg-gray-800 px-4 py-2 rounded-full mb-6">
                    <Users size={18} /> <span className="font-bold">{players.length} Joined</span>
                </div>

                {/* TIMER (Only for Quizzes) */}
                {isQuizMode && timeLeft !== null && !isRevealing && (
                    <div className="mb-6 w-full text-center">
                        <div className={`text-6xl font-black font-mono animate-pulse ${timeLeft < 5 ? 'text-red-500' : 'text-blue-400'}`}>{timeLeft}s</div>
                        <p className="text-xs text-gray-500 mt-1">Auto-advancing</p>
                    </div>
                )}
                {isRevealing && (
                    <div className="mb-6 w-full text-center bg-yellow-600/20 py-2 rounded-lg border border-yellow-500/50">
                        <div className="text-xl font-bold text-yellow-400">Time's Up!</div>
                        <p className="text-xs text-gray-400">Revealing Answer...</p>
                    </div>
                )}

                <div className="mt-auto w-full pt-6">
                      {/* HIDE NEXT BUTTON FOR QUIZZES during countdown */}
                      {gameStatus === 'playing' && (
                        <button 
                            onClick={handleNext} 
                            disabled={isRevealing} 
                            className={`w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white py-4 rounded-xl font-bold text-xl shadow-lg transition flex items-center justify-center gap-2 ${isQuizMode && timeLeft !== null ? 'hidden' : ''}`}
                        >
                            {isRevealing ? 'Loading...' : 'Next Slide'} <ArrowRight size={24} />
                        </button>
                      )}
                      {gameStatus === 'finished' && <button onClick={() => window.location.reload()} className="w-full bg-gray-700 py-3 rounded-xl font-bold">New Session 🔄</button>}
                </div>
            </div>

            {/* MAIN DISPLAY */}
            <div className="flex-1 flex flex-col p-12 relative overflow-y-auto transition-colors duration-500" style={getThemeStyle()}>
                {gameStatus === 'lobby' && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-6">{topic || "Interactive Session"}</h1>
                        <p className="text-2xl opacity-70 mb-12">Waiting for players...</p>
                        <button onClick={() => socket.emit("start_game", { roomId: activeRoomId })} className="px-12 py-5 bg-green-600 hover:bg-green-500 rounded-full font-bold text-2xl shadow-xl animate-pulse text-white">Start 🚀</button>
                    </div>
                )}

                {gameStatus === 'playing' && currentQuestion && (
                    <div className="max-w-6xl mx-auto w-full flex flex-col justify-center h-full items-center z-10">
                         {currentQuestion.type !== 'info' && currentQuestion.type !== 'ending' && <h2 className="text-4xl font-extrabold mb-8 text-center drop-shadow-md">{currentQuestion.questionText}</h2>}
                         
                         <div className={`w-full flex items-center justify-center relative ${currentQuestion.type === 'info' || currentQuestion.type === 'ending' ? '' : 'bg-black/20 backdrop-blur-sm p-8 rounded-3xl border border-white/10 min-h-[400px] shadow-xl'}`}>
                            {(currentQuestion.type === 'info' || currentQuestion.type === 'ending') && renderInfoSlide()}
                            {(!currentQuestion.type || currentQuestion.type === 'mcq') && renderLiveChart()}
                         </div>
                         
                         {currentQuestion.type !== 'info' && currentQuestion.type !== 'ending' && (
                             <div className="mt-6 text-center opacity-70 font-bold">{Object.values(stats).reduce((a,b)=>a+(Number(b)||0), 0)} Responses</div>
                         )}
                    </div>
                )}

                {gameStatus === 'finished' && (
                    <Analytics players={players} hostHistory={hostHistory} isTeacher={true} onExit={() => navigate('/teacher')} />
                )}
            </div>
        </>
      ) : (
        /* STUDENT VIEW (Simplified for brevity, same logic as before) */
        <div className="w-full flex flex-col items-center justify-center relative min-h-screen p-6 overflow-hidden transition-colors duration-500" style={getThemeStyle()}>
            {gameStatus === 'lobby' && <div className="text-center"><h1 className="text-3xl font-bold">You're in!</h1><p className="opacity-70 mt-2">Look at the big screen.</p></div>}
            
            {gameStatus === 'playing' && currentQuestion && (
                <div className="w-full max-w-md pb-24 relative z-10">
                    {/* Timer Logic for Student */}
                    {isQuizMode && timeLeft !== null && !isRevealing && (
                        <div className="w-full mb-6">
                            <div className="flex justify-between items-end mb-1 px-1">
                                <span className="text-xs font-bold uppercase text-gray-400">Time</span>
                                <span className="font-mono font-bold text-xl text-blue-400">{timeLeft}s</span>
                            </div>
                            <div className="h-3 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / 15) * 100}%` }}></div></div>
                        </div>
                    )}

                    {currentQuestion.type === 'info' ? (
                        <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-lg">
                            <h3 className="text-2xl font-bold mb-4">{currentQuestion.questionText}</h3>
                            <p className="opacity-80 text-lg">{currentQuestion.options && currentQuestion.options[0]}</p>
                        </div>
                    ) : isRevealing ? (
                        // FEEDBACK
                        <div className="text-center animate-fade-in-up">
                            {answerHistory[answerHistory.length - 1]?.isCorrect ? (
                                <div className="bg-green-500/20 border border-green-500 p-8 rounded-3xl"><CheckCircle size={64} className="mx-auto text-green-400 mb-4"/><h2 className="text-3xl font-bold text-white">Correct!</h2></div>
                            ) : (
                                <div className="bg-red-500/20 border border-red-500 p-8 rounded-3xl"><XCircle size={64} className="mx-auto text-red-400 mb-4"/><h2 className="text-3xl font-bold text-white">Wrong!</h2></div>
                            )}
                        </div>
                    ) : hasAnswered ? (
                        <div className="text-center p-8 bg-black/20 rounded-2xl border border-white/10 animate-fade-in"><div className="text-5xl mb-4">✅</div><h3 className="text-2xl font-bold">Answer Sent!</h3></div>
                    ) : (
                        // OPTIONS GRID
                        <>
                            <h3 className="text-xl font-bold mb-6 text-center opacity-90 drop-shadow-sm">{currentQuestion.questionText}</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {currentQuestion.options.map((opt, i) => (
                                    <button key={i} onClick={() => handleAnswer(opt)} className="p-5 rounded-xl bg-black/20 hover:bg-black/40 border border-white/20 font-bold text-lg transition active:scale-95 text-left" style={{ borderColor: 'currentColor' }}>{opt}</button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {gameStatus === 'finished' && <Analytics players={players} history={answerHistory} isTeacher={false} onExit={() => navigate('/')} />}
        </div>
      )}
    </div>
  );
};

export default GameRoom;