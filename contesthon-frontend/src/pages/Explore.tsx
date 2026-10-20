import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getEvents } from '../api/client';
import { ScoredEvent } from '../types';
import { EventCard } from '../components/EventCard';
import { Loader2, Compass, MapPin } from 'lucide-react';

export function Explore() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ScoredEvent[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEvents({
        userId: user?.uid,
        location: selectedLocation !== 'all' ? selectedLocation : undefined,
      });
      setEvents(res.data.events || []);
      if (res.data.locations && Array.isArray(res.data.locations)) {
        setLocations(res.data.locations);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    }
    setLoading(false);
  }, [user?.uid, selectedLocation]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-brand-600" />
            Explore All Hackathons
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Displaying all discovered competitions and opportunities
          </p>
        </div>

        {/* ONLY Filter: Location Filter */}
        <div className="flex items-center gap-2.5 bg-white border border-gray-300 rounded-xl px-3.5 py-2 shadow-sm min-w-[260px]">
          <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
          <div className="flex-1">
            <label htmlFor="location-filter" className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 leading-none mb-1">
              Filter by Location
            </label>
            <select
              id="location-filter"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="all">🌐 All Locations & Modes</option>
              <option value="online">💻 Online / Virtual Only</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  📍 {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : events.length === 0 ? (
          <div className="card p-12 text-center">
            <Compass className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium text-base">No hackathons found for this location</p>
            <p className="text-gray-400 text-sm mt-1">
              Select "All Locations" or run "Discover Opportunities" from the Dashboard to search the live web.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">
                Showing {events.length} {events.length === 1 ? 'hackathon' : 'hackathons'}
                {selectedLocation !== 'all' ? ` for "${selectedLocation}"` : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {events.map((event) => (
                <EventCard key={event.eventId} event={event} userId={user?.uid} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
