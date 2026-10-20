import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { discoverEvents, getEvents, getProfile, saveProfile } from '../api/client';
import { ScoredEvent, UserProfile } from '../types';
import { EventCard } from '../components/EventCard';
import { Zap, Trophy, Target, Clock, TrendingUp, Loader2, MapPin, Tag, Sliders } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ScoredEvent[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [updatingSkills, setUpdatingSkills] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [ignoreSkills, setIgnoreSkills] = useState<boolean>(false);

  // Load user profile
  useEffect(() => {
    if (user?.uid) {
      getProfile(user.uid)
        .then(res => {
          if (res.data?.profile) {
            setProfile(res.data.profile);
            setIgnoreSkills(Boolean(res.data.profile.ignoreSkills));
          }
        })
        .catch(() => {});
    }
  }, [user?.uid]);

  const loadEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getEvents({
        userId: user.uid,
        location: selectedLocation !== 'all' ? selectedLocation : undefined,
        isFree: priceFilter !== 'all' ? priceFilter : undefined,
      });
      setEvents(res.data.events || []);
      if (res.data.locations && Array.isArray(res.data.locations)) {
        setLocations(res.data.locations);
      }
    } catch {
      setError('Failed to load events');
    }
    setLoading(false);
  }, [user, selectedLocation, priceFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleToggleIgnoreSkills = async () => {
    if (!user || updatingSkills) return;
    const nextVal = !ignoreSkills;
    setIgnoreSkills(nextVal);
    setUpdatingSkills(true);

    try {
      const updatedProfile = {
        ...(profile || {
          userId: user.uid,
          email: user.email || '',
          name: user.displayName || 'Student',
          college: '',
          year: 1,
          branch: '',
          skills: [],
          interests: [],
          preferredMode: 'any',
          city: '',
          teamSizePreference: 'any',
        }),
        ignoreSkills: nextVal,
      };
      await saveProfile(updatedProfile);
      setProfile(updatedProfile as UserProfile);
      // Reload events to apply new scoring
      await loadEvents();
    } catch (e) {
      console.error('Failed to update skill preference:', e);
    }
    setUpdatingSkills(false);
  };

  const handleDiscover = async () => {
    if (!user) return;
    setDiscovering(true);
    setError('');
    try {
      const res = await discoverEvents(user.uid);
      setEvents(prev => {
        const existingIds = new Set(prev.map(e => e.eventId));
        const newEvents = (res.data.events || []).filter((e: ScoredEvent) => !existingIds.has(e.eventId));
        return [...newEvents, ...prev];
      });
      await loadEvents();
    } catch (err: any) {
      setError('Discovery failed: ' + (err.response?.data?.error || err.message));
    }
    setDiscovering(false);
  };

  const topEvents = events.filter(e => e.fitScore.isEligible).sort((a, b) => b.fitScore.total - a.fitScore.total);
  const urgent = events.filter(e => {
    if (!e.deadline) return false;
    const days = Math.ceil((new Date(e.deadline).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 7;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your personalized opportunity assistant</p>
        </div>
        <button
          onClick={handleDiscover}
          disabled={discovering}
          className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 shadow-sm"
        >
          {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {discovering ? 'Searching Live Web...' : 'Discover New Opportunities'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Found', value: events.length, icon: Trophy, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Eligible For', value: events.filter(e => e.fitScore.isEligible).length, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Closing Soon', value: urgent.length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Top Match', value: topEvents[0] ? `${topEvents[0].fitScore.total}%` : '—', icon: TrendingUp, color: 'text-accent-600', bg: 'bg-accent-50/50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls & Filters Bar */}
      <div className="card p-4 space-y-3.5 bg-white border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Location & Paid/Free Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Location Selector */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="bg-transparent font-medium text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Locations</option>
                <option value="online">Online / Virtual</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Paid & Free Filter Pills */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 text-xs">
              <Tag className="w-3.5 h-3.5 text-gray-400 ml-1.5 mr-0.5 shrink-0" />
              {(['all', 'free', 'paid'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriceFilter(p)}
                  className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                    priceFilter === p
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {p === 'all' ? 'All Fees' : p === 'free' ? 'Free Only' : 'Paid Only'}
                </button>
              ))}
            </div>
          </div>

          {/* Skill Matching Toggle (User Option) */}
          <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <Sliders className="w-4 h-4 text-accent-600 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-gray-800">Skill Criteria:</span>{' '}
              <span className={ignoreSkills ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}>
                {ignoreSkills ? 'Disabled (All Domains)' : 'Enabled (10% weight)'}
              </span>
            </div>
            <button
              onClick={handleToggleIgnoreSkills}
              disabled={updatingSkills}
              className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                ignoreSkills
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {updatingSkills ? 'Updating...' : ignoreSkills ? 'Re-enable Skills' : 'Disable Skills'}
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Closing Soon Notice */}
      {urgent.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <h2 className="font-semibold text-orange-800 flex items-center gap-2 mb-2 text-sm">
            <Clock className="w-4 h-4" />
            Closing Within 7 Days ({urgent.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {urgent.map(e => (
              <Link
                key={e.eventId}
                to={`/events/${e.eventId}`}
                className="text-xs bg-white border border-orange-200 rounded-lg px-3 py-1.5 text-orange-700 hover:bg-orange-100 transition-colors"
              >
                {e.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Live Discovery Progress */}
      {discovering && (
        <div className="flex items-center justify-center gap-3 py-16 text-gray-500 card">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <div>
            <p className="font-semibold text-gray-800">TinyFish is searching the live web...</p>
            <p className="text-xs text-gray-500 mt-0.5">Fetching registration pages and extracting details via Gemini AI</p>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {!discovering && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">
              {topEvents.length > 0
                ? `Opportunities (${topEvents.length})`
                : 'No opportunities found'}
            </h2>
            {events.length > 6 && (
              <Link to="/explore" className="text-sm text-brand-600 hover:underline">
                View all in Explore →
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            </div>
          ) : topEvents.length === 0 ? (
            <div className="card p-10 text-center">
              <Zap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium text-base">No opportunities matching your filters</p>
              <p className="text-gray-400 text-sm mt-1 mb-5">
                Adjust your location/fee filters or click below to search the live web for new hackathons.
              </p>
              <button
                onClick={handleDiscover}
                disabled={discovering}
                className="btn-primary text-sm inline-flex items-center gap-2 px-5 py-2.5 shadow-sm"
              >
                <Zap className="w-4 h-4" />
                {discovering ? 'Discovering Live Opportunities...' : 'Discover Opportunities'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topEvents.map(event => (
                <EventCard key={event.eventId} event={event} userId={user?.uid} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
