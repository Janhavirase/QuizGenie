import React, { useState } from 'react';
import axios from 'axios';

const QuizGenerator = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);

  const handleGenerate = async () => {
    if (!topic) return alert("Please enter a topic!");
    
    setLoading(true);
    setQuestions([]); // Clear previous questions

    try {
      // Calling your Backend API
      const res = await axios.post('http://localhost:5000/api/ai/generate', {
        topic,
        difficulty,
        amount: 5 // We ask for 5 questions
      });

      if (res.data.success) {
        setQuestions(res.data.data);
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      alert("Failed to generate quiz. Make sure Backend is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">QuizGenie 🧞‍♂️</h1>
      
      {/* Input Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Enter Topic (e.g., React, History, Space)"
            className="border p-3 flex-1 rounded text-lg"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <select 
            className="border p-3 rounded text-lg bg-gray-50"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-4 rounded-lg text-xl font-bold hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? "Creating Magic... ✨" : "Generate Quiz 🚀"}
        </button>
      </div>

      {/* Questions Display Section */}
      {questions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Generated Questions:</h2>
          {questions.map((q, index) => (
            <div key={index} className="bg-gray-100 p-6 rounded-lg border-l-4 border-blue-500">
              <h3 className="text-xl font-semibold mb-3">
                {index + 1}. {q.questionText}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt, i) => (
                  <div key={i} className={`p-2 rounded ${opt === q.correctAnswer ? "bg-green-200 border border-green-400" : "bg-white border"}`}>
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;