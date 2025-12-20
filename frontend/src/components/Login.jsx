import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast'; // 1. Import
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // ✅ Added missing state
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/teacher';
const handleLogin = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Logging in...');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // ✅ SUCCESS PATH (Backend is working)
      // We accept data.user OR data (depending on backend structure)
      const userToSave = data.user || data; 
      
      login(userToSave);
      toast.success(`Welcome back, ${userToSave.name}!`, { id: toastId });
      navigate(from, { replace: true });

    } catch (err) {
      console.warn("Backend failed... switching to Demo Mode check.");
      
      // ✅ FALLBACK PATH (Backend is down)
      const existingUsers = JSON.parse(localStorage.getItem('quizgenie_users_db') || "[]");
      const user = existingUsers.find(u => u.email === email && u.password === password);

      if (user) {
        toast.success("Login Successful (Demo Mode)", { id: toastId });
        
        // ⚠️ CRITICAL FIX: We create a fake ID so the Profile page doesn't crash
        login({ 
            name: user.name, 
            email: user.email, 
            id: user.id || "demo-user-id" // This prevents "undefined" errors
        }); 
        
        navigate(from, { replace: true });
      } else {
        toast.error(err.message || "Invalid credentials", { id: toastId });
      }
    }
  };
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {/* Error Banner */}
        {error && (
            <div className="absolute top-0 left-0 w-full bg-red-500/10 text-red-400 text-xs font-bold text-center py-3 border-b border-red-500/20 z-20 flex justify-center gap-2">
                <AlertCircle size={14}/> {error}
            </div>
        )}

        <div className="text-center mb-8 mt-6">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
            Teacher Login
          </h1>
          <p className="text-gray-400 text-sm">Access your QuizGenie Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email</label>
            <div className="relative group">
              <Mail className="absolute top-3 left-3 text-gray-500 group-focus-within:text-blue-500 transition pointer-events-none" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition"
                placeholder="teacher@school.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
            <div className="relative group">
              <Lock className="absolute top-3 left-3 text-gray-500 group-focus-within:text-blue-500 transition pointer-events-none" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
            Login to Dashboard <ArrowRight size={18} />
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Don't have an account? </span>
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold transition">Sign Up</Link>
        </div>
        
        <div className="mt-4 text-center">
            <p className="text-xs text-gray-600">Students do not need to login.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;