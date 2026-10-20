import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getApplications, updateApplication } from '../api/client';
import { ApplicationRecord } from '../types';
import { FileText, Loader2, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

const statusInfo = {
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-600', icon: '⏸' },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-700', icon: '🔄' },
  needs_user_input: { label: 'Needs Input', color: 'bg-yellow-100 text-yellow-700', icon: '⚠️' },
  ready_for_review: { label: 'Ready to Review', color: 'bg-green-100 text-green-700', icon: '✅' },
  preparation_failed: { label: 'Failed', color: 'bg-red-100 text-red-600', icon: '❌' },
  user_submitted: { label: 'Submitted', color: 'bg-green-200 text-green-800', icon: '🎉' },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-200 text-emerald-800', icon: '🏆' },
};

export function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadApplications();
  }, [user]);

  const loadApplications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getApplications(user.uid);
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleConfirm = async (app: ApplicationRecord) => {
    if (!user) return;
    try {
      const res = await updateApplication(app.applicationId, user.uid, { userConfirmedSubmission: true, status: 'user_submitted' });
      setApplications(prev => prev.map(a => a.applicationId === app.applicationId ? res.data.application : a));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-600" />
          Applications
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Track your registration preparation progress</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      ) : applications.length === 0 ? (
        <div className="card p-10 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No applications yet</p>
          <p className="text-gray-400 text-sm mt-1">Click "Prepare Application" on any event to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => {
            const info = statusInfo[app.status];
            return (
              <div key={app.applicationId} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('badge', info.color)}>
                        {info.icon} {info.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Updated {new Date(app.lastUpdatedAt).toLocaleString()}
                    </p>
                    {app.agentNotes && (
                      <p className="text-sm text-gray-500 mt-2">{app.agentNotes}</p>
                    )}
                  </div>
                </div>

                {/* Prepared Fields Preview */}
                {Object.keys(app.preparedFields || {}).length > 0 && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-1">
                    {Object.entries(app.preparedFields).slice(0, 3).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs text-gray-600">
                        <span className="text-gray-400">{k}</span>
                        <span className="font-medium">{v}</span>
                      </div>
                    ))}
                    {Object.keys(app.preparedFields).length > 3 && (
                      <p className="text-xs text-gray-400">+{Object.keys(app.preparedFields).length - 3} more fields</p>
                    )}
                  </div>
                )}

                {/* Missing Fields */}
                {app.missingFields?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {app.missingFields.map(f => (
                      <span key={f} className="badge bg-yellow-50 text-yellow-700 border border-yellow-200">⚠ {f}</span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {!app.userConfirmedSubmission && app.status !== 'preparation_failed' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleConfirm(app)}
                      className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Submitted
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
