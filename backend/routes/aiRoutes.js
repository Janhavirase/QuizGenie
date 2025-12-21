const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');

const upload = multer(); // Memory storage
const { aiGenerateSchema } = require('../validation'); 

// --- HELPER: VALIDATION MIDDLEWARE ---
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
};

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
// 1. NOTES/TEXT UPLOAD ROUTE (Replaced Logic)
// -------------------------------------------
router.post('/upload', async (req, res) => {
    try {
        // 1. Get Text & Settings directly from Body
        // We no longer use req.file because we are sending raw text
        const { text, count = 5, difficulty = "Medium", type = "MCQ" } = req.body;

        // Basic Validation
        // Check if 'text' exists (or if it was sent as 'topic' from the frontend)
        const contentToProcess = text || req.body.topic; 

        if (!contentToProcess || typeof contentToProcess !== 'string' || contentToProcess.trim().length === 0) {
            return res.status(400).json({ success: false, message: "No text provided for analysis." });
        }

        console.log(`📝 Processing Text Input. Length: ${contentToProcess.length} chars`);

        // 2. Safety: Truncate very long text (Token limit safety)
        const safeText = contentToProcess.substring(0, 50000); 

        // 3. Build Prompt
        const prompt = `
            You are a teacher creating a quiz from the following notes/text.
            
            SETTINGS:
            - Amount: ${count} questions
            - Difficulty: ${difficulty}
            - Type: ${type}

            NOTES CONTENT:
            "${safeText}..."
            
            OUTPUT RULES:
            - Return strictly a JSON array.
            - No Markdown, no code blocks (plain JSON).
            - Schema: [{ "questionText": "...", "options": ["..."], "correctAnswer": "..." }]
        `;

        // 4. Call AI (Using your existing fetchWithRetry helper)
        // Note: Switched to gemini-1.5-flash as it is the current standard for speed/cost
        const response = await fetchWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] }
        );

        // 5. Parse Response
        let aiText = response.data.candidates[0].content.parts[0].text;
        
        // Clean markdown formatting if present (Gemini sometimes adds ```json)
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const questions = JSON.parse(aiText);

        res.json({ success: true, data: questions });

    } catch (error) {
        console.error("Global Text/Upload Error:", error.message);
        if (error.response) {
            console.error("Google API Error Data:", error.response.data);
        }
        res.status(500).json({ success: false, message: "Failed to generate quiz from text." });
    }
});

// -------------------------------------------
// 2. AI GENERATE ROUTE (FROM TOPIC)
// -------------------------------------------
router.post('/generate', validate(aiGenerateSchema), async (req, res) => {
    // ⚠️ FIX: Extracted 'count' correctly to match your Joi schema
    const { topic, difficulty = "Medium", count = 5, type = "MCQ" } = req.body;

    try {
        const prompt = `
            You are an expert teacher. Create a quiz about "${topic}".
            
            SETTINGS:
            - Difficulty: ${difficulty}
            - Amount: ${count} questions  // ✅ Prompt now uses correct variable
            - Type: ${type}

            OUTPUT RULES:
            - Return strictly a JSON array.
            - No Markdown (no \`\`\`json).
            - Schema: [{ 
                "questionText": "Question string", 
                "options": ["Option 1", "Option 2"], 
                "correctAnswer": "Correct Option String",
                "timeLimit": 20,
                "type": "mcq"
            }]
        `;

        // 3. Call AI (Using your requested model)
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