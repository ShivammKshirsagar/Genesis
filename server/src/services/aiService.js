const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/**
 * Demo-safe Gemini wrapper
 *
 * Requirements this module enforces:
 * - Default to Gemini 1.5 Flash for stability (Gemini 2.0 often has entitlement issues in hackathon/free setups).
 * - Model name configurable in ONE place (env var), but always safe if AI is unavailable.
 * - Never throw from AI path; always return a story JSON object with the exact same shape.
 * - Simple in-memory cache by (location + interest) to avoid repeated AI calls during a demo.
 */

const DEFAULT_MODEL = 'gemini-1.5-flash';
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 12_000;

// Cache: key -> storyJson
const storyCache = new Map();

function getModelName() {
  return (process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim()) || DEFAULT_MODEL;
}

function cacheKey({ city, interest }) {
  return `${String(city || '').trim().toLowerCase()}|${String(interest || '').trim().toLowerCase()}`;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms)),
  ]);
}

function buildFallbackStory({ city, interest, rawStats }) {
  const safeCity = city || 'your city';
  const safeInterest = interest || 'your interest';
  const tempInc = rawStats?.temp_increase ?? 'some';
  const rainPct = rawStats?.rain_change_pct ?? 'unknown';

  return {
    title: `The Future of ${safeInterest} in ${safeCity}`,
    summary: `A grounded look at how changing heat and rainfall could reshape ${safeInterest} in ${safeCity} by 2050.`,
    chapters: [
      {
        id: 1,
        title: 'Today: The Familiar Rhythm',
        text: `Right now, ${safeCity} still supports the routines you love about ${safeInterest}—with predictable seasons and manageable extremes. But small shifts are already showing up: warmer nights, sharper heat spikes, and weather that changes faster than it used to.`,
        mapState: { zoom: 11, pitch: 0, overlay: 'none' },
      },
      {
        id: 2,
        title: 'The Shift: Heat Becomes the New Baseline',
        text: `Over the coming decades, a roughly ${tempInc}°C rise in peak temperatures can turn “normal” days into stress days. For ${safeInterest}, that means adjusting timing, hydration, routes, and rest—because the best results will come from working with the climate, not against it.`,
        mapState: { zoom: 13, pitch: 45, overlay: 'heat' },
      },
      {
        id: 3,
        title: '2050: Adapting, Not Giving Up',
        text: `By 2050, the biggest winners in ${safeCity} will be the people and places that adapt early: more shade, cooler surfaces, smarter schedules, and community spaces designed for comfort. Even if rainfall changes by about ${rainPct}%, ${safeInterest} can still thrive—with planning that treats climate risk as a design constraint.`,
        mapState: { zoom: 15, pitch: 60, overlay: 'drought' },
      },
    ],
  };
}

function extractJsonFromModelText(text) {
  // Gemini sometimes wraps JSON in code fences or adds leading/trailing prose.
  const cleaned = String(text || '').replace(/```json/g, '').replace(/```/g, '').trim();

  // Try direct parse first.
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Try to extract the first JSON object in the response.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const slice = cleaned.slice(start, end + 1);
      return JSON.parse(slice);
    }
    throw new Error('Model output was not valid JSON.');
  }
}

async function generateStoryJson({ prompt, city, interest, rawStats }) {
  const key = cacheKey({ city, interest });
  if (storyCache.has(key)) return storyCache.get(key);

  const modelName = getModelName();
  const apiKey = process.env.GEMINI_API_KEY;

  // If key is missing, skip AI entirely (demo-safe).
  if (!apiKey) {
    const story = buildFallbackStory({ city, interest, rawStats });
    storyCache.set(key, story);
    return story;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await withTimeout(model.generateContent(prompt), GEMINI_TIMEOUT_MS);
    const response = await result.response;
    const story = extractJsonFromModelText(response.text());

    // Cache successful AI responses.
    storyCache.set(key, story);
    return story;
  } catch (err) {
    // Never propagate AI failure: log clearly and return fallback.
    const msg = String(err?.message || err);
    console.error(
      `[AI] Gemini failed (model=${modelName}, timeout=${GEMINI_TIMEOUT_MS}ms). Returning fallback story. Error: ${msg}`
    );

    const story = buildFallbackStory({ city, interest, rawStats });
    storyCache.set(key, story);
    return story;
  }
}

module.exports = {
  DEFAULT_MODEL,
  generateStoryJson,
};

