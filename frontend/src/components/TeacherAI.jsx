import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { socket } from '../socket';

const TeacherAI = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");

  const handleGenerateAndHost = async () => {
    if (!topic) return alert("Please enter a topic!");
    setLoading(true);

    try {
        // 1. Generate Questions via AI API
        const res = await axios.post('http://localhost:5000/api/ai/generate', {
            topic, amount, difficulty
        });

        if (res.data.success) {
            // 2. Create Room Code
            const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
            
            // 3. Tell Server to Create Room WITH THESE QUESTIONS
            socket.emit("create_room", { 
                roomCode, 
                topic, 
                questions: res.data.data 
            });

            // 4. Go to Game Room (Host Mode)
            // 🔧 FIX: Added 'hasQuestions: true' so GameRoom knows we are ready!
            navigate(`/game/${roomCode}`, { 
                state: { 
                    role: 'host', 
                    name: 'Teacher',
                    hasQuestions: true 
                } 
            });
        }
    } catch (error) {
        console.error(error);
        alert("AI Failed. Try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="bg-gray-800 p-8 rounded-3xl max-w-lg w-full shadow-2xl border border-purple-500/30">
        <h2 className="text-3xl font-bold mb-6 text-purple-400">🤖 AI Quiz Generator</h2>
        
        <div className="space-y-4">
            <div>
                <label className="text-sm font-bold text-gray-400">Topic</label>
                <input 
                    className="w-full bg-gray-700 p-4 rounded-xl mt-1 text-white outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. Solar System"
                    value={topic} onChange={(e) => setTopic(e.target.value)}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-bold text-gray-400">Questions</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-gray-700 p-3 rounded-xl mt-1 font-bold"/>
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-400">Difficulty</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full bg-gray-700 p-3 rounded-xl mt-1 font-bold">
                        <option>Easy</option><option>Medium</option><option>Hard</option>
                    </select>
                </div>
            </div>

            <button 
                onClick={handleGenerateAndHost}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-xl mt-4 transition shadow-lg
                ${loading ? "bg-gray-600 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-500"}`}
            >
                {loading ? "✨ Generating..." : "Launch Classroom 🚀"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherAI;