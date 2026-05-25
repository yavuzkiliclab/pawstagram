import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Avatar from '../components/Avatar';
import BackButton from '../components/BackButton';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Messages() {
  const { username } = useParams();
  const { user } = useAuth();
  const { t, language } = useSettings();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const lastIdRef = useRef(0);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (username) openByUsername(username);
  }, [username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeConv) return;
    pollRef.current = setInterval(poll, 2500);
    return () => clearInterval(pollRef.current);
  }, [activeConv]);

  const loadConversations = async () => {
    try {
      const r = await api.get('/messages/conversations');
      setConversations(r.data || []);
    } catch {
      // silent
    } finally {
      setLoadingConvs(false);
    }
  };

  const openByUsername = async (uname) => {
    setLoadingChat(true);
    clearInterval(pollRef.current);
    try {
      const r = await api.get(`/messages/u/${uname}`);
      setOtherUser(r.data.other_user);
      setMessages(r.data.messages || []);
      setActiveConv(r.data.conversation);
      lastIdRef.current = r.data.messages?.at(-1)?.id || 0;
      loadConversations();
    } catch (e) {
      toast.error(t('conversationFailed'));
    } finally {
      setLoadingChat(false);
    }
  };

  const openConv = (conv) => {
    navigate(`/messages/${conv.other_user.username}`);
  };

  const poll = async () => {
    if (!activeConv || !otherUser) return;
    try {
      const r = await api.get(`/messages/${otherUser.id}/poll?after=${lastIdRef.current}`);
      if (r.data?.length > 0) {
        setMessages(prev => [...prev, ...r.data]);
        lastIdRef.current = r.data.at(-1).id;
        loadConversations();
      }
    } catch {}
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || !otherUser) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      const r = await api.post(`/messages/u/${otherUser.username}`, { content: text });
      setMessages(prev => [...prev, r.data]);
      lastIdRef.current = r.data.id;
      loadConversations();
    } catch {
      toast.error(t('messageFailed'));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const petEmoji = (type) =>
    type === 'cat' ? '🐱' : type === 'dog' ? '🐶' : type === 'bird' ? '🦜' :
    type === 'rabbit' ? '🐰' : type === 'hamster' ? '🐹' : '🐾';

  const locale = language === 'tr' ? 'tr' : 'en';

  return (
    <div className="messages-page">
      <div className="messages-topbar">
        <BackButton fallback="/" />
        <h2 className="page-header">💬 {t('messages')}</h2>
      </div>

      <div className="messages-panels">
        {/* Left: Conversations list */}
        <div className="conversations-panel">
          <div className="conversations-header">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {t('directMessages')}
            {conversations.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>
                {conversations.length}
              </span>
            )}
          </div>

          <div className="conversations-list">
            {loadingConvs && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
              </div>
            )}

            {!loadingConvs && conversations.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💌</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t('noConversations')}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>{t('startFromProfile')}</div>
              </div>
            )}

            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`conversation-item${activeConv?.id === conv.id ? ' active' : ''}`}
                onClick={() => openConv(conv)}
              >
                <Avatar user={conv.other_user} size={42} />
                <div className="conversation-item-info">
                  <div className="conversation-item-name">
                    {conv.other_user?.full_name || conv.other_user?.username}
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400, marginLeft: 5 }}>
                      @{conv.other_user?.username}
                    </span>
                  </div>
                  <div className="conversation-item-last">
                    {conv.last_message?.content || `• ${t('firstMessage')}`}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  {conv.last_message?.created_at && (
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>
                      {format(conv.last_message.created_at, locale)}
                    </span>
                  )}
                  {conv.unread_count > 0 && (
                    <div className="conversation-unread">{conv.unread_count}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Chat panel */}
        <div className="chat-panel">
          {!otherUser ? (
            <div className="chat-empty">
              <div style={{ fontSize: 44, marginBottom: 12 }}>💬</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text2)', marginBottom: 6 }}>
                {t('selectConversation')}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                {t('newConversationHint')}
              </div>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <Avatar user={otherUser} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="chat-header-name"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/${otherUser.username}`)}
                  >
                    {otherUser.full_name}
                  </div>
                  <div className="chat-header-pet">
                    {petEmoji(otherUser.pet_type)} {otherUser.pet_name || otherUser.username}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/${otherUser.username}`)}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}
                >
                  {t('profileBtn')}
                </button>
              </div>

              <div className="chat-messages">
                {loadingChat ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                    <div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginTop: 24 }}>
                    {t('firstMessage')}
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 4 }}
                      >
                        {!isMine && (
                          <Avatar
                            user={{ username: msg.username, avatar_url: msg.avatar_url }}
                            size={26}
                            style={{ marginRight: 6, flexShrink: 0, alignSelf: 'flex-end' }}
                          />
                        )}
                        <div className={`chat-msg ${isMine ? 'sent' : 'received'}`}>
                          {msg.content}
                          <div className="chat-msg-time">{format(msg.created_at, locale)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-row" onSubmit={sendMessage}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={t('messagePlaceholder')}
                  maxLength={1000}
                  autoFocus
                  disabled={sending}
                />
                <button type="submit" className="chat-send-btn" disabled={!input.trim() || sending}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
