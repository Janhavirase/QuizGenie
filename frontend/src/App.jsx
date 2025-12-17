import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TeacherHub from './components/TeacherHub';
import TeacherAI from './components/TeacherAI';
// Import Components
import AIQuizGenerator from './components/AIQuizGenerator';
import ManualQuiz from './components/ManualQuiz';
import Navbar from './components/Navbar';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import SoloHub from './components/SoloHub';
import NotesQuiz from './components/NotesQuiz';
import FlashcardMode from './components/FlashcardMode';
import MathBash from './components/games/MathBash';
import WordScramble from './components/games/WordScramble';
import SurveyCreator from './components/SurveyCreator';
function App() {
  return (
    <BrowserRouter>
      {/* Navbar appears on every page */}
      <Navbar /> 
      
      <Routes>
        {/* Live Multiplayer Routes */}
        <Route path="/" element={<Lobby />} />
        
<Route path="/teacher/ai" element={<AIQuizGenerator />} />
        <Route path="/game/:roomId" element={<GameRoom />} />
        <Route path="/teacher" element={<TeacherHub />} />
<Route path="/teacher/ai" element={<TeacherAI />} />
        {/* Solo / Study Routes */}
        <Route path="/solo" element={<SoloHub />} />
        <Route path="/upload-notes" element={<NotesQuiz />} />
        <Route path="/study" element={<FlashcardMode />} />
        <Route path="/create-manual" element={<ManualQuiz />} />
        <Route path="/game/math-bash" element={<MathBash />} />
        <Route path="/game/word-scramble" element={<WordScramble />} />
        <Route path="/create-survey" element={<SurveyCreator />} />

      </Routes>
    </BrowserRouter>
  );
}

// ⬇️ THIS LINE WAS MISSING OR BROKEN
export default App;