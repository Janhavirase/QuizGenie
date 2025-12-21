import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); 
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/teacher';

  const handleLogin = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Verifying credentials...');

    try {
      const response = await fetch('https://quizgenie-22xy.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // ✅ SUCCESS PATH (Backend is working)
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
        
        login({ 
            name: user.name, 
            email: user.email, 
            id: user.id || "demo-user-id" 
        }); 
        
        navigate(from, { replace: true });
      } else {
        toast.error(err.message || "Invalid credentials", { id: toastId });
        // Optional: Set error state if you want the banner to show as well
        setError("Invalid credentials or server unavailable");
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-[2rem] shadow-2xl relative z-10 group transition-all duration-500 hover:shadow-indigo-500/10 hover:border-slate-700">
        
        {/* Error Banner */}
        {error && (
            <div className="absolute top-0 left-0 w-full bg-rose-500/10 text-rose-400 text-xs font-bold text-center py-3 border-b border-rose-500/20 animate-slide-down flex items-center justify-center gap-2">
                <AlertCircle size={14}/> {error}
            </div>
        )}

        <div className="text-center mb-10 mt-2">
          <div className="inline-flex items-center justify-center p-3 bg-slate-800/50 rounded-2xl mb-4 ring-1 ring-white/5 shadow-inner">
             <Fingerprint size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-slate-200 tracking-tight mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-400 text-sm font-medium">Please sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group/input">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors pointer-events-none">
                  <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 shadow-inner"
                placeholder="teacher@school.com"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group/input">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors pointer-events-none">
                  <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 shadow-inner"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 transform active:scale-[0.98] mt-4 group/btn"
          >
            Access Dashboard <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform"/>
          </button>
        </form>
        
        {/* Footer Links */}
        <div className="mt-8 flex items-center justify-center gap-1 text-sm">
            <span className="text-slate-500">New here?</span>
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors underline decoration-indigo-500/30 hover:decoration-indigo-500">
                Create an Account
            </Link>
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-600 font-medium">
                Students: No login required. Use the <Link to="/" className="text-slate-400 hover:text-white transition-colors underline">Join Page</Link>.
            </p>
        </div>

      </div>
    </div>
  );
};

export default Login;