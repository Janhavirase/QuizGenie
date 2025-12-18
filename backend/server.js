require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app); 

// Connect DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes (AI Generation)
app.use('/api/ai', require('./routes/aiRoutes'));

// --- SOCKET.IO CONFIGURATION ---
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Make sure this matches your React URL
        methods: ["GET", "POST"]
    }
});

// Store Rooms in RAM
let rooms = {}; 
const MAX_PLAYERS = 50; 

// --- MAIN SOCKET CONNECTION HANDLER ---
// (Only ONE io.on('connection') block allowed!)
io.on('connection', (socket) => {
    console.log(`⚡ User Connected: ${socket.id}`);

    // 1. TEACHER: CREATE ROOM
    socket.on('create_room', ({ roomCode, topic, questions }) => {
        const initialQuestions = questions || [];
        rooms[roomCode] = {
            roomCode,
            topic,
            players: [],
            questions: initialQuestions,
            currentQuestionIndex: 0,
            gameStatus: 'lobby',
            stats: {}
        };
        socket.join(roomCode);
        console.log(`🚀 Room ${roomCode} created with ${initialQuestions.length} questions.`);
    });

    // 2. STUDENT: JOIN ROOM
    socket.on('join_room', ({ roomCode, playerName }) => {
        const room = rooms[roomCode];

        if (!room) {
            return socket.emit('error', 'Room not found! Check the code.');
        }
        if (room.players.length >= MAX_PLAYERS) {
            return socket.emit('error', 'Classroom is full! (Max 50)');
        }

        // Prevent Duplicates
        const existingPlayer = room.players.find(p => p.name === playerName);
        if (existingPlayer) {
            existingPlayer.id = socket.id;
        } else {
            room.players.push({ id: socket.id, name: playerName, score: 0 });
            console.log(`🎓 Student ${playerName} joined ${roomCode}`);
        }

        socket.join(roomCode);
        io.to(roomCode).emit('update_players', room.players);
    });

    // 3. TEACHER: START GAME
    socket.on('start_game', ({ roomId, questions }) => {
        const room = rooms[roomId];
        if (room) {
            if (questions && questions.length > 0) {
                room.questions = questions;
            }
            if (!room.questions || room.questions.length === 0) {
                return console.log(`❌ Room ${roomId} tried to start with NO questions!`);
            }

            room.gameStatus = 'playing';
            room.currentQuestionIndex = 0;
            
            console.log(`🚀 Starting Game in ${roomId}`);
            const firstQuestion = room.questions[0];

            io.to(roomId).emit('new_question', { question: firstQuestion });
            io.to(roomId).emit('game_started');
        }
    });

    // 4. TEACHER: NEXT QUESTION
    socket.on('next_question', ({ roomId }) => {
        const room = rooms[roomId];
        if (room) {
            room.currentQuestionIndex += 1;
            room.stats = {}; // Reset stats

            if (room.currentQuestionIndex < room.questions.length) {
                const question = room.questions[room.currentQuestionIndex];
                io.to(roomId).emit('new_question', { question });
                io.to(roomId).emit('update_stats', {}); 
            } else {
                io.to(roomId).emit('game_over');
            }
        }
    });

    // 5. REACTIONS (The Fix)
    // This handler must be here, NOT inside another listener
    socket.on("send_reaction", (data) => {
        // Broadcast to everyone in the room (Host + Students)
        io.to(data.roomCode).emit("reaction_received", data);
    });

  // 6. SUBMIT ANSWER
    socket.on('submit_answer', ({ roomId, playerName, answer, timeLeft }) => { // ✅ Added timeLeft
        const room = rooms[roomId];
        if (room) {
            const player = room.players.find(p => p.name === playerName);
            
            if (player) {
                player.answer = answer;
                
                if (!room.stats) room.stats = {};

                let statsKey = answer;
                if (typeof answer === 'object' && answer.x !== undefined) statsKey = null; 
                else if (Array.isArray(answer)) statsKey = answer.join(" → "); 

                if (statsKey) {
                    room.stats[statsKey] = (room.stats[statsKey] || 0) + 1;
                }

                // --- 🏆 NEW SCORING LOGIC (Speed + Accuracy) ---
                const currentQ = room.questions[room.currentQuestionIndex];
                if (currentQ && currentQ.correctAnswer && currentQ.correctAnswer === answer) {
                    // Base points (100) + Speed Bonus (10 points per second remaining)
                    // If no timer (surveys), just give 100
                    const timeBonus = timeLeft ? (timeLeft * 10) : 0;
                    player.score += (100 + timeBonus);
                }

                io.to(roomId).emit('update_stats', room.stats);
                io.to(roomId).emit('update_players', room.players);
            }
        }
    });
    // 7. HANDLE DISCONNECT
    socket.on('disconnect', () => {
        console.log(`❌ User Disconnected: ${socket.id}`);
        // Optional: Remove player from room logic here if needed
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Real-Time Server running on port ${PORT}`));