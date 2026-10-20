import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSavedEvents } from '../api/client';
import { ScoredEvent } from '../types';
import { EventCard } from '../components/EventCard';
import { Bookmark, Loader2 } from 'lucide-react';

export function Saved() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ScoredEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadSaved();
  }, [user]);

  const loadSaved = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getSavedEvents(user.uid);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleUnsave = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.eventId !== eventId));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-brand-600" />
          Saved Events
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">{events.length} bookmarked</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      ) : events.length === 0 ? (
        <div className="card p-10 text-center">
          <Bookmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No saved events yet</p>
          <p className="text-gray-400 text-sm mt-1">Bookmark events from Explore or Dashboard to find them here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(event => (
            <EventCard
              key={event.eventId}
              event={event}
              userId={user?.uid}
              onSaveToggle={(id, saved) => { if (!saved) handleUnsave(id); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
