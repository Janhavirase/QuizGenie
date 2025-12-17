import React, { useState } from 'react';
import { ArrowRight, ArrowDown, ArrowUp } from 'lucide-react';

const TemplateGallery = ({ onSelect }) => {
  const [showAll, setShowAll] = useState(false);

  // --- 1. STUDENT-TEACHER FOCUSED DECKS (Now with Ending Slides!) ---
  const TEMPLATE_DECKS = {
    pulse_check: {
        bgColor: "#FFF4E5", // Warm Orange
        textColor: "#78350f",
        slides: [
            { question: "How is your energy level today?", type: "mcq", options: ["High ⚡", "Medium 😐", "Low 😴", "Need Coffee ☕"] },
            { question: "In one word, describe your week so far.", type: "wordcloud", options: [] },
            { question: "Anything you want to share with the class?", type: "open", options: [] },
            // ✅ Automatic Ending
            { question: "Thanks for checking in!", type: "ending", options: ["Let's get this class started."] }
        ]
    },
    comprehension: {
        bgColor: "#E0E7FF", // Cool Blue
        textColor: "#312e81",
        slides: [
            { question: "How well did you understand the last topic?", type: "ranking", options: ["Totally got it", "Mostly clear", "Confused"] },
            { question: "Which concept was the hardest?", type: "wordcloud", options: [] },
            { question: "Should we review it again tomorrow?", type: "mcq", options: ["Yes, please", "No, move on"] },
            // ✅ Automatic Ending
            { question: "Feedback Received!", type: "ending", options: ["I'll adjust the next lesson based on this."] }
        ]
    },
    exam_review: {
        bgColor: "#FCE7F3", // Soft Pink
        textColor: "#831843",
        slides: [
            { question: "Rate the difficulty of yesterday's exam", type: "ranking", options: ["Easy Peasy", "Fair", "Difficult", "Impossible"] },
            { question: "Did you have enough time to finish?", type: "mcq", options: ["Yes, plenty", "Barely", "No"] },
            { question: "Which question was the trickiest?", type: "open", options: [] },
            // ✅ Automatic Ending
            { question: "Good luck on the next one!", type: "ending", options: ["Review the answer key tonight."] }
        ]
    },
    debate: {
        bgColor: "#F3F4F6", // Neutral Grey
        textColor: "#111827",
        slides: [
            { question: "Is AI helpful or harmful for learning?", type: "mcq", options: ["Helpful 🤖", "Harmful ⚠️", "Both"] },
            { question: "Why do you think that?", type: "open", options: [] },
            { question: "Vote again after the discussion!", type: "mcq", options: ["Helpful", "Harmful"] },
            // ✅ Automatic Ending
            { question: "Debate Concluded", type: "ending", options: ["Great points everyone!"] }
        ]
    },
    exit_ticket: {
        bgColor: "#ECFDF5", // Mint Green
        textColor: "#064e3b",
        slides: [
            { question: "One thing you learned today", type: "open", options: [] },
            { question: "One question you still have", type: "open", options: [] },
            { question: "Rate today's lesson", type: "mcq", options: ["⭐⭐⭐⭐⭐", "⭐⭐⭐", "⭐"] },
            // ✅ Automatic Ending
            { question: "Class Dismissed!", type: "ending", options: ["See you tomorrow."] }
        ]
    },
    group_project: {
        bgColor: "#F5F3FF", // Lilac
        textColor: "#4c1d95",
        slides: [
            { question: "Who is your group leader?", type: "open", options: [] },
            { question: "Project topic choice", type: "wordcloud", options: [] },
            { question: "Timeline feasibility", type: "ranking", options: ["On Track", "Behind", "Ahead"] },
            // ✅ Automatic Ending
            { question: "Happy Planning!", type: "ending", options: ["Remember to submit your proposal."] }
        ]
    }
  };

  // --- 2. CARD VISUALS ---
  const ALL_TEMPLATES = [
    {
        id: 'pulse_check',
        title: "Classroom Pulse Check",
        question: "How is your energy level?",
        footer: "4 Slides • Icebreaker", // Updated count
        color: "bg-[#FFF4E5]",
        hoverText: "text-[#d97706]",
        visual: (
            <div className="w-24 h-24 relative flex items-center justify-center">
                 <div className="w-16 h-8 border-4 border-[#f59e0b] rounded-lg flex items-center p-1 gap-1">
                    <div className="h-full w-1/3 bg-[#f59e0b] rounded-sm animate-pulse"></div>
                    <div className="h-full w-1/3 bg-[#f59e0b] rounded-sm animate-pulse delay-75"></div>
                    <div className="h-full w-1/3 bg-[#fcd34d] rounded-sm"></div>
                 </div>
                 <div className="absolute right-2 w-1 h-4 bg-[#f59e0b] rounded-r-md"></div>
            </div>
        )
    },
    {
        id: 'comprehension',
        title: "Lesson Comprehension",
        question: "Did you understand the topic?",
        footer: "4 Slides • Check-in", // Updated count
        color: "bg-[#E0E7FF]",
        hoverText: "text-[#4f46e5]",
        visual: (
            <div className="w-24 h-24 flex items-end justify-center gap-2 pb-2">
                 <div className="w-4 h-8 bg-[#a5b4fc] rounded-t-md"></div>
                 <div className="w-4 h-12 bg-[#6366f1] rounded-t-md"></div>
                 <div className="w-4 h-16 bg-[#4338ca] rounded-t-md"></div>
                 <div className="absolute top-8 right-6 bg-white rounded-full p-1 shadow-md border border-[#c7d2fe]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                 </div>
            </div>
        )
    },
    {
        id: 'exam_review',
        title: "Post-Exam Review",
        question: "Rate the difficulty level",
        footer: "4 Slides • Feedback", // Updated count
        color: "bg-[#FCE7F3]",
        hoverText: "text-[#db2777]",
        visual: (
            <div className="w-28 h-20 relative">
                 <svg viewBox="0 0 100 50" className="absolute bottom-6 w-full drop-shadow-sm overflow-visible">
                     <path d="M0,50 Q25,50 35,20 T50,5 T65,20 T100,50 Z" fill="#fbcfe8" />
                 </svg>
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-1 bg-[#be185d] h-12 border-l-2 border-dashed border-[#be185d]"></div>
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#831843] bg-white px-1 rounded shadow">Avg</div>
            </div>
        )
    },
    {
        id: 'debate',
        title: "Debate & Discuss",
        question: "AI: Helpful or Harmful?",
        footer: "4 Slides • Engagement", // Updated count
        color: "bg-[#F3F4F6]",
        hoverText: "text-[#1f2937]",
        visual: (
            <div className="w-24 h-24 flex items-center justify-center relative">
                 <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg absolute left-0 top-2 border-2 border-white shadow-sm">🤖</div>
                 <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-lg absolute right-0 bottom-2 border-2 border-white shadow-sm">⚠️</div>
                 <div className="w-0.5 h-12 bg-gray-300 transform rotate-45"></div>
            </div>
        )
    },
    {
        id: 'exit_ticket',
        title: "Daily Exit Ticket",
        question: "One thing you learned...",
        footer: "4 Slides • Assessment", // Updated count
        color: "bg-[#ECFDF5]",
        hoverText: "text-[#059669]",
        visual: (
            <div className="w-20 h-24 bg-white border border-[#6ee7b7] rounded-lg p-2 shadow-sm flex flex-col gap-2 rotate-6">
                <div className="w-full h-2 bg-[#d1fae5] rounded"></div>
                <div className="w-3/4 h-2 bg-[#d1fae5] rounded"></div>
                <div className="w-full h-2 bg-[#d1fae5] rounded"></div>
            </div>
        )
    },
    {
        id: 'group_project',
        title: "Project Planning",
        question: "Who is the team leader?",
        footer: "4 Slides • Collaboration", // Updated count
        color: "bg-[#F5F3FF]",
        hoverText: "text-[#7c3aed]",
        visual: (
            <div className="flex -space-x-2">
                 <div className="w-8 h-8 rounded-full bg-[#ddd6fe] border-2 border-white"></div>
                 <div className="w-8 h-8 rounded-full bg-[#c4b5fd] border-2 border-white"></div>
                 <div className="w-8 h-8 rounded-full bg-[#a855f7] border-2 border-white"></div>
            </div>
        )
    }
  ];

  const visibleTemplates = showAll ? ALL_TEMPLATES : ALL_TEMPLATES.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up delay-200 font-sans">
        
        <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-white">Classroom Templates</h2>
            <button 
                onClick={() => setShowAll(!showAll)}
                className="text-gray-400 text-sm font-bold flex items-center gap-1 hover:text-white transition"
            >
                {showAll ? "Show less" : "See all templates"} 
                {showAll ? <ArrowUp size={14}/> : <ArrowDown size={14}/>}
            </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleTemplates.map((template) => (
                <button 
                    key={template.id}
                    onClick={() => onSelect({ 
                        title: template.title, 
                        ...TEMPLATE_DECKS[template.id]
                    })}
                    className="group flex flex-col rounded-2xl overflow-hidden transition hover:shadow-2xl hover:scale-[1.02] duration-300 bg-white border border-transparent h-full"
                >
                    <div className={`h-40 ${template.color} p-6 relative flex items-center justify-between`}>
                        <p className="text-[#1e1e2f] font-bold text-lg leading-tight w-1/2 z-10 text-left">
                            {template.question}
                        </p>
                        {template.visual}
                    </div>
                    <div className="p-5 flex flex-col justify-between flex-1 w-full text-left bg-white">
                        <div>
                            <h4 className={`font-bold text-gray-900 text-base mb-1 group-hover:${template.hoverText} transition`}>
                                {template.title}
                            </h4>
                            <p className="text-sm text-gray-500">{template.footer}</p>
                        </div>
                    </div>
                </button>
            ))}
        </div>
        
    </div>
  );
};

export default TemplateGallery;