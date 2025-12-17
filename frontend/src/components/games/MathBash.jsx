import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MathBash = () => {
  const navigate = useNavigate();
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState('+');
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(""); // Emoji feedback

  // Generate Problem
  const generateProblem = () => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const n1 = Math.floor(Math.random() * 12) + 1;
    const n2 = Math.floor(Math.random() * 12) + 1;
    
    setNum1(n1);
    setNum2(n2);
    setOperator(op);
    setAnswer('');
  };

  useEffect(() => {
    generateProblem();
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    let correctAnswer;
    switch(operator) {
      case '+': correctAnswer = num1 + num2; break;
      case '-': correctAnswer = num1 - num2; break;
      case '*': correctAnswer = num1 * num2; break;
      default: correctAnswer = 0;
    }

    if (parseInt(answer) === correctAnswer) {
      setScore(score + 10);
      setFeedback("✅");
      generateProblem();
    } else {
      setScore(Math.max(0, score - 5)); // Penalty
      setFeedback("❌");
      setAnswer('');
    }
    
    // Clear feedback after 500ms
    setTimeout(() => setFeedback(""), 500);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <button onClick={() => navigate('/solo')} className="absolute top-6 left-6 bg-gray-800 px-4 py-2 rounded-lg">⬅ Exit</button>
      
      {!gameOver ? (
        <div className="bg-gray-800 p-10 rounded-3xl shadow-2xl text-center w-full max-w-lg border border-gray-700 relative">
          <div className="flex justify-between mb-8 text-xl font-bold text-gray-400">
            <span>⏰ {timeLeft}s</span>
            <span>🏆 {score}</span>
          </div>

          <div className="text-8xl font-bold mb-8 font-mono tracking-widest relative">
            {num1} {operator} {num2}
            {feedback && <span className="absolute -right-12 top-2 text-4xl animate-bounce">{feedback}</span>}
          </div>

          <form onSubmit={handleSubmit}>
            <input 
              type="number" 
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full bg-gray-700 text-center text-4xl p-4 rounded-xl text-white outline-none focus:ring-4 focus:ring-blue-500 mb-4 font-bold"
              placeholder="?"
              autoFocus
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold text-xl transition">
              Submit Answer 🚀
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-gray-800 p-10 rounded-3xl text-center animate-scale-in">
          <h2 className="text-4xl font-bold mb-4">Time's Up! ⏰</h2>
          <p className="text-gray-400 mb-6">Your Final Score</p>
          <div className="text-8xl font-bold text-blue-400 mb-8">{score}</div>
          <button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-xl font-bold text-xl">
            Play Again 🔄
          </button>
        </div>
      )}
    </div>
  );
};

export default MathBash;