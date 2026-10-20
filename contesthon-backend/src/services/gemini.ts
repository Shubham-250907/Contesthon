import { GoogleGenerativeAI } from '@google/generative-ai';
import { EventRecord } from '../types/index.js';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const EVENT_EXTRACTION_PROMPT = `You are a strict JSON extractor for hackathons and student tech competitions.
Extract information from the webpage text provided.

Return ONLY a valid JSON object matching this schema. Use null for missing information — do NOT invent data:
{
  "title": "string or null",
  "organizer": "string or null",
  "description": "1-3 sentence summary or null",
  "registrationUrl": "string or null",
  "eligibility": {
    "minYear": null,
    "maxYear": null,
    "allowedBranches": null,
    "allowedColleges": null,
    "rawEligibilityText": "string or null",
    "isRestricted": false
  },
  "startDate": null,
  "deadline": "ISO date string or null",
  "mode": "online",
  "location": "city or venue string or null",
  "isFree": true,
  "fee": null,
  "teamSize": { "min": 1, "max": 4 },
  "prizes": "string or null",
  "tags": ["relevant tags like AI, Web3, Python, Open Source, Mobile"],
  "confidence": 0.8
}

NOTES ON isFree & fee:
- If registration is free or says "no fee" or "free to enter", set "isFree": true, "fee": "Free".
- If registration requires an entry fee, set "isFree": false, and put the fee in "fee" (e.g. "₹200", "$15").
- Most student hackathons are free ("isFree": true).

CRITICAL: Return ONLY raw JSON, no markdown codeblocks, no explanations.`;

export async function extractEventFromText(pageText: string, sourceUrl: string): Promise<Partial<EventRecord> | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const truncatedText = pageText.slice(0, 10000);

    const result = await model.generateContent(
      `${EVENT_EXTRACTION_PROMPT}\n\nSOURCE URL: ${sourceUrl}\n\nPAGE CONTENT:\n${truncatedText}`
    );

    const responseText = result.response.text().trim();
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(cleaned);
  } catch (error: any) {
    console.error('Gemini extraction error for', sourceUrl, ':', error.message);
    return null;
  }
}

export async function generateFitExplanation(
  event: EventRecord,
  userProfile: any,
  scoreBreakdown: any
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = `Explain in 1-2 concise sentences why this student matches this event:
Student: ${userProfile.name}, Year ${userProfile.year} ${userProfile.branch} in ${userProfile.city}
Event: ${event.title} in ${event.location || event.mode}
Score: ${scoreBreakdown.total}%`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return `${scoreBreakdown.total}% match based on your criteria.`;
  }
}
