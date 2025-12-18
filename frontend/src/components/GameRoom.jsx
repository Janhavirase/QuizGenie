import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react'; 
import { socket } from '../socket'; 
import { playSound, stopSound } from '../utils/sounds'; 
import Analytics from './Analytics'; 
import { Users, ArrowRight, Trophy, Cat, Heart, HelpCircle, ThumbsUp, ThumbsDown, CheckCircle, XCircle } from 'lucide-react'; 

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
  
  // --- STATE ---
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionsList, setQuestionsList] = useState([]); // Store all Qs to detect mode
  const [topic, setTopic] = useState(""); 
  const [gameStatus, setGameStatus] = useState("lobby"); 
  const [hasAnswered, setHasAnswered] = useState(false);
  const [stats, setStats] = useState({}); 
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  
  const [answerHistory, setAnswerHistory] = useState([]);
  const [hostHistory, setHostHistory] = useState([]); 
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);

  // ✅ AUTO-DETECT MODE: If ANY question has a correct answer, it is a QUIZ.
  const isQuizMode = questionsList.some(q => q.correctAnswer && q.correctAnswer.trim() !== "");

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

  // --- 1. SOCKET LISTENERS ---
  useEffect(() => {
    socket.emit("join_room", { roomCode: activeRoomId, playerName: isTeacher ? "___HOST___" : name });

    // Helper to capture all questions for mode detection
    socket.on("room_data", (room) => {
        if(room && room.questions) setQuestionsList(room.questions);
        if(room && room.topic) setTopic(room.topic);
    });

    socket.on("update_players", (list) => setPlayers(list.filter(p => p.name !== "___HOST___").sort((a,b) => b.score - a.score)));
    
    socket.on("new_question", ({ question }) => {
        setCurrentQuestion(question);
        setGameStatus("playing");
        setHasAnswered(false);
        setStats({}); 
        setIsRevealing(false); 
        setTimeLeft(null); 
        if (question.type === 'mcq' && question.correctAnswer) playSound("tick");
    });

    socket.on("update_stats", (newStats) => setStats(newStats));
    socket.on("game_over", () => {
        setGameStatus("finished");
        stopSound("tick");
        playSound("win");
    });

    const handleEmoji = (data) => {
        setFloatingEmojis(prev => [...prev, { id: Date.now()+Math.random(), icon: REACTION_ICONS[data.reactionId] || <ThumbsUp/>, left: Math.random()*80+10+'%' }]);
    };
    socket.on("reaction_received", handleEmoji);

    return () => {
        socket.off("room_data");
        socket.off("update_players");
        socket.off("new_question");
        socket.off("update_stats");
        socket.off("game_over");
        socket.off("reaction_received");
        stopSound("tick");
    };
  }, [activeRoomId]);

  // --- 2. TIMER & REVIEW SAVING ---
  useEffect(() => {
      // Stop conditions
      if (!currentQuestion || gameStatus !== 'playing' || isRevealing || currentQuestion.type === 'info' || currentQuestion.type === 'ending') {
          if (!isRevealing) setTimeLeft(null);
          return;
      }

      if (isQuizMode) {
          const startLimit = currentQuestion.type === 'open' ? 30 : 15;
          setTimeLeft(startLimit);

          const timer = setInterval(() => {
              setTimeLeft((prev) => {
                  if (prev <= 1) {
                      clearInterval(timer);
                      setIsRevealing(true); 
                      
                      if (isTeacher) {
                          // ✅ AUTO-SAVE HISTORY (Time Up)
                          saveHostHistory();
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

  // ✅ Helper to Save History reliably
  const saveHostHistory = () => {
      if (!currentQuestion || currentQuestion.type === 'info' || currentQuestion.type === 'ending') return;
      
      setHostHistory(prevH => {
          if (prevH.some(h => h.question === currentQuestion.questionText)) return prevH;
          return [...prevH, {
              question: currentQuestion.questionText,
              correctAnswer: currentQuestion.correctAnswer,
              stats: stats 
          }];
      });
  };

  // --- ACTIONS ---
  const handleNext = () => {
      // ✅ MANUAL SAVE HISTORY (Teacher Clicked Next)
      if (isTeacher) saveHostHistory();
      socket.emit("next_question", { roomId: activeRoomId });
  };

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

  // --- RENDERERS ---
  const renderInfoSlide = () => (
      <div className="text-center p-12 animate-fade-in-up">
          {currentQuestion.type === 'ending' ? (
              <>
                  <div className="bg-green-500/20 p-6 rounded-full mb-6 border border-green-500/50 inline-block">
                      <Trophy size={80} className="text-green-400 drop-shadow-lg" />
                  </div>
                  <h1 className="text-6xl font-extrabold mb-4 text-white">
                      {isQuizMode ? "Quiz Complete!" : "Survey Complete!"}
                  </h1>
                  <p className="text-2xl opacity-80 text-blue-200">
                      {isQuizMode ? "Check the leaderboard for winners." : "Thank you for participating."}
                  </p>
              </>
          ) : (
              <>
                  <div className="mb-6">{currentQuestion.layout === 'title' ? <span className="text-6xl">✨</span> : <HelpCircle size={60} className="text-blue-400 mx-auto"/>}</div>
                  <h1 className="text-5xl font-bold mb-6 leading-tight">{currentQuestion.questionText}</h1>
                  {currentQuestion.layout === 'bullets' ? (
                      <ul className="text-left space-y-4 inline-block text-2xl bg-black/20 p-8 rounded-3xl">
                          {currentQuestion.options && currentQuestion.options.map((o,i)=><li key={i} className="flex gap-3"><span className="text-blue-500 mt-1">•</span>{o}</li>)}
                      </ul>
                  ) : <p className="text-2xl opacity-80 max-w-3xl mx-auto">{currentQuestion.options && currentQuestion.options[0]}</p>}
              </>
          )}
      </div>
  );

  const renderLiveChart = () => {
      const vizType = currentQuestion.style?.visualization || 'bar';
      const totalVotes = Object.values(stats).reduce((a, b) => a + (Number(b) || 0), 0);
      const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

      // Bar Chart
      if (vizType === 'bar') {
          return (
              <div className="w-full space-y-4 mt-6">
                  {currentQuestion.options.map((opt, i) => {
                      const count = Number(stats[opt]) || 0;
                      const pct = totalVotes === 0 ? 0 : Math.round((count/totalVotes)*100);
                      const isCorrect = isRevealing && opt === currentQuestion.correctAnswer;
                      const barColor = isCorrect ? '#10B981' : isRevealing ? '#374151' : '#3B82F6';
                      const opacity = isRevealing && !isCorrect ? 0.3 : 1;

                      return (
                          <div key={i} className="relative w-full h-16 bg-gray-800 rounded-xl overflow-hidden border border-gray-700 transition-all duration-500" style={{opacity}}>
                              <div className="absolute top-0 left-0 h-full transition-all duration-700" style={{width: `${pct}%`, backgroundColor: barColor}}></div>
                              <div className="absolute inset-0 flex items-center justify-between px-6 font-bold z-10 text-xl">
                                  <div className="flex items-center gap-3">
                                      {isCorrect && <CheckCircle className="text-green-400 fill-white"/>}
                                      <span className="truncate text-white">{opt}</span>
                                  </div>
                                  <span>{count} ({pct}%)</span>
                              </div>
                          </div>
                      );
                  })}
              </div>
          );
      }
      
      // Pie/Donut/Dots Fallback to simple list if complex render fails, but here is the logic:
      return <div className="text-center text-gray-400">Visualization: {vizType} (Use Bar for best results in Quizzes)</div>;
  };

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden relative font-sans">
      
      {/* Floating Emojis */}
      <div className="fixed inset-0 pointer-events-none z-[9999]">
          {floatingEmojis.map(e => <div key={e.id} className="absolute text-4xl animate-float-up" style={{left:e.left}}>{e.icon}</div>)}
      </div>

      {isTeacher ? (
        <>
            {/* SIDEBAR */}
            <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col items-center p-6 shadow-2xl z-20 overflow-y-auto">
                
                {/* ✅ ROOM CODE - High Visibility */}
                <div className="w-full bg-blue-600 rounded-2xl p-4 text-center shadow-lg mb-6 transform hover:scale-105 transition">
                    <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Join Code</p>
                    <p className="text-5xl font-mono font-black text-white tracking-widest">{activeRoomId}</p>
                </div>

                <div className="bg-white p-3 rounded-xl mb-6 shadow-md"><QRCodeCanvas value={`${HOST_URL}/game/${activeRoomId}`} size={160} /></div>

                <div className="flex items-center gap-2 text-gray-300 bg-gray-800 px-4 py-2 rounded-full mb-6 font-bold border border-gray-700">
                    <Users size={18} /> <span>{players.length} Joined</span>
                </div>

                {timeLeft !== null && !isRevealing && (
                    <div className="mb-6 w-full text-center">
                        <div className={`text-6xl font-black font-mono animate-pulse ${timeLeft < 5 ? 'text-red-500' : 'text-blue-400'}`}>{timeLeft}s</div>
                        <p className="text-xs text-gray-500 mt-1">Auto-advancing</p>
                    </div>
                )}
                {isRevealing && <div className="mb-6 w-full text-center bg-yellow-600/20 py-2 rounded-lg border border-yellow-500/50 text-yellow-400 font-bold">Time's Up!</div>}

                <div className="mt-auto w-full">
                    {gameStatus === 'playing' && (
                        <button onClick={handleNext} disabled={isRevealing || (isQuizMode && timeLeft !== null)} className={`w-full py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 transition flex items-center justify-center gap-2 ${isQuizMode && timeLeft !== null ? 'hidden' : ''}`}>
                            {isRevealing ? 'Loading...' : 'Next Slide'} <ArrowRight size={20}/>
                        </button>
                    )}
                    {gameStatus === 'finished' && <button onClick={() => window.location.reload()} className="w-full bg-gray-700 py-3 rounded-xl font-bold hover:bg-gray-600">Restart Session 🔄</button>}
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 p-12 flex flex-col relative" style={getThemeStyle()}>
                {gameStatus === 'lobby' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <h1 className="text-7xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{topic || "Interactive Session"}</h1>
                        <p className="text-3xl opacity-60 mb-12">Waiting for players to join...</p>
                        <button onClick={() => socket.emit("start_game", { roomId: activeRoomId })} className="px-12 py-5 bg-green-600 hover:bg-green-500 rounded-full font-bold text-2xl shadow-2xl animate-pulse text-white transform hover:scale-105 transition">Start Game 🚀</button>
                    </div>
                )}

                {gameStatus === 'playing' && currentQuestion && (
                    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl mx-auto">
                        {currentQuestion.type !== 'info' && currentQuestion.type !== 'ending' && <h2 className="text-5xl font-extrabold mb-10 text-center leading-tight drop-shadow-xl">{currentQuestion.questionText}</h2>}
                        
                        <div className={`w-full ${currentQuestion.type==='info' || currentQuestion.type==='ending' ? '' : 'bg-black/30 backdrop-blur-md p-10 rounded-[3rem] border border-white/10 shadow-2xl'}`}>
                            {(currentQuestion.type === 'info' || currentQuestion.type === 'ending') ? renderInfoSlide() : renderLiveChart()}
                        </div>
                        
                        {currentQuestion.type !== 'info' && currentQuestion.type !== 'ending' && (
                             <div className="mt-8 text-center text-xl font-bold opacity-70 bg-black/20 px-6 py-2 rounded-full inline-block">{Object.values(stats).reduce((a,b)=>a+(Number(b)||0), 0)} Responses</div>
                         )}
                    </div>
                )}

                {gameStatus === 'finished' && <Analytics players={players} hostHistory={hostHistory} isTeacher={true} onExit={() => navigate('/teacher')} />}
            </div>
        </>
      ) : (
        // STUDENT VIEW
        <div className="w-full flex flex-col items-center justify-center min-h-screen p-6 relative" style={getThemeStyle()}>
            {gameStatus === 'lobby' && <div className="text-center"><h1 className="text-4xl font-bold mb-4">You're In!</h1><p className="opacity-70 text-lg">Watch the big screen.</p></div>}
            
            {gameStatus === 'playing' && currentQuestion && (
                <div className="w-full max-w-md pb-24">
                    {/* Timer Bar */}
                    {isQuizMode && timeLeft !== null && !isRevealing && (
                        <div className="w-full mb-6">
                            <div className="flex justify-between items-end mb-1 px-1">
                                <span className="text-xs font-bold uppercase opacity-60">Time Left</span>
                                <span className={`font-mono font-bold text-xl ${timeLeft < 5 ? 'text-red-500 animate-ping' : ''}`}>{timeLeft}s</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000 ease-linear" style={{width: `${(timeLeft/15)*100}%`}}></div></div>
                        </div>
                    )}
                    
                    {currentQuestion.type === 'info' ? (
                        <div className="text-center bg-white/10 p-8 rounded-3xl border border-white/20 shadow-xl">
                            {currentQuestion.layout === 'title' && <div className="text-4xl mb-4">✨</div>}
                            <h3 className="text-2xl font-bold mb-4">{currentQuestion.questionText}</h3>
                            {currentQuestion.options && currentQuestion.options.map((o,i)=><p key={i} className="opacity-80 mb-2 text-lg">{o}</p>)}
                        </div>
                    ) : currentQuestion.type === 'ending' ? (
                        <div className="text-center bg-white/10 p-8 rounded-3xl border border-white/20 shadow-xl">
                            <Trophy size={60} className="mx-auto mb-4 text-yellow-400"/>
                            <h3 className="text-3xl font-bold">Quiz Done!</h3>
                            <p className="opacity-80 mt-2">Check the results.</p>
                        </div>
                    ) : isRevealing ? (
                        <div className="text-center animate-fade-in-up">
                            {answerHistory[answerHistory.length-1]?.isCorrect ? (
                                <div className="bg-green-500/20 border-2 border-green-500 p-8 rounded-3xl"><CheckCircle size={64} className="mx-auto text-green-400 mb-4"/><h2 className="text-3xl font-bold text-white">Correct!</h2><p className="text-green-300 mt-2 font-bold">+ Points</p></div>
                            ) : (
                                <div className="bg-red-500/20 border-2 border-red-500 p-8 rounded-3xl"><XCircle size={64} className="mx-auto text-red-400 mb-4"/><h2 className="text-3xl font-bold text-white">Wrong!</h2></div>
                            )}
                        </div>
                    ) : (
                        !hasAnswered ? (
                            <div className="grid gap-4">
                                <h3 className="text-xl font-bold mb-4 text-center">{currentQuestion.questionText}</h3>
                                {currentQuestion.options.map((o, i)=>(
                                    <button key={i} onClick={()=>handleAnswer(o)} className="p-5 bg-white/10 hover:bg-white/20 active:scale-95 transition rounded-2xl border border-white/20 font-bold text-lg text-left shadow-md">{o}</button>
                                ))}
                            </div>
                        ) : <div className="text-center p-10 bg-black/20 rounded-3xl"><div className="text-6xl mb-4">✅</div><h3 className="text-2xl font-bold">Answer Sent!</h3></div>
                    )}
                </div>
            )}
            
            {/* Reaction Bar */}
            {currentQuestion?.allowedReactions && !isRevealing && currentQuestion.type !== 'ending' && (
                <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-full px-6 py-3 flex gap-6 shadow-2xl pointer-events-auto">
                        {currentQuestion.allowedReactions.map(r => <button key={r} onClick={()=>handleReaction(r)} className="text-2xl hover:scale-125 transition">{REACTION_ICONS[r] || <ThumbsUp/>}</button>)}
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