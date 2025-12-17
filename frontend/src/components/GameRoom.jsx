import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react'; 
import { socket } from '../socket'; 
import { playSound, stopSound } from '../utils/sounds'; 
// ✅ Import the new Analytics component
import Analytics from './Analytics'; 
import { Users, ArrowRight, Cat, Heart, HelpCircle, ThumbsUp, ThumbsDown } from 'lucide-react'; 

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
  const hasPreloadedQuestions = location.state?.hasQuestions;

  // --- STATE ---
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [topic, setTopic] = useState(""); 
  const [gameStatus, setGameStatus] = useState("lobby"); 
  const [hasAnswered, setHasAnswered] = useState(false);
  const [stats, setStats] = useState({}); 
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  
  // ✅ NEW: Track Student History for Review
  const [answerHistory, setAnswerHistory] = useState([]);

  // Survey Logic
  const isSurvey = currentQuestion && (currentQuestion.type !== 'mcq' || !currentQuestion.correctAnswer);

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

    return () => {
        socket.off("reaction_received", handleEmoji);
    };
  }, []); 

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
        if (question.type === 'mcq' && question.correctAnswer) playSound("tick");
    };

    const onUpdateStats = (newStats) => setStats(newStats);

    const onShowResult = () => {
        stopSound("tick");
        if (!isSurvey) playSound("correct"); 
    };

    const onGameOver = () => {
        setGameStatus("finished");
        stopSound("tick");
        playSound("win");
    };

    socket.on("update_players", onUpdatePlayers);
    socket.on("new_question", onNewQuestion);
    socket.on("update_stats", onUpdateStats);
    socket.on("show_result", onShowResult);
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
        socket.off("show_result", onShowResult);
        socket.off("game_over", onGameOver);
        stopSound("tick");
    };
  }, [activeRoomId, name, isTeacher, isSurvey]);

  const handleNext = () => socket.emit("next_question", { roomId: activeRoomId });

  const handleAnswer = (answerValue) => {
    if (hasAnswered || isTeacher) return;
    if (!answerValue) return;
    
    setHasAnswered(true);
    socket.emit("submit_answer", { roomId: activeRoomId, playerName: name, answer: answerValue });

    // ✅ NEW: Record answer locally for the "Review" tab
    if (currentQuestion && currentQuestion.type !== 'info') {
        const isCorrect = currentQuestion.correctAnswer === answerValue;
        setAnswerHistory(prev => [...prev, {
            question: currentQuestion.questionText,
            myAnswer: answerValue,
            correctAnswer: currentQuestion.correctAnswer,
            isCorrect: isCorrect,
            type: currentQuestion.type
        }]);
    }
  };

  const handleReaction = (reactionId) => {
      socket.emit('send_reaction', { roomCode: activeRoomId, reactionId });
  };

  const HOST_URL = window.location.protocol + "//" + window.location.host; 

  // ==========================================
  // RENDERERS
  // ==========================================

  const renderInfoSlide = () => {
    if (currentQuestion.layout === 'title') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in-up px-10">
                <h1 className="text-7xl font-extrabold mb-8 text-white drop-shadow-2xl leading-tight">
                    {currentQuestion.questionText}
                </h1>
                <div className="w-32 h-2 bg-blue-500 mb-8 rounded-full"></div>
                <p className="text-3xl opacity-90 font-light max-w-4xl leading-relaxed text-blue-100">
                    {currentQuestion.options && currentQuestion.options[0]}
                </p>
            </div>
        );
    } 
    return (
        <div className="w-full max-w-5xl bg-white text-black p-16 rounded-[2rem] shadow-2xl animate-scale-up relative">
            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-[2rem]"></div>
            <h1 className="text-6xl font-bold mb-10 text-center border-b-4 border-gray-100 pb-6 text-gray-900">
                {currentQuestion.questionText}
            </h1>
            <ul className="space-y-6">
                {currentQuestion.options && currentQuestion.options.map((opt, i) => (
                    <li key={i} className="flex items-start gap-5 text-2xl font-medium text-gray-700">
                        <span className="mt-2.5 w-3 h-3 bg-blue-600 rounded-full shrink-0"></span>
                        <span className="leading-snug">{opt}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
  };

  const renderLiveBarChart = () => {
    const totalVotes = Object.values(stats).reduce((a, b) => a + (Number(b) || 0), 0);
    return (
        <div className="w-full space-y-3 mt-4">
            {currentQuestion.options.map((opt, i) => {
                const count = Number(stats[opt]) || 0;
                const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
                return (
                    <div key={i} className="relative w-full h-14 bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
                        <div className="absolute top-0 left-0 h-full bg-blue-500/50 transition-all duration-700 ease-out" style={{ width: `${percentage}%` }}></div>
                        <div className="absolute inset-0 flex items-center justify-between px-4 font-bold z-10">
                            <span className="text-lg truncate mr-2 text-white">{opt}</span>
                            <div className="flex items-center gap-2 text-sm text-white">
                                <span>{count}</span>
                                <span className="bg-black/30 px-2 py-0.5 rounded">{percentage}%</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes floatUp {
            0% { transform: translateY(0) scale(0.5); opacity: 0; }
            20% { opacity: 1; transform: translateY(-20px) scale(1.2); }
            100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
        }
        .animate-float-up { animation: floatUp 2.5s ease-out forwards; }
      `}</style>

      {/* ==========================================
          VIEW 1: TEACHER / HOST
         ========================================== */}
      {isTeacher ? (
        <div className="min-h-screen bg-black text-white flex overflow-hidden relative">
            
            <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                {floatingEmojis.map(emoji => (
                    <div key={emoji.id} className="absolute bottom-0 text-blue-400 animate-float-up opacity-0 text-6xl font-bold drop-shadow-lg" style={{ left: emoji.left, color: 'inherit' }}>
                        {emoji.icon}
                    </div>
                ))}
            </div>

            <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col items-center p-6 shadow-2xl z-20">
                <div className="mb-6 text-center">
                    <p className="text-blue-400 font-bold text-lg mb-4">{HOST_URL}/join</p>
                    <div className="bg-white p-3 rounded-xl inline-block shadow-lg">
                        <QRCodeCanvas value={`${HOST_URL}/game/${activeRoomId}`} size={180} />
                    </div>
                </div>
                <div className="w-full bg-gray-800 rounded-xl p-4 text-center border border-gray-700 mb-6">
                    <p className="text-4xl font-mono font-bold text-white tracking-wider">{activeRoomId}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-400 bg-gray-800 px-4 py-2 rounded-full">
                    <Users size={18} /> <span className="font-bold">{players.length} Joined</span>
                </div>
                <div className="mt-auto w-full pt-6">
                      {gameStatus === 'playing' && (
                        <button onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2">
                            Next Slide <ArrowRight size={24} />
                        </button>
                      )}
                      {gameStatus === 'finished' && <button onClick={() => window.location.reload()} className="w-full bg-gray-700 py-3 rounded-xl font-bold">New Session 🔄</button>}
                </div>
            </div>

            <div className="flex-1 flex flex-col p-12 relative overflow-y-auto transition-colors duration-500" style={getThemeStyle()}>
                {gameStatus === 'lobby' && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-6">{topic || "Interactive Session"}</h1>
                        <p className="text-2xl opacity-70 mb-12">Waiting for players...</p>
                        {hasPreloadedQuestions ? (
                             <button onClick={() => socket.emit("start_game", { roomId: activeRoomId })} className="px-12 py-5 bg-green-600 hover:bg-green-500 rounded-full font-bold text-2xl shadow-xl animate-pulse text-white">Start Presentation 🚀</button>
                        ) : (
                            <div className="text-gray-500">Loading configuration...</div>
                        )}
                    </div>
                )}

                {gameStatus === 'playing' && currentQuestion && (
                    <div className="max-w-6xl mx-auto w-full flex flex-col justify-center h-full items-center z-10">
                         {currentQuestion.type !== 'info' && (
                             <h2 className="text-4xl font-extrabold mb-8 text-center drop-shadow-md">{currentQuestion.questionText}</h2>
                         )}
                         <div className={`w-full flex items-center justify-center relative ${currentQuestion.type === 'info' ? '' : 'bg-black/20 backdrop-blur-sm p-8 rounded-3xl border border-white/10 min-h-[400px] shadow-xl'}`}>
                            {currentQuestion.type === 'info' && renderInfoSlide()}
                            {(!currentQuestion.type || currentQuestion.type === 'mcq') && renderLiveBarChart()}
                         </div>
                         {currentQuestion.type !== 'info' && (
                             <div className="mt-6 text-center opacity-70 font-bold">
                                {Object.values(stats).reduce((a,b)=>a+(Number(b)||0), 0)} Responses
                            </div>
                         )}
                    </div>
                )}

                {/* ✅ REPLACED OLD LEADERBOARD WITH NEW ANALYTICS COMPONENT */}
                {gameStatus === 'finished' && (
                    <Analytics 
                        players={players} 
                        isTeacher={true} 
                        onExit={() => navigate('/teacher')} 
                    />
                )}
            </div>
        </div>

      ) : (

      /* ==========================================
         VIEW 2: STUDENT / JOINER
         ========================================== */
        <div className="min-h-screen p-6 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500" style={getThemeStyle()}>
            <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                {floatingEmojis.map(emoji => (
                    <div key={emoji.id} className="absolute bottom-0 text-blue-400 animate-float-up opacity-0 text-6xl font-bold drop-shadow-lg" style={{ left: emoji.left, color: 'inherit' }}>
                        {emoji.icon}
                    </div>
                ))}
            </div>

            {gameStatus === 'lobby' && <div className="text-center"><h1 className="text-3xl font-bold">You're in!</h1><p className="opacity-70 mt-2">Look at the big screen.</p></div>}

            {gameStatus === 'playing' && currentQuestion && (
                <div className="w-full max-w-md pb-24 relative z-10"> 
                    
                    {currentQuestion.type === 'info' ? (
                        <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-lg animate-fade-in">
                            {currentQuestion.layout === 'title' ? (
                                <div className="mb-4">✨</div>
                            ) : (
                                <HelpCircle size={40} className="mx-auto mb-4 text-blue-400"/>
                            )}
                            <h3 className="text-2xl font-bold mb-4 leading-tight">{currentQuestion.questionText}</h3>
                            {currentQuestion.layout === 'title' ? (
                                <p className="opacity-80 text-lg">{currentQuestion.options && currentQuestion.options[0]}</p>
                            ) : (
                                <div className="text-left space-y-3 bg-black/20 p-4 rounded-xl">
                                    {currentQuestion.options && currentQuestion.options.map((opt, i) => (
                                        <div key={i} className="flex gap-3 text-sm opacity-90">
                                            <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0"></span>
                                            <span>{opt}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        hasAnswered ? (
                            <div className="text-center p-8 bg-black/20 rounded-2xl border border-white/10 animate-fade-in backdrop-blur-md">
                                <div className="text-5xl mb-4">✅</div>
                                <h3 className="text-2xl font-bold">Answer Sent!</h3>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold mb-6 text-center opacity-90 drop-shadow-sm">{currentQuestion.questionText}</h3>
                                {(!currentQuestion.type || currentQuestion.type === 'mcq') && (
                                    <div className="grid grid-cols-1 gap-3">
                                        {currentQuestion.options.map((opt, i) => (
                                            <button key={i} onClick={() => handleAnswer(opt)} className="p-5 rounded-xl bg-black/20 hover:bg-black/40 border border-white/20 font-bold text-lg transition active:scale-95 text-left" style={{ borderColor: 'currentColor' }}>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )
                    )}

                    {currentQuestion?.allowedReactions && currentQuestion.allowedReactions.length > 0 && (
                        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center w-full pointer-events-none">
                            <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-full px-6 py-3 flex gap-4 shadow-2xl pointer-events-auto">
                                {currentQuestion.allowedReactions.map((rId) => (
                                    <button key={rId} onClick={() => handleReaction(rId)} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition transform hover:-translate-y-1">
                                        <div className="text-blue-400 hover:text-blue-300 transition">
                                            {REACTION_ICONS[rId] || <ThumbsUp size={24}/>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ✅ REPLACED OLD GAME OVER SCREEN WITH ANALYTICS */}
            {gameStatus === 'finished' && (
                <Analytics 
                    players={players} 
                    history={answerHistory} 
                    isTeacher={false} 
                    onExit={() => navigate('/')} 
                />
            )}
        </div>
      )}
    </>
  );
};

export default GameRoom;