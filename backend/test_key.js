require('dotenv').config();
const axios = require('axios');

async function testGemini() {
    const key = process.env.GEMINI_API_KEY;
    console.log("🔑 Testing API Key starting with:", key ? key.substring(0, 8) + "..." : "UNDEFINED");

    // 🔧 UPDATE: Switched to 'gemini-2.5-flash' (Current Standard)
    // The older 'gemini-pro' is discontinued.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

    try {
        console.log("📡 Sending 'Hello' to Google (Model: gemini-2.5-flash)...");
        
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hello, are you working?" }] }]
        });

        console.log("\n✅ SUCCESS! The API Key is working with Gemini 2.5.");
        console.log("🤖 Response:", response.data.candidates[0].content.parts[0].text);
    } catch (error) {
        console.log("\n❌ FAILED.");
        if (error.response) {
            console.log("🔴 Status:", error.response.status);
            console.log("🔴 Reason:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.log("🔴 Error:", error.message);
        }
    }
}

testGemini();