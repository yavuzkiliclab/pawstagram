import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext(null);

const STORAGE_KEY = 'petcircle_settings';

const getSavedLang = () => {
  const saved = localStorage.getItem('petcircle_language');
  if (saved) return saved;
  const browser = navigator.language || navigator.languages?.[0] || 'en';
  return browser.toLowerCase().startsWith('tr') ? 'tr' : 'en';
};

const defaults = {
  theme: 'dark',
  petFilter: 'all',
  compact: false,
};

// ─── Translations ─────────────────────────────────────────────────────────────
const translations = {
  tr: {
    // Nav
    home: 'Ana Sayfa',
    explore: 'Keşfet',
    reels: 'Reels',
    messages: 'Mesajlar',
    notifications: 'Bildirimler',
    newPost: 'Yeni Gönderi',
    trending: 'Trend',
    stats: 'İstatistik',
    profile: 'Profil',
    logout: 'Çıkış',
    searchPlaceholder: 'Kullanıcı veya etiket ara...',
    searchAll: 'Tümünde ara →',
    back: 'Geri',
    // Feed
    suggestedForYou: 'Sana Önerilen',
    seeAll: 'Tümünü gör',
    follow: 'Takip Et',
    following: 'Takip Ediliyor',
    youMightLike: 'Bunları da beğenebilirsin',
    // Explore / Filter
    all: 'Tümü',
    cats: 'Kediler',
    dogs: 'Köpekler',
    birds: 'Kuşlar',
    rodents: 'Kemirgenler',
    other: 'Diğer',
    nearYou: 'Yakınındaki Evcil Hayvanlar',
    suggestedUsers: 'Önerilen Kullanıcılar',
    loadMore: 'Daha fazla göster',
    loading: 'Yükleniyor...',
    noPostsFound: 'Gönderi bulunamadı',
    shareFirst: 'İlk fotoğrafı sen paylaş!',
    filterByCountry: 'Ülkeye göre filtrele',
    filterByCity: 'Şehre göre filtrele',
    allCountries: 'Tüm Ülkeler',
    // Profile
    editProfile: 'Profili Düzenle',
    posts: 'Gönderi',
    followers: 'Takipçi',
    followingLabel: 'Takip',
    noPosts: 'Henüz gönderi yok',
    sendMessage: 'Mesaj Gönder',
    // Pet card labels
    age: 'Yaş',
    gender: 'Cinsiyet',
    color: 'Renk',
    weight: 'Ağırlık',
    bloodType: 'Kan Grubu',
    city: 'Şehir',
    petId: 'Kimlik Kartı',
    // Edit Profile
    editProfileTitle: 'Profili Düzenle',
    fullName: 'Ad Soyad',
    bio: 'Biyografi',
    bioPlaceholder: 'Kendin ve hayvanın hakkında...',
    petInfo: 'Evcil Hayvan Bilgileri',
    petName: 'Evcil hayvanının adı',
    petNamePlaceholder: 'Pamuk, Max, Boncuk...',
    petType: 'Evcil hayvan türü',
    cat: 'Kedi',
    dog: 'Köpek',
    language: 'Dil',
    turkish: 'Türkçe',
    english: 'English',
    settings: 'Tercihler',
    darkMode: 'Karanlık Mod',
    lightMode: 'Aydınlık Mod',
    compactMode: 'Kompakt Mod',
    petFilter: 'Evcil Hayvan Filtresi',
    save: 'Kaydet',
    saving: 'Kaydediliyor...',
    changePhoto: 'Fotoğraf değiştir',
    country: 'Ülke',
    // Messages
    directMessages: 'Mesajlar',
    messagePlaceholder: 'Mesaj gönder...',
    send: 'Gönder',
    selectConversation: 'Bir konuşma seç',
    newConversationHint: 'veya profil sayfasından yeni mesaj gönder',
    noConversations: 'Henüz konuşma yok',
    startFromProfile: 'Profil sayfasından mesaj gönder',
    firstMessage: 'İlk mesajı gönder 👋',
    messageFailed: 'Mesaj gönderilemedi',
    conversationFailed: 'Konuşma açılamadı',
    // Notifications
    notificationsTitle: 'Bildirimler',
    clearAll: 'Tümünü temizle',
    noNotifications: 'Bildirim yok',
    notifAppear: 'Birileri seni beğendiğinde burada görünür',
    notifLiked: 'gönderini beğendi',
    notifCommented: 'gönderine yorum yaptı',
    notifFollowed: 'seni takip etmeye başladı',
    notifAction: 'bir şey yaptı',
    markAllRead: 'Tümünü okundu işaretle',
    // Auth
    loginTitle: 'Hoş Geldin',
    loginSubtitle: 'Tüylü dostların dünyası 🐾',
    usernameOrEmail: 'Kullanıcı adı veya e-posta',
    usernameOrEmailPlaceholder: 'kullanici_adi veya email',
    password: 'Şifre',
    loggingIn: 'Giriş yapılıyor...',
    login: 'Giriş Yap',
    loginFailed: 'Giriş başarısız',
    noAccount: 'Hesabın yok mu?',
    register: 'Kayıt Ol',
    demoHint: '🎭 Demo hesabıyla dene (whisker_mom / demo1234)',
    joinTitle: "PetCircle'a Katıl",
    joinSubtitle: 'Tüylü dostunla çembere gir! 🐾',
    registerTitle: 'Hesap Oluştur',
    username: 'Kullanıcı Adı',
    usernamePlaceholder: 'tatlı_hayvan_sahibi',
    email: 'E-posta',
    minChars: 'En az 6 karakter',
    aboutYourPet: 'Evcil hayvanın hakkında',
    creatingAccount: 'Hesap oluşturuluyor...',
    createAccount: 'Hesap Oluştur ◉',
    haveAccount: 'Zaten hesabın var mı?',
    registerFailed: 'Kayıt başarısız',
    passwordMinError: 'Şifre en az 6 karakter olmalı',
    // Search
    searchTitle: 'Arama',
    searchBigPlaceholder: 'Kullanıcı, gönderi, konum veya hayvan türü ara...',
    users: 'Kullanıcılar',
    postsLabel: 'Gönderiler',
    allLabel: 'Hepsi',
    usersLabel: 'Kullanıcılar',
    noResults: 'Sonuç bulunamadı',
    noResultsFor: 'için hiçbir şey bulamadık. Farklı bir arama deneyin.',
    advancedSearch: 'Gelişmiş Arama',
    advancedSearchDesc: 'Kullanıcı adı, gönderi açıklaması, konum veya hayvan türüne göre ara',
    filterByLocation: 'Konuma göre filtrele (İstanbul, Ankara...)',
    profileBtn: 'Profil',
    // New Post
    newPostTitle: '📸 Yeni Gönderi',
    onlyImagesVideos: 'Sadece resim veya video dosyaları kabul edilir',
    fileTooLarge: "Dosya 80 MB'dan büyük olamaz",
    pleaseSelectPhoto: 'Lütfen bir fotoğraf seç',
    postShared: 'Gönderi paylaşıldı! 🐾',
    postFailed: 'Gönderi paylaşılamadı',
    dragDropSelect: 'Fotoğraf veya video seç ya da sürükle bırak',
    maxFileSize: 'PNG, JPG, GIF, WEBP, MP4, WEBM · Maks 80 MB',
    petNameLabel: 'Evcil Hayvanının Adı',
    locationTag: '📍 Konum Etiketi',
    locationTagPlaceholder: 'İstanbul, Kalamış Parkı...',
    captionLabel: 'Açıklama',
    captionPlaceholder2: 'Hayvanın hakkında bir şeyler yaz... 🐾',
    sharingVideo: '🎬 Videoyu Paylaş',
    sharingPhoto: '🐾 Fotoğrafı Paylaş',
    sharing: 'Paylaşılıyor...',
    // Post card
    myPet: 'Tatlı hayvan',
    addComment: 'Yorum ekle...',
    postCommentBtn: 'Paylaş',
    deletePostConfirm: 'Bu gönderiyi silmek istiyor musun?',
    postDeleted: 'Gönderi silindi',
    deleteFailed: 'Silinemedi',
    errorOccurred: 'Hata oluştu',
    saved: 'Kaydedildi',
    // Post detail
    commentFailed: 'Yorum eklenemedi',
    commentDeleteFailed: 'Yorum silinemedi',
    // Trending
    trendingTitle: '🔥 En Çok Beğenilenler',
    period24h: '24 Saat',
    periodWeek: 'Bu Hafta',
    periodMonth: 'Bu Ay',
    periodAll: 'Tüm Zamanlar',
    noPostsThisPeriod: 'Bu dönemde gönderi yok',
    tryLongerPeriod: 'Daha uzun bir dönem seç ya da fotoğraf paylaş!',
    loadMoreBtn: 'Daha fazla',
    // Stats
    statsTitle: '📊 Uygulama İstatistikleri',
    statsUsers: 'Kullanıcı',
    statsPosts: 'Gönderi',
    statsLikes: 'Beğeni',
    statsComments: 'Yorum',
    statsFollows: 'Takip',
    statsMessages: 'Mesaj',
    activityTitle: '📅 Son 30 Gün — Gönderi Aktivitesi',
    topFollowedTitle: '🏆 En Çok Takipçili',
    petDistTitle: '🐾 Evcil Hayvan Dağılımı',
    trendingTags: '🔥 Trend Etiketler',
    nearbyUsers: '📍 Yakınındakiler',
    // Match
    match: 'Eşleş',
    matchTab: 'Eşleş',
    matchesTab: 'Eşleşmeler',
    matchLike: 'Beğen',
    matchPass: 'Geç',
    swipeHint: 'Sürükle veya butona bas',
    noMoreCandidates: 'Şimdilik hepsi bu! Birazdan daha fazla evcil dost gelecek.',
    refreshCandidates: 'Yenile',
    noMatchesYet: 'Henüz eşleşme yok. Evcil dostlarla tanış! 💛',
  },
  en: {
    // Nav
    home: 'Home',
    explore: 'Explore',
    reels: 'Reels',
    messages: 'Messages',
    notifications: 'Notifications',
    newPost: 'New Post',
    trending: 'Trending',
    stats: 'Statistics',
    profile: 'Profile',
    logout: 'Log Out',
    searchPlaceholder: 'Search users or tags...',
    searchAll: 'Search all →',
    back: 'Back',
    // Feed
    suggestedForYou: 'Suggested for You',
    seeAll: 'See all',
    follow: 'Follow',
    following: 'Following',
    youMightLike: 'You might also like',
    // Explore / Filter
    all: 'All',
    cats: 'Cats',
    dogs: 'Dogs',
    birds: 'Birds',
    rodents: 'Rodents',
    other: 'Other',
    nearYou: 'Pets Near You',
    suggestedUsers: 'Suggested Users',
    loadMore: 'Load more',
    loading: 'Loading...',
    noPostsFound: 'No posts found',
    shareFirst: 'Be the first to share!',
    filterByCountry: 'Filter by country',
    filterByCity: 'Filter by city',
    allCountries: 'All Countries',
    // Profile
    editProfile: 'Edit Profile',
    posts: 'Posts',
    followers: 'Followers',
    followingLabel: 'Following',
    noPosts: 'No posts yet',
    sendMessage: 'Send Message',
    // Pet card labels
    age: 'Age',
    gender: 'Gender',
    color: 'Color',
    weight: 'Weight',
    bloodType: 'Blood Type',
    city: 'City',
    petId: 'ID Card',
    // Edit Profile
    editProfileTitle: 'Edit Profile',
    fullName: 'Full Name',
    bio: 'Bio',
    bioPlaceholder: 'About you and your pet...',
    petInfo: 'Pet Information',
    petName: "Pet's name",
    petNamePlaceholder: 'Whiskers, Max, Biscuit...',
    petType: 'Pet type',
    cat: 'Cat',
    dog: 'Dog',
    language: 'Language',
    turkish: 'Türkçe',
    english: 'English',
    settings: 'Preferences',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    compactMode: 'Compact Mode',
    petFilter: 'Pet Filter',
    save: 'Save',
    saving: 'Saving...',
    changePhoto: 'Change photo',
    country: 'Country',
    // Messages
    directMessages: 'Messages',
    messagePlaceholder: 'Send a message...',
    send: 'Send',
    selectConversation: 'Select a conversation',
    newConversationHint: 'or start a new message from a profile page',
    noConversations: 'No conversations yet',
    startFromProfile: 'Send a message from a profile page',
    firstMessage: 'Send the first message 👋',
    messageFailed: 'Could not send message',
    conversationFailed: 'Could not open conversation',
    // Notifications
    notificationsTitle: 'Notifications',
    clearAll: 'Clear all',
    noNotifications: 'No notifications',
    notifAppear: 'Appears when someone likes or follows you',
    notifLiked: 'liked your post',
    notifCommented: 'commented on your post',
    notifFollowed: 'started following you',
    notifAction: 'did something',
    markAllRead: 'Mark all as read',
    // Auth
    loginTitle: 'Welcome Back',
    loginSubtitle: 'The world of furry friends 🐾',
    usernameOrEmail: 'Username or email',
    usernameOrEmailPlaceholder: 'username or email',
    password: 'Password',
    loggingIn: 'Signing in...',
    login: 'Sign In',
    loginFailed: 'Login failed',
    noAccount: "Don't have an account?",
    register: 'Sign Up',
    demoHint: '🎭 Try demo account (whisker_mom / demo1234)',
    joinTitle: 'Join PetCircle',
    joinSubtitle: 'Join the circle with your furry friend! 🐾',
    registerTitle: 'Create Account',
    username: 'Username',
    usernamePlaceholder: 'cute_pet_owner',
    email: 'Email',
    minChars: 'At least 6 characters',
    aboutYourPet: 'About your pet',
    creatingAccount: 'Creating account...',
    createAccount: 'Create Account ◉',
    haveAccount: 'Already have an account?',
    registerFailed: 'Registration failed',
    passwordMinError: 'Password must be at least 6 characters',
    // Search
    searchTitle: 'Search',
    searchBigPlaceholder: 'Search users, posts, location or pet type...',
    users: 'Users',
    postsLabel: 'Posts',
    allLabel: 'All',
    usersLabel: 'Users',
    noResults: 'No results found',
    noResultsFor: '— nothing found. Try a different search.',
    advancedSearch: 'Advanced Search',
    advancedSearchDesc: 'Search by username, post caption, location or pet type',
    filterByLocation: 'Filter by location (Istanbul, London...)',
    profileBtn: 'Profile',
    // New Post
    newPostTitle: '📸 New Post',
    onlyImagesVideos: 'Only image or video files are accepted',
    fileTooLarge: 'File cannot be larger than 80 MB',
    pleaseSelectPhoto: 'Please select a photo',
    postShared: 'Post shared! 🐾',
    postFailed: 'Could not share post',
    dragDropSelect: 'Select or drag and drop a photo or video',
    maxFileSize: 'PNG, JPG, GIF, WEBP, MP4, WEBM · Max 80 MB',
    petNameLabel: "Your Pet's Name",
    locationTag: '📍 Location Tag',
    locationTagPlaceholder: 'Istanbul, Central Park...',
    captionLabel: 'Caption',
    captionPlaceholder2: 'Write something about your pet... 🐾',
    sharingVideo: '🎬 Share Video',
    sharingPhoto: '🐾 Share Photo',
    sharing: 'Sharing...',
    // Post card
    myPet: 'Sweet pet',
    addComment: 'Add a comment...',
    postCommentBtn: 'Post',
    deletePostConfirm: 'Are you sure you want to delete this post?',
    postDeleted: 'Post deleted',
    deleteFailed: 'Could not delete',
    errorOccurred: 'An error occurred',
    saved: 'Saved',
    // Post detail
    commentFailed: 'Could not add comment',
    commentDeleteFailed: 'Could not delete comment',
    // Trending
    trendingTitle: '🔥 Most Liked',
    period24h: '24 Hours',
    periodWeek: 'This Week',
    periodMonth: 'This Month',
    periodAll: 'All Time',
    noPostsThisPeriod: 'No posts this period',
    tryLongerPeriod: 'Try a longer period or share a photo!',
    loadMoreBtn: 'Load more',
    // Stats
    statsTitle: '📊 App Statistics',
    statsUsers: 'Users',
    statsPosts: 'Posts',
    statsLikes: 'Likes',
    statsComments: 'Comments',
    statsFollows: 'Follows',
    statsMessages: 'Messages',
    activityTitle: '📅 Last 30 Days — Post Activity',
    topFollowedTitle: '🏆 Most Followed',
    petDistTitle: '🐾 Pet Distribution',
    trendingTags: '🔥 Trending Tags',
    nearbyUsers: '📍 Nearby',
    // Match
    match: 'Match',
    matchTab: 'Match',
    matchesTab: 'Matches',
    matchLike: 'Like',
    matchPass: 'Pass',
    swipeHint: 'Swipe or use the buttons',
    noMoreCandidates: "That's everyone for now! More furry friends coming soon.",
    refreshCandidates: 'Refresh',
    noMatchesYet: 'No matches yet. Start swiping! 💛',
  },
};

export const COUNTRIES = [
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
];

export function SettingsProvider({ children }) {
  const [language, setLanguageState] = useState(getSavedLang);
  const [settings, setSettings] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return { ...defaults, ...stored };
    } catch { return defaults; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.classList.toggle('compact', settings.compact);
  }, [settings.theme, settings.compact]);

  const setLanguage = useCallback((v) => {
    localStorage.setItem('petcircle_language', v);
    setLanguageState(v);
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // t(key) — returns translated string; supports {var} interpolation
  const t = useCallback((key, vars) => {
    let str = translations[language]?.[key] ?? translations.en[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
    }
    return str;
  }, [language]);

  const value = {
    theme: settings.theme,
    language,
    petFilter: settings.petFilter,
    compact: settings.compact,
    setTheme: (v) => updateSetting('theme', v),
    setLanguage,
    setPetFilter: (v) => updateSetting('petFilter', v),
    setCompact: (v) => updateSetting('compact', v),
    t,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
