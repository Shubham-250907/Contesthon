import { Router, Request, Response } from 'express';
import { prepareRegistrationForm } from '../services/tinyfish.js';
import { ApplicationRecord } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../services/store.js';

const router = Router();

// POST /api/applications/prepare
router.post('/prepare', async (req: Request, res: Response) => {
  try {
    const { userId, eventId } = req.body;
    if (!userId || !eventId) return res.status(400).json({ error: 'userId and eventId required' });

    const profile = await store.getUser(userId);
    const event = await store.getEvent(eventId);

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const applicationId = uuidv4();
    const now = new Date().toISOString();

    const userFormData = {
      name: profile?.name || 'Applicant',
      email: profile?.email || 'applicant@college.edu',
      college: profile?.college || 'Engineering College',
      city: profile?.city || 'City',
      year: String(profile?.year || 2),
      branch: profile?.branch || 'Computer Science',
    };

    const application: ApplicationRecord = {
      applicationId,
      eventId,
      userId,
      status: 'preparing',
      preparedFields: {},
      missingFields: [],
      lastUpdatedAt: now,
      userConfirmedSubmission: false,
    };

    await store.saveApplication(application);

    // Call TinyFish Web Agent or fallback
    const formResult = await prepareRegistrationForm(event.registrationUrl || event.sourceUrl, userFormData);

    const updatedStatus: ApplicationRecord['status'] = formResult.success
      ? (formResult.missingFields.length > 0 ? 'needs_user_input' : 'ready_for_review')
      : 'preparation_failed';

    const updatedApp: ApplicationRecord = {
      ...application,
      status: updatedStatus,
      preparedFields: formResult.preparedFields,
      missingFields: formResult.missingFields,
      agentNotes: formResult.agentNotes,
      lastUpdatedAt: new Date().toISOString(),
    };

    await store.saveApplication(updatedApp);

    res.json({
      applicationId,
      status: updatedStatus,
      preparedFields: formResult.preparedFields,
      missingFields: formResult.missingFields,
      agentNotes: formResult.agentNotes,
      registrationUrl: event.registrationUrl || event.sourceUrl,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/applications?userId=
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query as { userId: string };
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const applications = await store.getUserApplications(userId);
    res.json({ applications, count: applications.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/applications/:appId
router.patch('/:appId', async (req: Request, res: Response) => {
  try {
    const appId = req.params.appId as string;
    const { userId, status, userConfirmedSubmission } = req.body as { userId?: string; status?: ApplicationRecord['status']; userConfirmedSubmission?: boolean };

    if (!userId) return res.status(400).json({ error: 'userId required' });

    const updates: Partial<ApplicationRecord> = {};
    if (status) updates.status = status;
    if (userConfirmedSubmission !== undefined) {
      updates.userConfirmedSubmission = userConfirmedSubmission;
      if (userConfirmedSubmission) updates.status = 'user_submitted';
    }

    const updated = await store.updateApplication(userId, appId, updates);
    res.json({ application: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
