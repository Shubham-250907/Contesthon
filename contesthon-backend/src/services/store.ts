import * as fs from 'fs';
import * as path from 'path';
import { db } from '../config/firebase.js';
import {
  collection, getDocs, doc, getDoc, setDoc, deleteDoc
} from 'firebase/firestore';
import { EventRecord, UserProfile, ApplicationRecord } from '../types/index.js';

interface StorageData {
  events: Record<string, EventRecord>;
  users: Record<string, UserProfile>;
  savedEvents: Record<string, string[]>; // userId -> eventIds
  applications: Record<string, Record<string, ApplicationRecord>>; // userId -> appId -> app
}

class AppStore {
  private dataDir = process.env.VERCEL ? path.resolve('/tmp', 'data') : path.resolve(process.cwd(), 'data');
  private dbFile = path.resolve(this.dataDir, 'db.json');
  private state: StorageData = {
    events: {},
    users: {},
    savedEvents: {},
    applications: {},
  };

  constructor() {
    this.loadFromFile();
  }

  private loadFromFile() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.dbFile)) {
        const raw = fs.readFileSync(this.dbFile, 'utf-8');
        this.state = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read local db.json, starting fresh:', e);
    }
  }

  private persistToFile() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.dbFile, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save to db.json:', e);
    }
  }

  // Events
  async getAllEvents(): Promise<EventRecord[]> {
    try {
      const snap = await getDocs(collection(db, 'events'));
      if (!snap.empty) {
        snap.docs.forEach(d => {
          const ev = d.data() as EventRecord;
          if (ev.eventId) this.state.events[ev.eventId] = ev;
        });
        this.persistToFile();
      }
    } catch {
      // Offline or permission fallback
    }
    return Object.values(this.state.events);
  }

  async getEvent(eventId: string): Promise<EventRecord | null> {
    if (this.state.events[eventId]) {
      return this.state.events[eventId];
    }
    try {
      const docSnap = await getDoc(doc(db, 'events', eventId));
      if (docSnap.exists()) {
        const ev = docSnap.data() as EventRecord;
        this.state.events[eventId] = ev;
        this.persistToFile();
        return ev;
      }
    } catch {}
    return null;
  }

  async saveEvent(event: EventRecord): Promise<void> {
    this.state.events[event.eventId] = event;
    this.persistToFile();
    try {
      await setDoc(doc(db, 'events', event.eventId), event, { merge: true });
    } catch {}
  }

  // User Profile
  async getUser(userId: string): Promise<UserProfile | null> {
    if (this.state.users[userId]) {
      return this.state.users[userId];
    }
    try {
      const docSnap = await getDoc(doc(db, 'users', userId));
      if (docSnap.exists()) {
        const u = docSnap.data() as UserProfile;
        this.state.users[userId] = u;
        this.persistToFile();
        return u;
      }
    } catch {}
    return null;
  }

  async saveUser(user: UserProfile): Promise<void> {
    this.state.users[user.userId] = user;
    this.persistToFile();
    try {
      await setDoc(doc(db, 'users', user.userId), user, { merge: true });
    } catch {}
  }

  // Saved Events
  async getSavedEventIds(userId: string): Promise<Set<string>> {
    const list = this.state.savedEvents[userId] || [];
    const set = new Set<string>(list);

    try {
      const snap = await getDocs(collection(db, 'users', userId, 'savedEvents'));
      snap.docs.forEach(d => set.add(d.id));
      this.state.savedEvents[userId] = Array.from(set);
      this.persistToFile();
    } catch {}

    return set;
  }

  async bookmarkEvent(userId: string, eventId: string, personalNote?: string): Promise<void> {
    if (!this.state.savedEvents[userId]) {
      this.state.savedEvents[userId] = [];
    }
    if (!this.state.savedEvents[userId].includes(eventId)) {
      this.state.savedEvents[userId].push(eventId);
    }
    this.persistToFile();

    try {
      await setDoc(doc(db, 'users', userId, 'savedEvents', eventId), {
        eventId,
        savedAt: new Date().toISOString(),
        personalNote: personalNote || '',
      });
    } catch {}
  }

  async unbookmarkEvent(userId: string, eventId: string): Promise<void> {
    if (this.state.savedEvents[userId]) {
      this.state.savedEvents[userId] = this.state.savedEvents[userId].filter(id => id !== eventId);
      this.persistToFile();
    }
    try {
      await deleteDoc(doc(db, 'users', userId, 'savedEvents', eventId));
    } catch {}
  }

  // Applications
  async saveApplication(app: ApplicationRecord): Promise<void> {
    if (!this.state.applications[app.userId]) {
      this.state.applications[app.userId] = {};
    }
    this.state.applications[app.userId][app.applicationId] = app;
    this.persistToFile();

    try {
      await setDoc(doc(db, 'users', app.userId, 'applications', app.applicationId), app, { merge: true });
    } catch {}
  }

  async getUserApplications(userId: string): Promise<ApplicationRecord[]> {
    const appsMap = this.state.applications[userId] || {};

    try {
      const snap = await getDocs(collection(db, 'users', userId, 'applications'));
      snap.docs.forEach(d => {
        const a = d.data() as ApplicationRecord;
        appsMap[a.applicationId] = a;
      });
      this.state.applications[userId] = appsMap;
      this.persistToFile();
    } catch {}

    return Object.values(appsMap);
  }

  async updateApplication(userId: string, appId: string, updates: Partial<ApplicationRecord>): Promise<ApplicationRecord | null> {
    const userApps = this.state.applications[userId];
    const existing = userApps?.[appId];
    if (!existing) return null;

    const updated = { ...existing, ...updates, lastUpdatedAt: new Date().toISOString() };
    userApps[appId] = updated;
    this.persistToFile();

    try {
      await setDoc(doc(db, 'users', userId, 'applications', appId), updated, { merge: true });
    } catch {}

    return updated;
  }
}

export const store = new AppStore();
