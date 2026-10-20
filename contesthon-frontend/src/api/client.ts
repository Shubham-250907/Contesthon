import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Profile
export const getProfile = (userId: string) => api.get(`/profile/${userId}`);
export const saveProfile = (profile: any) => api.post('/profile', profile);

// Discover
export const discoverEvents = (userId: string, categories?: string[]) =>
  api.post('/discover', { userId, categories, limit: 15 });

// Events
export const getEvents = (params: {
  userId?: string;
  mode?: string;
  tags?: string;
  search?: string;
  location?: string;
  isFree?: string;
}) => api.get('/events', { params });

export const getEvent = (eventId: string, userId?: string) =>
  api.get(`/events/${eventId}`, { params: { userId } });

export const saveEvent = (eventId: string, userId: string, personalNote?: string) =>
  api.post(`/events/${eventId}/save`, { userId, personalNote });

export const unsaveEvent = (eventId: string, userId: string) =>
  api.delete(`/events/${eventId}/save`, { data: { userId } });

export const getSavedEvents = (userId: string) =>
  api.get('/events/saved/list', { params: { userId } });

// Applications
export const prepareApplication = (userId: string, eventId: string) =>
  api.post('/applications/prepare', { userId, eventId });

export const getApplications = (userId: string) =>
  api.get('/applications', { params: { userId } });

export const updateApplication = (appId: string, userId: string, updates: any) =>
  api.patch(`/applications/${appId}`, { userId, ...updates });
