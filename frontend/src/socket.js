import io from 'socket.io-client';

// The one and only connection
export const socket = io.connect("https://quizgenie-22xy.onrender.com");