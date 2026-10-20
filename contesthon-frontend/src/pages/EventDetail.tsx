import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getEvent, prepareApplication, saveEvent, unsaveEvent } from '../api/client';
import { ScoredEvent, ApplicationRecord } from '../types';
import { FitScoreBadge } from '../components/FitScoreBadge';
import { RegistrationModal } from '../components/RegistrationModal';
import { ArrowLeft, ExternalLink, Calendar, MapPin, Users, Trophy, Clock, ShieldCheck, Loader2, Bookmark, BookmarkCheck, Zap } from 'lucide-react';
import { clsx } from 'clsx';

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<ScoredEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (eventId) loadEvent();
  }, [eventId, user?.uid]);

  const loadEvent = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await getEvent(eventId, user?.uid);
      setEvent(res.data.event);
      setIsSaved(res.data.event.isSaved);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handlePrepare = async () => {
    if (!user || !eventId) return;
    setPreparing(true);
    try {
      const res = await prepareApplication(user.uid, eventId);
      setApplication({
        applicationId: res.data.applicationId,
        eventId,
        userId: user.uid,
        status: res.data.status,
        preparedFields: res.data.preparedFields,
        missingFields: res.data.missingFields,
        agentNotes: res.data.agentNotes,
        lastUpdatedAt: new Date().toISOString(),
        userConfirmedSubmission: false,
      });
      setShowModal(true);
    } catch (err: any) {
      console.error(err);
    }
    setPreparing(false);
  };

  const handleSaveToggle = async () => {
    if (!user || !eventId || saving) return;
    setSaving(true);
    try {
      if (isSaved) {
        await unsaveEvent(eventId, user.uid);
        setIsSaved(false);
      } else {
        await saveEvent(eventId, user.uid);
        setIsSaved(true);
      }
    } catch {
      // ignore
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
    </div>
  );

  if (!event) return (
    <div className="p-6 text-center text-gray-500">Event not found</div>
  );

  const deadlineDays = event.deadline
    ? Math.ceil((new Date(event.deadline).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-5">
          {/* Header */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={clsx('badge', {
                    'bg-blue-100 text-blue-700': event.mode === 'online',
                    'bg-orange-100 text-orange-700': event.mode === 'offline',
                    'bg-purple-100 text-purple-700': event.mode === 'hybrid',
                  })}>
                    {event.mode}
                  </span>
                  {event.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="badge bg-gray-100 text-gray-600">{tag}</span>
                  ))}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{event.title}</h1>
                <p className="text-gray-500">by {event.organizer}</p>
              </div>
              <FitScoreBadge fitScore={event.fitScore} size="lg" />
            </div>

            {/* Fit Explanation */}
            {event.fitScore.explanation && (
              <div className={clsx('mt-4 p-3 rounded-lg text-sm', {
                'bg-red-50 border border-red-100 text-red-700': !event.fitScore.isEligible,
                'bg-brand-50 border border-brand-100 text-brand-700': event.fitScore.isEligible,
              })}>
                💡 {event.fitScore.isEligible ? event.fitScore.explanation : event.fitScore.ineligibilityReason}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-3">About</h2>
            <p className="text-gray-600 leading-relaxed">{event.description}</p>
          </div>

          {/* Eligibility */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Eligibility
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {event.eligibility?.rawEligibilityText || 'Open to all students'}
            </p>
            {event.eligibility?.allowedBranches?.length ? (
              <div className="mt-3">
                <p className="text-xs text-gray-500 font-medium mb-1">Allowed Branches</p>
                <div className="flex flex-wrap gap-1.5">
                  {event.eligibility.allowedBranches.map(b => (
                    <span key={b} className="badge bg-gray-100 text-gray-600">{b}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Score Breakdown */}
          {event.fitScore.isEligible && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Match Breakdown</h2>
              <div className="space-y-3">
                {Object.entries({
                  'Eligibility & Constraints': { score: event.fitScore.breakdown.eligibility, weight: '35%' },
                  'Skills & Interests': { score: event.fitScore.breakdown.skills, weight: '30%' },
                  'Mode & Location': { score: event.fitScore.breakdown.mode, weight: '15%' },
                  'Timing': { score: event.fitScore.breakdown.timing, weight: '10%' },
                  'Preferences': { score: event.fitScore.breakdown.preferences, weight: '10%' },
                }).map(([label, { score, weight }]) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{label} <span className="text-gray-400">({weight})</span></span>
                      <span className="font-semibold text-gray-900">{score}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={clsx('h-full rounded-full transition-all', {
                          'bg-green-500': score >= 75,
                          'bg-yellow-400': score >= 50 && score < 75,
                          'bg-red-400': score < 50,
                        })}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="card p-4 space-y-3">
            <button
              onClick={handlePrepare}
              disabled={preparing || !user}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              {preparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {preparing ? 'Preparing...' : 'Prepare Application'}
            </button>

            <button onClick={handleSaveToggle} disabled={saving || !user} className="w-full btn-secondary flex items-center justify-center gap-2">
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-brand-600" /> : <Bookmark className="w-4 h-4" />}
              {isSaved ? 'Saved' : 'Save Event'}
            </button>

            <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="w-full btn-secondary flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4" />
              View Source
            </a>
          </div>

          {/* Event Details */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Details</h3>
            {event.deadline && (
              <InfoRow icon={Clock} label="Registration Deadline" value={
                deadlineDays !== null && deadlineDays >= 0
                  ? `${new Date(event.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} (${deadlineDays}d left)`
                  : 'Deadline passed'
              } />
            )}
            {event.startDate && <InfoRow icon={Calendar} label="Event Start" value={new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />}
            {event.location && <InfoRow icon={MapPin} label="Location" value={event.location} />}
            <InfoRow icon={Users} label="Team Size" value={`${event.teamSize?.min}–${event.teamSize?.max} members`} />
            {event.prizes && <InfoRow icon={Trophy} label="Prizes" value={event.prizes} />}
          </div>

          {/* Data Quality */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">Data Quality</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Confidence</span>
                <span className="font-semibold text-gray-700">{Math.round(event.confidence * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Extracted</span>
                <span className="font-semibold text-gray-700">{new Date(event.extractedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && application && (
        <RegistrationModal
          application={application}
          registrationUrl={event.registrationUrl || event.sourceUrl}
          eventTitle={event.title}
          userId={user!.uid}
          onClose={() => setShowModal(false)}
          onStatusUpdate={setApplication}
        />
      )}
    </div>
  );
}
