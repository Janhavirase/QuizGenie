// Online sound assets (so you don't have to download anything right now)
const sounds = {
    tick: new Audio("https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3"), // Ticking
    correct: new Audio("https://cdn.pixabay.com/audio/2021/08/04/audio_12b0c7443c.mp3"), // Ding!
    wrong: new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_788c22a738.mp3"), // Buzz
};

export const playSound = (type) => {
    const audio = sounds[type];
    if (audio) {
        audio.currentTime = 0; // Reset to start
        audio.play().catch(e => console.log("Audio blocked:", e));
    }
};

export const stopSound = (type) => {
    const audio = sounds[type];
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
};