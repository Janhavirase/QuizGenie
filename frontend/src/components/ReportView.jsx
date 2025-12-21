import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { ArrowLeft, Trophy, Users, AlertTriangle, CheckCircle2, Download, TrendingUp, Calendar, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

const ReportView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(null);

    const handleDownloadCSV = () => {
        if (!reportData || !reportData.students) return;

        // 1. Define CSV Headers
        const headers = ["Rank,Name,Score,Correct Answers,Wrong Answers"];

        // 2. Map Student Data to Rows
        const rows = reportData.students.map((student, index) => {
            // Estimate correct/wrong based on score (Approximation for now)
            // In a real app, you'd track this precisely per student
            const estimatedCorrect = Math.floor(student.score / 100); 
            const estimatedWrong = reportData.questionStats.length - estimatedCorrect;
            
            return `${index + 1},"${student.name}",${student.score},${estimatedCorrect},${estimatedWrong}`;
        });
        const csvContent = [headers, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        // 4. Trigger Download
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${reportData.title.replace(/\s+/g, '_')}_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("CSV Report Downloaded!");
    };

    useEffect(() => {
        // 1. Try to find REAL data from LocalStorage
        const allReports = JSON.parse(localStorage.getItem('quizgenie_reports') || "[]");
        
        // Find the report that matches this Quiz ID
        const realReport = allReports.find(r => r.quizId === id);

        if (realReport) {
            setReportData(realReport);
        } else {
            // 2. Fallback to DUMMY Data if no game has been played yet
            setReportData({
                isDummy: true, // Mark as dummy
                title: "Sample Report (Play the game to see real data)",
                date: new Date().toLocaleDateString(),
                totalPlayers: 0,
                avgScore: 0,
                toughestQuestion: "N/A",
                students: [],
                questionStats: []
            });
        }
    }, [id]);

    if (!reportData) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="w-16 h-16 bg-slate-800 rounded-full"></div>
                <p>Loading Report...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 md:p-12 pb-20 selection:bg-indigo-500/30">
            
            {/* Background Decor */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-10 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <button 
                    onClick={() => navigate('/teacher')} 
                    className="flex items-center gap-3 text-slate-400 hover:text-white transition-all group px-4 py-2 rounded-full hover:bg-white/5 border border-transparent hover:border-white/5 w-fit"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> 
                    <span className="font-medium tracking-wide text-sm">Dashboard</span>
                </button>
                
                <div className="flex items-center gap-3">
                    {reportData.isDummy && (
                        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-bold rounded-full border border-yellow-500/20">
                            Demo Mode
                        </span>
                    )}
                    <button 
                        onClick={handleDownloadCSV} 
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-500/20 active:scale-95 border border-indigo-400/20"
                    >
                        <FileSpreadsheet size={18}/> Export CSV
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                
                {/* 1. Title Card */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 md:p-10 rounded-[2rem] relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 text-indigo-400 font-bold text-sm tracking-wider uppercase">
                            <TrendingUp size={16}/> Session Report
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight leading-tight">
                            {reportData.title}
                        </h1>
                        <div className="flex items-center gap-6 text-slate-400 text-sm font-medium">
                            <span className="flex items-center gap-2"><Calendar size={16}/> {reportData.date}</span>
                            <span className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-md border border-slate-700 font-mono text-xs">ID: {id}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center gap-5 hover:border-slate-700 transition-colors shadow-lg">
                        <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20"><Users size={28}/></div>
                        <div>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Participants</p>
                            <p className="text-3xl font-black text-white">{reportData.totalPlayers}</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center gap-5 hover:border-slate-700 transition-colors shadow-lg">
                        <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20"><CheckCircle2 size={28}/></div>
                        <div>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Avg. Score</p>
                            <p className="text-3xl font-black text-white">{reportData.avgScore}</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center gap-5 hover:border-slate-700 transition-colors shadow-lg overflow-hidden">
                        <div className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 shrink-0"><AlertTriangle size={28}/></div>
                        <div className="min-w-0">
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Hardest Question</p>
                            <p className="text-lg font-bold text-white truncate" title={reportData.toughestQuestion}>{reportData.toughestQuestion}</p>
                        </div>
                    </div>
                </div>

                {/* 3. Charts & Data Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Performance Chart */}
                    <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 p-8 rounded-[2rem] shadow-xl">
                        <h3 className="text-lg font-bold mb-8 flex items-center gap-3 text-white">
                            <div className="p-1.5 bg-blue-500 rounded-lg"></div>
                            Question Performance
                        </h3>
                        {reportData.questionStats.length > 0 ? (
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={reportData.questionStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10}/>
                                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}/>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                        />
                                        <Bar dataKey="correct" name="Correct" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                                        <Bar dataKey="wrong" name="Incorrect" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                                <p className="text-slate-500 font-medium">No question data available</p>
                            </div>
                        )}
                    </div>

                    {/* Leaderboard Table */}
                    <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-[2rem] flex flex-col shadow-xl h-[500px]">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-white">
                            <Trophy size={20} className="text-yellow-400 fill-yellow-400/20"/> Top Performers
                        </h3>
                        <div className="flex-1 overflow-auto custom-scrollbar -mr-2 pr-2">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-900 z-10">
                                    <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                        <th className="pb-3 pl-2">Rank</th>
                                        <th className="pb-3">Student</th>
                                        <th className="pb-3 text-right pr-2">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-medium">
                                    {reportData.students.length > 0 ? reportData.students.map((student, i) => (
                                        <tr key={i} className="group hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-0">
                                            <td className="py-4 pl-4">
                                                <div className={`w-6 h-6 flex items-center justify-center rounded-md font-bold text-xs ${
                                                    i === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                                                    i === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                                                    i === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                                    'text-slate-500'
                                                }`}>
                                                    {i+1}
                                                </div>
                                            </td>
                                            <td className="py-4 text-slate-200">{student.name}</td>
                                            <td className="py-4 pr-2 text-right font-mono font-bold text-indigo-400">{student.score}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="3" className="py-8 text-center text-slate-500 italic">No players joined yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReportView;