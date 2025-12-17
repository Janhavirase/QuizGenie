import io from 'socket.io-client';

// The one and only connection
export const socket = io.connect("http://localhost:5000");