import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const WORDS = ["REACT", "SOCKET", "JAVASCRIPT", "PYTHON", "DATABASE", "SERVER", "CLIENT", "NODE", "EXPRESS", "MONGO"];

const WordScramble = () => {
  const navigate = useNavigate();
  const [currentWord, setCurrentWord] = useState("");
  const [scrambled, setScrambled] = useState("");
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");

  const nextWord = () => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    const shuffled = randomWord.split('').sort(() => 0.5 - Math.random()).join('');
    setCurrentWord(randomWord);
    setScrambled(shuffled);
    setGuess("");
    setMessage("");
  };

  useEffect(() => {
    nextWord();
  }, []);

  const handleGuess = (e) => {
    e.preventDefault();
    if (guess.toUpperCase() === currentWord) {
      setScore(score + 1);
      setMessage("🎉 Correct!");
      setTimeout(nextWord, 1000);
    } else {
      setMessage("❌ Try again!");
      setScore(Math.max(0, score - 1)); // Penalty
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <button onClick={() => navigate('/solo')} className="absolute top-6 left-6 bg-gray-800 px-4 py-2 rounded-lg">⬅ Exit</button>
      
      <div className="bg-gray-800 p-10 rounded-3xl shadow-2xl text-center w-full max-w-lg border border-purple-500/30">
        <div className="text-right font-bold text-purple-400 text-xl mb-4">Score: {score}</div>
        
        <h2 className="text-xl text-gray-400 mb-2">Unscramble this word:</h2>
        <div className="text-6xl font-bold tracking-widest mb-8 font-mono text-purple-300">
            {scrambled}
        </div>

        <form onSubmit={handleGuess}>
            <input 
                type="text" 
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                className="w-full bg-gray-700 text-center text-3xl p-4 rounded-xl text-white outline-none focus:ring-4 focus:ring-purple-500 mb-4 uppercase font-bold tracking-widest"
                placeholder="TYPE HERE"
                autoFocus
            />
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 py-4 rounded-xl font-bold text-xl transition">
                Check Word ✨
            </button>
        </form>
        
        {message && <div className="mt-4 text-xl font-bold animate-pulse">{message}</div>}
      </div>
    </div>
  );
};

export default WordScramble;