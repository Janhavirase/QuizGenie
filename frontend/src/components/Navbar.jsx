import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to highlight active tab
  // Updated to use white/10 for a subtle highlight on black
  const isActive = (path) => location.pathname === path 
    ? "bg-white/10 text-white border border-white/10" 
    : "text-gray-400 hover:text-white hover:bg-white/5";

  return (
    // 🎨 CHANGED: bg-gray-900 -> bg-black/40 + backdrop-blur-xl
    // This makes it blend perfectly with the black background
    <nav className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full flex justify-between items-center px-6">
        
        {/* LOGO */}
        <Link to="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 tracking-wide hover:opacity-80 transition">
          QuizGenie 🧞‍♂️
        </Link>

        {/* NAVIGATION LINKS */}
        {/* Changed container to be subtle black/transparent */}
        <div className="hidden md:flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
          <Link to="/" className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${isActive("/")}`}>
            🎮 Live Game
          </Link>
          <Link to="/solo" className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${isActive("/solo")}`}>
            🧠 Solo Learn
          </Link>
        </div>

        {/* ACTION BUTTON */}
        <button 
          onClick={() => navigate('/teacher')} 
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-105 active:scale-95 transition-all duration-200 px-5 py-2.5 rounded-full font-bold text-white shadow-lg shadow-purple-500/20 text-sm border border-white/10"
        >
          <PlusCircle size={18} />
          <span>Create Room</span>
        </button>

      </div>
    </nav>
  );
};

export default Navbar;