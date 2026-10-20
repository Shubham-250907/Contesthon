import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { saveProfile, getProfile } from '../api/client';
import { Loader2, User, CheckCircle } from 'lucide-react';

const ALL_SKILLS = ['React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP', 'Data Science', 'Blockchain', 'Smart Contracts', 'Flutter', 'React Native', 'iOS', 'Android', 'AWS', 'Docker', 'Kubernetes', 'DevOps', 'UI/UX Design', 'Figma', 'Cybersecurity', 'Game Dev', 'AR/VR', 'IoT'];
const ALL_INTERESTS = ['AI/ML', 'Web Development', 'Mobile Apps', 'Blockchain/Web3', 'Open Source', 'Social Impact', 'FinTech', 'EdTech', 'HealthTech', 'Gaming', 'Cybersecurity', 'IoT', 'Data Science', 'Design'];

export function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    college: '',
    year: 1,
    branch: '',
    city: '',
    skills: [] as string[],
    interests: [] as string[],
    preferredMode: 'any' as 'online' | 'offline' | 'hybrid' | 'any',
    teamSizePreference: 'any' as 'solo' | 'team' | 'any',
    ignoreSkills: false,
  });

  useEffect(() => {
    if (user) {
      getProfile(user.uid).then(res => {
        const p = res.data.profile;
        if (p) setForm(prev => ({ ...prev, ...p }));
      }).catch(() => {});
    }
  }, [user]);

  const toggleItem = (list: string[], item: string) =>
    list.includes(item) ? list.filter(i => i !== item) : [...list, item];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await saveProfile({
        ...form,
        userId: user.uid,
        email: user.email || '',
      });
      setSaved(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
            <p className="text-gray-500 text-sm">Help us find the best opportunities for you</p>
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">Profile saved! Redirecting to dashboard...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Arjun Sharma" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">College / University *</label>
                <input className="input" value={form.college} onChange={e => setForm(f => ({ ...f, college: e.target.value }))} required placeholder="IIT Bombay" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study *</label>
                <select className="input" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}>
                  {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch / Major *</label>
                <input className="input" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} required placeholder="Computer Science" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input className="input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required placeholder="Mumbai" />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Preferences</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Mode</label>
                <select className="input" value={form.preferredMode} onChange={e => setForm(f => ({ ...f, preferredMode: e.target.value as any }))}>
                  {['any', 'online', 'offline', 'hybrid'].map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Preference</label>
                <select className="input" value={form.teamSizePreference} onChange={e => setForm(f => ({ ...f, teamSizePreference: e.target.value as any }))}>
                  {['any', 'solo', 'team'].map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.ignoreSkills}
                  onChange={e => setForm(f => ({ ...f, ignoreSkills: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-medium text-gray-800">Disable skill criteria for event suggestions</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    When checked, events will be suggested based on eligibility, location, mode, and timing regardless of specific tech skills.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Skills */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-1">Skills</h2>
            <p className="text-sm text-gray-500 mb-3">Select all that apply ({form.skills.length} selected)</p>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, skills: toggleItem(f.skills, skill) }))}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    form.skills.includes(skill)
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-1">Interests</h2>
            <p className="text-sm text-gray-500 mb-3">What domains excite you? ({form.interests.length} selected)</p>
            <div className="flex flex-wrap gap-2">
              {ALL_INTERESTS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, interests: toggleItem(f.interests, interest) }))}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    form.interests.includes(interest)
                      ? 'bg-accent-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || saved}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Save Profile & Find Opportunities
          </button>
        </form>
      </div>
    </div>
  );
}
