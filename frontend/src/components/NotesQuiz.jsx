import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NotesQuiz = () => {
  const [loading, setLoading] = useState(false);
  
  // New State for Quiz Settings
  const [amount, setAmount] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");
  const [type, setType] = useState("MCQ"); // MCQ, True/False, Fill-in-Blank
  
  const navigate = useNavigate();

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    
    // Append File AND Settings to FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('amount', amount);
    formData.append('difficulty', difficulty);
    formData.append('type', type);

    try {
        const res = await axios.post('http://localhost:5000/api/ai/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        // ... inside successful response block ...
if (res.data.success) {
    const questions = res.data.data;
    
    // If coming from Teacher Hub (check location.state.mode === 'host')
    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    socket.emit("create_room", { roomCode, topic: "PDF Quiz", questions });
    
    navigate(`/game/${roomCode}`, { state: { role: 'host', name: 'Teacher' } });
}
    } catch (error) {
        console.error(error);
        alert("Failed to process PDF. Make sure it has readable text!");
    } finally {
        setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-2">Upload Your Notes 📄</h1>
      <p className="text-gray-400 mb-8">Turn your textbook or class notes into a custom quiz.</p>

      {/* --- SETTINGS PANEL --- */}
      <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-2xl mb-8 border border-gray-700 shadow-xl">
        <h3 className="text-xl font-bold mb-4 text-purple-400">⚙️ Quiz Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Amount */}
            <div>
                <label className="block text-sm text-gray-400 mb-2">Number of Questions</label>
                <input 
                    type="number" 
                    min="1" max="20" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-700 p-3 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                />
            </div>

            {/* Difficulty */}
            <div>
                <label className="block text-sm text-gray-400 mb-2">Difficulty Level</label>
                <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-gray-700 p-3 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 font-bold cursor-pointer"
                >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                </select>
            </div>

            {/* Question Type */}
            <div>
                <label className="block text-sm text-gray-400 mb-2">Question Type</label>
                <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-gray-700 p-3 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 font-bold cursor-pointer"
                >
                    <option value="MCQ">Multiple Choice</option>
                    <option value="True/False">True / False</option>
                    <option value="Fill-in-Blank">Fill in Blanks</option>
                </select>
            </div>
        </div>
      </div>
      
      {/* --- DRAG & DROP ZONE --- */}
      <div 
        {...getRootProps()} 
        className={`w-full max-w-2xl h-64 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition relative overflow-hidden
          ${isDragActive ? "border-green-500 bg-gray-800 scale-105" : "border-gray-600 hover:border-purple-500 hover:bg-gray-800"}
        `}
      >
        <input {...getInputProps()} />
        {loading ? (
            <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center z-10">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xl font-bold animate-pulse">reading your PDF...</p>
            </div>
        ) : (
            <>
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition">📂</div>
                <p className="text-xl font-bold">Drag & drop PDF here</p>
                <p className="text-gray-400 mt-2">or click to browse files</p>
            </>
        )}
      </div>

    </div>
  );
};

export default NotesQuiz;