import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    User, Mail, Calendar, LogOut, 
    FileText, ArrowLeft, Settings, Trash2, X, Save, 
    Shield, Activity, CreditCard
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

  // ✅ 1. FETCH USER DATA & LOCAL QUIZZES
  useEffect(() => {
    const fetchUserData = async () => {
        const userId = user?.id || user?._id;
        if (!userId) return;

        // DEMO MODE CHECK
        if (userId === "demo-user-id") {
            setProfile({
                name: user.name,
                email: user.email,
                _id: "demo-user-id",
                createdAt: new Date().toISOString()
            });
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/users/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setEditForm(prev => ({ ...prev, name: data.name }));
            }
        } catch (err) {
            console.error(err);
             setProfile({
                name: user?.name || "User",
                email: user?.email || "No Email",
                _id: userId,
                createdAt: new Date().toISOString()
            });
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

  // ✅ 2. SEPARATE HOOK FOR HISTORY (This was the error source)
  useEffect(() => {
    if (user?.id && user.id !== "demo-user-id") {
        fetch(`http://localhost:5000/api/results/${user.id}`)
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

    // DEMO MODE UPDATE
    if (userId === "demo-user-id") {
        setTimeout(() => {
            setProfile(prev => ({ ...prev, name: editForm.name }));
            login({ ...user, name: editForm.name });
            
            // Update LocalStorage DB
            const existingUsers = JSON.parse(localStorage.getItem('quizgenie_users_db') || "[]");
            const updatedUsers = existingUsers.map(u => (u.email === user.email) ? { ...u, name: editForm.name } : u);
            localStorage.setItem('quizgenie_users_db', JSON.stringify(updatedUsers));

            setIsEditing(false);
            setEditForm(prev => ({ ...prev, password: "" })); 
            setIsSaving(false);
        }, 800);
        return;
    }

    // REAL BACKEND UPDATE
    try {
        const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm)
        });
        const updatedUser = await res.json();

        if (res.ok) {
            setProfile(prev => ({ ...prev, name: updatedUser.name }));
            if (login) login({ ...user, name: updatedUser.name });
            setIsEditing(false);
            setEditForm(prev => ({ ...prev, password: "" })); 
        } else {
            alert(updatedUser.message || "Failed to update.");
        }
    } catch (error) {
        alert("Server error.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if(logout) logout();
    localStorage.removeItem('token'); 
    navigate('/login');
  };

  const deleteQuiz = (id) => {
    if(!window.confirm("Delete this quiz?")) return;
    const updated = localQuizzes.filter(q => q.id !== id);
    localStorage.setItem('quizgenie_quizzes', JSON.stringify(updated));
    setLocalQuizzes(updated);
  };

  if (loading) return (
    <div className="h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="w-20 h-20 bg-white/5 rounded-full border border-white/10 shadow-xl"></div>
            <div className="h-4 w-32 bg-white/5 rounded-full"></div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans p-6 md:p-8 lg:p-12 pt-24 relative selection:bg-blue-500/30">
      
      {/* PROFESSIONAL BACKGROUND EFFECTS */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />

      {/* TOP NAVIGATION */}
      <div className="max-w-7xl mx-auto mb-10 relative z-10 flex items-center justify-between">
        <button 
            onClick={() => navigate('/teacher')} 
            className="flex items-center gap-3 text-gray-400 hover:text-white transition-all group px-4 py-2 rounded-full hover:bg-white/5 border border-transparent hover:border-white/5"
        >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> 
            <span className="font-medium tracking-wide text-sm">Return to Dashboard</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT COLUMN: IDENTITY & STATS */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Identity Card */}
            <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"/>
                
                <div className="flex flex-col items-center text-center relative z-10">
                    <div className="relative mb-6">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[2px] shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]">
                            <div className="w-full h-full rounded-full bg-[#18181b] flex items-center justify-center overflow-hidden">
                                 <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">
                                    {profile?.name?.charAt(0).toUpperCase()}
                                 </span>
                            </div>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-[3px] border-[#18181b]" title="Online"></div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-1">{profile?.name}</h2>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold tracking-wider uppercase mb-8">
                        <Shield size={10}/> Instructor
                    </div>

                    {/* Quick Stats */}
                    <div className="w-full grid grid-cols-2 gap-3 mb-8">
                        <div className="bg-black/30 border border-white/5 p-4 rounded-2xl hover:bg-white/5 transition duration-300">
                            <div className="text-2xl font-bold text-white tracking-tight">{localQuizzes.length}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Projects</div>
                        </div>
                        <div className="bg-black/30 border border-white/5 p-4 rounded-2xl hover:bg-white/5 transition duration-300">
                            <div className="text-2xl font-bold text-blue-400 tracking-tight">Pro</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Tier</div>
                        </div>
                    </div>

                    <div className="w-full space-y-3">
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white py-3.5 rounded-xl text-sm font-semibold transition-all hover:border-white/20 hover:shadow-lg hover:shadow-white/5"
                        >
                            <Settings size={16}/> Edit Profile
                        </button>
                        
                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 py-3.5 rounded-xl text-sm font-semibold transition-all"
                        >
                            <LogOut size={16}/> Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Read Only Details */}
            <div className="bg-[#121214]/60 border border-white/5 rounded-3xl p-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5 ml-1">Metadata</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 text-gray-400 hover:text-gray-200 transition group p-2 rounded-xl hover:bg-white/5">
                        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-blue-500/20 group-hover:text-blue-400 transition"><Mail size={16}/></div> 
                        <span className="text-sm font-medium">{profile?.email}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 hover:text-gray-200 transition group p-2 rounded-xl hover:bg-white/5">
                        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-purple-500/20 group-hover:text-purple-400 transition"><Calendar size={16}/></div> 
                        <span className="text-sm font-medium">Joined {new Date(profile?.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 hover:text-gray-200 transition group p-2 rounded-xl hover:bg-white/5">
                        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-orange-500/20 group-hover:text-orange-400 transition"><CreditCard size={16}/></div> 
                        <span className="text-sm font-medium tracking-wide">ID: {profile?._id?.substring(0,8)}...</span>
                    </div>
                </div>
            </div>

            {/* 📊 PERFORMANCE ANALYTICS WIDGET */}
            <div className="bg-[#121214]/60 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={64}/></div>
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <Activity size={16} className="text-blue-500"/> Activity
                </h3>
                
                {history.length > 0 ? (
                    <div className="h-48 w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={history.slice(0, 5)}>
                                <XAxis dataKey="quizTitle" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.substring(0,3)} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center border border-dashed border-white/10 rounded-xl">
                        <p className="text-gray-500 text-xs">No data recorded.</p>
                    </div>
                )}
            </div>

        </div>

        {/* RIGHT COLUMN: LIBRARY GRID */}
        <div className="lg:col-span-8">
            <div className="bg-[#121214]/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-2xl min-h-[800px]">
                
                {/* Library Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><FileText size={24}/></div>
                            Your Library
                        </h3>
                        <p className="text-gray-400 text-sm mt-2 ml-1">Manage all your locally saved quizzes.</p>
                    </div>
                    <button onClick={() => navigate('/create-manual')} className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl text-sm font-bold transition shadow-lg shadow-white/5 flex items-center gap-2">
                        <span>+ Create New</span>
                    </button>
                </div>

                {localQuizzes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                        <div className="w-20 h-20 bg-[#18181b] rounded-full border border-white/10 flex items-center justify-center mb-6 shadow-xl">
                            <Activity size={32} className="text-gray-600"/>
                        </div>
                        <h4 className="text-lg font-bold text-gray-300">It's quiet here</h4>
                        <p className="text-gray-500 text-sm mt-2">Create your first quiz to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {localQuizzes.map((quiz, index) => (
                             <div key={index} className="group relative bg-[#18181b] border border-white/5 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1">
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-black rounded-xl border border-white/5 flex items-center justify-center text-blue-500 font-bold text-sm shadow-inner">
                                        Q{index + 1}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => deleteQuiz(quiz.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition">
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </div>
                                
                                <h4 className="font-bold text-white text-xl mb-2 truncate pr-4">{quiz.title}</h4>
                                <div className="text-xs font-medium text-gray-500 mb-8 flex items-center gap-3">
                                    <span className="bg-white/5 px-2 py-1 rounded-md border border-white/5">{quiz.questions?.length || 0} Questions</span>
                                    <span>{new Date(quiz.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>

                                <button 
                                    onClick={() => navigate('/study', { state: { questions: quiz.questions, title: quiz.title, id: quiz.id } })}
                                    className="w-full py-3 bg-white/5 hover:bg-blue-600 text-gray-300 hover:text-white rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-transparent flex items-center justify-center gap-2"
                                >
                                    Launch Quiz <ArrowLeft size={14} className="rotate-180"/>
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-[#121214] w-full max-w-md border border-white/10 rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
                
                <button onClick={() => setIsEditing(false)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-gray-500 hover:text-white transition hover:bg-white/10">
                    <X size={18} />
                </button>

                <div className="mb-8">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-4">
                        <User size={24}/>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Edit Profile</h2>
                    <p className="text-gray-400 text-sm mt-1">Update your personal information below.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Display Name</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input 
                                type="text" 
                                value={editForm.name}
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="w-full bg-[#09090b] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-700"
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">New Password</label>
                        <div className="relative group">
                            <Settings className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={18} />
                            <input 
                                type="password" 
                                value={editForm.password}
                                onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                                className="w-full bg-[#09090b] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-700"
                                placeholder="Leave empty to keep current"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8 pt-4 border-t border-white/5">
                        <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition text-sm">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving} className="flex-1 bg-white text-black hover:bg-gray-200 py-3 rounded-xl font-bold transition shadow-lg shadow-white/5 flex items-center justify-center gap-2 text-sm">
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