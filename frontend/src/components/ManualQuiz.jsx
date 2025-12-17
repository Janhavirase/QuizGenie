import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, CheckCircle, ArrowRight, Play, FileText, List } from 'lucide-react';

const ManualCreator = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  
  // Current Question State
  const [qText, setQText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]); 
  const [correctIndex, setCorrectIndex] = useState(0); 

  // --- ACTIONS ---
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addQuestion = () => {
    if (!qText.trim()) return alert("Please enter a question text.");
    if (options.some(opt => !opt.trim())) return alert("Please fill in all options.");

    const newQuestion = {
      id: Date.now(), // Temp ID
      type: 'mcq',
      question: qText, // Use 'question' key to match Editor format
      options: options,
      correctAnswer: options[correctIndex],
      layout: 'centered',
      bgColor: '#111827',
      textColor: '#ffffff',
      visualization: 'bar',
      showPercentage: true,
      reactions: ['like', 'love', 'cat']
    };

    setQuestions([...questions, newQuestion]);
    
    // Reset Form
    setQText("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);
  };

  const deleteQuestion = (index) => {
    const newList = questions.filter((_, i) => i !== index);
    setQuestions(newList);
  };

  // --- INTEGRATION WITH SURVEY CREATOR ---
  const handleFinalize = () => {
    if (questions.length === 0) return alert("Add at least one question!");
    if (!topic.trim()) return alert("Please enter a Quiz Topic at the top!");

    // 1. Generate Standard Intro Slides
    const slideTitle = {
        id: 1,
        type: 'info',
        layout: 'title',
        question: topic,
        options: [`A custom quiz created manually.`], 
        bgColor: '#111827',
        textColor: '#ffffff'
    };

    const slideRules = {
        id: 2,
        type: 'info',
        layout: 'bullets',
        question: "Quiz Rules",
        options: [
            `This quiz contains ${questions.length} questions.`,
            "You have 20 seconds per question.",
            "Points are awarded for speed and accuracy.",
            "Good luck!"
        ],
        bgColor: '#ffffff',
        textColor: '#000000'
    };

    // 2. Combine Everything
    const fullTemplate = {
        slides: [slideTitle, slideRules, ...questions]
    };

    // 3. Navigate to Editor for Final Review
    navigate('/create-survey', { state: { template: fullTemplate } });
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans flex flex-col items-center relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* HEADER */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-10 z-10">
        <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                Manual Builder
            </h1>
            <p className="text-gray-400">Craft your questions precisely.</p>
        </div>
        <button onClick={() => navigate('/teacher')} className="px-6 py-2 rounded-full border border-gray-700 hover:bg-gray-800 transition">
            Cancel
        </button>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* --- LEFT: EDITOR (7 cols) --- */}
        <div className="lg:col-span-7 space-y-6">
            
            {/* Topic Input */}
            <div className="bg-gray-900/80 backdrop-blur-md p-6 rounded-2xl border border-gray-800">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Quiz Topic</label>
                <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter Quiz Title (e.g. Physics Final)"
                    className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-600 border-b border-gray-700 focus:border-blue-500 outline-none pb-2 transition"
                />
            </div>

            {/* Question Editor */}
            <div className="bg-gray-900/80 backdrop-blur-md p-8 rounded-3xl border border-gray-800 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Plus className="text-blue-500"/> New Question</h2>
                    <span className="text-xs font-bold bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full">Multiple Choice</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 font-bold mb-2 block">Question Text</label>
                        <textarea 
                            className="w-full bg-black/40 p-4 rounded-xl text-white outline-none border border-gray-700 focus:border-blue-500 transition resize-none text-lg"
                            rows="2"
                            placeholder="Type your question here..."
                            value={qText}
                            onChange={(e) => setQText(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm text-gray-400 font-bold block">Options <span className="text-xs font-normal opacity-50">(Select the correct answer)</span></label>
                        {options.map((opt, i) => (
                            <div key={i} onClick={() => setCorrectIndex(i)} className={`flex items-center gap-3 p-2 rounded-xl border transition cursor-pointer group ${correctIndex === i ? 'bg-green-500/10 border-green-500/50' : 'bg-transparent border-gray-800 hover:border-gray-600'}`}>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${correctIndex === i ? 'border-green-500 bg-green-500' : 'border-gray-600'}`}>
                                    {correctIndex === i && <CheckCircle size={14} className="text-black"/>}
                                </div>
                                <input 
                                    type="text" 
                                    className="flex-1 bg-transparent outline-none text-white placeholder-gray-600"
                                    placeholder={`Option ${i + 1}`}
                                    value={opt}
                                    onChange={(e) => handleOptionChange(i, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={addQuestion}
                        className="w-full mt-4 bg-white text-black hover:bg-gray-200 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2"
                    >
                        Add to Quiz <ArrowRight size={20}/>
                    </button>
                </div>
            </div>
        </div>

        {/* --- RIGHT: PREVIEW (5 cols) --- */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[500px]">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl flex flex-col h-full overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2"><List size={18}/> Quiz Queue</h3>
                    <span className="bg-gray-800 text-xs font-bold px-2 py-1 rounded">{questions.length} Items</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/20">
                    {questions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                            <FileText size={48} className="mb-4"/>
                            <p>Questions will appear here.</p>
                        </div>
                    ) : (
                        questions.map((q, i) => (
                            <div key={i} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 hover:border-gray-500 transition group relative">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">Q{i+1}</span>
                                    <button onClick={() => deleteQuestion(i)} className="text-gray-600 hover:text-red-400 transition">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                                <h4 className="font-bold text-white mb-2 line-clamp-2">{q.question}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {q.options.map((opt, idx) => (
                                        <div key={idx} className={`text-xs p-1.5 rounded truncate ${opt === q.correctAnswer ? 'bg-green-500/20 text-green-300' : 'bg-black/30 text-gray-500'}`}>
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-gray-900 border-t border-gray-800">
                    <button 
                        onClick={handleFinalize}
                        disabled={questions.length === 0}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition shadow-lg ${
                            questions.length > 0 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] text-white shadow-blue-500/20' 
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        <Play size={20} fill="currentColor"/> Finalize & Preview
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ManualCreator;