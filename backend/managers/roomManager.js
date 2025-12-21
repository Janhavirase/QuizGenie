const Redis = require("ioredis");

// --- CONFIGURATION ---
// Set this to TRUE only if you have Redis running locally or a URL in .env
const ENABLE_REDIS = process.env.ENABLE_REDIS === 'true'; 

let redisClient;
let localStore = new Map(); // Fallback RAM storage

if (ENABLE_REDIS) {
    console.log("🔌 Attempting to connect to Redis...");
    redisClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
        // This prevents the app from crashing if Redis is down
        retryStrategy: (times) => {
            if (times > 3) {
                console.warn("⚠️ Redis unreachable. Switching to In-Memory Mode.");
                return null; // Stop retrying
            }
            return Math.min(times * 50, 2000);
        }
    });

    redisClient.on("error", (err) => {
        // Silently handle error so server doesn't crash
        // console.error("Redis Error (Handled):", err.message);
    });
} else {
    console.log("🧠 Redis disabled. Using In-Memory Store (RAM).");
}

// --- THE MANAGER CLASS ---
const RoomManager = {
    
    // 1. SET ROOM
    setRoom: async (roomCode, roomData) => {
        if (redisClient && redisClient.status === 'ready') {
            // ✅ IMPRESSIVE REDIS CODE
            // We store as a string with a 1-hour expiration (TTL)
            await redisClient.set(roomCode, JSON.stringify(roomData), "EX", 3600);
        } else {
            // 🛡️ SAFE FALLBACK CODE
            localStore.set(roomCode, roomData);
        }
        return roomData;
    },

    // 2. GET ROOM
    getRoom: async (roomCode) => {
        if (redisClient && redisClient.status === 'ready') {
            const data = await redisClient.get(roomCode);
            return data ? JSON.parse(data) : null;
        } else {
            return localStore.get(roomCode) || null;
        }
    },

    // 3. UPDATE ROOM (Atomic Simulation)
    updateRoom: async (roomCode, updateFn) => {
        // Fetch current state
        let room = await RoomManager.getRoom(roomCode);
        if (!room) return null;

        // Apply updates
        const updatedRoom = updateFn(room);

        // Save back
        await RoomManager.setRoom(roomCode, updatedRoom);
        return updatedRoom;
    },

    // 4. DELETE ROOM
    deleteRoom: async (roomCode) => {
        if (redisClient && redisClient.status === 'ready') {
            await redisClient.del(roomCode);
        } else {
            localStore.delete(roomCode);
        }
    }
};

module.exports = RoomManager;