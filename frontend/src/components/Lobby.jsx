import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast'; // ✅ Added Toaster
import { User, Hash, ArrowRight, Zap, Gamepad2 } from 'lucide-react';
import Navbar from './Navbar'; // Kept import as requested

const Lobby = () => {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    // ✅ VALIDATION TOASTERS
    if (!playerName.trim()) {
        return toast.error("Please pick a nickname!", { icon: '👤' });
    }
    if (!roomCode.trim()) {
        return toast.error("Enter a valid Room Code!", { icon: '🔢' });
    }

    // Success Feedback
    toast.loading("Connecting to game...", { duration: 2000 });

    // Navigate to GameRoom as a Player
    // Added slight delay for the toast to be seen
    setTimeout(() => {
        navigate(`/game/${roomCode.toUpperCase()}`, { state: { role: 'player', name: playerName } });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-indigo-500/30 font-sans">
      
      {/* Background Decor (Subtle & Professional) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
         {/* Subtle Grid Pattern */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="z-10 w-full max-w-md flex flex-col items-center">
        
        {/* LOGO HEADER */}
        <div className="text-center mb-8 animate-fade-in-down">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/20 backdrop-blur-md">
                <Gamepad2 size={32} className="text-indigo-400" />
            </div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-tight mb-2">
                QuizGenie
            </h1>
            <p className="text-slate-400 text-lg font-medium">Ready to play?</p>
        </div>

        {/* --- MAIN CARD --- */}
        <div className="w-full bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          
          {/* Top Gradient Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70"></div>

          {/* Avatar Preview Section */}
          <div className="mb-8 flex flex-col items-center">
             <div className="relative">
                 <div className="w-28 h-28 rounded-full border-4 border-slate-800 bg-slate-950 shadow-xl overflow-hidden relative z-10 transition-transform duration-300 hover:scale-105">
                    <img 
                        src={`https://api.dicebear.com/9.x/notionists/svg?seed=${playerName || "guest"}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                    />
                 </div>
                 {/* Glow behind avatar */}
                 <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full -z-10 scale-150 animate-pulse"></div>
             </div>
             <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">Your Avatar</p>
          </div>

          <div className="space-y-5">
            
            {/* INPUT: Nickname */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">Nickname</label>
                <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors">
                        <User size={20} />
                    </div>
                    <input 
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 p-4 pl-12 rounded-xl text-white outline-none transition-all font-bold text-lg placeholder-slate-700 shadow-inner focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={15}
                    />
                </div>
            </div>

            {/* INPUT: Room Code */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">Game PIN</label>
                <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-purple-400 transition-colors">
                        <Hash size={20} />
                    </div>
                    <input 
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 p-4 pl-12 rounded-xl text-white uppercase outline-none transition-all font-mono font-black text-xl tracking-[0.15em] placeholder-slate-700 shadow-inner focus:ring-2 focus:ring-purple-500/20"
                        placeholder="0000"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        maxLength={6}
                    />
                </div>
            </div>

            {/* ACTION BUTTON */}
            <button 
              onClick={handleJoinRoom}
              className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 py-4 rounded-xl font-black text-xl text-white shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group/btn relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                  Join Adventure <ArrowRight size={24} className="group-hover/btn:translate-x-1 transition-transform"/>
              </span>
              {/* Button Shine Effect */}
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 rounded-xl"></div>
            </button>

          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">Are you a teacher?</p>
            <button onClick={() => navigate('/login')} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors text-sm flex items-center gap-1 mx-auto mt-1">
                Host a Game <Zap size={14} className="fill-current"/>
            </button>
        </div>

      </div>
    </div>
  );
};

export default Lobby;