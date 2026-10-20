import { Search, SlidersHorizontal } from 'lucide-react';

interface FilterState {
  search: string;
  mode: string;
  tags: string[];
}

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const ALL_TAGS = ['AI', 'ML', 'Web3', 'Mobile', 'Open Source', 'Blockchain', 'IoT', 'Cybersecurity', 'Data Science', 'Design', 'Social Impact', 'FinTech', 'Gaming', 'EdTech'];
const MODES = ['any', 'online', 'offline', 'hybrid'];

export function FilterPanel({ filters, onChange }: Props) {
  const toggleTag = (tag: string) => {
    const tags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onChange({ ...filters, tags });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <SlidersHorizontal className="w-4 h-4" />
        Filters
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search events..."
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="input pl-9"
        />
      </div>

      {/* Mode */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mode</label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {MODES.map(mode => (
            <button
              key={mode}
              onClick={() => onChange({ ...filters, mode })}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                filters.mode === mode
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categories</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {ALL_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.tags.includes(tag)
                  ? 'bg-accent-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
