// Run this file with: node check_models.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const checkModels = async () => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init

    console.log("🔑 Checking API Key permissions...");
    
    // Fetch list of all models
    // Note: There isn't a direct "listModels" in the simple SDK, 
    // so we test the most likely ones manually.
    
    const candidates = [
      "gemini-2.0-flash-exp",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.0-pro",
      "gemini-pro"
    ];

    console.log("\n📋 Testing Model Availability:\n");

    for (const modelName of candidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        if (response.text()) {
            console.log(`✅ SUPPORTED: ${modelName}`);
        }
      } catch (error) {
        // If 404 or 400, it's not supported
        if (error.message.includes("404") || error.message.includes("not found")) {
            console.log(`❌ NOT FOUND: ${modelName}`);
        } else if (error.message.includes("403") || error.message.includes("API key not valid")) {
            console.log(`🚫 ACCESS DENIED: ${modelName} (API Key issue)`);
        } else {
             console.log(`⚠️ ERROR on ${modelName}: ${error.message.split('\n')[0]}`);
        }
      }
    }

  } catch (error) {
    console.error("Script Error:", error);
  }
};

checkModels();