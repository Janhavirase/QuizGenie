import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // ✅ VALIDATION
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return setError("All fields are required.");
    }

    const toastId = toast.loading("Creating your account...");

    try {
      // 1. Try Real Backend
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Success
      login(data.user);
      toast.success("Account created successfully!", { id: toastId });
      navigate('/teacher');

    } catch (err) {
      console.warn("Backend failed, using local demo mode.");
      
      // 2. Local Fallback
      const existingUsers = JSON.parse(localStorage.getItem('quizgenie_users_db') || "[]");
      if (existingUsers.some(u => u.email === email)) {
          toast.error("Account already exists!", { id: toastId });
          return setError("Account already exists! Please login.");
      }
      const newUser = { name, email, password }; 
      existingUsers.push(newUser);
      localStorage.setItem('quizgenie_users_db', JSON.stringify(existingUsers));
      
      login({ name, email }); 
      toast.success("Welcome to QuizGenie!", { id: toastId });
      navigate('/teacher');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-[2rem] shadow-2xl relative z-10 group transition-all duration-500 hover:shadow-purple-500/10 hover:border-slate-700">
        
        {/* Error Banner */}
        {error && (
            <div className="absolute top-0 left-0 w-full bg-rose-500/10 text-rose-400 text-xs font-bold text-center py-3 border-b border-rose-500/20 animate-slide-down flex items-center justify-center gap-2">
                <AlertCircle size={14}/> {error}
            </div>
        )}

        <div className="text-center mb-8 mt-4">
          <div className="inline-flex items-center justify-center p-3 bg-slate-800/50 rounded-2xl mb-4 ring-1 ring-white/5 shadow-inner">
             <Sparkles size={32} className="text-purple-400" />
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-slate-200 tracking-tight mb-2">
            Create Account
          </h1>
          <p className="text-slate-400 text-sm font-medium">Join the QuizGenie Community</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          
          {/* Name Input */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 cursor-pointer">Full Name</label>
            <div className="relative group/input">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-purple-400 transition-colors pointer-events-none">
                  <User size={18} />
              </div>
              <input 
                id="name"
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 outline-none transition-all focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 shadow-inner"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 cursor-pointer">Email Address</label>
            <div className="relative group/input">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-purple-400 transition-colors pointer-events-none">
                  <Mail size={18} />
              </div>
              <input 
                id="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 outline-none transition-all focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 shadow-inner"
                placeholder="teacher@school.com"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 cursor-pointer">Password</label>
            <div className="relative group/input">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-purple-400 transition-colors pointer-events-none">
                  <Lock size={18} />
              </div>
              <input 
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 outline-none transition-all focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 shadow-inner"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 flex items-center justify-center gap-2 transform active:scale-[0.98] mt-4 group/btn"
          >
            Get Started <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform"/>
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm">
            <span className="text-slate-500">Already have an account? </span>
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-bold transition-colors underline decoration-purple-500/30 hover:decoration-purple-500">
                Sign In
            </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;