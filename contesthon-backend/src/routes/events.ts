import { Router, Request, Response } from 'express';
import { calculateFitScore } from '../services/scoring.js';
import { EventRecord, ScoredEvent } from '../types/index.js';
import { store } from '../services/store.js';

const router = Router();

// GET /api/events?userId=&location=&isFree=&mode=&search=&tags=
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, mode, tags, search, location, isFree } = req.query as Record<string, string>;

    let events = await store.getAllEvents();

    // Extract all distinct locations for frontend filter options
    const distinctLocations = Array.from(new Set(
      events.map(e => e.location).filter((loc): loc is string => Boolean(loc && loc.trim()))
    )).sort();

    // Location Filter
    if (location && location !== 'all') {
      const locQuery = location.toLowerCase().trim();
      if (locQuery === 'online') {
        events = events.filter(e => e.mode === 'online' || e.mode === 'hybrid');
      } else {
        events = events.filter(e =>
          (e.location && e.location.toLowerCase().includes(locQuery)) ||
          e.mode === 'online' // online events are also available anywhere
        );
      }
    }

    // Free / Paid Filter
    if (isFree === 'free') {
      events = events.filter(e => e.isFree !== false);
    } else if (isFree === 'paid') {
      events = events.filter(e => e.isFree === false);
    }

    // Mode Filter
    if (mode && mode !== 'any') {
      events = events.filter(e => e.mode === mode);
    }

    // Tags Filter
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim().toLowerCase());
      events = events.filter(e =>
        e.tags?.some(t => tagList.includes(t.toLowerCase()))
      );
    }

    // Keyword Search
    if (search) {
      const s = search.toLowerCase();
      events = events.filter(e =>
        e.title?.toLowerCase().includes(s) ||
        e.description?.toLowerCase().includes(s) ||
        e.tags?.some(t => t.toLowerCase().includes(s)) ||
        (e.location && e.location.toLowerCase().includes(s))
      );
    }

    // Get user profile and saved events
    let profile = null;
    let savedEventIds = new Set<string>();

    if (userId) {
      profile = await store.getUser(userId);
      savedEventIds = await store.getSavedEventIds(userId);
    }

    const scored: ScoredEvent[] = events.map(event => ({
      ...event,
      fitScore: profile ? calculateFitScore(event, profile) : {
        total: 50,
        breakdown: { eligibility: 50, skills: 50, mode: 50, timing: 50, preferences: 50 },
        explanation: 'Set up your profile for personalized scoring',
        isEligible: true,
      },
      isSaved: savedEventIds.has(event.eventId),
    }));

    scored.sort((a, b) => b.fitScore.total - a.fitScore.total);

    res.json({
      events: scored,
      count: scored.length,
      locations: distinctLocations,
    });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/saved/list?userId=
router.get('/saved/list', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query as { userId: string };
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const savedIds = await store.getSavedEventIds(userId);
    const profile = await store.getUser(userId);
    const events: ScoredEvent[] = [];

    for (const eventId of savedIds) {
      const event = await store.getEvent(eventId);
      if (event) {
        events.push({
          ...event,
          fitScore: profile ? calculateFitScore(event, profile) : {
            total: 50,
            breakdown: { eligibility: 50, skills: 50, mode: 50, timing: 50, preferences: 50 },
            explanation: '',
            isEligible: true,
          },
          isSaved: true,
        });
      }
    }

    res.json({ events, count: events.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/:eventId?userId=
router.get('/:eventId', async (req: Request, res: Response) => {
  try {
    const eventId = req.params.eventId as string;
    const { userId } = req.query as { userId?: string };

    const event = await store.getEvent(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    let profile = null;
    let isSaved = false;

    if (userId) {
      profile = await store.getUser(userId);
      const savedIds = await store.getSavedEventIds(userId);
      isSaved = savedIds.has(eventId);
    }

    const scored: ScoredEvent = {
      ...event,
      fitScore: profile ? calculateFitScore(event, profile) : {
        total: 50,
        breakdown: { eligibility: 50, skills: 50, mode: 50, timing: 50, preferences: 50 },
        explanation: 'Set up your profile for personalized scoring',
        isEligible: true,
      },
      isSaved,
    };

    res.json({ event: scored });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events/:eventId/save
router.post('/:eventId/save', async (req: Request, res: Response) => {
  try {
    const eventId = req.params.eventId as string;
    const { userId, personalNote } = req.body as { userId?: string; personalNote?: string };

    if (!userId) return res.status(400).json({ error: 'userId required' });

    await store.bookmarkEvent(userId, eventId, personalNote);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/events/:eventId/save
router.delete('/:eventId/save', async (req: Request, res: Response) => {
  try {
    const eventId = req.params.eventId as string;
    const { userId } = req.body as { userId?: string };

    if (!userId) return res.status(400).json({ error: 'userId required' });

    await store.unbookmarkEvent(userId, eventId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
