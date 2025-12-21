require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // <--- ADD THIS LINE
const User = require('./models/User'); // ✅ Ensure User model is imported
const RoomManager = require('./managers/roomManager'); // ✅ Import Redis Manager
// ✅ NEW SECURITY IMPORTS
const helmet = require('helmet');

//const xss = require('xss-clean');
const { globalLimiter, authLimiter } = require('./middleware.js/security');
const app = express();
// Disable the "X-Powered-By" header
app.disable('x-powered-by');
// 🔧 FIX: Unlock 'req.query' so mongoSanitize doesn't crash
// app.use((req, res, next) => {
//     // Check if the query property is read-only (which causes the crash)
//     const descriptor = Object.getOwnPropertyDescriptor(req, 'query');
//     if (descriptor && !descriptor.writable) {
//         // Force it to be writable
//         Object.defineProperty(req, 'query', {
//             value: req.query,
//             writable: true,
//             enumerable: true,
//             configurable: true
//         });
//     }
//     next();
// });

// JSON Parser
app.use(express.json({ limit: '10mb' }));
// ✅ CUSTOM SECURITY MIDDLEWARE (No Library Needed)
// This function cleans inputs to prevent NoSQL Injection
app.use((req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (key.startsWith('$')) {
        delete obj[key]; // Remove dangerous keys like $gt, $where
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]); // Recursively clean nested objects
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
});
// Now this will work safely
// app.use(mongoSanitize());
const server = http.createServer(app); 
const { 
    registerSchema, 
    loginSchema, 
    aiGenerateSchema, 
    quizSchema 
} = require('./validation');
// Connect DB (MongoDB for Users)
connectDB();

// --- 🛡️ APPLY SECURITY MIDDLEWARE ---

// 1. Set Security Headers
app.use(helmet()); 

// 2. Prevent CORS errors (Restrict in production!)
app.use(cors({
   origin: "*", // Add your specific frontend URLs
    methods: ["GET", "POST","PUT","DELETE"],
    credentials: false
}));

// 3. Body Parsers
// 🛡️ MIDDLEWARE: The Validator
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        // Return a clear error message to the frontend
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
};

// 5. Rate Limiting
app.use('/api', globalLimiter); // Apply global limit to all API routes
app.use('/api/login', authLimiter); // Stricter limit for login
app.use('/api/register', authLimiter); // Stricter limit for register
// ------------------------------------------
// 🔐 AUTHENTICATION ROUTES (MongoDB)
// ------------------------------------------

// 1. REGISTER
app.post('/api/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save User
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ 
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
      message: "Account created successfully" 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});
// 2. LOGIN ROUTE (Fixed)
app.post('/api/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find User
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Validate Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // 👇 GENERATE TOKEN (This was missing!)
    const token = jwt.sign(
        { id: user._id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
    );

    // Success
    res.json({ 
      message: "Login Successful",
      token: token, // Now this variable exists!
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password'); // Exclude password
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // We just send Name, Email, ID, and CreatedAt
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});
// API Routes (AI Generation)
app.use('/api/ai', require('./routes/aiRoutes'));
// 4. UPDATE USER PROFILE
app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, password } = req.body;
    const userId = req.params.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update Name
    if (name) user.name = name;

    // Update Password (only if provided)
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    // Return updated user (excluding password)
    res.json({ 
      id: user._id, 
      name: user.name, 
      email: user.email,
      // Send back other fields needed for context
      level: user.level,
      xp: user.xp 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});
// ------------------------------------------
// 🎮 GAME SOCKET LOGIC (Redis)
// ------------------------------------------

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity, or specify your React URL
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`⚡ User Connected: ${socket.id}`);

   // 1. TEACHER: CREATE ROOM
    socket.on('create_room', async ({ roomCode, topic, questions }) => {
        try {
            const initialQuestions = questions || [];
            
            const newRoom = {
                roomCode,
                topic,
                players: [],
                questions: initialQuestions,
                currentQuestionIndex: 0,
                gameStatus: 'lobby',
                stats: {}
            };

            // ✅ Save to Redis (Persistent)
            await RoomManager.setRoom(roomCode, newRoom);

            socket.join(roomCode);
            console.log(`🚀 Room ${roomCode} created in Redis.`);
            
            // Optional: Send confirmation back to client
            socket.emit("room_created_success", roomCode);

        } catch (err) {
            console.error(`❌ Error creating room ${roomCode}:`, err);
            socket.emit("error_message", "Failed to create room. Please try again.");
        }
    });
// 2. STUDENT: JOIN ROOM
    socket.on('join_room', async ({ roomCode, playerName }) => {
        // ✅ Fetch from Redis
        const room = await RoomManager.getRoom(roomCode);
        const isHost = playerName === "___HOST___";

        if (!room) {
            return socket.emit("error_message", "Room not found!");
        }

        socket.join(roomCode);

        // Player Logic (Skip for Host)
        if (!isHost) {
            // ✅ Atomic Update via Redis with SAFETY CHECK
            const updatedRoom = await RoomManager.updateRoom(roomCode, (r) => {
                // SAFETY: Ensure players array exists before accessing it
                if (!r.players) r.players = []; 

                const existingPlayer = r.players.find(p => p.name === playerName);

                if (existingPlayer) {
                    // Scenario 1: Reconnection
                    existingPlayer.id = socket.id;
                    console.log(`🔄 ${playerName} reconnected to ${roomCode}`);
                } else {
                    // Scenario 2: New Player
                    r.players.push({ id: socket.id, name: playerName, score: 0 });
                    console.log(`🎓 ${playerName} joined ${roomCode}`);
                }
                return r;
            });

            // Notify everyone with fresh data (only if update succeeded)
            if (updatedRoom) {
                io.to(roomCode).emit('update_players', updatedRoom.players);

                // Scenario 3: Late Joiner Sync
                if (updatedRoom.gameStatus === 'playing') {
                    const activeQuestion = updatedRoom.questions[updatedRoom.currentQuestionIndex];
                    if (activeQuestion) {
                        socket.emit('new_question', { 
                            question: activeQuestion, 
                            topic: "Catching up..." 
                        });
                    }
                }
            }
        }
    });

    // 3. TEACHER: START GAME
    socket.on('start_game', async ({ roomId }) => {
        // ✅ Update Status in Redis
        const updatedRoom = await RoomManager.updateRoom(roomId, (r) => {
             if (r.questions.length > 0) {
                 r.gameStatus = 'playing';
                 r.currentQuestionIndex = 0;
                 r.stats = {};
             }
             return r;
        });

        if (updatedRoom && updatedRoom.gameStatus === 'playing') {
            console.log(`🚀 Starting Game in ${roomId}`);
            const firstQuestion = updatedRoom.questions[0];
            io.to(roomId).emit('new_question', { question: firstQuestion });
            io.to(roomId).emit('game_started');
        }
    });

    // 4. TEACHER: NEXT QUESTION
    socket.on('next_question', async ({ roomId }) => {
        // ✅ Update Index in Redis
        const updatedRoom = await RoomManager.updateRoom(roomId, (r) => {
            r.currentQuestionIndex += 1;
            r.stats = {}; // Reset stats for new question
            return r;
        });

        if (updatedRoom) {
            if (updatedRoom.currentQuestionIndex < updatedRoom.questions.length) {
                const question = updatedRoom.questions[updatedRoom.currentQuestionIndex];
                io.to(roomId).emit('new_question', { question });
                io.to(roomId).emit('update_stats', {}); 
            } else {
                // Game Over
                await RoomManager.updateRoom(roomId, (r) => { r.gameStatus = 'finished'; return r; });
                io.to(roomId).emit('game_over', updatedRoom.players); 
            }
        }
    });

    // 5. REACTIONS (Pass-through, no state needed)
    socket.on("send_reaction", (data) => {
        io.to(data.roomCode).emit("reaction_received", data);
    });

    // 6. SUBMIT ANSWER
    socket.on('submit_answer', async ({ roomId, playerName, answer, timeLeft }) => {
        // ✅ Update Score & Stats in Redis
        const updatedRoom = await RoomManager.updateRoom(roomId, (r) => {
            const player = r.players.find(p => p.name === playerName);
            
            if (player) {
                player.answer = answer; 
                
                // Update Stats
                if (!r.stats) r.stats = {};
                let statsKey = answer;
                if (Array.isArray(answer)) statsKey = answer.join(" → "); 

                if (statsKey) {
                    r.stats[statsKey] = (r.stats[statsKey] || 0) + 1;
                }

                // Score Logic
                const currentQ = r.questions[r.currentQuestionIndex];
                if (currentQ && currentQ.correctAnswer === answer) {
                    const timeBonus = timeLeft ? (timeLeft * 10) : 0;
                    player.score += (100 + timeBonus);
                }
            }
            return r;
        });

        if (updatedRoom) {
             io.to(roomId).emit('update_stats', updatedRoom.stats);
             io.to(roomId).emit('update_players', updatedRoom.players);
        }
    });

    // 7. HANDLE DISCONNECT
    socket.on('disconnect', () => {
        // We do not delete from Redis here to allow reconnection
        console.log(`❌ User Disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
// Only listen if the file is run directly (not imported by tests)
if (require.main === module) {
    server.listen(PORT, () => console.log(`Server running on ${PORT}`));
}
module.exports = server; // Export app for testing

