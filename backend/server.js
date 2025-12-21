require('dotenv').config();
const express = require('express');
const cors = require('cors'); // ✅ Import CORS
const http = require('http'); 
const { Server } = require('socket.io'); 
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const User = require('./models/User'); 
const RoomManager = require('./managers/roomManager'); 
const helmet = require('helmet');
const { globalLimiter, authLimiter } = require('./middleware.js/security');
const { 
    registerSchema, 
    loginSchema, 
    aiGenerateSchema, 
    quizSchema 
} = require('./validation');

const app = express();

// =======================================================================
// 🛑 CRITICAL MIDDLEWARE SEQUENCE (DO NOT MOVE)
// =======================================================================

// 1. CORS (MUST BE FIRST)
// Allows your Vercel frontend to talk to this Render backend
app.use(cors({
    origin: "*", // ✅ Allow All (Vercel, Localhost, Mobile)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false // ⚠️ MUST be false if origin is "*"
}));

// 2. Handle Preflight Requests Explicitly
// Forces the server to say "OK" to the browser's initial safety check
// ✅ FIX: Use Regex instead of string '*' to prevent PathError
app.options(/.*/, cors());
// 3. Security Headers (Helmet)
app.use(helmet({
    crossOriginResourcePolicy: false, // Fixes blocking of assets
}));

// 4. Disable 'X-Powered-By' (Security)
app.disable('x-powered-by');

// 5. Body Parsers (JSON)
app.use(express.json({ limit: '10mb' }));

// 6. Custom Sanitizer (Your Logic)
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

// 7. Rate Limiting
app.use('/api', globalLimiter); 
app.use('/api/login', authLimiter); 
app.use('/api/register', authLimiter); 

// =======================================================================
// 🔌 SERVER & DB SETUP
// =======================================================================

const server = http.createServer(app); 

// Connect DB (MongoDB for Users)
connectDB();

// =======================================================================
// 🔐 AUTHENTICATION ROUTES (MongoDB)
// =======================================================================

// 🛡️ MIDDLEWARE: The Validator
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
};

// 1. REGISTER
app.post('/api/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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

// 2. LOGIN ROUTE
app.post('/api/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
        { id: user._id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
    );

    res.json({ 
      message: "Login Successful",
      token: token, 
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password'); 
    if (!user) return res.status(404).json({ message: "User not found" });
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

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({ 
      id: user._id, 
      name: user.name, 
      email: user.email,
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
        origin: "*", // ✅ Allow All
        methods: ["GET", "POST"],
        credentials: false // ⚠️ Matches Express CORS
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

            await RoomManager.setRoom(roomCode, newRoom);

            socket.join(roomCode);
            console.log(`🚀 Room ${roomCode} created in Redis.`);
            
            socket.emit("room_created_success", roomCode);

        } catch (err) {
            console.error(`❌ Error creating room ${roomCode}:`, err);
            socket.emit("error_message", "Failed to create room. Please try again.");
        }
    });

// 2. STUDENT: JOIN ROOM
    socket.on('join_room', async ({ roomCode, playerName }) => {
        const room = await RoomManager.getRoom(roomCode);
        const isHost = playerName === "___HOST___";

        if (!room) {
            return socket.emit("error_message", "Room not found!");
        }

        socket.join(roomCode);

        if (!isHost) {
            const updatedRoom = await RoomManager.updateRoom(roomCode, (r) => {
                if (!r.players) r.players = []; 

                const existingPlayer = r.players.find(p => p.name === playerName);

                if (existingPlayer) {
                    existingPlayer.id = socket.id;
                    console.log(`🔄 ${playerName} reconnected to ${roomCode}`);
                } else {
                    r.players.push({ id: socket.id, name: playerName, score: 0 });
                    console.log(`🎓 ${playerName} joined ${roomCode}`);
                }
                return r;
            });

            if (updatedRoom) {
                io.to(roomCode).emit('update_players', updatedRoom.players);

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
        const updatedRoom = await RoomManager.updateRoom(roomId, (r) => {
            r.currentQuestionIndex += 1;
            r.stats = {}; 
            return r;
        });

        if (updatedRoom) {
            if (updatedRoom.currentQuestionIndex < updatedRoom.questions.length) {
                const question = updatedRoom.questions[updatedRoom.currentQuestionIndex];
                io.to(roomId).emit('new_question', { question });
                io.to(roomId).emit('update_stats', {}); 
            } else {
                await RoomManager.updateRoom(roomId, (r) => { r.gameStatus = 'finished'; return r; });
                io.to(roomId).emit('game_over', updatedRoom.players); 
            }
        }
    });

    // 5. REACTIONS
    socket.on("send_reaction", (data) => {
        io.to(data.roomCode).emit("reaction_received", data);
    });

    // 6. SUBMIT ANSWER
    socket.on('submit_answer', async ({ roomId, playerName, answer, timeLeft }) => {
        const updatedRoom = await RoomManager.updateRoom(roomId, (r) => {
            const player = r.players.find(p => p.name === playerName);
            
            if (player) {
                player.answer = answer; 
                
                if (!r.stats) r.stats = {};
                let statsKey = answer;
                if (Array.isArray(answer)) statsKey = answer.join(" → "); 

                if (statsKey) {
                    r.stats[statsKey] = (r.stats[statsKey] || 0) + 1;
                }

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
        console.log(`❌ User Disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
    server.listen(PORT, () => console.log(`Server running on ${PORT}`));
}
module.exports = server;