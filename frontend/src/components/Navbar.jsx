import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    Plus, LogOut, User, MonitorPlay, BrainCircuit, 
    ChevronDown, LayoutDashboard, Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // --- DROPDOWN STATE ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- CLICK OUTSIDE TO CLOSE MENU ---
  useEffect(() => {
    function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // --- NAVIGATION HELPERS ---
  const isActive = (path) => location.pathname === path 
    ? "bg-indigo-600/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border-transparent";

  const isWorkspace = ['/teacher', '/create-quiz', '/create-survey', '/game/'].some(path => location.pathname.startsWith(path));

  const handleCreateRoom = () => {
      if (user) {
          navigate('/teacher');
      } else {
          navigate('/login', { state: { from: { pathname: '/teacher' } } });
      }
  };

  const handleLogout = () => {
      logout();
      setIsDropdownOpen(false);
      navigate('/');
  };

  return (
   // ✅ GLASSMORPHISM HEADER
   <nav className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-[100] transition-all duration-300">

      <div className="max-w-7xl mx-auto h-16 flex justify-between items-center px-6">
        
        {/* LEFT: LOGO */}
        <Link to="/" className="flex items-center gap-3 group relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300 relative z-10">
                <Sparkles size={18} className="text-white fill-white/20"/>
            </div>
            <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-white tracking-tight relative z-10">
                QuizGenie
            </span>
        </Link>

        {/* CENTER: LINKS (Desktop) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1.5 rounded-full border border-slate-800/50 backdrop-blur-sm">
          <Link to="/" className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 border ${isActive("/")}`}>
            <MonitorPlay size={16} className={location.pathname === "/" ? "fill-current" : ""}/> Live Game
          </Link>
          <Link to="/solo" className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 border ${isActive("/solo")}`}>
            <BrainCircuit size={16} className={location.pathname === "/solo" ? "fill-current" : ""}/> Solo Learn
          </Link>
        </div>

        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-4">
            
            {/* CREATE ROOM BUTTON (Gradient Shine) */}
            {!isWorkspace && (
                <button 
                    onClick={handleCreateRoom} 
                    className="hidden sm:flex group relative px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                    <span className="relative flex items-center gap-2">
                        <Plus size={16} strokeWidth={3} /> Host Session
                    </span>
                </button>
            )}

            {user ? (
                /* --- LOGGED IN USER DROPDOWN --- */
                <div className="relative pl-4 border-l border-slate-800 ml-2" ref={dropdownRef}>
                    
                    {/* TRIGGER BUTTON */}
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 group focus:outline-none"
                    >
                        <div className="flex flex-col text-right hidden lg:flex">
                            <span className="text-sm font-bold text-slate-200 leading-none group-hover:text-indigo-400 transition-colors">
                                {user.name}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                                Teacher
                            </span>
                        </div>
                        
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 p-[2px] shadow-inner group-hover:shadow-indigo-500/20 transition-all duration-300">
                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-sm font-bold text-indigo-400">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <ChevronDown size={14} className={`text-slate-600 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`}/>
                    </button>

                    {/* DROPDOWN MENU */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-4 w-60 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in-up origin-top-right overflow-hidden ring-1 ring-white/5">
                            
                            {/* MOBILE HEADER */}
                            <div className="px-5 py-4 border-b border-slate-800 lg:hidden bg-slate-950/30">
                                <p className="text-white font-bold truncate text-base">{user.name}</p>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>

                            {/* LINKS */}
                            <div className="p-2 space-y-1">
                                <button onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-3 transition-colors group">
                                    <div className="p-1.5 bg-slate-800 rounded-lg group-hover:bg-indigo-500/20 transition-colors"><User size={16} className="text-indigo-400"/></div> 
                                    My Profile
                                </button>
                                
                                <button onClick={() => { navigate('/teacher'); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-3 transition-colors group">
                                    <div className="p-1.5 bg-slate-800 rounded-lg group-hover:bg-purple-500/20 transition-colors"><LayoutDashboard size={16} className="text-purple-400"/></div>
                                    Dashboard
                                </button>
                            </div>

                            <div className="h-px bg-slate-800 my-1 mx-4"></div>

                            <div className="p-2">
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl flex items-center gap-3 transition-colors group">
                                    <div className="p-1.5 bg-rose-500/10 rounded-lg group-hover:bg-rose-500/20 transition-colors"><LogOut size={16}/></div>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* --- GUEST VIEW --- */
                <div className="flex items-center gap-3">
                    <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-white transition px-4 py-2 hover:bg-slate-800/50 rounded-full">
                        Log in
                    </Link>
                    <Link to="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full text-sm font-bold transition shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
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