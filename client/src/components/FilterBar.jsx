import { useSettings } from '../context/SettingsContext';

export default function FilterBar({ value, onChange }) {
  const { t } = useSettings();
  const filters = [
    { value: 'all',    key: 'all',     icon: '🐾' },
    { value: 'cat',    key: 'cats',    icon: '🐱' },
    { value: 'dog',    key: 'dogs',    icon: '🐶' },
    { value: 'bird',   key: 'birds',   icon: '🦜' },
    { value: 'rodent', key: 'rodents', icon: '🐹' },
    { value: 'other',  key: 'other',   icon: '🐠' },
  ];
  return (
    <div className="filter-bar">
      {filters.map(f => (
        <button
          key={f.value}
          className={`filter-pill ${value === f.value ? 'active' : ''}`}
          onClick={() => onChange(f.value)}
        >
          <span>{f.icon}</span>
          <span>{t(f.key)}</span>
        </button>
      ))}
    </div>
  );
}
