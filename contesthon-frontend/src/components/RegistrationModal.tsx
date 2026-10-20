import { useState } from 'react';
import { ApplicationRecord } from '../types';
import { X, CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { updateApplication } from '../api/client';
import { clsx } from 'clsx';

interface Props {
  application: ApplicationRecord | null;
  registrationUrl?: string;
  eventTitle?: string;
  userId: string;
  onClose: () => void;
  onStatusUpdate: (app: ApplicationRecord) => void;
}

const statusConfig = {
  not_started: { label: 'Not Started', color: 'text-gray-500', icon: '⏸' },
  preparing: { label: 'Preparing...', color: 'text-blue-600', icon: '🔄' },
  needs_user_input: { label: 'Needs Your Input', color: 'text-yellow-600', icon: '⚠️' },
  ready_for_review: { label: 'Ready for Review', color: 'text-green-600', icon: '✅' },
  preparation_failed: { label: 'Preparation Failed', color: 'text-red-500', icon: '❌' },
  user_submitted: { label: 'Submitted by You', color: 'text-green-700', icon: '🎉' },
  confirmed: { label: 'Confirmed', color: 'text-green-800', icon: '🏆' },
};

export function RegistrationModal({ application, registrationUrl, eventTitle, userId, onClose, onStatusUpdate }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(application?.userConfirmedSubmission || false);

  if (!application) return null;

  const status = statusConfig[application.status];

  const handleConfirmSubmission = async () => {
    setConfirming(true);
    try {
      const res = await updateApplication(application.applicationId, userId, {
        userConfirmedSubmission: true,
        status: 'user_submitted',
      });
      setConfirmed(true);
      onStatusUpdate(res.data.application);
    } catch (err) {
      console.error(err);
    }
    setConfirming(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Registration Assistant</h2>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{eventTitle}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status Banner */}
          <div className={clsx('flex items-center gap-2 p-3 rounded-lg', {
            'bg-yellow-50 border border-yellow-200': application.status === 'needs_user_input',
            'bg-green-50 border border-green-200': application.status === 'ready_for_review' || application.status === 'user_submitted',
            'bg-red-50 border border-red-200': application.status === 'preparation_failed',
            'bg-blue-50 border border-blue-200': application.status === 'preparing',
            'bg-gray-50 border border-gray-200': application.status === 'not_started',
          })}>
            <span className="text-lg">{status.icon}</span>
            <div>
              <p className={clsx('font-semibold text-sm', status.color)}>{status.label}</p>
              {application.agentNotes && (
                <p className="text-xs text-gray-500 mt-0.5">{application.agentNotes}</p>
              )}
            </div>
          </div>

          {/* Safety Notice */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>Human-in-the-loop:</strong> ContestHon never auto-submits. All form data is shown here for your review before you submit manually.
            </p>
          </div>

          {/* Prepared Fields */}
          {Object.keys(application.preparedFields || {}).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Pre-filled Fields ({Object.keys(application.preparedFields).length})
              </h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-100">
                {Object.entries(application.preparedFields).map(([field, value]) => (
                  <div key={field} className="px-3 py-2 flex justify-between items-start gap-2 text-sm">
                    <span className="text-gray-500 shrink-0">{field}</span>
                    <span className="text-gray-900 font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Fields */}
          {application.missingFields?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                Needs Your Input ({application.missingFields.length})
              </h3>
              <ul className="bg-yellow-50 rounded-lg border border-yellow-100 divide-y divide-yellow-100">
                {application.missingFields.map(field => (
                  <li key={field} className="px-3 py-2 text-sm text-yellow-800">• {field}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {registrationUrl && (
              <a
                href={registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full btn-primary"
              >
                <ExternalLink className="w-4 h-4" />
                Open Registration Page
              </a>
            )}

            {!confirmed && application.status !== 'preparation_failed' && (
              <button
                onClick={handleConfirmSubmission}
                disabled={confirming}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                I have completed submission
              </button>
            )}

            {confirmed && (
              <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-semibold">Marked as submitted!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
