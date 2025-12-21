import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const FlashcardMode = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- 1. GAME STATE ---
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  // Interaction State
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // --- 2. SETTINGS STATE ---
  const [topic, setTopic] = useState("");
  const [amount, setAmount] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");
  const [type, setType] = useState("MCQ");
  const [loading, setLoading] = useState(false);

  // --- 3. GENERATE QUIZ ---
  const generateQuiz = async () => {
    if (!topic.trim()) return alert("Please enter a topic!");
    setLoading(true);
    try {
      const res = await axios.post('https://quizgenie-22xy.onrender.com/api/ai/generate', {
        topic, difficulty, amount, type
      });
      if (res.data.success) {
        setQuestions(res.data.data);
        // Reset Game State
        setCurrentQIndex(0);
        setScore(0);
        setShowResult(false);
        setIsAnswered(false);
        setSelectedOption(null);
      }
    } catch (error) {
      alert("AI Error. Is Backend running?");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. HANDLE ANSWER CLICK ---
  const handleAnswerClick = (option) => {
    if (isAnswered) return; // Prevent double clicking

    const currentQuestion = questions[currentQIndex];
    const isCorrect = option === currentQuestion.correctAnswer;

    if (isCorrect) {
      setScore(score + 1);
    }

    setSelectedOption(option);
    setIsAnswered(true);
  };

  // --- 5. NEXT QUESTION ---
  const handleNext = () => {
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex(currentQIndex + 1);
      setIsAnswered(false);
      setSelectedOption(null);
    } else {
      setShowResult(true);
    }
  };

  // --- 6. RESTART ---
  const restart = () => {
    setQuestions([]);
    setTopic("");
    setShowResult(false);
    setScore(0);
    setCurrentQIndex(0);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">
      
      {/* HEADER */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-yellow-500">
          🧠 Solo Practice
        </h1>
        <button onClick={() => navigate('/solo')} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-bold">
          Exit 🚪
        </button>
      </div>

      {/* --- SCENE 1: SETUP FORM (Show if no questions yet) --- */}
      {questions.length === 0 && (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 text-center">Customize Your Quiz 🛠️</h2>
          
          <div className="space-y-6">
            <div>
                <label className="block text-gray-400 mb-2 font-bold">Topic</label>
                <input 
                    type="text" placeholder="e.g. Python Lists, World War II"
                    className="w-full bg-gray-700 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-pink-500 text-lg"
                    value={topic} onChange={(e) => setTopic(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-gray-400 mb-2 font-bold">Count</label>
                    <input type="number" min="1" max="20" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-gray-700 p-3 rounded-xl font-bold"/>
                </div>
                <div>
                    <label className="block text-gray-400 mb-2 font-bold">Difficulty</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full bg-gray-700 p-3 rounded-xl font-bold cursor-pointer">
                        <option>Easy</option><option>Medium</option><option>Hard</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-400 mb-2 font-bold">Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-700 p-3 rounded-xl font-bold cursor-pointer">
                        <option value="MCQ">MCQ</option><option value="True/False">True/False</option>
                    </select>
                </div>
            </div>

            <button 
                onClick={generateQuiz} disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-xl transition transform hover:scale-105 shadow-lg mt-4
                ${loading ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500"}`}
            >
                {loading ? "✨ AI is Thinking..." : "Start Quiz 🚀"}
            </button>
          </div>
        </div>
      )}

      {/* --- SCENE 2: PLAYING QUIZ --- */}
      {questions.length > 0 && !showResult && (
        <div className="w-full max-w-3xl">
            {/* Progress Bar */}
            <div className="mb-6 flex justify-between text-gray-400 text-sm font-bold uppercase tracking-widest">
                <span>Question {currentQIndex + 1} / {questions.length}</span>
                <span>Score: {score}</span>
            </div>
            <div className="w-full bg-gray-700 h-2 rounded-full mb-8">
                <div className="bg-pink-500 h-2 rounded-full transition-all duration-500" style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}></div>
            </div>

            {/* Question Card */}
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 min-h-[200px] flex items-center justify-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-center leading-tight">
                    {questions[currentQIndex].questionText}
                </h2>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions[currentQIndex].options.map((opt, i) => {
                    // Logic for Colors
                    let btnClass = "bg-gray-700 hover:bg-gray-600 border-gray-600"; // Default
                    
                    if (isAnswered) {
                        if (opt === questions[currentQIndex].correctAnswer) {
                            btnClass = "bg-green-600 border-green-500 text-white"; // Correct
                        } else if (opt === selectedOption) {
                            btnClass = "bg-red-600 border-red-500 text-white"; // Wrong Choice
                        } else {
                            btnClass = "bg-gray-700 opacity-50"; // Not chosen
                        }
                    }

                    return (
                        <button 
                            key={i}
                            onClick={() => handleAnswerClick(opt)}
                            disabled={isAnswered}
                            className={`p-6 rounded-xl text-lg font-bold border-2 transition-all duration-200 transform ${!isAnswered && "hover:scale-105 active:scale-95"} ${btnClass}`}
                        >
                            {opt}
                        </button>
                    )
                })}
            </div>

            {/* Next Button (Shows after answering) */}
            {isAnswered && (
                <div className="flex justify-center mt-8 animate-bounce-in">
                    <button 
                        onClick={handleNext}
                        className="bg-white text-gray-900 px-10 py-3 rounded-full font-bold text-xl hover:bg-gray-200 transition shadow-xl"
                    >
                        {currentQIndex + 1 === questions.length ? "Finish Quiz 🏁" : "Next Question ➡️"}
                    </button>
                </div>
            )}
        </div>
      )}

      {/* --- SCENE 3: RESULTS --- */}
      {showResult && (
        <div className="bg-gray-800 p-10 rounded-3xl shadow-2xl text-center border border-gray-700 max-w-lg w-full animate-scale-in">
            <h2 className="text-4xl font-bold mb-4">Quiz Completed! 🎉</h2>
            <div className="text-8xl mb-6">
                {score / questions.length > 0.7 ? "🏆" : score / questions.length > 0.4 ? "🤔" : "📚"}
            </div>
            
            <p className="text-gray-400 text-lg mb-2">Your Score</p>
            <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-8">
                {score} / {questions.length}
            </h1>

            <div className="flex flex-col gap-3">
                <button onClick={() => { setQuestions([]); setShowResult(false); }} className="bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-bold text-lg text-white">
                    Try Another Topic 🔄
                </button>
                <button onClick={() => navigate('/solo')} className="bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-bold text-lg text-gray-300">
                    Back to Hub 🏠
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

export default FlashcardMode;