'use strict';

const bcrypt = require('bcryptjs');
const path = require('path');

// Use database.js so tables + migrations are guaranteed to exist before seeding
const db = require('./db/database');
db.pragma('foreign_keys = OFF'); // speed up bulk inserts

// ---------------------------------------------------------------------------
// Photo helpers — all loremflickr, animal-only
// ---------------------------------------------------------------------------
const AVATAR_TAGS = {
  cat:    'cat',
  dog:    'dog',
  bird:   'parrot',
  rabbit: 'rabbit',
  hamster:'hamster',
  fish:   'fish,aquarium',
  turtle: 'turtle',
  horse:  'horse',
  hedgehog:'hedgehog',
  ferret: 'ferret',
  reptile:'iguana',
  other:  'pet',
};

const POST_QUERIES = {
  cat:    ['cat,kitten',        'cat,person',          'cat,home'],
  dog:    ['dog,puppy',         'dog,person',          'dog,park'],
  bird:   ['parrot',            'parrot,person',       'bird,cage'],
  rabbit: ['rabbit',            'rabbit,person',       'rabbit,garden'],
  hamster:['hamster',           'hamster,person',      'hamster,cage'],
  fish:   ['fish,aquarium',     'fish,aquarium,color', 'aquarium,tank'],
  turtle: ['turtle',            'turtle,person',       'turtle,grass'],
  horse:  ['horse',             'horse,rider',         'horse,stable'],
  hedgehog:['hedgehog',         'hedgehog,person',     'hedgehog,grass'],
  ferret: ['ferret',            'ferret,person',       'ferret,play'],
  reptile:['iguana',            'iguana,person',       'lizard,terrarium'],
  other:  ['pet,animal',        'pet,person',          'nature,animal'],
};

function getAvatarUrl(petType, lockIdx) {
  const tag = AVATAR_TAGS[petType] || 'pet';
  return `https://loremflickr.com/200/200/${tag}?lock=${lockIdx + 1}`;
}

function getPostImage(petType, counter) {
  const queries = POST_QUERIES[petType] || POST_QUERIES.other;
  const n = counter % 10;
  const q = n < 7 ? queries[0] : n < 9 ? queries[1] : queries[2];
  return `https://loremflickr.com/600/600/${q}?lock=${counter + 1}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randInt(7, 22));
  d.setMinutes(randInt(0, 59));
  return d.toISOString().replace('T', ' ').slice(0, 19);
}
function randomDateOffset(maxDaysAgo) { return daysAgo(randInt(1, maxDaysAgo)); }

// ---------------------------------------------------------------------------
// Animal-themed usernames (Turkish pet names)
// ---------------------------------------------------------------------------
const animalUsernames = [
  'pamuk', 'simsek', 'karamel', 'tombik', 'boncuk', 'tekir', 'sarman', 'pasa',
  'duman', 'bulut', 'zeytin', 'tarcin', 'seker', 'bal', 'findik', 'badem',
  'gul_pati', 'papatya', 'inci', 'pati', 'aslan', 'kaplan', 'tilki', 'tavsan',
  'kelebek', 'kartal', 'serce', 'guguk', 'minik', 'toprak', 'yildiz', 'bora',
  'mavi_pati', 'kahve', 'limon', 'elma', 'nane', 'vanilya', 'gumus', 'altin',
  'bronz', 'mercan', 'amber', 'berrak', 'sevgi', 'mutlu', 'nese', 'ruzgar',
  'firtina', 'camur',
];

const fullNames = [
  'Zeynep Arslan', 'Elif Kaya', 'Ayşe Demir', 'Selin Çelik', 'Büşra Şahin',
  'Merve Doğan', 'Esra Yılmaz', 'Derya Polat', 'Gizem Koç', 'Pınar Aydın',
  'Cansu Öztürk', 'İpek Yıldız', 'Neslihan Kurt', 'Yasemin Aksoy', 'Melis Özdemir',
  'Ahmet Yılmaz', 'Mehmet Kaya', 'Mustafa Demir', 'Ali Çelik', 'Hasan Şahin',
  'İbrahim Koç', 'Ömer Kurt', 'Yusuf Aydın', 'Emre Arslan', 'Serkan Polat',
  'Berk Öztürk', 'Mert Yıldız', 'Oğuz Aksoy', 'Enes Özdemir', 'Burak Aslan',
  'Kerem Çetin', 'Onur Turan', 'Deniz Kılıç', 'Cem Erdoğan', 'Tarık Kara',
  'Sophie Martin', 'Emma Wilson', 'Lucas Müller', 'Yuki Tanaka', 'Marie Dubois',
  'Carlos García', 'Anna Schmidt', 'James Brown', 'Li Wei', 'Fatima Al-Hassan',
  'Igor Petrov', 'Sara Johnson', 'Tom Anderson', 'Mia Chen', 'David Kim',
];

// Per-pet-type data
const petData = {
  cat: {
    names: ['Pamuk', 'Minnoş', 'Boncuk', 'Paşa', 'Süslü', 'Şeker', 'Karamel', 'Sarman', 'Tekir', 'Bıyık', 'Mırıl', 'Tombik', 'Zeytin', 'Pisi', 'Mis'],
    bios: [
      'Kedilerin kraliçesi 👑🐱', 'Pamuk sahibi, mutlu anne 🐈', 'Sokak kedilerini besleyen gönüllü ❤️',
      'Kedicik hayranı ✨', 'Kedim olmasa ne yapardım 🐱', 'Kedi tüylü hayat daha güzel ☀️',
      'Sabah kahvemi kedimle içiyorum ☕🐱', 'İki kedi bir aşk 💕🐈', 'Kedi fotoğrafları çekmeyi bırakamıyorum 📸',
    ],
    captions: [
      'Bugün de güneşleniyor 🌞🐱 #kedi #catlife #sevimli',
      'Bu bakışlara dayanmak imkansız 😍 #kedi #miyav #catsofinstagram',
      'Sabah kahvemle en iyi arkadaşım ☕ #catmom #kedi',
      'Pencere başında felsefi düşünceler 🪟🐱 #kedi #catlife',
      'Yeni oyuncak büyük heyecan 🎀 #kedi #play',
      'Mama zamanı geldi mi? 🍽️ #kedi #feeding',
      'Yumuşacık patiler 🐾 #kedi #catphotography',
      'Kedi mantığı: kutu varsa girilir 📦🐱 #funny',
      'Tüm sevgimi hak ediyor 🥰 #kedi #love',
      'Miyav miyav! En güzel ses bu 🎵 #kedi #catlover',
    ],
    comments: ['Bu kadar tatlı olunmaz!🐱', 'Pamuk gibi mi ne 😍', 'Benim de kalbim ❤️', 'Bebiiiiim 😍', 'Miyav miyav 🐾', 'Bu bakış öldürdü beni 💀😂', 'Yüzü ne kadar tatlı 🥰'],
    breeds: ['British Shorthair', 'Persian', 'Scottish Fold', 'Maine Coon', 'Siamese', 'Ragdoll', 'Abyssinian', 'Bengal', 'Turkish Angora', 'Van Kedisi'],
    colors: ['Beyaz', 'Siyah', 'Gri', 'Turuncu-Beyaz', 'Tekir', 'Sarman', 'Calico', 'Vizon', 'Krem'],
    bloodTypes: ['A', 'B', 'AB'],
    weightRange: [2.5, 7.0],
    skills: ['Yüksek zıplama', 'Işık takibi', 'Kutu bulma', 'Pati ver', 'Titreşimli miyav', 'Denge ustası', 'Kapı açma'],
    likes: ['Güneşlenme ☀️', 'Oyun zamanı 🎀', 'Kucak keyfi 🤗', 'Pencere başı 🪟', 'Mama zamanı 🍽️', 'Uyku 😴'],
    dislikes: ['Yağmur ☔', 'Yüksek ses 🔊', 'Banyo 🛁', 'Veteriner 🏥'],
    traits: ['Oyuncu', 'Bağımsız', 'Meraklı', 'Sakin', 'Akıllı', 'Sevecen', 'Şımarık'],
    foods: ['Ton balığı', 'Tavuk göğsü', 'Somon', 'Kuru mama', 'Islak mama'],
  },
  dog: {
    names: ['Max', 'Luna', 'Buddy', 'Charlie', 'Rex', 'Bella', 'Rocky', 'Coco', 'Duke', 'Zeus', 'Milo', 'Lola', 'Oscar', 'Daisy', 'Bear'],
    bios: [
      'Golden sahibi mutlu baba 🐕', 'Köpekler her şeyden çok sevdiğim 🐶', 'Sabah koşusu + köpek = mükemmel gün ☀️',
      'Köpek tüylü hayat daha güzel 🐾', 'Her gün yürüyüş, her gün mutluluk 🌳', 'Woof woof! Burada sadece köpek sevgisi 🐶❤️',
      'En iyi terapist = köpeğim 🛋️🐕', 'Pati izleri kalbimde 🐾❤️',
    ],
    captions: [
      'Parkta harika bir gün 🌳🐶 #köpek #doglife',
      'Yeni oyuncağını buldu 🎾 #doggo #play',
      'Bu gülümseme her şeye değer 😄 #smile #köpek',
      'Sabah yürüyüşü ritüeli ☀️ #morning #dogwalk',
      'Plajda ilk kez! 🏖️🐕 #beach #summer',
      'Bugün çok iyi bir çocuk oldu 🌟 #goodboy #köpek',
      'Yaramazlık modu: ON 😅 #naughtydog #funny',
      'En sevdiği şey arabada yolculuk 🚗💨 #cardog',
      'Dağ yürüyüşünde harika bir gün 🏔️ #hiking #nature',
      'Bu mutluluğa bir bak 😍 #happydog #petlovers',
    ],
    comments: ['Bu saatten sonra köpek almak istiyorum 🐶', 'Çok şeker!!', 'Bu bakış beni eritti 😭', 'En iyi arkadaş 💙', 'Woof woof! 🐕', 'Bu mutluluğa bak ya 🥰'],
    breeds: ['Golden Retriever', 'Labrador', 'Husky', 'Alman Çoban', 'Poodle', 'Beagle', 'Dachshund', 'Border Collie', 'Shih Tzu', 'Maltese', 'Boxer', 'Pomeranian'],
    colors: ['Altın Sarısı', 'Siyah', 'Beyaz', 'Açık Kahve', 'Krem', 'Gri-Beyaz', 'Kahverengi'],
    bloodTypes: ['DEA 1.1+', 'DEA 1.1-', 'DEA 4+', 'DEA 7+'],
    weightRange: [5, 45],
    skills: ['Pati ver', 'Otur', 'Yat', 'Yuvarlan', 'Getir', 'Yüzme', 'Çevir', 'Atla', 'Bekle'],
    likes: ['Park gezisi 🌳', 'Oyun topu 🎾', 'Kucak keyfi 🤗', 'Araba yolculuğu 🚗', 'Yüzmek 🏊', 'Kemik 🦴'],
    dislikes: ['Yalnız kalmak 😢', 'Fırtına ⛈️', 'Veteriner 🏥', 'Banyo 🛁'],
    traits: ['Oyuncu', 'Sadık', 'Enerjik', 'Sakin', 'Akıllı', 'Sosyal', 'Koruyucu', 'Sevecen'],
    foods: ['Tavuk pirzola', 'Somon', 'Kemik', 'Özel mama', 'Et'],
  },
  bird: {
    names: ['Çipçip', 'Renkli', 'Papağan', 'Muhabbet', 'Kanarya', 'Tüylü', 'Şarkıcı', 'Rüzgar'],
    bios: [
      'Papağanımla her sabah muhteşem 🦜', 'Kuşum konuşuyor ve çok şey söylüyor! 🐦', 'Renkli tüylü bir dünya 🌈🦜',
      'Kanarya sesi hayatımın müziği 🎵', 'Muhabbet kuşu sahipleri nerede? 🐦💚',
    ],
    captions: [
      'Bugün de çok konuştu 🦜 #papağan #parrot #konuşan',
      'Renkli tüyleri şaşırttı herkesi 🌈 #kuş #bird',
      'Şarkısını dinleyin! 🎵🐦 #kanarya #canary',
      'Omzumdan inmek bilmiyor 😄🦜 #papağan #birdsofinstagram',
      'Meyve zamanı en mutlu an 🍎🦜 #parrot #feeding',
      'Bu zekaya inanamıyorum 🤯 #papağan #smart',
    ],
    comments: ['Bu kadar tatlı bir kuş görmedim 🦜', 'Konuşuyor mu gerçekten? 😮', 'Renkleri inanılmaz 🌈', 'Tüyleri çok güzel 🥰'],
    breeds: ['Afrika Gri Papağanı', 'Muhabbet Kuşu', 'Kanarya', 'Kakadu', 'Konur', 'Forpus', 'Cennet Papağanı'],
    colors: ['Yeşil-Sarı', 'Mavi-Beyaz', 'Kırmızı-Yeşil', 'Sarı', 'Gri', 'Gökkuşağı'],
    bloodTypes: [],
    weightRange: [0.05, 1.5],
    skills: ['Konuşma', 'Dans etme', 'Şarkı söyleme', 'Islatma', 'Oyun oynama', 'Trick yapma'],
    likes: ['Meyve 🍎', 'Müzik 🎵', 'Uçmak 🕊️', 'Sosyal vakit 🤗', 'Oyuncak 🎀'],
    dislikes: ['Yalnızlık 😢', 'Yüksek ses 🔊', 'Soğuk hava ❄️', 'Banyo 🚿'],
    traits: ['Zeki', 'Sosyal', 'Konuşkan', 'Oyuncu', 'Meraklı', 'Sadık'],
    foods: ['Tohum', 'Taze meyve', 'Sebze', 'Pellet mama'],
  },
  rabbit: {
    names: ['Tavşan', 'Pamuk Top', 'Hoppala', 'Flopsy', 'Bunnybun', 'Çiçek', 'Beyaz Tavşan', 'Şans'],
    bios: [
      'Tavşanım benden daha çok yer 😄🐰', 'En yumuşak arkadaşım 🐇💕', 'Tavşan sahibi olmak çok güzel 🥕',
      'Mini lop tavşanım çok meraklı 🐰', 'Holland lop ailesi büyüdü 🐇',
    ],
    captions: [
      'Havuç zamanı en mutlu an 🥕🐰 #tavşan #rabbit',
      'Kulaklarına doyamıyorum 🐇 #bunnylove #rabbit',
      'Bahçede keyif çatıyor 🌿🐰 #bunnylife',
      'Uyurken bile tatlı 😴🐇 #sleepybunny',
      'Oyun modunda! 🎀🐰 #bunnyplay #rabbit',
      'Yeni evi keşfediyor 🏠🐇 #floppyears',
    ],
    comments: ['Bu tavşanı almak istiyorum! 🥺🐰', 'Kulaklarına bak ya 🥰', 'Pamuk gibi görünüyor 🤍', 'Bu tatlılığa dayanılmaz 😭'],
    breeds: ['Holland Lop', 'Mini Rex', 'Angora', 'Dutch', 'Flemish Giant', 'Lionhead', 'Mini Lop'],
    colors: ['Beyaz', 'Gri', 'Kahverengi', 'Siyah-Beyaz', 'Turuncu', 'Alacalı'],
    bloodTypes: [],
    weightRange: [1.0, 5.0],
    skills: ['Zıplama', 'Çember atlama', 'Adını tanıma', 'Pati ver', 'Kutu girme'],
    likes: ['Havuç 🥕', 'Kuru ot 🌾', 'Oyun alanı 🎀', 'Kucak keyfi 🤗', 'Taze sebze 🥬'],
    dislikes: ['Yüksek ses 🔊', 'Ani hareketler 😱', 'Yalnız kalmak 😢'],
    traits: ['Meraklı', 'Sevecen', 'Oyuncu', 'Çekingen', 'Sakin', 'Akıllı'],
    foods: ['Havuç', 'Marul', 'Kuru ot', 'Pellet mama', 'Elma'],
  },
  hamster: {
    names: ['Cüce', 'Ponpon', 'Hamsi', 'Yuvarlak', 'Fıstık', 'Tombul', 'Mini'],
    bios: [
      'Altın Hamster annesiyim 🐹💛', 'Gece yarısı koşucusu 🌙🐹', 'En küçük arkadaşım en büyük mutluluğum 🐹',
    ],
    captions: [
      'Yanaklarında mı ne o? 😂🐹 #hamster #hampsterdance',
      'Gece koşusu başladı! 🏃🐹 #hamsterlife',
      'Oyuncak evini keşfediyor 🏠🐹 #hamsterlove',
      'Uyurken çok tatlı 😴🐹 #sleepyhamster',
      'Yemek yeme ritüeli 🌾🐹 #feeding',
    ],
    comments: ['Bu yanaklar inanılmaz 😍🐹', 'Ne kadar küçük ve tatlı 🥺', 'Hamster sahibi olmak istiyorum 🐹'],
    breeds: ['Altın Hamster', 'Cüce Hamster', 'Roborovski', 'Campbell', 'Winter White'],
    colors: ['Altın', 'Beyaz', 'Gri', 'Kahverengi', 'Alacalı'],
    bloodTypes: [],
    weightRange: [0.03, 0.18],
    skills: ['Koşu bandı', 'Tünel gezisi', 'Saklama', 'Oyun topu'],
    likes: ['Tohum 🌻', 'Meyve 🍓', 'Tünel 🕳️', 'Koşu bandı 🏃', 'Gizlenme 🙈'],
    dislikes: ['Gündüz saatleri 😴', 'Ani sesler 🔊', 'Çok sık dokunulma'],
    traits: ['Gece aktif', 'Meraklı', 'Bağımsız', 'Sakin', 'Hızlı'],
    foods: ['Tohum', 'Çekirdek', 'Küçük meyve', 'Pellet mama'],
  },
  fish: {
    names: ['Balık', 'Nemo', 'Dori', 'Koi', 'Japon', 'Rengarenk', 'Akvaryum', 'Süzgeç'],
    bios: [
      'Akvaryum dünyasına hoş geldiniz 🐠', 'Koi balığım 10 yıllık dostum 🐟', 'Renkli balıklarla dolup taşan ev 🌊',
      'Japon balığı koleksiyonu büyüdü 🐠🐡',
    ],
    captions: [
      'Akvaryumum yeni sakinlerini karşıladı 🐠 #balık #fish #akvaryum',
      'Sabah süzme zamanı 🌊🐡 #koi #fishlife',
      'Renkler inanılmaz değil mi? 🌈🐠 #aquarium',
      'Yem zamanı en mutlu anları 🌱🐟 #feeding',
      'Sularda huzur 🌊 #aquarium #peaceful',
    ],
    comments: ['Bu akvaryum harika! 😍🐠', 'Balık sahibi olmak istiyorum 🐡', 'Renkleri çok güzel 🌈', 'Huzur veriyor bu fotoğraf 🌊'],
    breeds: ['Japon Balığı', 'Koi', 'Betta', 'Guppy', 'Neon Tetra', 'Diskus', 'Clownfish'],
    colors: ['Turuncu-Beyaz', 'Mavi', 'Kırmızı', 'Sarı-Siyah', 'Gökkuşağı', 'Gümüş'],
    bloodTypes: [],
    weightRange: [0.01, 2.0],
    skills: ['Süzme', 'Hoop atlama', 'Yem alma'],
    likes: ['Temiz su 💧', 'Canlı yem 🦐', 'Gizlenme taşları 🪨', 'Bitki 🌿'],
    dislikes: ['Kirli su 🤢', 'Sıcaklık değişimi 🌡️', 'Aşırı ışık 💡'],
    traits: ['Sakin', 'Estetik', 'Bağımsız', 'Renkli', 'Huzurlu'],
    foods: ['Pul yem', 'Dondurulmuş artemia', 'Canlı yem', 'Pellet'],
  },
  turtle: {
    names: ['Kaptan', 'Yavaş', 'Taş', 'Cenk', 'Kaplumbağa', 'Sert', 'Uzun Ömür'],
    bios: [
      'Kaplumbağam 15 yıllık yoldaşım 🐢', 'Yavaş ama kararlı! 🐢💪', 'Kaplumbağa sahibi olmak sabır ister 🐢',
    ],
    captions: [
      'Güneşlenme vakti! ☀️🐢 #kaplumbağa #turtle',
      'Bu hızla yarın varırım 😂🐢 #slowlife #turtle',
      'Marul büyük zevk 🥬🐢 #turtlelove',
      'Su keyfi 🌊🐢 #swimming #turtle',
    ],
    comments: ['Çok tatlı bir kaplumbağa 🐢💚', 'Yavaş yavaş ama güzel 🥺', 'Yaşlı olmasına rağmen tatlı 😍'],
    breeds: ['Kırmızı Kulaklı Su Kaplumbağası', 'Rus Kaplumbağası', 'Kutu Kaplumbağası', 'Gopher'],
    colors: ['Yeşil', 'Kahverengi', 'Siyah-Sarı', 'Zeytin Yeşili'],
    bloodTypes: [],
    weightRange: [0.2, 5.0],
    skills: ['Yüzme', 'Kazmak', 'Güneşlenme'],
    likes: ['Güneş ☀️', 'Su 🌊', 'Marul 🥬', 'Çilek 🍓'],
    dislikes: ['Soğuk hava ❄️', 'Gürültü 🔊'],
    traits: ['Sakin', 'Sabırlı', 'Uzun ömürlü', 'Bağımsız'],
    foods: ['Marul', 'Havuç', 'Çilek', 'Özel pellet'],
  },
  horse: {
    names: ['Rüzgar', 'Yıldırım', 'Prens', 'Prenses', 'Fırtına', 'Gök', 'Şimşek'],
    bios: ['Atlar özgürlüktür 🐴❤️', 'Binicilik hayatımın parçası 🏇', 'Atımla birlikte doğada 🌿🐴'],
    captions: [
      'Sabah galopunda 🐴💨 #at #horse #binicilik',
      'Doğada özgür 🌿🐴 #horselife #horseback',
      'Gün batımında yürüyüş 🌅🐴 #riding',
      'Elma zamanı! 🍎🐴 #horsefeed',
    ],
    comments: ['Harika bir at 🐴😍', 'Binmek istiyorum 🏇', 'Özgürlük bu 🌿'],
    breeds: ['Arap', 'Haflinger', 'Quarter Horse', 'Trakya', 'İngiliz Safkanı'],
    colors: ['Doru', 'Kır', 'Kula', 'Alageyik', 'Siyah'],
    bloodTypes: [],
    weightRange: [400, 700],
    skills: ['Galop', 'Tırıs', 'Engel atlama', 'Dressaj'],
    likes: ['Geniş çayırlar 🌿', 'Elma 🍎', 'Yürüyüş 🚶', 'Özgürlük 🌅'],
    dislikes: ['Kapalı alan', 'Yabancılar', 'Ani sesler'],
    traits: ['Güçlü', 'Özgür ruhlu', 'Sadık', 'Akıllı', 'Enerjik'],
    foods: ['Saman', 'Elma', 'Havuç', 'Yulaf', 'Özel at yemi'],
  },
  hedgehog: {
    names: ['Kirpi', 'Sivri', 'Küçük', 'Ponpon', 'Dikenli'],
    bios: ['Kirpi annesi çok mutlu 🦔', 'Dikenli ama sevimli 🦔💕'],
    captions: [
      'Elma yiyor! 🍎🦔 #kirpi #hedgehog',
      'Top olunca çok tatlı 🦔🌸 #hedgehoglove',
      'Gecenin kahramanı 🌙🦔 #nocturnal',
    ],
    comments: ['Ne kadar tatlı kirpi 🦔😍', 'Dikenlerine rağmen sevilesi 🥺'],
    breeds: ['Afrika Cüce Kirpisi', 'Avrupa Kirpisi'],
    colors: ['Bej-Beyaz', 'Kahverengi', 'Gri-Beyaz'],
    bloodTypes: [],
    weightRange: [0.2, 0.6],
    skills: ['Top olma', 'Yüzme'],
    likes: ['Böcek 🪲', 'Elma 🍎', 'Koşu tüpü 🕳️'],
    dislikes: ['Gündüz 😴', 'Gürültü 🔊'],
    traits: ['Gece aktif', 'Bağımsız', 'Meraklı', 'Savunmacı'],
    foods: ['Böcek', 'Özel kirpi maması', 'Meyve'],
  },
  ferret: {
    names: ['Şeytan', 'Şeker', 'Hız', 'Dans', 'Kaygan'],
    bios: ['Gelincik ailesine hoş geldiniz 🦡', 'Dağ sansarım beni koşturuyor 😂'],
    captions: [
      'Dur bir saniye! 🦡😂 #gelincik #ferret',
      'Oyun modu her zaman açık 🎀🦡 #ferretlife',
      'Tünel sevgisi 🕳️🦡 #ferretplay',
    ],
    comments: ['Gelincik çok enerji verici 😂', 'Süper sevimli bu hayvan 🥺'],
    breeds: ['Evcil Gelincik', 'Angora Gelincik'],
    colors: ['Fitch', 'Beyaz', 'Sable', 'Silverpoint'],
    bloodTypes: [],
    weightRange: [0.6, 2.0],
    skills: ['Tünel koşusu', 'Saklambac', 'Dans hareketi'],
    likes: ['Oyun 🎀', 'Tünel 🕳️', 'Uyku 😴', 'Protein 🍗'],
    dislikes: ['Yalnızlık 😢', 'Sıcak hava 🥵'],
    traits: ['Enerjik', 'Oyuncu', 'Meraklı', 'Sosyal', 'Zeki'],
    foods: ['Tavuk', 'Protein maması', 'Balık'],
  },
  reptile: {
    names: ['Ejder', 'Iguana', 'Kertenkele', 'Zümrüt', 'Yeşim'],
    bios: ['Sürüngen dünyasına hoş geldiniz 🦎', 'İguanam en farklı arkadaşım 🦎💚'],
    captions: [
      'Güneşlenme vakti 🌞🦎 #iguana #reptile',
      'Gözlerini görüyor musunuz? 👁️🦎 #lizard',
      'Marul zamanı 🥬🦎 #iguanalife',
    ],
    comments: ['Sürüngen sevgisi ayrı bir şey 🦎', 'İguana çok ilginç 😮'],
    breeds: ['Yeşil İguana', 'Leopar Kertenkele', 'Sakalı Ejder', 'Kameleon'],
    colors: ['Yeşil', 'Turuncu', 'Sarı-Kahve', 'Mavi-Yeşil'],
    bloodTypes: [],
    weightRange: [0.1, 8.0],
    skills: ['Güneşlenme', 'Tırmanma', 'Renk değiştirme'],
    likes: ['Güneş ☀️', 'Marul 🥬', 'Böcek 🪲', 'Sıcak ortam 🌡️'],
    dislikes: ['Soğuk 🥶', 'Ani hareketler', 'Gürültü'],
    traits: ['Sakin', 'Bağımsız', 'Uzun ömürlü', 'Egzotik'],
    foods: ['Marul', 'Böcek', 'Meyve', 'Özel sürüngen maması'],
  },
};

const mixedComments = [
  'Çok güzel 😍', '❤️❤️❤️', 'Bu tatlılığa dayanılmaz!', 'Harika kare!',
  'Çok güzel bir fotoğraf 📸', 'Bayıldım 😍', '🔥🔥🔥', 'Harika 👏',
  'Güzel paylaşım 🌸', '😍😍😍', 'Süper! 🌟', 'Çok iyi 👍',
];

const locations = [
  'İstanbul, Kadıköy', 'İstanbul, Beşiktaş', 'İstanbul, Şişli',
  'İstanbul, Üsküdar', 'İstanbul, Bakırköy', 'Ankara, Kızılay',
  'Ankara, Çankaya', 'İzmir, Kordon', 'İzmir, Bornova',
  'Bursa, Nilüfer', 'Antalya, Lara', 'Eskişehir, Odunpazarı',
  'Konya, Selçuklu', 'London, Hyde Park', 'Berlin, Mitte',
  'Paris, Montmartre', 'Tokyo, Shibuya', 'New York, Brooklyn',
];

const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Eskişehir', 'Konya', 'Mersin', 'Kayseri', 'Gaziantep'];

// International locations distributed evenly
const internationalLocations = [
  { city: 'New York',    country: 'US' },
  { city: 'Los Angeles', country: 'US' },
  { city: 'Chicago',     country: 'US' },
  { city: 'London',      country: 'UK' },
  { city: 'Manchester',  country: 'UK' },
  { city: 'Birmingham',  country: 'UK' },
  { city: 'Berlin',      country: 'DE' },
  { city: 'Munich',      country: 'DE' },
  { city: 'Hamburg',     country: 'DE' },
  { city: 'Tokyo',       country: 'JP' },
  { city: 'Osaka',       country: 'JP' },
  { city: 'Paris',       country: 'FR' },
  { city: 'Lyon',        country: 'FR' },
  { city: 'Barcelona',   country: 'ES' },
  { city: 'Madrid',      country: 'ES' },
  { city: 'Amsterdam',   country: 'NL' },
  { city: 'Rotterdam',   country: 'NL' },
  { city: 'Toronto',     country: 'CA' },
  { city: 'Vancouver',   country: 'CA' },
  { city: 'Sydney',      country: 'AU' },
];

// ---------------------------------------------------------------------------
// Build pet profile data
// ---------------------------------------------------------------------------
function buildPetProfile(petType, idx) {
  const d = petData[petType] || petData.other;
  const ageYears = randInt(0, 8);
  const ageMonths = randInt(0, 11);
  const bd = new Date('2024-06-01');
  bd.setFullYear(bd.getFullYear() - ageYears);
  bd.setMonth(Math.max(0, bd.getMonth() - ageMonths));
  const birthdate = bd.toISOString().slice(0, 10);

  let weight;
  if (d.weightRange && d.weightRange.length === 2) {
    const [lo, hi] = d.weightRange;
    if (hi < 10) weight = `${(lo + Math.random() * (hi - lo)).toFixed(1)} kg`;
    else weight = `${(lo + Math.random() * (hi - lo)).toFixed(0)} kg`;
  } else {
    weight = '';
  }

  return {
    pet_breed: d.breeds && d.breeds.length ? d.breeds[idx % d.breeds.length] : '',
    pet_birthdate: birthdate,
    pet_gender: ['Erkek', 'Dişi'][idx % 2],
    pet_color: d.colors && d.colors.length ? d.colors[idx % d.colors.length] : '',
    pet_weight: weight,
    pet_neutered: Math.random() > 0.4 ? 1 : 0,
    pet_vaccinated: Math.random() > 0.15 ? 1 : 0,
    pet_blood_type: d.bloodTypes && d.bloodTypes.length ? d.bloodTypes[idx % d.bloodTypes.length] : '',
    pet_skills: shuffle(d.skills || []).slice(0, randInt(2, 4)).join('|'),
    pet_likes: shuffle(d.likes || []).slice(0, randInt(2, 4)).join('|'),
    pet_dislikes: shuffle(d.dislikes || []).slice(0, randInt(1, 3)).join('|'),
    pet_favorite_food: pickRandom(d.foods || ['Mama']),
    pet_traits: shuffle(d.traits || []).slice(0, randInt(3, 5)).join('|'),
    pet_lineage: '',
    pet_awards: '',
  };
}

// ---------------------------------------------------------------------------
// User type distribution: 15 cat, 15 dog, 20 other
// ---------------------------------------------------------------------------
const USER_TYPES = [
  ...Array(15).fill('cat'),
  ...Array(15).fill('dog'),
  ...Array(5).fill('bird'),
  ...Array(5).fill('rabbit'),
  ...Array(3).fill('hamster'),
  ...Array(3).fill('fish'),
  ...Array(2).fill('turtle'),
  ...Array(1).fill('horse'),
  ...Array(1).fill('hedgehog'),
  ...Array(1).fill('ferret'),
]; // 51 total

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------
function clearDatabase() {
  process.stdout.write('Clearing existing data...');
  const tables = ['messages', 'conversations', 'notifications', 'follows', 'comments', 'likes', 'posts', 'users'];
  for (const t of tables) {
    try { db.prepare(`DELETE FROM ${t}`).run(); } catch {}
  }
  try { db.prepare('DELETE FROM sqlite_sequence').run(); } catch {}
  console.log(' done.');
}

// ---------------------------------------------------------------------------
// Build 50 user definitions
// ---------------------------------------------------------------------------
function buildUserDefs() {
  const defs = [];
  // Distribute international slots across the 50 users
  const intlSlots = new Set([3, 7, 10, 14, 18, 21, 24, 27, 30, 33, 36, 38, 40, 42, 44, 46, 47, 48, 49]);

  for (let i = 0; i < 50; i++) {
    const petType = USER_TYPES[i % USER_TYPES.length];
    const d = petData[petType] || petData.cat;
    const isIntl = intlSlots.has(i);
    const loc = isIntl ? internationalLocations[Math.floor(i / 3) % internationalLocations.length] : null;
    const petNameList = d.names || ['Minik'];
    defs.push({
      username: animalUsernames[i] || `pati_${i}`,
      email: `user${i + 1}@demo.com`,
      full_name: fullNames[i] || `Kullanıcı ${i + 1}`,
      bio: pickRandom(d.bios || ['Evcil hayvan sevgisi 🐾']),
      avatar_url: getAvatarUrl(petType, i),
      pet_name: petNameList[i % petNameList.length],
      pet_type: petType,
      city: loc ? loc.city : pickRandom(cities),
      country: loc ? loc.country : 'TR',
      ...buildPetProfile(petType, i),
    });
  }
  return defs;
}

// ---------------------------------------------------------------------------
// Insert 50 users
// ---------------------------------------------------------------------------
function seedUsers(hash, userDefs) {
  process.stdout.write('Inserting 50 users...');
  const stmt = db.prepare(`
    INSERT INTO users (username,email,password_hash,full_name,bio,avatar_url,pet_name,pet_type,city,country,
      pet_breed,pet_birthdate,pet_gender,pet_color,pet_weight,pet_neutered,pet_vaccinated,pet_blood_type,
      pet_skills,pet_likes,pet_dislikes,pet_favorite_food,pet_traits,pet_lineage,pet_awards,created_at)
    VALUES (@username,@email,@password_hash,@full_name,@bio,@avatar_url,@pet_name,@pet_type,@city,@country,
      @pet_breed,@pet_birthdate,@pet_gender,@pet_color,@pet_weight,@pet_neutered,@pet_vaccinated,@pet_blood_type,
      @pet_skills,@pet_likes,@pet_dislikes,@pet_favorite_food,@pet_traits,@pet_lineage,@pet_awards,@created_at)
  `);
  db.transaction((defs) => {
    for (const d of defs) stmt.run({ ...d, password_hash: hash, created_at: randomDateOffset(90) });
  })(userDefs);
  console.log(' done.');
}

// ---------------------------------------------------------------------------
// Posts (8-12 per user)
// ---------------------------------------------------------------------------
function seedPosts(users) {
  process.stdout.write('Inserting posts...');
  const stmt = db.prepare(`
    INSERT INTO posts (user_id,image_url,media_type,caption,pet_name,location,created_at)
    VALUES (@user_id,@image_url,@media_type,@caption,@pet_name,@location,@created_at)
  `);
  let imgCounter = 0;
  const postIds = [];
  db.transaction(() => {
    for (const user of users) {
      const count = randInt(8, 12);
      const d = petData[user.pet_type] || petData.cat;
      for (let p = 0; p < count; p++) {
        const info = stmt.run({
          user_id: user.id,
          image_url: getPostImage(user.pet_type, imgCounter++),
          media_type: 'image',
          caption: pickRandom(d.captions || ['Güzel bir gün 🐾 #hayvan']),
          pet_name: user.pet_name,
          location: pickRandom(locations),
          created_at: randomDateOffset(60),
        });
        postIds.push({ postId: info.lastInsertRowid, userId: user.id, petType: user.pet_type });
      }
    }
  })();
  console.log(` done (${postIds.length} posts).`);
  return postIds;
}

// ---------------------------------------------------------------------------
// Follows (15-25 per user)
// ---------------------------------------------------------------------------
function seedFollows(users) {
  process.stdout.write('Inserting follows...');
  const stmt = db.prepare('INSERT OR IGNORE INTO follows (follower_id,following_id,created_at) VALUES (?,?,?)');
  db.transaction(() => {
    for (const user of users) {
      const targets = shuffle(users.filter(u => u.id !== user.id)).slice(0, randInt(15, 25));
      for (const t of targets) stmt.run(user.id, t.id, randomDateOffset(60));
    }
  })();
  console.log(' done.');
}

// ---------------------------------------------------------------------------
// Likes (10-40 per post)
// ---------------------------------------------------------------------------
function seedLikes(posts, users) {
  process.stdout.write('Inserting likes...');
  const stmt = db.prepare('INSERT OR IGNORE INTO likes (post_id,user_id,created_at) VALUES (?,?,?)');
  const allIds = users.map(u => u.id);
  db.transaction(() => {
    for (const post of posts) {
      const likers = shuffle(allIds.filter(id => id !== post.userId)).slice(0, randInt(10, 40));
      for (const uid of likers) stmt.run(post.postId, uid, randomDateOffset(60));
    }
  })();
  console.log(' done.');
}

// ---------------------------------------------------------------------------
// Comments (3-8 per post)
// ---------------------------------------------------------------------------
function seedComments(posts, users) {
  process.stdout.write('Inserting comments...');
  const stmt = db.prepare('INSERT INTO comments (post_id,user_id,content,created_at) VALUES (?,?,?,?)');
  const allIds = users.map(u => u.id);
  db.transaction(() => {
    for (const post of posts) {
      const commenters = shuffle(allIds.filter(id => id !== post.userId)).slice(0, randInt(3, 8));
      for (const uid of commenters) {
        const d = petData[post.petType] || petData.cat;
        const pool = Math.random() < 0.5 ? (d.comments || mixedComments) : mixedComments;
        stmt.run(post.postId, uid, pickRandom(pool), randomDateOffset(60));
      }
    }
  })();
  console.log(' done.');
}

// ---------------------------------------------------------------------------
// 5 demo users
// ---------------------------------------------------------------------------
function seedDemoUsers(hash) {
  process.stdout.write('Inserting 5 demo users...');
  const stmt = db.prepare(`
    INSERT INTO users (username,email,password_hash,full_name,bio,avatar_url,pet_name,pet_type,city,country,
      pet_breed,pet_birthdate,pet_gender,pet_color,pet_weight,pet_neutered,pet_vaccinated,pet_blood_type,
      pet_skills,pet_likes,pet_dislikes,pet_favorite_food,pet_traits,pet_lineage,pet_awards,created_at)
    VALUES (@username,@email,@password_hash,@full_name,@bio,@avatar_url,@pet_name,@pet_type,@city,@country,
      @pet_breed,@pet_birthdate,@pet_gender,@pet_color,@pet_weight,@pet_neutered,@pet_vaccinated,@pet_blood_type,
      @pet_skills,@pet_likes,@pet_dislikes,@pet_favorite_food,@pet_traits,@pet_lineage,@pet_awards,@created_at)
  `);
  const demoUsers = [
    {
      username: 'whisker_mom', email: 'whisker@demo.com', full_name: 'Zeynep Arslan',
      bio: 'Pamuk\'un annesi 🐱 | İstanbul, Kadıköy | Kedi sevgisi > her şey',
      avatar_url: 'https://loremflickr.com/200/200/cat?lock=251',
      pet_name: 'Pamuk', pet_type: 'cat', city: 'İstanbul', country: 'TR',
      pet_breed: 'British Shorthair', pet_birthdate: '2022-03-15', pet_gender: 'Dişi',
      pet_color: 'Krem', pet_weight: '4.2 kg', pet_neutered: 1, pet_vaccinated: 1,
      pet_blood_type: 'A', pet_skills: 'Yüksek zıplama|Işık takibi|Pati ver',
      pet_likes: 'Güneşlenme ☀️|Kucak keyfi 🤗|Oyun zamanı 🎀|Pencere başı 🪟',
      pet_dislikes: 'Yağmur ☔|Yüksek ses 🔊',
      pet_favorite_food: 'Ton balığı',
      pet_traits: 'Sevecen|Oyuncu|Meraklı|Şımarık',
      pet_lineage: 'Anne: Bella | Baba: Shadow',
      pet_awards: 'En İyi British Shorthair 2023',
    },
    {
      username: 'golden_dad', email: 'golden@demo.com', full_name: 'Murat Demir',
      bio: 'Golden sahibi mutlu baba 🐕 | Ankara | Max ile her yerde',
      avatar_url: 'https://loremflickr.com/200/200/dog?lock=252',
      pet_name: 'Max', pet_type: 'dog', city: 'Ankara', country: 'TR',
      pet_breed: 'Golden Retriever', pet_birthdate: '2020-06-20', pet_gender: 'Erkek',
      pet_color: 'Altın Sarısı', pet_weight: '34 kg', pet_neutered: 1, pet_vaccinated: 1,
      pet_blood_type: 'DEA 1.1+', pet_skills: 'Pati ver|Getir|Yüzme|Otur|Yuvarlan',
      pet_likes: 'Park gezisi 🌳|Oyun topu 🎾|Araba yolculuğu 🚗|Kucak keyfi 🤗',
      pet_dislikes: 'Yalnız kalmak 😢|Fırtına ⛈️',
      pet_favorite_food: 'Tavuk pirzola',
      pet_traits: 'Sadık|Oyuncu|Sevecen|Sosyal|Enerjik',
      pet_lineage: 'Anne: Luna | Baba: Duke',
      pet_awards: 'Belek Cup 2021 Birincilik|İyi Köpek Sertifikası 2022',
    },
    {
      username: 'paw_lover', email: 'paw@demo.com', full_name: 'Elif Kaya',
      bio: 'İki kedi, bir köpek = tam mutluluk 🐾 | İzmir',
      avatar_url: 'https://loremflickr.com/200/200/cat?lock=253',
      pet_name: 'Boncuk', pet_type: 'cat', city: 'İzmir', country: 'TR',
      pet_breed: 'Siamese', pet_birthdate: '2021-09-10', pet_gender: 'Dişi',
      pet_color: 'Gri-Beyaz', pet_weight: '3.8 kg', pet_neutered: 1, pet_vaccinated: 1,
      pet_blood_type: 'B', pet_skills: 'Titreşimli miyav|Işık takibi|Tahterevalli',
      pet_likes: 'Pencere başı 🪟|Oyun zamanı 🎀|Uyku 😴',
      pet_dislikes: 'Banyo 🛁|Yabancılar 😤',
      pet_favorite_food: 'Somon',
      pet_traits: 'Bağımsız|Meraklı|Akıllı|Çekingen',
      pet_lineage: '', pet_awards: '',
    },
    {
      username: 'karamel_pati', email: 'furry@demo.com', full_name: 'Ahmet Yılmaz',
      bio: 'Sokak kedilerini besleyen gönüllü 🏙️ | Karamel\'in babası',
      avatar_url: 'https://loremflickr.com/200/200/cat?lock=254',
      pet_name: 'Karamel', pet_type: 'cat', city: 'İstanbul', country: 'TR',
      pet_breed: 'Van Kedisi', pet_birthdate: '2019-05-05', pet_gender: 'Erkek',
      pet_color: 'Sarman', pet_weight: '5.1 kg', pet_neutered: 0, pet_vaccinated: 1,
      pet_blood_type: 'A', pet_skills: 'Kutu bulma|Denge ustası|Kapı açma',
      pet_likes: 'Güneşlenme ☀️|Mama zamanı 🍽️|Uyku 😴',
      pet_dislikes: 'Veteriner 🏥|Kirli kum',
      pet_favorite_food: 'Islak mama',
      pet_traits: 'Bağımsız|Sakin|Meraklı|Şımarık',
      pet_lineage: '', pet_awards: 'Kadıköy Kedi Festivali 2022',
    },
    {
      username: 'ruzgar_kopek', email: 'doggo@demo.com', full_name: 'Selin Öztürk',
      bio: 'Her gün yeni macera 🐾 | İzmir | Lila ile büyük keşifler',
      avatar_url: 'https://loremflickr.com/200/200/dog?lock=255',
      pet_name: 'Lila', pet_type: 'dog', city: 'İzmir', country: 'TR',
      pet_breed: 'Husky', pet_birthdate: '2021-01-15', pet_gender: 'Dişi',
      pet_color: 'Gri-Beyaz', pet_weight: '24 kg', pet_neutered: 0, pet_vaccinated: 1,
      pet_blood_type: 'DEA 1.1-', pet_skills: 'Yüzme|Koşmak|Gel|Otur',
      pet_likes: 'Koşmak 🏃|Park gezisi 🌳|Yüzmek 🏊|Arkadaş buluşması 🐕',
      pet_dislikes: 'Sıcak hava 🥵|Banyo 🛁',
      pet_favorite_food: 'Somon',
      pet_traits: 'Enerjik|Oyuncu|Sadık|Sosyal|Meraklı',
      pet_lineage: '', pet_awards: 'İzmir Köpek Koşusu 2022 — 3.lük',
    },
  ];
  db.transaction((list) => {
    for (const u of list) stmt.run({ ...u, password_hash: hash, created_at: randomDateOffset(30) });
  })(demoUsers);
  console.log(' done.');
}

// ---------------------------------------------------------------------------
// Rich whisker_mom data: 10 conversations, 15+ notifications
// ---------------------------------------------------------------------------
function seedWhiskerMomData(allUsers) {
  process.stdout.write('Building whisker_mom rich profile...');
  const whisker = db.prepare("SELECT id FROM users WHERE username='whisker_mom'").get();
  if (!whisker) { console.log(' SKIPPED (not found)'); return; }
  const wId = whisker.id;

  const others = shuffle(allUsers.filter(u => u.id !== wId));

  // 25 followers, 22 following
  const followStmt = db.prepare('INSERT OR IGNORE INTO follows (follower_id,following_id,created_at) VALUES (?,?,?)');
  for (let i = 0; i < Math.min(25, others.length); i++) followStmt.run(others[i].id, wId, daysAgo(randInt(1, 20)));
  for (let i = 25; i < Math.min(47, others.length); i++) followStmt.run(wId, others[i].id, daysAgo(randInt(1, 20)));

  // 18 posts
  const postStmt = db.prepare(`INSERT INTO posts (user_id,image_url,media_type,caption,pet_name,location,created_at) VALUES (@user_id,@image_url,@media_type,@caption,@pet_name,@location,@created_at)`);
  const whiskerCaptions = [
    'Sabah güneşinde Pamuk 🌞🐱 #kedi #catlife #pamuk #istanbul',
    'Pazar kahvem ve en iyi arkadaşım ☕🐱 #kedisevgisi #catmom',
    'Bu bakışa dayanmak imkansız 😍 #kedi #miyav #catsofinstagram',
    'Yeni yastık yeni yuva 🛋️🐱 #catsofinstagram #homekitty',
    'Pencere başında felsefi günler 🪟 #kedi #catlife',
    'Mama zamanı geldi! 🍽️🐱 #feeding #catmom #hungry',
    'Oyun modunda Pamuk 🎀 #kedi #playfulcat #cute',
    'İstanbul manzarasında kedi keyfi 🏙️🐱 #istanbul #catlife',
    'Güneş ışığı = kedi mıknatısı ✨ #catsofinstagram #sunbath',
    'Hafta sonu yavaş başladık 😴🐱 #lazycat #weekend #cozy',
    'Yeni oyuncak büyük heyecan 🎾 #catstagram #toy #play',
    'Kucak keyfi 🤗🐱 #cuddlecat #catmom #kediannem',
    'Akşam gezisi isteyen var mı? 🌙 #catlife #evening',
    'Bugün çok tatlı bir gün geçirdik 🌸 #happycat #blessed',
    'Pamuk\'un en sevdiği poz 📸 #catphotography #kedi',
    'Mutfakta yardımcı 😄🍳 #helpfulcat #kitchencat #funny',
    'Kedi tüylü hayat daha güzel 🌺 #petlover #catlife',
    'Küçük prensesim 👑🐱 #princess #catsofig',
  ];
  const postIds = [];
  db.transaction(() => {
    for (let p = 0; p < 18; p++) {
      const info = postStmt.run({
        user_id: wId,
        image_url: getPostImage('cat', p + 300),
        media_type: 'image',
        caption: whiskerCaptions[p],
        pet_name: 'Pamuk',
        location: pickRandom(locations),
        created_at: daysAgo(randInt(1, 30)),
      });
      postIds.push(info.lastInsertRowid);
    }
  })();

  // Likes & comments on whisker_mom's posts
  const likeStmt = db.prepare('INSERT OR IGNORE INTO likes (post_id,user_id,created_at) VALUES (?,?,?)');
  const commentStmt = db.prepare('INSERT INTO comments (post_id,user_id,content,created_at) VALUES (?,?,?,?)');
  db.transaction(() => {
    for (const postId of postIds) {
      const likers = shuffle(others).slice(0, randInt(20, 48));
      for (const u of likers) likeStmt.run(postId, u.id, daysAgo(randInt(1, 28)));
      const commenters = shuffle(others).slice(0, randInt(5, 12));
      for (const u of commenters) commentStmt.run(postId, u.id, pickRandom(petData.cat.comments.concat(mixedComments)), daysAgo(randInt(1, 28)));
    }
  })();

  // ── 10 rich conversations (5-10 messages each) ──
  const msgStmt = db.prepare('INSERT INTO messages (conversation_id,sender_id,content,read,created_at) VALUES (?,?,?,?,?)');

  const conversationScripts = [
    {
      partnerIdx: 0,
      msgs: [
        { from: 'partner', text: 'Merhaba! Pamuk çok tatlı, kaç aylık? 😍', daysBack: 1 },
        { from: 'me',      text: 'Teşekkürler! Pamuk 2 yaşında, British Shorthair 🐱', daysBack: 1 },
        { from: 'partner', text: 'Vay be, o tatlılığa dayanmak zor 🥺 Hangi mamayı yiyor?', daysBack: 1 },
        { from: 'me',      text: 'Ton balığı çılgını 😂 Islak mama dışında hiçbir şey yemiyor', daysBack: 0 },
        { from: 'partner', text: 'Benim Tekir de öyle! Sadece belirli marka sever 😅', daysBack: 0 },
        { from: 'me',      text: 'Kediler çok seçici ya, haha 😄🐱', daysBack: 0 },
      ],
    },
    {
      partnerIdx: 1,
      msgs: [
        { from: 'partner', text: 'Fotoğraflarını çok beğeniyorum! Hangi kamerayla çekiyorsun? 📸', daysBack: 3 },
        { from: 'me',      text: 'Sadece telefonla! iPhone 14 Pro, ışığı doğru yakalamak önemli 😊', daysBack: 3 },
        { from: 'partner', text: 'Wow, kalite çok iyi gerçekten. Pamuk\'u fotoğraflamak zor mu?', daysBack: 3 },
        { from: 'me',      text: 'Çok zor! Sürekli hareket ediyor 😅 Sabır işi', daysBack: 2 },
        { from: 'partner', text: 'Anladım 😂 Benim Maviş de aynı şekilde, kaçıyor sürekli', daysBack: 2 },
        { from: 'me',      text: 'Sabah saatleri en iyi, ışık güzel ve uykuları var biraz 😄', daysBack: 2 },
        { from: 'partner', text: 'Harika ipucu, deneyeceğim! Teşekkürler 🙏', daysBack: 2 },
      ],
    },
    {
      partnerIdx: 2,
      msgs: [
        { from: 'partner', text: 'Selam! İstanbul\'da mıyız? Bir gün buluşabiliriz, köpeklerimizi tanıştıralım 😊', daysBack: 5 },
        { from: 'me',      text: 'Merhaba! Evet Kadıköy\'deyim 🌊 Ne kadar eğlenceli olurdu!', daysBack: 5 },
        { from: 'partner', text: 'Bende Golden var, sosyal hayvan, herkesle arkadaş oluyor 😄', daysBack: 4 },
        { from: 'me',      text: 'Pamuk köpekleri sevmiyor pek ama tanışırlarsa belki anlaşırlar 😂', daysBack: 4 },
        { from: 'partner', text: 'Haha! Belki kedi-köpek dostluğu kurarsınız 🐱🐶', daysBack: 4 },
        { from: 'me',      text: 'Hafta sonu Moda Sahili\'ne gidelim mi? Güzel hava olacak 🌞', daysBack: 3 },
        { from: 'partner', text: 'Harika fikir! Cumartesi öğleden sonra uygun mu?', daysBack: 3 },
        { from: 'me',      text: 'Çok uygun! Saat 15 de olur mu? ☀️', daysBack: 3 },
      ],
    },
    {
      partnerIdx: 3,
      msgs: [
        { from: 'partner', text: 'Kedilerin bakımı için önerilerin var mı? Yeni kedi aldım 🐱', daysBack: 7 },
        { from: 'me',      text: 'Tebrikler! 🎉 Ne cinsi aldın?', daysBack: 7 },
        { from: 'partner', text: 'Scottish Fold, 3 aylık bebek 🥺', daysBack: 6 },
        { from: 'me',      text: 'Çok güzel! Vet kontrolü yaptırdın mı önce?', daysBack: 6 },
        { from: 'partner', text: 'Evet yaptırdım, aşıları tamam. Kum kabı için önerin var mı?', daysBack: 6 },
        { from: 'me',      text: 'Kapalı kum kabı olsun, toz yapmaz. Silika kum çok iyi 👍', daysBack: 5 },
        { from: 'partner', text: 'Teşekkürler! Bir de mama markası için?', daysBack: 5 },
        { from: 'me',      text: 'Royal Canin veya Hills çok iyi, tahılsız olsun 🐾', daysBack: 5 },
        { from: 'partner', text: 'Çok yardımcı oldun! Seni takip etmeye devam 😊❤️', daysBack: 4 },
      ],
    },
    {
      partnerIdx: 4,
      msgs: [
        { from: 'partner', text: 'Çok güzel kedilerin var, takip etmek zorunda kaldım 🥰', daysBack: 10 },
        { from: 'me',      text: 'Teşekkürler, çok naziksin 😊🐱', daysBack: 10 },
        { from: 'partner', text: 'Pamuk\'un o gözleri inanılmaz, hangi renk tam olarak?', daysBack: 9 },
        { from: 'me',      text: 'Kehribar sarısı 💛 British Shorthair\'lerde çok olur', daysBack: 9 },
        { from: 'partner', text: 'Harika! Ben de kedi almayı düşünüyorum', daysBack: 9 },
        { from: 'me',      text: 'Kesinlikle al! Hayatın değişiyor tamamen 😄🐾', daysBack: 8 },
      ],
    },
    {
      partnerIdx: 5,
      msgs: [
        { from: 'partner', text: 'Fotoğraflarını çok seviyorum, devam et! 🌟', daysBack: 12 },
        { from: 'me',      text: 'Teşekkürler bu güzel mesaj için 🙏😊', daysBack: 12 },
        { from: 'partner', text: 'Papağanım da fotoğraf çekilmekten nefret ediyor 😅 nasıl bu kadar güzel çekiyorsun?', daysBack: 11 },
        { from: 'me',      text: 'Hahaha! Kediler de zor ama 😂 Oyun oynarken çekmek daha kolay', daysBack: 11 },
        { from: 'partner', text: 'Deneyeceğim teşekkürler! 🦜❤️', daysBack: 11 },
      ],
    },
    {
      partnerIdx: 6,
      msgs: [
        { from: 'partner', text: 'Selam! Veteriner önerin var mı Kadıköy\'de? 🏥', daysBack: 14 },
        { from: 'me',      text: 'Merhaba! Moda Hayvan Kliniği çok iyi, Dr. Ahmet harika bir hekim 👨‍⚕️', daysBack: 14 },
        { from: 'partner', text: 'Teşekkürler! Fiyatları uygun mu?', daysBack: 13 },
        { from: 'me',      text: 'Orta seviye, ama kalite çok yüksek. İnternet\'ten randevu alabilirsin', daysBack: 13 },
        { from: 'partner', text: 'Çok yardımcı oldun! 🙏 Sana güveniyorum artık 😊', daysBack: 13 },
        { from: 'me',      text: 'Ne zaman ihtiyacın olursa sorabilirsin 😊🐾', daysBack: 12 },
      ],
    },
    {
      partnerIdx: 7,
      msgs: [
        { from: 'partner', text: 'Merhaba! Pamuk\'la ilgili bir sorum vardı, kısırlaştırma ne zaman yaptırdın?', daysBack: 16 },
        { from: 'me',      text: 'Merhaba! 6 aylıkken yaptırdım, çok doğru bir karar 👍', daysBack: 16 },
        { from: 'partner', text: 'Sonrasında davranış değişti mi?', daysBack: 15 },
        { from: 'me',      text: 'Daha sakin oldu biraz ama hâlâ çok oyuncu 😄 Kilo almaya başladı, dikkat et!', daysBack: 15 },
        { from: 'partner', text: 'Tamam not ettim! Teşekkürler, çok bilgi vericisin 🙏', daysBack: 15 },
        { from: 'me',      text: 'İyi şanslar! Bi\'şey olursa yaz 🐱💕', daysBack: 15 },
      ],
    },
    {
      partnerIdx: 8,
      msgs: [
        { from: 'partner', text: 'Harika paylaşımın için tebrikler! Pamuk çok tatlı 🐱✨', daysBack: 20 },
        { from: 'me',      text: 'Teşekkürler 😊 Senin tavşanın da çok tatlı!', daysBack: 20 },
        { from: 'partner', text: 'Hoppala\'ya kedi nasıl reaksiyon veriyor acaba? 😄', daysBack: 19 },
        { from: 'me',      text: 'Vay, kedi tavşan birlikteliği ilginç olurdu! Bizimki köpeklere bile takılıyor 😂', daysBack: 19 },
        { from: 'partner', text: 'Haha! Tavşanlar aslında çok savunmacı 😅', daysBack: 19 },
        { from: 'me',      text: 'Bunun videosunu görmek isterdim 😄🐰🐱', daysBack: 18 },
        { from: 'partner', text: 'Belki bir gün deneriz! Güzel bir içerik olur 📸', daysBack: 18 },
      ],
    },
    {
      partnerIdx: 9,
      msgs: [
        { from: 'partner', text: 'Merhaba, PetCircle\'a yeni katıldım. Nasıl bir yer burası? 😊', daysBack: 25 },
        { from: 'me',      text: 'Hoş geldin! 🎉 Çok güzel bir topluluk, evcil hayvan severlerin buluşma noktası', daysBack: 25 },
        { from: 'partner', text: 'Çok güzel! Ne tür içerik paylaşmalıyım?', daysBack: 24 },
        { from: 'me',      text: 'Hayvanının fotoğrafları, günlük aktiviteler, bakım ipuçları... Her şey olur 🐾', daysBack: 24 },
        { from: 'partner', text: 'Süper! Benim ferretım var, pek fazla ferret hesabı göremedim', daysBack: 24 },
        { from: 'me',      text: 'Tam o yüzden paylaş! Farklı hayvanlar çok ilgi görüyor burada 😊', daysBack: 23 },
        { from: 'partner', text: 'Harika, teşekkürler! Seni takip ettim 🦡❤️', daysBack: 23 },
        { from: 'me',      text: 'Ben de seni takip ettim! Ferret fotoğraflarını bekliyorum 📸', daysBack: 23 },
      ],
    },
  ];

  db.transaction(() => {
    for (const script of conversationScripts) {
      const partner = others[script.partnerIdx];
      if (!partner) continue;
      const p1 = Math.min(partner.id, wId);
      const p2 = Math.max(partner.id, wId);
      let conv = db.prepare('SELECT id FROM conversations WHERE participant_1=? AND participant_2=?').get(p1, p2);
      if (!conv) {
        const r = db.prepare('INSERT OR IGNORE INTO conversations (participant_1,participant_2,last_message_at) VALUES (?,?,?)').run(p1, p2, daysAgo(script.msgs[0].daysBack));
        conv = { id: r.lastInsertRowid };
      }
      let lastTime = script.msgs[0].daysBack;
      for (const msg of script.msgs) {
        const senderId = msg.from === 'me' ? wId : partner.id;
        const isRead = msg.from === 'me' ? 1 : (msg.daysBack > 1 ? 1 : 0);
        msgStmt.run(conv.id, senderId, msg.text, isRead, daysAgo(msg.daysBack));
        lastTime = msg.daysBack;
      }
    }
  })();

  // ── 18 notifications (mix of types, different dates) ──
  const notifStmt = db.prepare('INSERT INTO notifications (recipient_id,sender_id,type,post_id,read,created_at) VALUES (?,?,?,?,?,?)');
  db.transaction(() => {
    // 6 follow notifications
    for (let i = 0; i < 6; i++) {
      notifStmt.run(wId, others[i].id, 'follow', null, i < 3 ? 0 : 1, daysAgo(randInt(i + 1, i + 5)));
    }
    // 6 like notifications
    for (let i = 6; i < 12; i++) {
      const pid = postIds[(i - 6) % postIds.length];
      notifStmt.run(wId, others[i].id, 'like', pid, i < 9 ? 0 : 1, daysAgo(randInt(1, 10)));
    }
    // 4 comment notifications
    for (let i = 12; i < 16; i++) {
      const pid = postIds[(i - 12) % postIds.length];
      notifStmt.run(wId, others[i % others.length].id, 'comment', pid, i < 14 ? 0 : 1, daysAgo(randInt(1, 8)));
    }
    // 2 message notifications
    for (let i = 16; i < 18; i++) {
      notifStmt.run(wId, others[i % others.length].id, 'message', null, 0, daysAgo(randInt(1, 3)));
    }
  })();

  console.log(' done.');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  console.log('=== PetCircle Demo Seeder ===\n');

  clearDatabase();

  process.stdout.write('Hashing password...');
  const hash = bcrypt.hashSync('demo1234', 10);
  console.log(' done.');

  const userDefs = buildUserDefs();
  seedUsers(hash, userDefs);

  const users = db.prepare('SELECT id, pet_name, pet_type FROM users ORDER BY id').all();
  const posts = seedPosts(users);
  seedFollows(users);
  seedLikes(posts, users);
  seedComments(posts, users);
  seedDemoUsers(hash);

  const allUsers = db.prepare('SELECT id, pet_name, pet_type FROM users ORDER BY id').all();
  seedWhiskerMomData(allUsers);

  const uCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const pCount = db.prepare('SELECT COUNT(*) AS c FROM posts').get().c;
  const lCount = db.prepare('SELECT COUNT(*) AS c FROM likes').get().c;
  const cCount = db.prepare('SELECT COUNT(*) AS c FROM comments').get().c;
  const fCount = db.prepare('SELECT COUNT(*) AS c FROM follows').get().c;
  const mCount = db.prepare('SELECT COUNT(*) AS c FROM messages').get().c;
  const nCount = db.prepare('SELECT COUNT(*) AS c FROM notifications').get().c;

  const wStats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM follows WHERE following_id=u.id) as followers,
      (SELECT COUNT(*) FROM follows WHERE follower_id=u.id) as following,
      (SELECT COUNT(*) FROM posts WHERE user_id=u.id) as posts
    FROM users u WHERE u.username='whisker_mom'
  `).get();

  const ptDist = db.prepare('SELECT pet_type, COUNT(*) as c FROM users GROUP BY pet_type ORDER BY c DESC').all();

  console.log('\n=== Seed Complete ===');
  console.log(`  Users         : ${uCount}`);
  console.log(`  Posts         : ${pCount}`);
  console.log(`  Likes         : ${lCount}`);
  console.log(`  Comments      : ${cCount}`);
  console.log(`  Follows       : ${fCount}`);
  console.log(`  Messages      : ${mCount}`);
  console.log(`  Notifications : ${nCount}`);
  if (wStats) console.log(`\nwhisker_mom: ${wStats.posts} posts | ${wStats.followers} followers | ${wStats.following} following`);
  console.log('\nPet type distribution:');
  for (const row of ptDist) console.log(`  ${row.pet_type.padEnd(10)}: ${row.c}`);
  console.log('\nDemo credentials (password: demo1234)');
  console.log('  whisker@demo.com  – whisker_mom');
  console.log('  golden@demo.com   – golden_dad');
  console.log('  paw@demo.com      – paw_lover');
  console.log('  furry@demo.com    – karamel_pati');
  console.log('  doggo@demo.com    – ruzgar_kopek');
  console.log('\nDone! 🐾');
}

if (require.main === module) main();
