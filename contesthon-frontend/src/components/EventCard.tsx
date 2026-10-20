import React, { useState } from 'react';
import { ScoredEvent } from '../types';
import { FitScoreBadge } from './FitScoreBadge';
import { Users, Trophy, ExternalLink, Bookmark, BookmarkCheck, Clock, MapPin, Tag } from 'lucide-react';
import { clsx } from 'clsx';
import { saveEvent, unsaveEvent } from '../api/client';
import { Link } from 'react-router-dom';

interface Props {
  event: ScoredEvent;
  userId?: string;
  onSaveToggle?: (eventId: string, isSaved: boolean) => void;
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'No deadline listed';
  const d = new Date(deadline);
  const now = new Date();
  const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Deadline passed';
  if (days === 0) return 'Closes today!';
  if (days === 1) return '1 day left';
  if (days <= 7) return `${days} days left`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const modeColor = {
  online: 'bg-blue-100 text-blue-700',
  offline: 'bg-orange-100 text-orange-700',
  hybrid: 'bg-purple-100 text-purple-700',
};

export function EventCard({ event, userId, onSaveToggle }: Props) {
  const [isSaved, setIsSaved] = useState(event.isSaved);
  const [saving, setSaving] = useState(false);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!userId || saving) return;
    setSaving(true);
    try {
      if (isSaved) {
        await unsaveEvent(event.eventId, userId);
        setIsSaved(false);
        onSaveToggle?.(event.eventId, false);
      } else {
        await saveEvent(event.eventId, userId);
        setIsSaved(true);
        onSaveToggle?.(event.eventId, true);
      }
    } catch (err) {
      console.error('Save toggle error:', err);
    }
    setSaving(false);
  };

  return (
    <div className="card p-5 flex flex-col gap-3 group relative">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className={clsx('badge', modeColor[event.mode])}>
              {event.mode}
            </span>
            {event.isFree === false ? (
              <span className="badge bg-amber-100 text-amber-800 font-semibold flex items-center gap-0.5">
                <Tag className="w-3 h-3" />
                {event.fee || 'Paid Entry'}
              </span>
            ) : (
              <span className="badge bg-emerald-100 text-emerald-700 font-semibold">
                Free Entry
              </span>
            )}
            {event.location && (
              <span className="badge bg-gray-100 text-gray-700 flex items-center gap-1 truncate max-w-[180px]">
                <MapPin className="w-3 h-3 text-gray-500" />
                {event.location}
              </span>
            )}
            {event.confidence >= 0.8 && (
              <span className="badge bg-green-50 text-green-600">verified</span>
            )}
          </div>

          <Link to={`/events/${event.eventId}`}>
            <h3 className="font-semibold text-gray-900 hover:text-brand-600 transition-colors line-clamp-2 cursor-pointer">
              {event.title}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 mt-0.5">{event.organizer}</p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <FitScoreBadge fitScore={event.fitScore} size="sm" />
          {userId && (
            <button
              onClick={handleSaveToggle}
              disabled={saving}
              className="text-gray-400 hover:text-brand-600 transition-colors p-1"
              title={isSaved ? 'Remove bookmark' : 'Bookmark event'}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5 text-brand-600" /> : <Bookmark className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>

      {/* Tags */}
      {event.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {event.tags.slice(0, 4).map(tag => (
            <span key={tag} className="badge bg-gray-100 text-gray-600">{tag}</span>
          ))}
          {event.tags.length > 4 && (
            <span className="badge bg-gray-100 text-gray-500">+{event.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span className={clsx(
            event.deadline && new Date(event.deadline) < new Date() ? 'text-red-500' :
            event.deadline && Math.ceil((new Date(event.deadline).getTime() - Date.now()) / 86400000) <= 3 ? 'text-orange-500 font-semibold' : ''
          )}>
            {formatDeadline(event.deadline)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>Team {event.teamSize?.min}–{event.teamSize?.max}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
            <MapPin className="w-3.5 h-3.5 text-brand-600" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
        {event.prizes && (
          <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            <span className="truncate">{event.prizes}</span>
          </div>
        )}
      </div>

      {/* Fit explanation */}
      {event.fitScore.explanation && (
        <p className="text-xs text-brand-700 bg-brand-50 rounded-lg px-3 py-2 border border-brand-100">
          💡 {event.fitScore.explanation}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-600 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Source
        </a>
        <span className="text-gray-200">•</span>
        <span className="text-xs text-gray-400">
          Updated {new Date(event.extractedAt).toLocaleDateString()}
        </span>
        <Link
          to={`/events/${event.eventId}`}
          className="ml-auto btn-primary text-xs py-1.5 px-3"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
