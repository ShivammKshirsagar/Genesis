// server/src/services/aiService.js
const Groq = require("groq-sdk");
require('dotenv').config();

// Initialize Groq Client
// Make sure GROQ_API_KEY is in your .env file!
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// The model: Llama 3 8B (Fastest & Free)
const MODEL_NAME = "llama-3.1-8b-instant"; 

// Cache to save money/time
const storyCache = new Map();

function cacheKey({ city, interest }) {
  return `${String(city || '').trim().toLowerCase()}|${String(interest || '').trim().toLowerCase()}`;
}

// --- The Safety Net (Fallback) ---
// If Groq fails, this story is returned so the app doesn't crash.
function buildFallbackStory({ city, interest }) {
  const safeCity = city || 'Mumbai';
  const safeInterest = interest || 'Cricket';
  
  return {
    title: `The Future of ${safeInterest} in ${safeCity}`,
    summary: `A grounded look at how changing heat and rainfall could reshape ${safeInterest} by 2050.`,
    chapters: [
      {
        id: 1,
        year: 2025,
        title: "The Present (2025)",
        text: `Today in 2025, ${safeCity} supports the routines you love. The weather is familiar, though subtle shifts are already appearing.`,
        mapState: { zoom: 11, pitch: 0, overlay: "none" }
      },
      {
        id: 2,
        year: 2035,
        title: "The Shift (2035)",
        text: `By 2035, rising temperatures change the baseline. You might notice shorter windows for ${safeInterest} as heat rises.`,
        mapState: { zoom: 13, pitch: 45, overlay: "heat" }
      },
      {
        id: 3,
        year: 2050,
        title: "The Future (2050)",
        text: `In 2050, adaptation is key. Smarter planning and resilience allow ${safeInterest} to continue in a new form despite the climate shift.`,
        mapState: { zoom: 15, pitch: 60, overlay: "drought" }
      }
    ]
  };
}

// --- The Main Generator Function ---
async function generateStoryJson({ prompt, city, interest, rawStats }) {
  const key = cacheKey({ city, interest });
  
  // 1. Check Cache
  if (storyCache.has(key)) return storyCache.get(key);

  // 2. Check Key
  if (!process.env.GROQ_API_KEY) {
    console.log("⚠️ No GROQ_API_KEY found. Using Fallback.");
    return buildFallbackStory({ city, interest });
  }

  try {
    console.log(`[AI] Sending request to Groq (${MODEL_NAME})...`);
    
    // 3. Send Request
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a JSON generator. You must output VALID JSON only. Do not add markdown ```json blocks." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: MODEL_NAME,
      temperature: 0.5,
      // This forces Groq to return JSON (Critical feature!)
      response_format: { type: "json_object" } 
    });

    // 4. Parse Response
    const jsonString = completion.choices[0]?.message?.content || "";
    const story = JSON.parse(jsonString);
    
    console.log("✅ Groq Story Generated!");
    storyCache.set(key, story);
    return story;

  } catch (error) {
    console.error(`❌ Groq Failed: ${error.message}`);
    // If AI fails, return fallback silently
    return buildFallbackStory({ city, interest });
  }
}

module.exports = { generateStoryJson };
