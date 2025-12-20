import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    Plus, LogOut, User, MonitorPlay, BrainCircuit, 
    ChevronDown, LayoutDashboard 
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
    ? "bg-white/10 text-white border border-white/10" 
    : "text-gray-400 hover:text-white hover:bg-white/5";

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
   // ✅ FIX: z-[100] ensures this stays on top of EVERYTHING
   <nav className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-[100]">

      <div className="max-w-7xl mx-auto h-full flex justify-between items-center px-6">
        
        {/* LEFT: LOGO */}
        <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-lg shadow-lg group-hover:shadow-purple-500/30 transition-all">
                🧞‍♂️
            </div>
            <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight">
                QuizGenie
            </span>
        </Link>

        {/* CENTER: LINKS */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          <Link to="/" className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${isActive("/")}`}>
            <MonitorPlay size={16}/> Live Game
          </Link>
          <Link to="/solo" className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${isActive("/solo")}`}>
            <BrainCircuit size={16}/> Solo Learn
          </Link>
        </div>

        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-4">
            
            {/* CREATE ROOM BUTTON */}
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
                /* --- LOGGED IN USER DROPDOWN --- */
                <div className="relative pl-3 border-l border-gray-700" ref={dropdownRef}>
                    
                    {/* TRIGGER BUTTON */}
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 group focus:outline-none"
                    >
                        <div className="flex flex-col text-right hidden lg:flex">
                            <span className="text-sm font-bold text-white leading-none group-hover:text-blue-400 transition">
                                {user.name}
                            </span>
                            {/* CLEAN "TEACHER" LABEL (No Levels) */}
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                Teacher
                            </span>
                        </div>
                        
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg ring-2 ring-transparent group-hover:ring-blue-500/50 transition-all">
                            {user.name.charAt(0).toUpperCase()}
                        </div>

                        <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}/>
                    </button>

                    {/* DROPDOWN MENU */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-56 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-fade-in-up origin-top-right overflow-hidden">
                            
                            {/* MOBILE HEADER (Only visible on small screens) */}
                            <div className="px-4 py-3 border-b border-white/5 lg:hidden">
                                <p className="text-white font-bold truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>

                            {/* LINKS */}
                            <div className="p-1.5 space-y-1">
                                <button onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-3 transition">
                                    <User size={16} className="text-blue-500"/> My Profile
                                </button>
                                
                                <button onClick={() => { navigate('/teacher'); setIsDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-3 transition">
                                    <LayoutDashboard size={16} className="text-purple-500"/> Dashboard
                                </button>
                            </div>

                            <div className="h-px bg-white/10 my-1 mx-2"></div>

                            <div className="p-1.5">
                                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-3 transition">
                                    <LogOut size={16}/> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* --- GUEST VIEW --- */
                <div className="flex items-center gap-2">
                    <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-white transition px-3 py-2">
                        Log in
                    </Link>
                    <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition">
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