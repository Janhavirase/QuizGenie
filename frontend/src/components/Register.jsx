import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';

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

    if (!name || !email || !password) {
      return setError("Please fill in all fields.");
    }

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
      navigate('/teacher');

    } catch (err) {
      console.warn("Backend failed, using local demo mode.");
      
      // 2. Local Fallback
      const existingUsers = JSON.parse(localStorage.getItem('quizgenie_users_db') || "[]");
      if (existingUsers.some(u => u.email === email)) {
          return setError("Account already exists! Please login.");
      }
      const newUser = { name, email, password }; 
      existingUsers.push(newUser);
      localStorage.setItem('quizgenie_users_db', JSON.stringify(existingUsers));
      
      login({ name, email }); 
      navigate('/teacher');
    }
  }; // <--- Ensure this is the only closing brace here

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {/* Decorative Gradient Blur */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        {/* Error Banner */}
        {error && (
            <div className="absolute top-0 left-0 w-full bg-red-500/10 text-red-400 text-xs font-bold text-center py-3 flex items-center justify-center gap-2 border-b border-red-500/20 z-20">
                <AlertCircle size={14}/> {error}
            </div>
        )}

        <div className="text-center mb-8 mt-6 relative z-10">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
            Create Account
          </h1>
          <p className="text-gray-400 text-sm">Join QuizGenie as a Teacher</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6 relative z-10">
          
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 cursor-pointer">Full Name</label>
            <div className="relative group">
              <User className="absolute top-3 left-3 text-gray-500 pointer-events-none group-focus-within:text-blue-500 transition" size={18} />
              <input 
                id="name"
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 cursor-pointer">Email</label>
            <div className="relative group">
              <Mail className="absolute top-3 left-3 text-gray-500 pointer-events-none group-focus-within:text-blue-500 transition" size={18} />
              <input 
                id="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition"
                placeholder="teacher@school.com"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 cursor-pointer">Password</label>
            <div className="relative group">
              <Lock className="absolute top-3 left-3 text-gray-500 pointer-events-none group-focus-within:text-blue-500 transition" size={18} />
              <input 
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transform active:scale-95">
            Sign Up <ArrowRight size={18} />
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm relative z-10">
            <span className="text-gray-500">Already have an account? </span>
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold transition">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;