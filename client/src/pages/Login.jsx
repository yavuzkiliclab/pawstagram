import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post('/auth/login', form);
      login(r.data.token, r.data.user);
      toast.success(`${t('loginTitle')}, ${r.data.user.username}! ◉`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => setForm({ login: 'whisker_mom', password: 'demo1234' });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo" style={{ fontSize: '2.6rem', fontWeight: 900, background: 'linear-gradient(135deg,#00C9A7,#F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>◉</div>
        <h1 className="auth-title">PetCircle</h1>
        <p className="auth-subtitle">{t('loginSubtitle')}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('usernameOrEmail')}</label>
            <input
              className="form-input"
              value={form.login}
              onChange={e => setForm(p => ({ ...p, login: e.target.value }))}
              placeholder={t('usernameOrEmailPlaceholder')}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('loggingIn') : t('login')}
          </button>
        </form>

        <button
          onClick={fillDemo}
          style={{ marginTop: 12, width: '100%', padding: '10px', background: 'rgba(0,201,167,0.07)', border: '1px dashed rgba(0,201,167,0.35)', borderRadius: 10, color: 'var(--pink)', fontSize: 13, cursor: 'pointer' }}
        >
          {t('demoHint')}
        </button>

        <div className="auth-switch">
          {t('noAccount')} <Link to="/register">{t('register')}</Link>
        </div>
      </div>
    </div>
  );
}
