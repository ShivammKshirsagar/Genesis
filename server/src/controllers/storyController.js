// server/src/controllers/storyController.js
const { getHistoricalWeather, getFutureClimate, calculateImpact } = require('../services/climateService');
const { generateStoryJson } = require('../services/aiService');
require('dotenv').config();

const generateStory = async (req, res) => {
    const { city, lat, long, interest } = req.body;

    // 1. Validation
    if (!lat || !long || !interest) {
        return res.status(400).json({ error: "Missing lat, long, or interest" });
    }

    try {
        console.log(`\n--- 1. Fetching Climate Data for ${city} ---`);
        
        // CALL MEMBER 3's FUNCTIONS
        const history = await getHistoricalWeather(lat, long);
        const future = await getFutureClimate(lat, long);

        let impactText = "Data unavailable";
        let rawStats = {};

        if (history && future) {
            const impact = calculateImpact(history, future);
            rawStats = impact;
            impactText = `
                - Historical Avg Max Temp: ${impact.raw_stats.past_temp}°C
                - Future Avg Max Temp (2050): ${impact.raw_stats.future_temp}°C
                - Net Increase: ${impact.temp_increase}°C
                - Precipitation Change: ${impact.rain_change_pct}%
            `;
            console.log("✅ Data Impact Calculated:", impactText);
        }

        console.log(`\n--- 2. Asking Gemini to write the story ---`);

        // THE GOLDEN PROMPT
        const prompt = `
            You are an expert narrative designer for a climate awareness app.
            
            USER PROFILE:
            - Location: ${city}
            - Interest: ${interest}
            
            REAL SCIENTIFIC DATA (Source: Open-Meteo CMIP6):
            ${impactText}

            TASK:
            Write a hyper-personalized 3-chapter story about how this specific climate change impacts their interest in ${interest}.
            - Chapter 1: The Present (Context of the city today).
            - Chapter 2: The Shift (How the changing weather starts affecting the activity).
            - Chapter 3: The Future (2050) (The new reality, stark but grounded).

            STRICT JSON OUTPUT FORMAT (No Markdown, just raw JSON):
            {
                "title": "The Future of ${interest} in ${city}",
                "summary": "One sentence summary of the change.",
                "chapters": [
                    {
                        "id": 1,
                        "title": "Chapter Title",
                        "text": "Story text here (approx 40 words).",
                        "mapState": { "zoom": 11, "pitch": 0, "overlay": "none" }
                    },
                    {
                        "id": 2,
                        "title": "Chapter Title",
                        "text": "Story text here (approx 40 words). Mention the ${rawStats.temp_increase || 'rising'} degree change.",
                        "mapState": { "zoom": 13, "pitch": 45, "overlay": "heat" }
                    },
                    {
                        "id": 3,
                        "title": "Chapter Title",
                        "text": "Story text here (approx 40 words). Focus on adaptation.",
                        "mapState": { "zoom": 15, "pitch": 60, "overlay": "drought" }
                    }
                ]
            }
        `;

        const storyJson = await generateStoryJson({
            prompt,
            city,
            interest,
            rawStats,
        });
        
        console.log("✅ Story Generated Successfully");
        res.json(storyJson);

    } catch (error) {
        console.error("❌ Generator Error:", error);
        res.status(500).json({ 
            error: "Failed to generate story",
            details: error.message 
        });
    }
};

module.exports = { generateStory };