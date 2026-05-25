import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export default function BackButton({ fallback = '/' }) {
  const navigate = useNavigate();
  const { t } = useSettings();

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }

  return (
    <button className="back-btn" onClick={handleBack} aria-label={t('back')}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      <span>{t('back')}</span>
    </button>
  );
}
