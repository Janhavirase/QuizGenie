import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Sparkles, Zap, BarChart3, MessageCircle, CheckCircle, Users } from 'lucide-react';

const TemplateGallery = ({ onSelect }) => {
  const [showAll, setShowAll] = useState(false);

  // --- 1. LOGIC & DATA (UNCHANGED) ---
  const TEMPLATE_DECKS = {
    pulse_check: {
        bgColor: "#FFF4E5", textColor: "#78350f",
        slides: [
            { question: "How is your energy level today?", type: "mcq", options: ["High ⚡", "Medium 😐", "Low 😴", "Need Coffee ☕"] },
            { question: "In one word, describe your week so far.", type: "wordcloud", options: [] },
            { question: "Anything you want to share with the class?", type: "open", options: [] },
            { question: "Thanks for checking in!", type: "ending", options: ["Let's get this class started."] }
        ]
    },
    comprehension: {
        bgColor: "#E0E7FF", textColor: "#312e81",
        slides: [
            { question: "How well did you understand the last topic?", type: "ranking", options: ["Totally got it", "Mostly clear", "Confused"] },
            { question: "Which concept was the hardest?", type: "wordcloud", options: [] },
            { question: "Should we review it again tomorrow?", type: "mcq", options: ["Yes, please", "No, move on"] },
            { question: "Feedback Received!", type: "ending", options: ["I'll adjust the next lesson based on this."] }
        ]
    },
    exam_review: {
        bgColor: "#FCE7F3", textColor: "#831843",
        slides: [
            { question: "Rate the difficulty of yesterday's exam", type: "ranking", options: ["Easy Peasy", "Fair", "Difficult", "Impossible"] },
            { question: "Did you have enough time to finish?", type: "mcq", options: ["Yes, plenty", "Barely", "No"] },
            { question: "Which question was the trickiest?", type: "open", options: [] },
            { question: "Good luck on the next one!", type: "ending", options: ["Review the answer key tonight."] }
        ]
    },
    debate: {
        bgColor: "#F3F4F6", textColor: "#111827",
        slides: [
            { question: "Is AI helpful or harmful for learning?", type: "mcq", options: ["Helpful 🤖", "Harmful ⚠️", "Both"] },
            { question: "Why do you think that?", type: "open", options: [] },
            { question: "Vote again after the discussion!", type: "mcq", options: ["Helpful", "Harmful"] },
            { question: "Debate Concluded", type: "ending", options: ["Great points everyone!"] }
        ]
    },
    exit_ticket: {
        bgColor: "#ECFDF5", textColor: "#064e3b",
        slides: [
            { question: "One thing you learned today", type: "open", options: [] },
            { question: "One question you still have", type: "open", options: [] },
            { question: "Rate today's lesson", type: "mcq", options: ["⭐⭐⭐⭐⭐", "⭐⭐⭐", "⭐"] },
            { question: "Class Dismissed!", type: "ending", options: ["See you tomorrow."] }
        ]
    },
    group_project: {
        bgColor: "#F5F3FF", textColor: "#4c1d95",
        slides: [
            { question: "Who is your group leader?", type: "open", options: [] },
            { question: "Project topic choice", type: "wordcloud", options: [] },
            { question: "Timeline feasibility", type: "ranking", options: ["On Track", "Behind", "Ahead"] },
            { question: "Happy Planning!", type: "ending", options: ["Remember to submit your proposal."] }
        ]
    }
  };

  // --- 2. CREATIVE VISUALS (Redesigned for Dark Mode) ---
  const ALL_TEMPLATES = [
    {
        id: 'pulse_check',
        title: "Classroom Pulse Check",
        question: "How is your energy level?",
        footer: "4 Slides • Icebreaker",
        gradient: "from-orange-500/20 to-orange-900/5",
        border: "group-hover:border-orange-500/50",
        icon: <Zap size={18} className="text-orange-400" />,
        visual: (
            // Neon Battery
            <div className="w-24 h-24 relative flex items-center justify-center">
                 <div className="w-16 h-8 border-2 border-orange-500/50 rounded-lg flex items-center p-1 gap-1 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                    <div className="h-full w-1/3 bg-orange-500 rounded-sm animate-pulse"></div>
                    <div className="h-full w-1/3 bg-orange-500 rounded-sm animate-pulse delay-75"></div>
                    <div className="h-full w-1/3 bg-gray-700/50 rounded-sm"></div>
                 </div>
                 <div className="absolute right-2 w-1 h-4 bg-orange-500/50 rounded-r-md"></div>
            </div>
        )
    },
    {
        id: 'comprehension',
        title: "Lesson Comprehension",
        question: "Did you understand the topic?",
        footer: "4 Slides • Check-in",
        gradient: "from-indigo-500/20 to-indigo-900/5",
        border: "group-hover:border-indigo-500/50",
        icon: <BarChart3 size={18} className="text-indigo-400" />,
        visual: (
            // Neon Bars
            <div className="w-24 h-24 flex items-end justify-center gap-2 pb-2">
                 <div className="w-3 h-6 bg-indigo-500/30 rounded-t-sm"></div>
                 <div className="w-3 h-10 bg-indigo-500/60 rounded-t-sm"></div>
                 <div className="w-3 h-14 bg-indigo-500 rounded-t-sm shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                 <div className="absolute top-6 right-4 bg-gray-800 rounded-full p-1 border border-indigo-500/50">
                    <CheckCircle size={10} className="text-indigo-400"/>
                 </div>
            </div>
        )
    },
    {
        id: 'exam_review',
        title: "Post-Exam Review",
        question: "Rate the difficulty level",
        footer: "4 Slides • Feedback",
        gradient: "from-pink-500/20 to-pink-900/5",
        border: "group-hover:border-pink-500/50",
        icon: <Sparkles size={18} className="text-pink-400" />,
        visual: (
            // Neon Graph
            <div className="w-28 h-20 relative flex items-center justify-center">
                 <svg viewBox="0 0 100 50" className="w-full drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]">
                     <path d="M10,40 Q30,40 40,20 T60,10 T90,30" fill="none" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />
                 </svg>
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-pink-300 bg-pink-900/50 px-2 py-0.5 rounded border border-pink-500/30">
                    AVG
                 </div>
            </div>
        )
    },
    {
        id: 'debate',
        title: "Debate & Discuss",
        question: "AI: Helpful or Harmful?",
        footer: "4 Slides • Engagement",
        gradient: "from-gray-500/20 to-gray-800/5",
        border: "group-hover:border-gray-400/50",
        icon: <MessageCircle size={18} className="text-gray-400" />,
        visual: (
            // Scale
            <div className="w-24 h-24 flex items-center justify-center relative">
                 <div className="absolute left-1 top-4 text-xl animate-bounce delay-100">🤖</div>
                 <div className="absolute right-1 bottom-4 text-xl animate-bounce">⚠️</div>
                 <div className="w-16 h-1 bg-gray-600 rounded-full rotate-[-15deg]"></div>
                 <div className="w-4 h-4 rounded-full bg-gray-700 absolute"></div>
            </div>
        )
    },
    {
        id: 'exit_ticket',
        title: "Daily Exit Ticket",
        question: "One thing you learned...",
        footer: "4 Slides • Assessment",
        gradient: "from-emerald-500/20 to-emerald-900/5",
        border: "group-hover:border-emerald-500/50",
        icon: <CheckCircle size={18} className="text-emerald-400" />,
        visual: (
            // Ticket Stub
            <div className="w-16 h-20 bg-gray-800 border border-emerald-500/30 rounded-lg p-2 flex flex-col gap-2 rotate-6 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <div className="w-full h-1 bg-emerald-500/50 rounded"></div>
                <div className="w-3/4 h-1 bg-emerald-500/50 rounded"></div>
                <div className="mt-auto w-full h-8 bg-emerald-500/10 rounded border border-emerald-500/20 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border border-emerald-500"></div>
                </div>
            </div>
        )
    },
    {
        id: 'group_project',
        title: "Project Planning",
        question: "Who is the team leader?",
        footer: "4 Slides • Collaboration",
        gradient: "from-violet-500/20 to-violet-900/5",
        border: "group-hover:border-violet-500/50",
        icon: <Users size={18} className="text-violet-400" />,
        visual: (
            // Avatars
            <div className="flex -space-x-3">
                 <div className="w-8 h-8 rounded-full bg-violet-900 border-2 border-gray-900 flex items-center justify-center text-[10px] text-violet-300">A</div>
                 <div className="w-8 h-8 rounded-full bg-violet-700 border-2 border-gray-900 flex items-center justify-center text-[10px] text-white shadow-[0_0_10px_rgba(139,92,246,0.5)] z-10">B</div>
                 <div className="w-8 h-8 rounded-full bg-violet-900 border-2 border-gray-900 flex items-center justify-center text-[10px] text-violet-300">C</div>
            </div>
        )
    }
  ];

  const visibleTemplates = showAll ? ALL_TEMPLATES : ALL_TEMPLATES.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-yellow-400" size={20} />
                    Instant Templates
                </h2>
                <p className="text-gray-400 text-sm mt-1">One-click interactive decks for any situation.</p>
            </div>

            <button 
                onClick={() => setShowAll(!showAll)}
                className="text-gray-400 text-sm font-bold flex items-center gap-1 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
                {showAll ? "Show less" : "See all templates"} 
                {showAll ? <ArrowUp size={14}/> : <ArrowDown size={14}/>}
            </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleTemplates.map((template) => (
                <button 
                    key={template.id}
                    onClick={() => onSelect({ 
                        title: template.title, 
                        ...TEMPLATE_DECKS[template.id]
                    })}
                    className={`
                        group relative flex flex-col h-60 rounded-3xl overflow-hidden transition-all duration-300 
                        hover:-translate-y-2 hover:shadow-2xl bg-gray-900/40 border border-white/5 text-left
                        ${template.border} hover:border-opacity-100
                    `}
                >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />

                    {/* Top Section: Visual */}
                    <div className="relative h-32 flex items-center justify-center p-4">
                        {/* Floating Icon Badge */}
                        <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-sm p-2 rounded-xl border border-white/10 shadow-lg">
                            {template.icon}
                        </div>
                        {/* The Creative Visual */}
                        <div className="transform group-hover:scale-110 transition-transform duration-500">
                            {template.visual}
                        </div>
                    </div>

                    {/* Bottom Section: Info */}
                    <div className="relative flex-1 bg-gray-900/60 backdrop-blur-sm p-5 border-t border-white/5 flex flex-col justify-between group-hover:bg-gray-900/80 transition-colors">
                        <div>
                            <h4 className="font-bold text-gray-100 text-lg leading-tight mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                                {template.title}
                            </h4>
                            <p className="text-xs text-gray-400 font-medium tracking-wide uppercase opacity-70">
                                {template.footer}
                            </p>
                        </div>

                        {/* Hover "Use" Action */}
                        <div className="mt-3 flex items-center text-xs font-bold text-white opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                            Use Template <ArrowDown className="ml-1 rotate-[-90deg]" size={12}/>
                        </div>
                    </div>
                </button>
            ))}
        </div>
        
    </div>
  );
};

export default TemplateGallery;