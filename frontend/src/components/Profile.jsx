import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast'; 
import QRCode from 'react-qr-code'; // ✅ IMPORTED QR CODE
import { 
    User, Mail, Calendar, LogOut, 
    FileText, ArrowLeft, Settings, Trash2, X, Save, 
    Shield, Activity, CreditCard, Layout, QrCode
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Profile = () => {
  const { user, login, logout } = useAuth(); 
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [localQuizzes, setLocalQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- SETTINGS MODAL STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", password: "" });
  const [isSaving, setIsSaving] = useState(false);

  // ✅ DYNAMIC LINK GENERATION FOR QR CODE
  const siteUrl = window.location.origin;
  const profileLink = profile ? `${siteUrl}/student/stats/${profile._id}` : siteUrl;

  // ✅ 1. FETCH USER DATA & LOCAL QUIZZES
  useEffect(() => {
    const fetchUserData = async () => {
        const userId = user?.id || user?._id;
        
        // ⚡ FALLBACK: Set profile from Context immediately so UI isn't empty
        if (user && !profile) {
            setProfile({
                name: user.name,
                email: user.email,
                _id: userId,
                createdAt: user.createdAt || new Date().toISOString()
            });
            setEditForm({ name: user.name, password: "" });
        }

        if (!userId) return;

        // DEMO MODE CHECK
        if (userId === "demo-user-id") {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`https://quizgenie-22xy.onrender.com/api/users/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setEditForm(prev => ({ ...prev, name: data.name }));
            }
        } catch (err) {
            console.error(err);
            // Fallback is already handled above
        }
    };

    const fetchLocalContent = () => {
        const stored = JSON.parse(localStorage.getItem('quizgenie_quizzes') || "[]");
        setLocalQuizzes(stored);
    };

    // Run fetches
    if (user) {
        Promise.all([fetchUserData(), fetchLocalContent()])
            .then(() => setLoading(false))
            .catch(() => setLoading(false));
    } else {
        setLoading(false);
    }
  }, [user]);

  // ✅ 2. SEPARATE HOOK FOR HISTORY
  useEffect(() => {
    if (user?.id && user.id !== "demo-user-id") {
        fetch(`https://quizgenie-22xy.onrender.com/api/results/${user.id}`)
            .then(res => res.json())
            .then(data => setHistory(data))
            .catch(err => console.error("History fetch error", err));
    }
  }, [user]);

  // --- UPDATE PROFILE FUNCTION ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const userId = user?.id || user?._id;
    if (!userId) return;

    setIsSaving(true);
    const toastId = toast.loading("Updating profile...");

    // DEMO MODE UPDATE
    if (userId === "demo-user-id") {
        setTimeout(() => {
            setProfile(prev => ({ ...prev, name: editForm.name }));
            login({ ...user, name: editForm.name });
            
            // Update LocalStorage DB
            const existingUsers = JSON.parse(localStorage.getItem('quizgenie_users_db') || "[]");
            const updatedUsers = existingUsers.map(u => (u.email === user.email) ? { ...u, name: editForm.name } : u);
            localStorage.setItem('quizgenie_users_db', JSON.stringify(updatedUsers));

            toast.success("Profile Updated!", { id: toastId });
            setIsEditing(false);
            setEditForm(prev => ({ ...prev, password: "" })); 
            setIsSaving(false);
        }, 800);
        return;
    }

    // REAL BACKEND UPDATE
    try {
        const res = await fetch(`https://quizgenie-22xy.onrender.com/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm)
        });
        const updatedUser = await res.json();

        if (res.ok) {
            setProfile(prev => ({ ...prev, name: updatedUser.name }));
            if (login) login({ ...user, name: updatedUser.name });
            toast.success("Profile Updated!", { id: toastId });
            setIsEditing(false);
            setEditForm(prev => ({ ...prev, password: "" })); 
        } else {
            toast.error(updatedUser.message || "Failed to update.", { id: toastId });
        }
    } catch (error) {
        toast.error("Server error.", { id: toastId });
    } finally {
        setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if(logout) logout();
    localStorage.removeItem('token'); 
    localStorage.removeItem('user'); // Clear user to force refresh next time
    toast.success("Logged out successfully");
    navigate('/login');
  };

  const deleteQuiz = (id) => {
    if(!window.confirm("Delete this quiz?")) return;
    const updated = localQuizzes.filter(q => q.id !== id);
    localStorage.setItem('quizgenie_quizzes', JSON.stringify(updated));
    setLocalQuizzes(updated);
    toast.success("Quiz deleted from library");
  };

  if (loading) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="w-20 h-20 bg-slate-800 rounded-full border border-slate-700 shadow-xl"></div>
            <div className="h-4 w-32 bg-slate-800 rounded-full"></div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 md:p-8 lg:p-12 pt-24 relative selection:bg-indigo-500/30">
      <Toaster />
      
      {/* PROFESSIONAL BACKGROUND EFFECTS */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />

      {/* TOP NAVIGATION */}
      <div className="max-w-7xl mx-auto mb-10 relative z-10 flex items-center justify-between">
        <button 
            onClick={() => navigate('/teacher')} 
            className="flex items-center gap-3 text-slate-400 hover:text-white transition-all group px-4 py-2 rounded-full hover:bg-white/5 border border-transparent hover:border-white/5"
        >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> 
            <span className="font-medium tracking-wide text-sm">Return to Dashboard</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT COLUMN: IDENTITY & STATS */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Identity Card */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"/>
                
                <div className="flex flex-col items-center text-center relative z-10">
                    <div className="relative mb-6">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-[2px] shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]">
                            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                                 <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
                                    {profile?.name?.charAt(0).toUpperCase()}
                                 </span>
                            </div>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-emerald-500 w-4 h-4 rounded-full border-[3px] border-slate-950" title="Online"></div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-1">{profile?.name}</h2>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-8">
                        <Shield size={10}/> Instructor
                    </div>

                    {/* Quick Stats */}
                    <div className="w-full grid grid-cols-2 gap-3 mb-8">
                        <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl hover:bg-slate-800/50 transition duration-300">
                            <div className="text-2xl font-bold text-white tracking-tight">{localQuizzes.length}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Projects</div>
                        </div>
                        <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl hover:bg-slate-800/50 transition duration-300">
                            <div className="text-2xl font-bold text-indigo-400 tracking-tight">Pro</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Tier</div>
                        </div>
                    </div>

                    <div className="w-full space-y-3">
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50"
                        >
                            <Settings size={16}/> Edit Profile
                        </button>
                        
                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 py-3.5 rounded-xl text-sm font-semibold transition-all"
                        >
                            <LogOut size={16}/> Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Read Only Details & QR CODE */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5 ml-1">Metadata</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 text-slate-400 hover:text-slate-200 transition group p-2 rounded-xl hover:bg-slate-800/50">
                        <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition"><Mail size={16}/></div> 
                        <span className="text-sm font-medium">{profile?.email || "No Email"}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 hover:text-slate-200 transition group p-2 rounded-xl hover:bg-slate-800/50">
                        <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-purple-500/20 group-hover:text-purple-400 transition"><Calendar size={16}/></div> 
                        <span className="text-sm font-medium">Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Unknown"}</span>
                    </div>
                    
                    {/* ✅ QR CODE SECTION ADDED HERE */}
                    <div className="pt-4 border-t border-slate-800 mt-4">
                        <div className="flex flex-col items-center bg-white p-3 rounded-xl border-4 border-slate-800 shadow-xl">
                             <div style={{ height: "auto", margin: "0 auto", maxWidth: 80, width: "100%" }}>
                                <QRCode
                                    size={256}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    value={profileLink}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-slate-500 mt-2 uppercase font-bold tracking-widest">Player Card</p>
                    </div>

                </div>
            </div>

            {/* 📊 PERFORMANCE ANALYTICS WIDGET */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={64}/></div>
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <Activity size={16} className="text-indigo-500"/> Activity
                </h3>
                
                {history.length > 0 ? (
                    <div className="h-48 w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={history.slice(0, 5)}>
                                <XAxis dataKey="quizTitle" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.substring(0,3)} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Bar dataKey="percentage" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
                        <p className="text-slate-600 text-xs">No activity recorded yet.</p>
                    </div>
                )}
            </div>

        </div>

        {/* RIGHT COLUMN: LIBRARY GRID */}
        <div className="lg:col-span-8">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[2rem] p-8 shadow-2xl min-h-[800px]">
                
                {/* Library Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><FileText size={24}/></div>
                            Your Library
                        </h3>
                        <p className="text-slate-400 text-sm mt-2 ml-1">Manage all your locally saved quizzes.</p>
                    </div>
                    <button onClick={() => navigate('/create-manual')} className="bg-white text-slate-950 hover:bg-slate-200 px-6 py-3 rounded-xl text-sm font-bold transition shadow-lg shadow-white/5 flex items-center gap-2 group">
                        <span className="group-hover:scale-110 transition-transform duration-200">+</span> Create New
                    </button>
                </div>

                {localQuizzes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
                        <div className="w-20 h-20 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center mb-6 shadow-xl">
                            <Layout size={32} className="text-slate-600"/>
                        </div>
                        <h4 className="text-lg font-bold text-slate-300">It's quiet here</h4>
                        <p className="text-slate-500 text-sm mt-2">Create your first quiz to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {localQuizzes.map((quiz, index) => (
                             <div key={index} className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-900/10 hover:-translate-y-1">
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center text-indigo-500 font-bold text-sm shadow-inner group-hover:text-indigo-400 transition-colors">
                                        Q{index + 1}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => deleteQuiz(quiz.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition">
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </div>
                                
                                <h4 className="font-bold text-slate-100 text-xl mb-2 truncate pr-4">{quiz.title}</h4>
                                <div className="text-xs font-medium text-slate-500 mb-8 flex items-center gap-3">
                                    <span className="bg-slate-800 px-2 py-1 rounded-md border border-slate-700">{quiz.questions?.length || 0} Questions</span>
                                    <span>{new Date(quiz.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>

                                <button 
                                    onClick={() => navigate('/study', { state: { questions: quiz.questions, title: quiz.title, id: quiz.id } })}
                                    className="w-full py-3 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-all border border-slate-800 hover:border-transparent flex items-center justify-center gap-2 group/btn"
                                >
                                    Launch Quiz <ArrowLeft size={14} className="rotate-180 group-hover/btn:translate-x-1 transition-transform"/>
                                </button>
                             </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* --- EDIT PROFILE MODAL --- */}
      {isEditing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 w-full max-w-md border border-slate-700 rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 ring-1 ring-white/10">
                
                <button onClick={() => setIsEditing(false)} className="absolute top-6 right-6 p-2 bg-slate-800 rounded-full text-slate-500 hover:text-white transition hover:bg-slate-700">
                    <X size={18} />
                </button>

                <div className="mb-8">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 mb-4">
                        <User size={24}/>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Edit Profile</h2>
                    <p className="text-slate-400 text-sm mt-1">Update your personal information below.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Display Name</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input 
                                type="text" 
                                value={editForm.name}
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-700"
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">New Password</label>
                        <div className="relative group">
                            <Settings className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-purple-500 transition-colors" size={18} />
                            <input 
                                type="password" 
                                value={editForm.password}
                                onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-700"
                                placeholder="Leave empty to keep current"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8 pt-4 border-t border-slate-800">
                        <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition text-sm">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving} className="flex-1 bg-white text-slate-950 hover:bg-slate-200 py-3 rounded-xl font-bold transition shadow-lg shadow-white/5 flex items-center justify-center gap-2 text-sm">
                            {isSaving ? "Saving..." : <><Save size={16}/> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default Profile;