import { Router, Request, Response } from 'express';
import { searchOpportunities, fetchPageContent } from '../services/tinyfish.js';
import { extractEventFromText } from '../services/gemini.js';
import { calculateFitScore } from '../services/scoring.js';
import { EventRecord, ScoredEvent } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../services/store.js';

const router = Router();

const DEFAULT_QUERIES = [
  'hackathon 2026 registration open students',
  'coding contest students India open registration',
  'student hackathon AI ML registration deadline',
  'open source student fellowship program',
  'tech competition college students India',
];

// POST /api/discover
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, categories = [], limit = 10 } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId required' });

    // Get user profile for personalized queries
    const profile = await store.getUser(userId);

    // Build search queries from profile
    const queries: string[] = [...DEFAULT_QUERIES];
    if (profile?.interests?.length) {
      queries.push(`${profile.interests.join(' OR ')} hackathon contest 2026 students`);
    }
    if (profile?.skills?.length) {
      queries.push(`${profile.skills.slice(0, 3).join(' ')} competition hackathon open`);
    }
    if (categories.length) {
      queries.push(`${categories.join(' ')} hackathon competition 2026`);
    }

    const results: ScoredEvent[] = [];
    const seenUrls = new Set<string>();

    // Search and extract (use first 2 queries for speed and API quota safety)
    for (const query of queries.slice(0, 2)) {
      const searchResults = await searchOpportunities(query, 4);

      for (const sr of searchResults.slice(0, 3)) {
        if (seenUrls.has(sr.url) || !sr.url) continue;
        seenUrls.add(sr.url);

        // Fetch page content
        const pageText = await fetchPageContent(sr.url);
        if (!pageText || pageText.length < 100) continue;

        // Extract structured event data via Gemini
        const extracted = await extractEventFromText(pageText, sr.url);
        if (!extracted || !extracted.title) continue;

        const eventId = uuidv4();
        const event: EventRecord = {
          eventId,
          title: extracted.title || sr.title || 'Untitled Event',
          organizer: extracted.organizer || 'Unknown',
          description: extracted.description || sr.snippet || '',
          sourceUrl: sr.url,
          registrationUrl: extracted.registrationUrl || sr.url,
          eligibility: extracted.eligibility || {
            rawEligibilityText: 'Open to all',
            isRestricted: false,
          },
          startDate: extracted.startDate || null,
          deadline: extracted.deadline || null,
          mode: extracted.mode || 'online',
          location: extracted.location || null,
          teamSize: extracted.teamSize || { min: 1, max: 4 },
          prizes: extracted.prizes || null,
          tags: extracted.tags || [],
          extractedAt: new Date().toISOString(),
          confidence: extracted.confidence || 0.7,
        };

        // Save event to Store
        await store.saveEvent(event);

        // Calculate fit score
        const fitScore = profile ? calculateFitScore(event, profile) : {
          total: 50,
          breakdown: { eligibility: 50, skills: 50, mode: 50, timing: 50, preferences: 50 },
          explanation: 'Complete your profile for personalized scoring',
          isEligible: true,
        };

        results.push({ ...event, fitScore, isSaved: false });

        if (results.length >= limit) break;
      }
      if (results.length >= limit) break;
    }

    // Sort by fit score
    results.sort((a, b) => b.fitScore.total - a.fitScore.total);

    res.json({ events: results, count: results.length });
  } catch (error: any) {
    console.error('Discover error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
