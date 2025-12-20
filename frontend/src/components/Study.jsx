import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Volume2, VolumeX, FileDown, 
    RefreshCcw, Award, ChevronRight, AlertCircle 
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';
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

    // ✅ STEP 1: NORMALIZE DATA (Fix Variable Names)
    const normalizedQuestions = rawQuestions.map(q => {
        // Fix: Explicitly look for 'questionText' first based on your logs
        const qText = q.questionText || q.question || q.text || "Question Text Missing";
        
        // Fix: Look for 'correctAnswer' based on your logs
        const qAnswer = q.correctAnswer || q.answer || "";

        // Fix: Ensure options exist
        const qOptions = Array.isArray(q.options) ? q.options : [];

        return {
            question: qText,
            options: qOptions,
            answer: qAnswer,
            type: q.type || 'unknown' // Keep track of type
        };
    });
const saveResult = async () => {
        if (!user || !user.id) return; // Don't save for guests

        try {
            await fetch('http://localhost:5000/api/results', {
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
        } catch (error) {
            console.error("Failed to save score");
        }
    };
    // ✅ STEP 2: STRICT FILTERING (Remove Info/Ending Slides)
    // We only want to play slides that are MCQ or True/False
    const playableQuestions = normalizedQuestions.filter(q => {
        // Exclude Info and Ending slides
        if (q.type === 'info' || q.type === 'ending' || q.type === 'title') return false;

        // Must have text, options, and an answer to be playable
        const hasText = q.question && q.question !== "Question Text Missing";
        const hasOptions = q.options.length > 1; // Need at least 2 choices
        const hasAnswer = q.answer && q.answer.trim() !== "";

        return hasText && hasOptions && hasAnswer;
    });

    console.log("✅ Final Playable Questions:", playableQuestions);

    setQuizData(playableQuestions);
    setLoading(false);
    
    return () => window.speechSynthesis.cancel();
  }, [location.state]);

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
    doc.setTextColor(41, 128, 185);
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
  };

  const handleAnswer = (selectedOption) => {
    const currentQ = quizData[currentIndex];
    
    // Strict match (Trim whitespace)
    if (selectedOption.trim() === currentQ.answer.trim()) {
        setScore(prev => prev + 1);
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const nextQ = currentIndex + 1;
    if (nextQ < quizData.length) {
        setCurrentIndex(nextQ);
    } else {
        setShowScore(true);
        saveResult();
    }
  };

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">Loading Quiz...</div>;
  
  if (quizData.length === 0) return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle size={48} className="text-red-500 mb-4"/>
          <h2 className="text-2xl font-bold mb-2">No Playable Questions Found</h2>
          <p className="text-gray-400 mb-6 max-w-md">
            The quiz slides you created (Info, Rules, Ending) are not meant for the Quiz Player mode.
            <br/><span className="text-xs text-gray-500">Only MCQ and True/False slides are shown here.</span>
          </p>
          <button onClick={() => navigate('/profile')} className="px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20">Back to Library</button>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* Background Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Progress Bar */}
        {!showScore && (
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-800 z-50">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                    style={{ width: `${((currentIndex + 1) / quizData.length) * 100}%` }}
                />
            </div>
        )}

        {/* MAIN CARD */}
        <div className="w-full max-w-3xl bg-[#18181b]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative z-10">
            
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                <button 
                    onClick={() => navigate('/profile')} 
                    className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition"
                >
                    <ArrowLeft size={24} />
                </button>
                
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold tracking-wide text-gray-200 uppercase truncate max-w-[200px]">{originalTitle}</h1>
                    {!showScore && (
                        <span className="text-xs font-bold text-gray-500 tracking-widest mt-1">
                            Q{currentIndex + 1} of {quizData.length}
                        </span>
                    )}
                </div>

                <button 
                    onClick={downloadPDF}
                    className="p-2 -mr-2 text-blue-400 hover:text-white hover:bg-blue-600 rounded-full transition"
                    title="Download PDF"
                >
                    <FileDown size={24}/>
                </button>
            </div>

            {!showScore ? (
                <div key={currentIndex} className="animate-in slide-in-from-right-8 fade-in duration-300">
                    
                    {/* Question */}
                    <div className="mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold leading-tight text-white mb-4">
                            {quizData[currentIndex].question}
                        </h2>
                        
                        <button 
                            onClick={() => speak(quizData[currentIndex].question)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all border ${
                                isSpeaking 
                                ? "bg-blue-500/20 text-blue-400 border-blue-500/50" 
                                : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                            }`}
                        >
                            {isSpeaking ? <VolumeX size={14} className="animate-pulse"/> : <Volume2 size={14}/>}
                            {isSpeaking ? "LISTENING..." : "READ ALOUD"}
                        </button>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 gap-3">
                        {quizData[currentIndex].options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswer(option)}
                                className="group w-full text-left p-5 rounded-xl bg-black/20 border border-white/10 hover:bg-blue-600 hover:border-blue-500 transition-all duration-200 flex items-center justify-between overflow-hidden"
                            >
                                <span className="font-medium text-lg text-gray-300 group-hover:text-white transition">
                                    {option}
                                </span>
                                <span className="p-2 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight size={16} className="text-white"/>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 animate-in zoom-in duration-500">
                    <div className="w-32 h-32 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(234,179,8,0.3)]">
                        <Award size={64} className="text-white drop-shadow-md"/>
                    </div>
                    
                    <h2 className="text-4xl font-bold text-white mb-2">Quiz Complete!</h2>
                    <p className="text-gray-400 text-lg mb-8">
                        You scored <strong className="text-white text-2xl">{score}</strong> out of <strong className="text-white text-2xl">{quizData.length}</strong>
                    </p>

                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                        <button 
                            onClick={() => {
                                setShowScore(false);
                                setCurrentIndex(0);
                                setScore(0);
                            }}
                            className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 transition"
                        >
                            <RefreshCcw size={18}/> Retry
                        </button>
                        <button 
                            onClick={() => navigate('/profile')}
                            className="flex items-center justify-center gap-2 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-bold transition shadow-lg shadow-white/10"
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