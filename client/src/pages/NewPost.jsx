import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';

export default function NewPost() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [petName, setPetName] = useState('');
  const [location, setLocation] = useState('');
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    const isImage = f.type.startsWith('image/');
    const isVideo = f.type.startsWith('video/');
    if (!isImage && !isVideo) { toast.error(t('onlyImagesVideos')); return; }
    if (f.size > 80 * 1024 * 1024) { toast.error(t('fileTooLarge')); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error(t('pleaseSelectPhoto')); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append('media', file);
    fd.append('caption', caption);
    fd.append('pet_name', petName);
    fd.append('location', location);
    try {
      const r = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(t('postShared'));
      navigate(`/post/${r.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || t('postFailed'));
    } finally { setLoading(false); }
  };

  return (
    <div className="new-post-page">
      <BackButton fallback="/" />
      <h2 className="page-header">{t('newPostTitle')}</h2>

      <form onSubmit={handleSubmit}>
        {preview ? (
          <div style={{ position: 'relative', marginBottom: 22 }}>
            {file?.type.startsWith('video/') ? (
              <video src={preview} className="upload-preview-video" controls muted />
            ) : (
              <img src={preview} alt="preview" className="upload-preview" />
            )}
            {file && (
              <div className="media-type-badge" style={{ position: 'absolute', top: 12, left: 12 }}>
                {file.type.startsWith('video/') ? '🎬 Video' : '🖼️ Photo'}
              </div>
            )}
            <button type="button" onClick={() => { setFile(null); setPreview(null); }}
              style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: '50%', width: 34, height: 34, color: 'white', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ×
            </button>
          </div>
        ) : (
          <div
            className={`upload-area ${drag ? 'drag-over' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <div className="upload-icon">🐾</div>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>{t('dragDropSelect')}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>{t('maxFileSize')}</div>
            <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          </div>
        )}

        <div className="auth-form">
          <div className="form-group">
            <label>{t('petNameLabel')}</label>
            <input className="form-input" value={petName} onChange={e => setPetName(e.target.value)} placeholder={t('petNamePlaceholder')} maxLength={50} />
          </div>

          <div className="form-group">
            <label>{t('locationTag')}</label>
            <input
              className="form-input"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder={t('locationTagPlaceholder')}
              maxLength={80}
            />
          </div>

          <div className="form-group">
            <label>{t('captionLabel')}</label>
            <textarea
              className="form-input"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder={t('captionPlaceholder2')}
              rows={3} maxLength={500}
              style={{ resize: 'vertical' }}
            />
            <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>{caption.length}/500</div>
          </div>

          <button type="submit" className="btn-primary" disabled={!file || loading}>
            {loading ? t('sharing') : file?.type.startsWith('video/') ? t('sharingVideo') : t('sharingPhoto')}
          </button>
        </div>
      </form>
    </div>
  );
}
