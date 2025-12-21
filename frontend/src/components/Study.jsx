import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Volume2, VolumeX, FileDown, 
    RefreshCcw, Award, ChevronRight, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast'; // ✅ Added Toaster

const Study = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [quizData, setQuizData] = useState([]); 
  const [originalTitle, setOriginalTitle] = useState("Untitled Quiz");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- 🛠️ ROBUST DATA LOADING ---
  useEffect(() => {
    if (!location.state || !location.state.questions) {
        setLoading(false);
        return;
    }

    const rawQuestions = location.state.questions || [];
    setOriginalTitle(location.state.title || "Untitled Quiz");

    console.log("🔍 Raw Input Data:", rawQuestions);

    // ✅ STEP 1: NORMALIZE DATA
    const normalizedQuestions = rawQuestions.map(q => {
        const qText = q.questionText || q.question || q.text || "Question Text Missing";
        const qAnswer = q.correctAnswer || q.answer || "";
        const qOptions = Array.isArray(q.options) ? q.options : [];

        return {
            question: qText,
            options: qOptions,
            answer: qAnswer,
            type: q.type || 'unknown'
        };
    });

    // ✅ STEP 2: STRICT FILTERING
    const playableQuestions = normalizedQuestions.filter(q => {
        if (q.type === 'info' || q.type === 'ending' || q.type === 'title') return false;
        
        const hasText = q.question && q.question !== "Question Text Missing";
        const hasOptions = q.options.length > 1; 
        const hasAnswer = q.answer && q.answer.trim() !== "";

        return hasText && hasOptions && hasAnswer;
    });

    console.log("✅ Final Playable Questions:", playableQuestions);

    setQuizData(playableQuestions);
    setLoading(false);
    
    return () => window.speechSynthesis.cancel();
  }, [location.state]);

  // --- SAVE RESULT FUNCTION ---
  const saveResult = async () => {
    if (!user || !user.id) return; // Don't save for guests

    try {
        await fetch('https://quizgenie-22xy.onrender.com/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                quizTitle: originalTitle,
                score: score,
                totalQuestions: quizData.length
            })
        });
        console.log("✅ Score saved to database!");
        toast.success("Progress saved!");
    } catch (error) {
        console.error("Failed to save score");
        toast.error("Could not save progress (Offline?)");
    }
  };

  // --- 🔊 AUDIO ENGINE ---
  const speak = (text) => {
    window.speechSynthesis.cancel();
    if (isSpeaking) {
        setIsSpeaking(false);
        return;
    }
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1; 
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // --- 📄 PDF EXPORT ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo color
    doc.text(originalTitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;
    doc.setDrawColor(200);
    doc.line(20, yPos - 5, pageWidth - 20, yPos - 5);

    quizData.forEach((q, index) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0);
        
        const questionText = `${index + 1}. ${q.question}`;
        const splitText = doc.splitTextToSize(questionText, 170);
        doc.text(splitText, 20, yPos);
        yPos += (splitText.length * 7) + 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(80);

        q.options.forEach((opt, i) => {
            doc.text(`   ${String.fromCharCode(97 + i)}) ${opt}`, 20, yPos);
            yPos += 6;
        });
        yPos += 10;
    });

    doc.save(`${originalTitle}_Exam.pdf`);
    toast.success("PDF Downloaded!", { icon: '📄' });
  };

  const handleAnswer = (selectedOption) => {
    const currentQ = quizData[currentIndex];
    
    // Strict match (Trim whitespace)
    if (selectedOption.trim() === currentQ.answer.trim()) {
        setScore(prev => prev + 1);
        toast.success("Correct!", { duration: 1000, icon: '🎉', position: 'top-center', style: { background: '#10B981', color: '#fff' } });
    } else {
        toast.error("Incorrect", { duration: 1000, icon: '❌', position: 'top-center' });
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const nextQ = currentIndex + 1;
    if (nextQ < quizData.length) {
        setTimeout(() => setCurrentIndex(nextQ), 300); // Slight delay for feedback
    } else {
        setShowScore(true);
        saveResult();
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
            Loading Quiz...
        </div>
    </div>
  );
  
  if (quizData.length === 0) return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl max-w-md">
            <AlertCircle size={64} className="text-indigo-500 mb-6 mx-auto"/>
            <h2 className="text-2xl font-bold mb-2">No Playable Questions</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              This quiz seems to only contain Info Slides or Rules. <br/>
              Add some <strong>Multiple Choice</strong> questions to play!
            </p>
            <button onClick={() => navigate('/profile')} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition">
                Return to Library
            </button>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500/30">
        
        {/* Background Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Progress Bar (Fixed Top) */}
        {!showScore && (
            <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-900 z-50">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{ width: `${((currentIndex + 1) / quizData.length) * 100}%` }}
                />
            </div>
        )}

        {/* MAIN CARD */}
        <div className="w-full max-w-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-6 md:p-10 shadow-2xl relative z-10 transition-all duration-300">
            
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
                <button 
                    onClick={() => navigate('/profile')} 
                    className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition"
                    title="Exit Quiz"
                >
                    <ArrowLeft size={24} />
                </button>
                
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold tracking-wide text-white uppercase truncate max-w-[200px]">{originalTitle}</h1>
                    {!showScore && (
                        <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mt-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            QUESTION {currentIndex + 1} / {quizData.length}
                        </span>
                    )}
                </div>

                <button 
                    onClick={downloadPDF}
                    className="p-2 -mr-2 text-indigo-400 hover:text-white hover:bg-indigo-600 rounded-full transition"
                    title="Download as PDF"
                >
                    <FileDown size={24}/>
                </button>
            </div>

            {!showScore ? (
                <div key={currentIndex} className="animate-in fade-in zoom-in-95 duration-300">
                    
                    {/* Question */}
                    <div className="mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold leading-tight text-white mb-6 drop-shadow-sm">
                            {quizData[currentIndex].question}
                        </h2>
                        
                        <button 
                            onClick={() => speak(quizData[currentIndex].question)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all border ${
                                isSpeaking 
                                ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/50 animate-pulse" 
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white"
                            }`}
                        >
                            {isSpeaking ? <VolumeX size={14}/> : <Volume2 size={14}/>}
                            {isSpeaking ? "LISTENING..." : "READ ALOUD"}
                        </button>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {quizData[currentIndex].options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswer(option)}
                                className="group w-full text-left p-5 rounded-2xl bg-slate-950/50 border border-slate-800 hover:bg-indigo-600 hover:border-indigo-500 transition-all duration-200 flex items-center justify-between overflow-hidden shadow-sm hover:shadow-indigo-500/20 active:scale-[0.99]"
                            >
                                <span className="font-medium text-lg text-slate-300 group-hover:text-white transition">
                                    {option}
                                </span>
                                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center opacity-50 group-hover:opacity-100 group-hover:bg-white/20 group-hover:border-transparent transition">
                                    <ChevronRight size={16} className="text-slate-400 group-hover:text-white"/>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 animate-in zoom-in duration-500">
                    <div className="relative inline-block mb-10">
                        <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20 rounded-full"></div>
                        <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center relative shadow-xl border-4 border-slate-900">
                            <Award size={64} className="text-white drop-shadow-md"/>
                        </div>
                        {score === quizData.length && (
                            <div className="absolute -top-2 -right-6 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-slate-900 transform rotate-12 shadow-lg">
                                PERFECT!
                            </div>
                        )}
                    </div>
                    
                    <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Session Complete!</h2>
                    <p className="text-slate-400 text-lg mb-10">
                        You scored <strong className="text-white text-2xl mx-1">{score}</strong> out of <strong className="text-white text-2xl mx-1">{quizData.length}</strong>
                    </p>

                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                        <button 
                            onClick={() => {
                                setShowScore(false);
                                setCurrentIndex(0);
                                setScore(0);
                            }}
                            className="flex items-center justify-center gap-2 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-700 transition"
                        >
                            <RefreshCcw size={18}/> Retry
                        </button>
                        <button 
                            onClick={() => navigate('/profile')}
                            className="flex items-center justify-center gap-2 py-3.5 bg-white text-slate-950 hover:bg-slate-200 rounded-xl font-bold transition shadow-lg shadow-white/10"
                        >
                            Finish
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default Study;