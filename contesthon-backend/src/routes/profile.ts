import { Router, Request, Response } from 'express';
import { UserProfile } from '../types/index.js';
import { store } from '../services/store.js';

const router = Router();

// GET /api/profile/:userId
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const profile = await store.getUser(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/profile — create or update
router.post('/', async (req: Request, res: Response) => {
  try {
    const profileData = req.body as UserProfile;

    if (!profileData.userId || !profileData.email) {
      return res.status(400).json({ error: 'userId and email are required' });
    }

    const now = new Date().toISOString();
    const profile: UserProfile = {
      ...profileData,
      updatedAt: now,
      createdAt: profileData.createdAt || now,
    };

    await store.saveUser(profile);

    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
