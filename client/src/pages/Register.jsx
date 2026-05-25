import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Register() {
  const { login } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', full_name: '', pet_name: '', pet_type: 'cat'
  });
  const [loading, setLoading] = useState(false);

  const PET_TYPES = [
    { value: 'cat', label: t('cat'), icon: '🐱' },
    { value: 'dog', label: t('dog'), icon: '🐶' },
    { value: 'other', label: t('other'), icon: '🐾' },
  ];

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error(t('passwordMinError')); return; }
    setLoading(true);
    try {
      const r = await api.post('/auth/register', form);
      login(r.data.token, r.data.user);
      toast.success(`${t('loginTitle')}, ${r.data.user.username}! 🎉`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || t('registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo" style={{ fontSize: '2.6rem', fontWeight: 900, background: 'linear-gradient(135deg,#00C9A7,#F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>◉</div>
        <h1 className="auth-title">{t('joinTitle')}</h1>
        <p className="auth-subtitle">{t('joinSubtitle')}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('fullName')}</label>
            <input className="form-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder={t('fullName')} required />
          </div>
          <div className="form-group">
            <label>{t('username')}</label>
            <input className="form-input" value={form.username} onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))} placeholder={t('usernamePlaceholder')} required />
          </div>
          <div className="form-group">
            <label>{t('email')}</label>
            <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="example@email.com" required />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={t('minChars')} required />
          </div>

          <hr className="divider" />
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: -4 }}>{t('aboutYourPet')}</div>

          <div className="form-group">
            <label>{t('petName')}</label>
            <input className="form-input" value={form.pet_name} onChange={e => set('pet_name', e.target.value)} placeholder={t('petNamePlaceholder')} />
          </div>

          <div className="form-group">
            <label>{t('petType')}</label>
            <div className="pet-type-grid">
              {PET_TYPES.map(pt => (
                <button key={pt.value} type="button"
                  className={`pet-type-btn ${form.pet_type === pt.value ? 'selected' : ''}`}
                  onClick={() => set('pet_type', pt.value)}
                >
                  <span>{pt.icon}</span>{pt.label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('creatingAccount') : t('createAccount')}
          </button>
        </form>

        <div className="auth-switch">
          {t('haveAccount')} <Link to="/login">{t('login')}</Link>
        </div>
      </div>
    </div>
  );
}
