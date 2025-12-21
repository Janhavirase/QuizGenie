import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // ✅ 1. Import Toaster
// --- CONTEXT & AUTH ---
import { AuthProvider } from './context/AuthContext'; 
import ProtectedRoute from './components/ProtectedRoute'; 

// --- PUBLIC COMPONENTS ---
import Navbar from './components/Navbar';
import Login from './components/Login';
import Lobby from './components/Lobby'; // Home / Join Screen
import GameRoom from './components/GameRoom'; // The actual game (Students need access)
import Register from './components/Register'; // ✅ 1. Import Register
// --- SOLO / STUDY MODES (Public) ---
import SoloHub from './components/SoloHub';
import CreateManual from './components/CreateManual';
import NotesQuiz from './components/NotesQuiz';
import FlashcardMode from './components/Study';
import MathBash from './components/games/MathBash';
import WordScramble from './components/games/WordScramble';
import ReportView from './components/ReportView'; // ✅ Import this
import SoloAI from './components/SoloAI'; //
// --- TEACHER COMPONENTS (Protected) ---
import TeacherHub from './components/TeacherHub';
import AIQuizGenerator from './components/AIQuizGenerator';
import QuizCreator from './components/QuizCreator';
import SurveyCreator from './components/SurveyCreator';
// Import
import Profile from './components/Profile';
function App() {
  return (
    <AuthProvider> {/* ✅ 1. Wrap entire app in AuthProvider */}
      <BrowserRouter>
        {/* ✅ 2. Add Toaster here. 
            'position' sets where it appears. 
            'toastOptions' styles it to match your Dark Mode. 
        */}
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#1f2937', // gray-900
              color: '#fff',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: 'white' },
            },
          }}
        />

        <Navbar /> 
        
        <Routes>
          {/* ==============================
              🔓 PUBLIC ROUTES (No Login) 
             ============================== */}
          <Route path="/" element={<Lobby />} />
          <Route path="/login" element={<Login />} />
          <Route path="/game/:roomId" element={<GameRoom />} />
          <Route path="/register" element={<Register />} /> {/* ✅ 2. Add Route */}
          {/* Solo Learning & Mini-Games */}
          <Route path="/solo" element={<SoloHub />} />
          <Route path="/upload-notes" element={<NotesQuiz />} />
          <Route path="/student/ai" element={<SoloAI />} />
          <Route path="/study" element={<FlashcardMode />} />
          <Route path="/game/math-bash" element={<MathBash />} />
          <Route path="/game/word-scramble" element={<WordScramble />} />
          <Route path="/create-manual" element={<CreateManual />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          {/* ==============================
              🔒 PROTECTED ROUTES (Teacher Only) 
             ============================== */}
          <Route 
            path="/teacher" 
            element={
              <ProtectedRoute>
                <TeacherHub />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/teacher/ai" 
            element={
              <ProtectedRoute>
                <AIQuizGenerator />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/create-quiz" 
            element={
              <ProtectedRoute>
                <QuizCreator />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/create-survey" 
            element={
              <ProtectedRoute>
                <SurveyCreator />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report/:id" 
            element={
              <ProtectedRoute>
                <ReportView />
              </ProtectedRoute>
            } 
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;