import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, LogOut, User, LogIn, MonitorPlay, BrainCircuit } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); 

  const isActive = (path) => location.pathname === path 
    ? "bg-white/10 text-white border border-white/10" 
    : "text-gray-400 hover:text-white hover:bg-white/5";

  // Hide button if already inside a workspace (Game, Creator, or Dashboard)
  const isWorkspace = ['/teacher', '/create-quiz', '/create-survey', '/game/'].some(path => location.pathname.startsWith(path));

  const handleCreateRoom = () => {
      if (user) {
          // If logged in -> Go to Dashboard
          navigate('/teacher');
      } else {
          // If guest -> Go to Login, but remember to redirect to /teacher after
          navigate('/login', { state: { from: { pathname: '/teacher' } } });
      }
  };

  const handleLogout = () => {
      logout();
      navigate('/');
  };

  return (
   <nav className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-50">

      <div className="max-w-7xl mx-auto h-full flex justify-between items-center px-6">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-lg shadow-lg group-hover:shadow-purple-500/30 transition-all">
                🧞‍♂️
            </div>
            <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight">
                QuizGenie
            </span>
        </Link>

        {/* CENTER LINKS (Navigation) */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          <Link to="/" className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${isActive("/")}`}>
            <MonitorPlay size={16}/> Live Game
          </Link>
          <Link to="/solo" className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${isActive("/solo")}`}>
            <BrainCircuit size={16}/> Solo Learn
          </Link>
        </div>

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-4">
            
            {/* 🚀 THE PROFESSIONAL CTA BUTTON */}
            {!isWorkspace && (
                <button 
                    onClick={handleCreateRoom} 
                    className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-purple-900/20 transition-all transform hover:scale-105 active:scale-95"
                >
                    <Plus size={18} />
                    <span>Create Room</span>
                </button>
            )}

            {user ? (
                /* --- LOGGED IN VIEW --- */
                <div className="flex items-center gap-3 pl-3 border-l border-gray-700">
                    <div className="flex flex-col text-right hidden lg:block">
                        <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Teacher</span>
                        <span className="text-sm font-bold text-white leading-none">{user.name}</span>
                    </div>
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold border border-gray-600">
                        {user.name.charAt(0)}
                    </div>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition p-2 hover:bg-white/5 rounded-lg" title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            ) : (
                /* --- GUEST VIEW --- */
                <div className="flex items-center gap-2">
                    <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-white transition px-3 py-2">
                        Log in
                    </Link>
                    <Link to="/register" className="sm:hidden bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                        Sign Up
                    </Link>
                </div>
            )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;