import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { ArrowLeft, Trophy, Users, AlertTriangle, CheckCircle, Download, Clock } from 'lucide-react';

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
    };
    useEffect(() => {
        // 1. Try to find REAL data from LocalStorage
        const allReports = JSON.parse(localStorage.getItem('quizgenie_reports') || "[]");
        
        // Find the report that matches this Quiz ID
        // (In a real app, you might have multiple sessions for one quiz, here we take the latest)
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

    if (!reportData) return <div className="p-10 text-white">Loading...</div>;

    const COLORS = ['#10B981', '#EF4444']; 

    return (
        <div className="min-h-screen bg-black text-white p-8 pb-20 font-sans">
            
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
                <button onClick={() => navigate('/teacher')} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                    <ArrowLeft size={20}/> Back to Dashboard
                </button>
                <button 
    onClick={handleDownloadCSV} // ✅ Attach the function here
    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold transition border border-gray-700"
>
    <Download size={16}/> Export CSV
</button>
            </div>

            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* 1. Title Card */}
                <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">{reportData.title}</h1>
                    <p className="text-gray-400">Played on {reportData.date} • Quiz ID: <span className="font-mono text-gray-500">{id}</span></p>
                </div>

                {/* 2. Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex items-center gap-4">
                        <div className="p-4 bg-blue-500/10 text-blue-400 rounded-xl"><Users size={24}/></div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Participants</p>
                            <p className="text-3xl font-black">{reportData.totalPlayers}</p>
                        </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex items-center gap-4">
                        <div className="p-4 bg-green-500/10 text-green-400 rounded-xl"><CheckCircle size={24}/></div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Avg. Score</p>
                            <p className="text-3xl font-black">{reportData.avgScore}</p>
                        </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex items-center gap-4">
                        <div className="p-4 bg-red-500/10 text-red-400 rounded-xl"><AlertTriangle size={24}/></div>
                        <div className="overflow-hidden">
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Hardest Question</p>
                            <p className="text-lg font-bold truncate text-white/90">{reportData.toughestQuestion}</p>
                        </div>
                    </div>
                </div>

                {/* 3. Charts & Data Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Performance Chart */}
                    <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                            Question Performance
                        </h3>
                        {reportData.questionStats.length > 0 ? (
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={reportData.questionStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                        <XAxis dataKey="name" stroke="#9CA3AF" tick={{fontSize: 12}} tickLine={false} axisLine={false}/>
                                        <YAxis stroke="#9CA3AF" tick={{fontSize: 12}} tickLine={false} axisLine={false}/>
                                        <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} cursor={{fill: '#1f2937'}}/>
                                        <Bar dataKey="correct" name="Correct" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="wrong" name="Incorrect" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-500 italic">No Data Available</div>
                        )}
                    </div>

                    {/* Leaderboard Table */}
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Trophy size={18} className="text-yellow-500"/> Top Performers
                        </h3>
                        <div className="flex-1 overflow-auto custom-scrollbar max-h-64">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs font-bold text-gray-500 border-b border-gray-800">
                                        <th className="pb-3 pl-2">Rank</th>
                                        <th className="pb-3">Name</th>
                                        <th className="pb-3 text-right pr-2">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {reportData.students.length > 0 ? reportData.students.map((student, i) => (
                                        <tr key={i} className="group hover:bg-white/5 transition">
                                            <td className="py-3 pl-4 font-bold text-gray-500 group-hover:text-white">#{i+1}</td>
                                            <td className="py-3 font-medium">{student.name}</td>
                                            <td className="py-3 pr-2 text-right font-mono text-blue-400">{student.score}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="3" className="py-4 text-center text-gray-500">No players yet</td></tr>
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