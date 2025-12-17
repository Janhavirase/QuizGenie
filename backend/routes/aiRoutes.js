const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');

const upload = multer(); // Memory storage

// --- HELPER: RETRY LOGIC ---
const fetchWithRetry = async (url, data, retries = 3, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await axios.post(url, data);
        } catch (error) {
            const status = error.response ? error.response.status : 0;
            if (i < retries - 1 && (status === 429 || status === 503)) {
                console.log(`⏳ Google API Busy (${status}). Retrying in ${delay/1000}s... (Attempt ${i + 1})`);
                await new Promise(res => setTimeout(res, delay));
            } else {
                throw error;
            }
        }
    }
};

// -------------------------------------------
// 1. PDF UPLOAD ROUTE
// -------------------------------------------
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

        console.log(`📄 Processing PDF: ${req.file.originalname}`);

        // --- DYNAMIC IMPORT FOR PDF LIB ---
        // This fixes the 'ERR_REQUIRE_ASYNC_MODULE' crash
        const pdfParseModule = await import('pdf-parse');
        const pdfParse = pdfParseModule.default || pdfParseModule;

        // 1. Extract Text
        let textContent = "";
        try {
            const data = await pdfParse(req.file.buffer);
            textContent = data.text;
            console.log("✅ PDF Read Success. Characters:", textContent.length);
        } catch (pdfError) {
            console.error("❌ Internal PDF Parse Error:", pdfError);
            return res.status(500).json({ success: false, message: "Could not read PDF text." });
        }

        if (!textContent || textContent.trim().length === 0) {
            return res.status(400).json({ success: false, message: "PDF contains no readable text." });
        }

        // 2. Build Prompt
        const { amount = 5, difficulty = "Medium", type = "MCQ" } = req.body;
        
        // Gemini 2.5 Flash has a huge context window (1M tokens), so we can send more text safely
        const safeText = textContent.substring(0, 100000);

        const prompt = `
            You are a teacher creating a quiz from the following notes.
            
            SETTINGS:
            - Amount: ${amount} questions
            - Difficulty: ${difficulty}
            - Type: ${type}

            NOTES CONTENT:
            "${safeText}..." 
            
            OUTPUT RULES:
            - Return strictly a JSON array.
            - No Markdown, no code blocks.
            - Schema: [{ "questionText": "...", "options": ["..."], "correctAnswer": "..." }]
        `;

        // ✅ USING GEMINI 2.5 FLASH (Current Standard)
        const response = await fetchWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] }
        );

        let aiText = response.data.candidates[0].content.parts[0].text;
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const questions = JSON.parse(aiText);

        res.json({ success: true, data: questions });

    } catch (error) {
        console.error("Global Upload Error:", error.message);
        if (error.response) {
            console.error("Google API Error Data:", error.response.data);
        }
        res.status(500).json({ success: false, message: "Failed to process request" });
    }
});

// -------------------------------------------
// 2. AI GENERATE ROUTE (FROM TOPIC)
// -------------------------------------------
router.post('/generate', async (req, res) => {
    const { topic, difficulty = "Medium", amount = 5, type = "MCQ" } = req.body;

    try {
        const prompt = `
            You are an expert teacher. Create a quiz about "${topic}".
            
            SETTINGS:
            - Difficulty: ${difficulty}
            - Amount: ${amount} questions
            - Type: ${type}

            OUTPUT RULES:
            - Return strictly a JSON array.
            - No Markdown (no \`\`\`json).
            - Schema: [{ 
                "questionText": "Question string", 
                "options": ["Option 1", "Option 2"], 
                "correctAnswer": "Correct Option String"
            }]
        `;

        // ✅ USING GEMINI 2.5 FLASH
        const response = await fetchWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] }
        );

        let aiText = response.data.candidates[0].content.parts[0].text;
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const questions = JSON.parse(aiText);

        res.json({ success: true, data: questions });

    } catch (error) {
        console.error("AI Error:", error.message);
        res.status(500).json({ success: false, message: "AI Generation Failed" });
    }
});

module.exports = router;