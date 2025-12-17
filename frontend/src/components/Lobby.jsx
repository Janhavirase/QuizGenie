import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import Navbar from './Navbar'; // ✅ Import the new Navbar
const Lobby = () => {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    if (!playerName || !roomCode) return alert("Enter Name & Code!");
    // Navigate to GameRoom as a Player
    navigate(`/game/${roomCode.toUpperCase()}`, { state: { role: 'player', name: playerName } });
  };

  return (
    
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 overflow-hidden relative">
      
      {/* Background Decor (Optional) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
         <div className="absolute top-10 left-10 text-9xl animate-float">?</div>
         <div className="absolute bottom-20 right-20 text-9xl animate-float" style={{animationDelay: '1s'}}>!</div>
      </div>

      <div className="z-10 w-full max-w-md text-center">
        <h1 className="text-6xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 tracking-tight">
          QuizGenie
        </h1>
        <p className="text-gray-400 mb-12 text-lg">Enter a code to join the fun!</p>

        {/* --- STUDENT JOIN CARD --- */}
        <div className="bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl border border-gray-700 shadow-2xl">
          
          {/* Avatar Preview */}
          <div className="mb-6 flex justify-center">
             <img 
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${playerName || "guest"}`}
                alt="Avatar"
                className="w-24 h-24 rounded-full border-4 border-purple-500 bg-gray-800 shadow-lg"
             />
          </div>

          <div className="space-y-4">
            <input 
              className="w-full bg-gray-800 border-2 border-gray-700 p-4 rounded-xl text-white focus:border-purple-500 outline-none transition text-lg font-bold placeholder-gray-500"
              placeholder="Nickname"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <input 
              className="w-full bg-gray-800 border-2 border-gray-700 p-4 rounded-xl text-white uppercase focus:border-blue-500 outline-none transition text-lg font-bold placeholder-gray-500 tracking-widest"
              placeholder="1234"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
            />
            <button 
              onClick={handleJoinRoom}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-4 rounded-xl font-extrabold text-xl transition transform hover:scale-[1.02] shadow-xl"
            >
              🚀 Join Game
            </button>
          </div>
        </div>

      

      </div>
    </div>
  );
};

export default Lobby;