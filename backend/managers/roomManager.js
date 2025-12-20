const Redis = require("ioredis");
// Use your Upstash URL or default to local
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1', // Docker uses 'redis', Local uses '127.0.0.1'
  port: process.env.REDIS_PORT || 6379
});
const EXPIRY = 3600; // Rooms die after 1 hour of inactivity

class RoomManager {
    
    // 1. Generate a Key: "room:1234"
    static key(roomCode) {
        return `room:${roomCode}`;
    }

    // 2. Create or Update a Room
    static async setRoom(roomCode, data) {
        // We store the data as a JSON string
        await redis.set(this.key(roomCode), JSON.stringify(data), "EX", EXPIRY);
    }

    // 3. Get Room Data
    static async getRoom(roomCode) {
        const data = await redis.get(this.key(roomCode));
        return data ? JSON.parse(data) : null;
    }

    // 4. Update specific fields (Atomic-ish pattern for this simple app)
    // In a real production app, we would use Lua scripts or Redis Hash maps for safety.
    static async updateRoom(roomCode, updateFn) {
        const room = await this.getRoom(roomCode);
        if (!room) return null;

        const updatedRoom = updateFn(room); // Run the update logic
        await this.setRoom(roomCode, updatedRoom); // Save it back
        return updatedRoom;
    }

    // 5. Delete Room
    static async deleteRoom(roomCode) {
        await redis.del(this.key(roomCode));
    }
}

module.exports = RoomManager;