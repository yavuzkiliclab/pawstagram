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
// Usernames & names
// ---------------------------------------------------------------------------
const animalUsernames = [
  'fluffy_paws', 'whisker_queen', 'biscuit_the_cat', 'noodle_nose', 'mochi_meow',
  'pretzel_pup', 'waffles_woof', 'captain_biscuit', 'mr_fluffins', 'duchess_of_purr',
  'tater_tot_pet', 'shadow_snuggles', 'cheddar_chaser', 'peanut_pounce', 'maple_mew',
  'ginger_snap_pet', 'hazel_hops', 'bean_the_dog', 'pickle_patrol', 'truffle_tracker',
  'mango_meow', 'zigzag_pup', 'pepper_paws', 'boba_bites', 'cinnamon_curl',
  'the_real_oreo', 'walnut_wag', 'clover_cuddles', 'sprout_sniffs', 'dumpling_dog',
  's_mores_pet', 'fudge_face', 'raisin_runs', 'pudding_purr', 'nacho_nibble',
  'butterscotch_b', 'pistachio_pet', 'jellybean_joy', 'taffy_tales', 'brownie_bark',
  'licorice_licks', 'cobbler_cat', 'croissant_crew', 'muffin_mew', 'latte_the_lab',
  'espresso_ears', 'sorbet_steps', 'tiramisu_tail', 'macaron_mischief', 'churro_chase',
];

const fullNames = [
  'Emma Wilson', 'Olivia Chen', 'Sophia Martinez', 'Isabella Brown', 'Charlotte Davis',
  'Amelia Thompson', 'Mia Anderson', 'Harper Garcia', 'Evelyn White', 'Abigail Harris',
  'Emily Clark', 'Elizabeth Lewis', 'Avery Robinson', 'Sofia Walker', 'Camila Hall',
  'Liam Johnson', 'Noah Williams', 'Oliver Jones', 'Elijah Miller', 'James Taylor',
  'Aiden Moore', 'Lucas Jackson', 'Mason Martin', 'Ethan Lee', 'Logan Perez',
  'Alexander King', 'Sebastian Scott', 'Jack Green', 'Owen Baker', 'Samuel Adams',
  'Daniel Nelson', 'Henry Carter', 'Matthew Mitchell', 'Joseph Perez', 'David Roberts',
  'Sophie Martin', 'Anna Schmidt', 'Lucas Müller', 'Yuki Tanaka', 'Marie Dubois',
  'Carlos García', 'Lena Weber', 'James Brown', 'Li Wei', 'Fatima Al-Hassan',
  'Igor Petrov', 'Sara Johnson', 'Tom Anderson', 'Mia Chen', 'David Kim',
];

// Per-pet-type data
const petData = {
  cat: {
    names: ['Whiskers', 'Biscuit', 'Mochi', 'Shadow', 'Pumpkin', 'Luna', 'Mango', 'Noodle', 'Pretzel', 'Cheddar', 'Hazel', 'Maple', 'Bean', 'Ginger', 'Pickles'],
    bios: [
      'I own this house, my human just pays the rent 😼',
      'Professional nap supervisor 😴🐱 | Will work for treats',
      'My cat has 3 Instagram accounts and I have none 😅',
      'Devoted servant to a 4kg furball who refuses wet food 🐱',
      'Cat mom of two chaos agents 🐈🐈 | They run this place',
      'Warning: may share unsolicited cat photos at any time 📸🐱',
      'My therapist has whiskers and charges in cuddles 🐾',
      'Rescue cat parent | They rescued me back 💕',
      'Morning coffee tastes better with a purring lap warmer ☕🐱',
    ],
    captions: [
      'Excuse me, this sunbeam is reserved 🌞😼 #catlife #sundayvibes #catsofinstagram',
      'This look means dinner was 3 minutes late 👀 #catmom #judgement #catsofig',
      'Gravity? Never heard of it 🐱✨ #tabletop #catphysics #petsofinstagram',
      'Box arrived. Cat claimed it immediately 📦🐱 #ifyoufitiousit #catlogic',
      'Philosophical window thoughts at 3am 🪟🌙 #catlife #deepthoughts',
      'New toy received. Played with the bag instead 🛍️😂 #classic #catlife',
      'The softest alarm clock in the world 🐾😴 #morningvibes #catmom',
      'Staring contest champion 3 years running 👁️👁️ #focusmode #catsofinstagram',
      'They said cats are low maintenance 😂 #lies #catlife #spoiled',
      'Caught mid-zoomies — a rare and precious moment 🏃💨 #zoomies #catlife',
    ],
    comments: [
      'Those eyes are EVERYTHING 😭🐱',
      'I am not okay, this is too cute 🥺',
      'My cat does the exact same thing omg 😂',
      'Stop it right now I cannot handle this 😍',
      'The little beans on those paws 🥹🐾',
      'Rental property confirmed 😂👑',
      'This pic made my whole day ☀️',
    ],
    breeds: ['British Shorthair', 'Persian', 'Scottish Fold', 'Maine Coon', 'Siamese', 'Ragdoll', 'Abyssinian', 'Bengal', 'Turkish Angora', 'Norwegian Forest'],
    colors: ['White', 'Black', 'Grey', 'Orange & White', 'Tabby', 'Ginger', 'Calico', 'Tortoiseshell', 'Cream'],
    bloodTypes: ['A', 'B', 'AB'],
    weightRange: [2.5, 7.0],
    skills: ['High jumper', 'Light chaser', 'Box finder', 'High-five', 'Chirp on command', 'Balance expert', 'Door opener'],
    likes: ['Sunny spots ☀️', 'Playtime 🎀', 'Lap cuddles 🤗', 'Window watching 🪟', 'Dinner time 🍽️', 'Napping 😴'],
    dislikes: ['Rain ☔', 'Loud noises 🔊', 'Bath time 🛁', 'Vet visits 🏥'],
    traits: ['Playful', 'Independent', 'Curious', 'Calm', 'Smart', 'Affectionate', 'Sassy'],
    foods: ['Tuna', 'Chicken breast', 'Salmon', 'Dry kibble', 'Wet food'],
  },
  dog: {
    names: ['Max', 'Luna', 'Buddy', 'Charlie', 'Rex', 'Bella', 'Rocky', 'Coco', 'Duke', 'Zeus', 'Milo', 'Lola', 'Oscar', 'Daisy', 'Bear'],
    bios: [
      'Golden dad and proud of it 🐕 | Max is my co-pilot',
      'My dog has more friends than I do and I\'m fine with that 🐶',
      'Morning run + dog = perfect start to any day ☀️🐾',
      'Dog hair is just a fashion statement I didn\'t choose 🐾',
      'Walk > anything else on the agenda 🌳🐕',
      'Full-time dog butler, part-time human 🐶❤️',
      'Best therapist I\'ve ever had, charges in belly rubs 🛋️🐕',
      'Paw prints permanently embedded in my heart 🐾❤️',
    ],
    captions: [
      'We came for the park, we stayed for the squirrel drama 🌳🐕 #doglife #parkday #dogsofinstagram',
      'New ball acquired. Life is complete 🎾😄 #doggo #fetch #happydog',
      'This smile makes every early morning walk worth it 🌅 #morningwalk #goodboy',
      'First time at the beach and he LOVED it 🏖️🐕 #beachdog #summer #doglife',
      'Officially the best boy in the world 🌟 #goodboy #dogsofinstagram',
      'Chaos mode: fully activated 😅 #naughtydog #funny #dogfails',
      'Car window = peak happiness 🚗💨 #cardog #windyears',
      'Trail day with my adventure buddy 🏔️🐾 #hikingdog #nature #doglife',
      'This face every single time I open the fridge 😍🐕 #treattime #beggingexperts',
      'Zoomies o\'clock at the dog park 🐶💨 #dogpark #zoomies #petsofinstagram',
    ],
    comments: [
      'I\'m adopting a dog TOMORROW because of this post 🐶',
      'The smile!! I can\'t 😭💙',
      'Those eyes melted my cold heart 😍',
      'Best friend material right there 💙',
      'Woof woof!! 🐕 (translation: adorable)',
      'This happiness is contagious 🥰',
    ],
    breeds: ['Golden Retriever', 'Labrador', 'Husky', 'German Shepherd', 'Poodle', 'Beagle', 'Dachshund', 'Border Collie', 'Shih Tzu', 'Maltese', 'Boxer', 'Pomeranian'],
    colors: ['Golden', 'Black', 'White', 'Light Brown', 'Cream', 'Grey & White', 'Brown'],
    bloodTypes: ['DEA 1.1+', 'DEA 1.1-', 'DEA 4+', 'DEA 7+'],
    weightRange: [5, 45],
    skills: ['Shake hands', 'Sit', 'Lie down', 'Roll over', 'Fetch', 'Swimming', 'Spin', 'Jump', 'Stay'],
    likes: ['Park trips 🌳', 'Tennis ball 🎾', 'Lap time 🤗', 'Car rides 🚗', 'Swimming 🏊', 'Chew bone 🦴'],
    dislikes: ['Being alone 😢', 'Thunderstorms ⛈️', 'Vet visits 🏥', 'Bath time 🛁'],
    traits: ['Playful', 'Loyal', 'Energetic', 'Calm', 'Smart', 'Social', 'Protective', 'Affectionate'],
    foods: ['Chicken strips', 'Salmon', 'Bone broth', 'Premium kibble', 'Beef'],
  },
  bird: {
    names: ['Mango', 'Kiwi', 'Pepper', 'Rio', 'Sunny', 'Echo', 'Skye', 'Cosmo'],
    bios: [
      'My parrot woke me up at 6am with a perfect rendition of my ringtone 🦜',
      'He says "pretty bird" and has not been wrong yet 🐦',
      'Living in a rainbow with wings 🌈🦜',
      'Canary song is the only alarm clock I need 🎵',
      'Budgie gang represent! 🐦💚 Who else relates?',
    ],
    captions: [
      'Delivered a 10-minute monologue this morning 🦜😂 #parrot #talkingbird #birdsofinstagram',
      'The feathers, the colors, the DRAMA 🌈 #bird #parrotlife #petsofinstagram',
      'Little concert at 7am, attendance mandatory 🎵🐦 #canary #birdlife',
      'Won\'t leave my shoulder and honestly? Fine by me 😄🦜 #shoulderbird #parrot',
      'Fruit time is the best time 🍎🦜 #parrotfood #treattime',
      'The intelligence in those eyes is unnerving 🤯 #parrot #smartbird',
    ],
    comments: [
      'The prettiest bird I\'ve ever seen 🦜',
      'Does it actually talk?! 😮',
      'Those colors are absolutely wild 🌈',
      'Feathers on point 🥰 #blessed',
    ],
    breeds: ['African Grey', 'Budgerigar', 'Canary', 'Cockatoo', 'Conure', 'Forpus', 'Eclectus'],
    colors: ['Green & Yellow', 'Blue & White', 'Red & Green', 'Yellow', 'Grey', 'Rainbow'],
    bloodTypes: [],
    weightRange: [0.05, 1.5],
    skills: ['Talking', 'Dancing', 'Singing', 'Splashing', 'Playing', 'Trick training'],
    likes: ['Fresh fruit 🍎', 'Music 🎵', 'Flying 🕊️', 'Social time 🤗', 'Toys 🎀'],
    dislikes: ['Loneliness 😢', 'Loud noises 🔊', 'Cold weather ❄️', 'Baths 🚿'],
    traits: ['Intelligent', 'Social', 'Chatty', 'Playful', 'Curious', 'Loyal'],
    foods: ['Seeds', 'Fresh fruit', 'Vegetables', 'Pellets'],
  },
  rabbit: {
    names: ['Thumper', 'Cottontail', 'Hops', 'Flopsy', 'Bunnybun', 'Clover', 'Snowball', 'Lucky'],
    bios: [
      'My rabbit eats better than I do 😄🐰',
      'The softest best friend you could ever ask for 🐇💕',
      'Bun life chose me and I have zero regrets 🥕',
      'Mini lop owner — he\'s tiny, chaotic, and perfect 🐰',
      'Holland lop family just got bigger 🐇',
    ],
    captions: [
      'Carrot o\'clock and she KNOWS it 🥕🐰 #bunnylove #rabbit #petsofinstagram',
      'I cannot stop kissing those ears, send help 🐇 #bunnyears #rabbitsofinstagram',
      'Garden exploration mode activated 🌿🐰 #bunnylife #freerange',
      'Sleeping bunny unlocked max cuteness 😴🐇 #sleepybunny #bunnylove',
      'Full sprint mode for no reason at all 🎀🐰 #binkies #rabbit',
      'New room, new adventure 🏠🐇 #floppyears #bunnylife',
    ],
    comments: [
      'I need this rabbit in my life immediately 🥺🐰',
      'Those ears though 🥰',
      'Looks like a literal cloud 🤍',
      'I am not handling this level of cute 😭',
    ],
    breeds: ['Holland Lop', 'Mini Rex', 'Angora', 'Dutch', 'Flemish Giant', 'Lionhead', 'Mini Lop'],
    colors: ['White', 'Grey', 'Brown', 'Black & White', 'Orange', 'Spotted'],
    bloodTypes: [],
    weightRange: [1.0, 5.0],
    skills: ['Binkies on command', 'Hoop jumping', 'Name recognition', 'High-five', 'Box diving'],
    likes: ['Carrots 🥕', 'Hay 🌾', 'Playtime 🎀', 'Cuddles 🤗', 'Fresh greens 🥬'],
    dislikes: ['Loud noises 🔊', 'Sudden movements 😱', 'Being alone 😢'],
    traits: ['Curious', 'Affectionate', 'Playful', 'Shy', 'Calm', 'Smart'],
    foods: ['Carrots', 'Lettuce', 'Timothy hay', 'Pellets', 'Apple slices'],
  },
  hamster: {
    names: ['Nugget', 'Peanut', 'Popcorn', 'Dumpling', 'Biscuit', 'Waffles', 'Mochi'],
    bios: [
      'Golden hamster mom living my best tiny life 🐹💛',
      'Midnight zoomie enabler 🌙🐹',
      'Smallest member of the family, biggest personality 🐹',
    ],
    captions: [
      'Those cheeks are storing half the kitchen 😂🐹 #hamster #hamsterlove #petsofinstagram',
      'Night shift just started 🏃🐹 #hamsterlife #nocturnal',
      'New habitat exploration begins 🏠🐹 #hamsterhome #hamsterlove',
      'Sleeping so hard he doesn\'t exist 😴🐹 #sleepyhamster #tinylife',
      'Dinner is serious business 🌾🐹 #feedingtime #hamsterlife',
    ],
    comments: [
      'Those cheeks are storing a whole meal 😍🐹',
      'So tiny and so perfect 🥺',
      'I need a hamster after seeing this 🐹',
    ],
    breeds: ['Syrian Hamster', 'Dwarf Hamster', 'Roborovski', 'Campbell', 'Winter White'],
    colors: ['Golden', 'White', 'Grey', 'Brown', 'Spotted'],
    bloodTypes: [],
    weightRange: [0.03, 0.18],
    skills: ['Wheel running', 'Tunnel navigation', 'Hoarding', 'Ball rolling'],
    likes: ['Seeds 🌻', 'Fruit 🍓', 'Tunnels 🕳️', 'Running wheel 🏃', 'Hiding 🙈'],
    dislikes: ['Daytime 😴', 'Sudden noises 🔊', 'Being woken up'],
    traits: ['Nocturnal', 'Curious', 'Independent', 'Calm', 'Fast'],
    foods: ['Seeds', 'Sunflower seeds', 'Tiny fruit pieces', 'Pellets'],
  },
  fish: {
    names: ['Nemo', 'Dory', 'Splash', 'Koi', 'Bubbles', 'Bluebell', 'Finley', 'Aqua'],
    bios: [
      'Welcome to my underwater kingdom 🐠',
      'My koi has been with me for 10 years, he knows things 🐟',
      'House full of color and fins 🌊',
      'Goldfish collection expanding dangerously 🐠🐡',
    ],
    captions: [
      'New residents just moved in 🐠 #aquarium #fishlife #fishtank',
      'Morning glide check 🌊🐡 #koi #fishkeeping',
      'The colors in this tank are unreal 🌈🐠 #aquascaping #aquarium',
      'Feeding frenzy at 8am 🌱🐟 #feedingtime #fishlife',
      'Peaceful tank, peaceful mind 🌊 #aquarium #relaxing',
    ],
    comments: [
      'That aquarium setup is stunning 😍🐠',
      'Fish goals honestly 🐡',
      'The colors are incredible 🌈',
      'So peaceful to look at 🌊',
    ],
    breeds: ['Goldfish', 'Koi', 'Betta', 'Guppy', 'Neon Tetra', 'Discus', 'Clownfish'],
    colors: ['Orange & White', 'Blue', 'Red', 'Yellow & Black', 'Rainbow', 'Silver'],
    bloodTypes: [],
    weightRange: [0.01, 2.0],
    skills: ['Hoop swimming', 'Following hand', 'Feeding recognition'],
    likes: ['Clean water 💧', 'Live feed 🦐', 'Hiding spots 🪨', 'Plants 🌿'],
    dislikes: ['Dirty water 🤢', 'Temperature changes 🌡️', 'Bright light 💡'],
    traits: ['Calm', 'Beautiful', 'Independent', 'Colorful', 'Peaceful'],
    foods: ['Flake food', 'Frozen brine shrimp', 'Live feed', 'Pellets'],
  },
  turtle: {
    names: ['Captain', 'Slowpoke', 'Pebble', 'Tank', 'Shelly', 'Donatello', 'Leonardo'],
    bios: [
      'My turtle has been here longer than any relationship I\'ve had 🐢',
      'Slow and steady, but mostly just slow 🐢💪',
      'Turtle keeping builds patience. A lot of it. 🐢',
    ],
    captions: [
      'Sunbathing is a full-time job 🌞🐢 #turtle #reptilelife #petsofinstagram',
      'At this pace I\'ll arrive tomorrow, please hold 😂🐢 #slowlife #turtlelife',
      'Lettuce appreciation post 🥬🐢 #turtlelove #reptiles',
      'Splashing around in the shallow end 🌊🐢 #swimming #turtle',
    ],
    comments: [
      'The most adorable ancient creature 🐢💚',
      'Slow and steady wins my heart 🥺',
      'Look at that personality 😍',
    ],
    breeds: ['Red-Eared Slider', 'Russian Tortoise', 'Box Turtle', 'Gopher Tortoise'],
    colors: ['Green', 'Brown', 'Black & Yellow', 'Olive Green'],
    bloodTypes: [],
    weightRange: [0.2, 5.0],
    skills: ['Swimming', 'Digging', 'Basking'],
    likes: ['Sunshine ☀️', 'Water 🌊', 'Lettuce 🥬', 'Strawberries 🍓'],
    dislikes: ['Cold weather ❄️', 'Loud noise 🔊'],
    traits: ['Calm', 'Patient', 'Long-lived', 'Independent'],
    foods: ['Lettuce', 'Carrots', 'Strawberries', 'Turtle pellets'],
  },
  horse: {
    names: ['Thunder', 'Storm', 'Prince', 'Duchess', 'Blaze', 'Sky', 'Lightning'],
    bios: [
      'Horses are just big dogs with better hair 🐴❤️',
      'Equestrian life chose me and I never looked back 🏇',
      'Out in the fields with my best friend 🌿🐴',
    ],
    captions: [
      'Morning gallop is the best therapy 🐴💨 #horse #horseriding #equestrianlife',
      'Freedom on four hooves 🌿🐴 #horselife #horseback',
      'Sunset ride with the best partner 🌅🐴 #riding #horselove',
      'Apple delivery has been received 🍎🐴 #horsetreats',
    ],
    comments: [
      'Absolutely magnificent 🐴😍',
      'Want to ride so badly 🏇',
      'This is what freedom looks like 🌿',
    ],
    breeds: ['Arabian', 'Haflinger', 'Quarter Horse', 'Thoroughbred', 'Andalusian'],
    colors: ['Bay', 'Grey', 'Palomino', 'Chestnut', 'Black'],
    bloodTypes: [],
    weightRange: [400, 700],
    skills: ['Gallop', 'Trot', 'Jumping', 'Dressage'],
    likes: ['Open fields 🌿', 'Apples 🍎', 'Trail rides 🚶', 'Freedom 🌅'],
    dislikes: ['Confined spaces', 'Strangers', 'Sudden sounds'],
    traits: ['Powerful', 'Free-spirited', 'Loyal', 'Intelligent', 'Energetic'],
    foods: ['Hay', 'Apples', 'Carrots', 'Oats', 'Horse feed'],
  },
  hedgehog: {
    names: ['Prickles', 'Sonic', 'Cactus', 'Quill', 'Spike'],
    bios: [
      'Proud hedgehog mom 🦔 | Spiky but soft inside',
      'Prickly on the outside, marshmallow on the inside 🦔💕',
    ],
    captions: [
      'Apple time is best time 🍎🦔 #hedgehog #hedgehoglove #petsofinstagram',
      'Full ball mode activated 🦔🌸 #hedgehoglove #spiky',
      'Nocturnal life, do not disturb 🌙🦔 #hedgehog #nocturnal',
    ],
    comments: [
      'The spikiest little angel 🦔😍',
      'Spiky outside, sweetheart inside 🥺',
    ],
    breeds: ['African Pygmy Hedgehog', 'European Hedgehog'],
    colors: ['Beige & White', 'Brown', 'Grey & White'],
    bloodTypes: [],
    weightRange: [0.2, 0.6],
    skills: ['Ball rolling', 'Swimming'],
    likes: ['Bugs 🪲', 'Apples 🍎', 'Exercise wheel 🕳️'],
    dislikes: ['Daytime 😴', 'Loud noise 🔊'],
    traits: ['Nocturnal', 'Independent', 'Curious', 'Defensive'],
    foods: ['Insects', 'Hedgehog food', 'Fruit'],
  },
  ferret: {
    names: ['Bandit', 'Weasel', 'Zippy', 'Chaos', 'Noodle'],
    bios: [
      'Ferret parent — basically just running a tiny circus 🦡',
      'My ferret is convinced gravity is optional 😂',
    ],
    captions: [
      'Hold on let me ZOOM through real quick 🦡😂 #ferret #ferretlife #petsofinstagram',
      'Chaos mode never actually turns off 🎀🦡 #ferretlife',
      'Tunnel? Oh absolutely, yes, immediately 🕳️🦡 #ferretplay',
    ],
    comments: [
      'Ferrets are pure concentrated energy 😂',
      'How is something this cute this chaotic 🥺',
    ],
    breeds: ['Domestic Ferret', 'Angora Ferret'],
    colors: ['Sable', 'White', 'Albino', 'Silverpoint'],
    bloodTypes: [],
    weightRange: [0.6, 2.0],
    skills: ['Tunnel sprinting', 'Hide and seek', 'War dance'],
    likes: ['Playtime 🎀', 'Tunnels 🕳️', 'Naps 😴', 'Protein 🍗'],
    dislikes: ['Loneliness 😢', 'Hot weather 🥵'],
    traits: ['Energetic', 'Playful', 'Curious', 'Social', 'Smart'],
    foods: ['Chicken', 'High-protein food', 'Fish'],
  },
  reptile: {
    names: ['Draco', 'Iggy', 'Scales', 'Jade', 'Ember'],
    bios: [
      'Reptile keeper — the most underrated pet community 🦎',
      'My iguana is the most distinguished roommate I\'ve had 🦎💚',
    ],
    captions: [
      'Basking time, do not disturb 🌞🦎 #iguana #reptile #petsofinstagram',
      'Have you looked into these eyes lately? 👁️🦎 #lizard #reptilesofinstagram',
      'Lettuce appreciation post 🥬🦎 #iguanalife #herp',
    ],
    comments: [
      'Reptile keepers are a different breed of cool 🦎',
      'Iguanas are so underrated as pets 😮',
    ],
    breeds: ['Green Iguana', 'Leopard Gecko', 'Bearded Dragon', 'Chameleon'],
    colors: ['Green', 'Orange', 'Yellow-Brown', 'Blue-Green'],
    bloodTypes: [],
    weightRange: [0.1, 8.0],
    skills: ['Basking', 'Climbing', 'Color changing'],
    likes: ['Sunshine ☀️', 'Lettuce 🥬', 'Bugs 🪲', 'Warm spots 🌡️'],
    dislikes: ['Cold 🥶', 'Sudden movements', 'Noise'],
    traits: ['Calm', 'Independent', 'Long-lived', 'Exotic'],
    foods: ['Lettuce', 'Insects', 'Fruit', 'Reptile pellets'],
  },
};

const mixedComments = [
  'This made my whole day 😍', '❤️❤️❤️', 'Literally cannot handle this cuteness!',
  'Perfect shot!', 'What a gorgeous photo 📸', 'Obsessed 😍', '🔥🔥🔥',
  'Incredible 👏', 'Beautiful post 🌸', '😍😍😍', 'So good! 🌟', 'Love this 👍',
  'Goals honestly ✨', 'This content is why I\'m here 🐾', 'Precious 🥹',
];

const locations = [
  'London, Hyde Park', 'London, Hampstead Heath', 'New York, Central Park',
  'New York, Brooklyn Bridge', 'Berlin, Tiergarten', 'Paris, Champ de Mars',
  'Tokyo, Shinjuku Park', 'Amsterdam, Vondelpark', 'Barcelona, Ciutadella Park',
  'Sydney, Bondi Beach', 'Los Angeles, Griffith Park', 'Chicago, Lincoln Park',
  'Vancouver, Stanley Park', 'Toronto, Trinity Bellwoods', 'Madrid, Retiro Park',
  'Rome, Villa Borghese', 'Vienna, Prater', 'Dublin, Phoenix Park',
];

const cities = ['London', 'New York', 'Berlin', 'Paris', 'Amsterdam', 'Barcelona', 'Sydney', 'Toronto', 'Chicago', 'Vienna'];

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
  const d = petData[petType] || petData.cat;
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
    pet_gender: ['Male', 'Female'][idx % 2],
    pet_color: d.colors && d.colors.length ? d.colors[idx % d.colors.length] : '',
    pet_weight: weight,
    pet_neutered: Math.random() > 0.4 ? 1 : 0,
    pet_vaccinated: Math.random() > 0.15 ? 1 : 0,
    pet_blood_type: d.bloodTypes && d.bloodTypes.length ? d.bloodTypes[idx % d.bloodTypes.length] : '',
    pet_skills: shuffle(d.skills || []).slice(0, randInt(2, 4)).join('|'),
    pet_likes: shuffle(d.likes || []).slice(0, randInt(2, 4)).join('|'),
    pet_dislikes: shuffle(d.dislikes || []).slice(0, randInt(1, 3)).join('|'),
    pet_favorite_food: pickRandom(d.foods || ['Premium kibble']),
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
  const tables = ['story_comments', 'story_likes', 'story_views', 'stories', 'messages', 'conversations', 'notifications', 'follows', 'comments', 'likes', 'posts', 'users'];
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
  const intlSlots = new Set([3, 7, 10, 14, 18, 21, 24, 27, 30, 33, 36, 38, 40, 42, 44, 46, 47, 48, 49]);

  for (let i = 0; i < 50; i++) {
    const petType = USER_TYPES[i % USER_TYPES.length];
    const d = petData[petType] || petData.cat;
    const isIntl = intlSlots.has(i);
    const loc = isIntl ? internationalLocations[Math.floor(i / 3) % internationalLocations.length] : null;
    const petNameList = d.names || ['Buddy'];
    defs.push({
      username: animalUsernames[i] || `paws_${i}`,
      email: `user${i + 1}@demo.com`,
      full_name: fullNames[i] || `User ${i + 1}`,
      bio: pickRandom(d.bios || ['Pet lover 🐾']),
      avatar_url: getAvatarUrl(petType, i),
      pet_name: petNameList[i % petNameList.length],
      pet_type: petType,
      city: loc ? loc.city : pickRandom(cities),
      country: loc ? loc.country : 'UK',
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
          caption: pickRandom(d.captions || ['What a beautiful day 🐾 #petlife']),
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
      username: 'whisker_mom', email: 'whisker@demo.com', full_name: 'Emma Wilson',
      bio: 'I own this house, Biscuit just lets me live here 😼 | London, Notting Hill',
      avatar_url: 'https://loremflickr.com/200/200/cat?lock=251',
      pet_name: 'Biscuit', pet_type: 'cat', city: 'London', country: 'UK',
      pet_breed: 'British Shorthair', pet_birthdate: '2022-03-15', pet_gender: 'Female',
      pet_color: 'Cream', pet_weight: '4.2 kg', pet_neutered: 1, pet_vaccinated: 1,
      pet_blood_type: 'A', pet_skills: 'High jumper|Light chaser|High-five',
      pet_likes: 'Sunny spots ☀️|Lap cuddles 🤗|Playtime 🎀|Window watching 🪟',
      pet_dislikes: 'Rain ☔|Loud noises 🔊',
      pet_favorite_food: 'Tuna',
      pet_traits: 'Affectionate|Playful|Curious|Sassy',
      pet_lineage: 'Mother: Bella | Father: Shadow',
      pet_awards: 'Best British Shorthair 2023',
    },
    {
      username: 'golden_dad', email: 'golden@demo.com', full_name: 'James Brown',
      bio: 'Golden dad and proud of it 🐕 | New York | Max is the real boss here',
      avatar_url: 'https://loremflickr.com/200/200/dog?lock=252',
      pet_name: 'Max', pet_type: 'dog', city: 'New York', country: 'US',
      pet_breed: 'Golden Retriever', pet_birthdate: '2020-06-20', pet_gender: 'Male',
      pet_color: 'Golden', pet_weight: '34 kg', pet_neutered: 1, pet_vaccinated: 1,
      pet_blood_type: 'DEA 1.1+', pet_skills: 'Shake hands|Fetch|Swimming|Sit|Roll over',
      pet_likes: 'Park trips 🌳|Tennis ball 🎾|Car rides 🚗|Lap time 🤗',
      pet_dislikes: 'Being alone 😢|Thunderstorms ⛈️',
      pet_favorite_food: 'Chicken strips',
      pet_traits: 'Loyal|Playful|Affectionate|Social|Energetic',
      pet_lineage: 'Mother: Luna | Father: Duke',
      pet_awards: 'Central Park Cup 2021 First Place|Good Dog Certificate 2022',
    },
    {
      username: 'paw_lover', email: 'paw@demo.com', full_name: 'Olivia Chen',
      bio: 'Two cats, one dog, zero regrets 🐾 | San Francisco | Professional pet photographer',
      avatar_url: 'https://loremflickr.com/200/200/cat?lock=253',
      pet_name: 'Mochi', pet_type: 'cat', city: 'San Francisco', country: 'US',
      pet_breed: 'Siamese', pet_birthdate: '2021-09-10', pet_gender: 'Female',
      pet_color: 'Grey & White', pet_weight: '3.8 kg', pet_neutered: 1, pet_vaccinated: 1,
      pet_blood_type: 'B', pet_skills: 'Chirp on command|Light chaser|Balance expert',
      pet_likes: 'Window watching 🪟|Playtime 🎀|Napping 😴',
      pet_dislikes: 'Bath time 🛁|Strangers',
      pet_favorite_food: 'Salmon',
      pet_traits: 'Independent|Curious|Smart|Shy',
      pet_lineage: '', pet_awards: '',
    },
    {
      username: 'karamel_pati', email: 'furry@demo.com', full_name: 'Sophie Martin',
      bio: 'Volunteer feeding street cats 🏙️ | Paris | Caramel\'s human servant',
      avatar_url: 'https://loremflickr.com/200/200/cat?lock=254',
      pet_name: 'Caramel', pet_type: 'cat', city: 'Paris', country: 'FR',
      pet_breed: 'Maine Coon', pet_birthdate: '2019-05-05', pet_gender: 'Male',
      pet_color: 'Ginger', pet_weight: '5.1 kg', pet_neutered: 0, pet_vaccinated: 1,
      pet_blood_type: 'A', pet_skills: 'Box finder|Door opener|Balance expert',
      pet_likes: 'Sunny spots ☀️|Dinner time 🍽️|Napping 😴',
      pet_dislikes: 'Vet visits 🏥|Dirty litter',
      pet_favorite_food: 'Wet food',
      pet_traits: 'Independent|Calm|Curious|Sassy',
      pet_lineage: '', pet_awards: 'Best Cat Café Regular 2022',
    },
    {
      username: 'ruzgar_kopek', email: 'doggo@demo.com', full_name: 'Anna Schmidt',
      bio: 'New adventure every day 🐾 | Berlin | Lila and I explore everything',
      avatar_url: 'https://loremflickr.com/200/200/dog?lock=255',
      pet_name: 'Lila', pet_type: 'dog', city: 'Berlin', country: 'DE',
      pet_breed: 'Husky', pet_birthdate: '2021-01-15', pet_gender: 'Female',
      pet_color: 'Grey & White', pet_weight: '24 kg', pet_neutered: 0, pet_vaccinated: 1,
      pet_blood_type: 'DEA 1.1-', pet_skills: 'Swimming|Running|Come|Sit',
      pet_likes: 'Running 🏃|Park trips 🌳|Swimming 🏊|Dog meetups 🐕',
      pet_dislikes: 'Hot weather 🥵|Bath time 🛁',
      pet_favorite_food: 'Salmon',
      pet_traits: 'Energetic|Playful|Loyal|Social|Curious',
      pet_lineage: '', pet_awards: 'Berlin Dog Run 2022 — 3rd Place',
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
    'Biscuit claimed the sunny spot again ☀️😼 #catlife #sundayvibes #catsofinstagram',
    'Sunday morning mood: coffee + purring lap warmer ☕🐱 #catmom #weekendvibes',
    'This look means I was 4 minutes late with dinner 👀 #catjudgement #catsofig',
    'New bed arrived. Biscuit chose the cardboard box 📦😂 #catlogic #ifyoufitiousit',
    'Philosophical window thoughts at 3am 🪟🌙 #catlife #deepthoughts #nocturnal',
    'Dinner is served, your majesty 🍽️🐱 #royaltreatment #catmom',
    'Playtime with the laser dot goes 0 to 100 real quick 🎀💨 #zoomies #playfulcat',
    'London flat, one demanding British Shorthair 🏙️🐱 #london #catlife #britishcat',
    'Sunbeam spotted. Nap initiated. Do not disturb ✨ #catsofinstagram #sunbath',
    'Lazy Saturday and I am very much okay with this 😴🐱 #lazycat #weekend',
    'New toy review: 2/10, prefers the receipt 🧾😂 #catstagram #typical',
    'Cuddle session in progress 🤗🐱 #cuddlecat #catmom #blessed',
    'Evening light hits different when there\'s a cat in the frame 🌆 #catlife #goldenhoour',
    'Biscuit and I both had a long week. We get it 🌸 #happycat #fridayfeeling',
    'Best camera subject in the world, honestly 📸 #catphotography #catsofinstagram',
    'Kitchen helper or kitchen hazard? Jury\'s out 😄🍳 #kitchencat #helpful',
    'Life with a cat is a bit chaotic but mostly wonderful 🌺 #petlover #catlife',
    'Small queen, big personality 👑🐱 #catprincess #catsofig',
  ];
  const postIds = [];
  db.transaction(() => {
    for (let p = 0; p < 18; p++) {
      const info = postStmt.run({
        user_id: wId,
        image_url: getPostImage('cat', p + 300),
        media_type: 'image',
        caption: whiskerCaptions[p],
        pet_name: 'Biscuit',
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
        { from: 'partner', text: 'Your cat is absolutely adorable, how old is Biscuit? 😍', daysBack: 1 },
        { from: 'me',      text: 'Thank you! She\'s 2 years old, British Shorthair 🐱', daysBack: 1 },
        { from: 'partner', text: 'No wonder she looks so regal! What food does she eat?', daysBack: 1 },
        { from: 'me',      text: 'Tuna-obsessed 😂 Won\'t touch anything else some days', daysBack: 0 },
        { from: 'partner', text: 'My cat is the same way, so picky about brands too 😅', daysBack: 0 },
        { from: 'me',      text: 'They really do train us eventually, don\'t they 😄🐱', daysBack: 0 },
      ],
    },
    {
      partnerIdx: 1,
      msgs: [
        { from: 'partner', text: 'Your photos are incredible! What camera do you use? 📸', daysBack: 3 },
        { from: 'me',      text: 'Just my phone actually! iPhone, good light is everything 😊', daysBack: 3 },
        { from: 'partner', text: 'Wow the quality is amazing. Is Biscuit a patient model?', daysBack: 3 },
        { from: 'me',      text: 'Absolutely not 😅 She moves constantly, lots of patience required', daysBack: 2 },
        { from: 'partner', text: 'Haha same with my cat, always turns away right as I click 😂', daysBack: 2 },
        { from: 'me',      text: 'Morning light works best — they\'re still a bit sleepy then 😄', daysBack: 2 },
        { from: 'partner', text: 'Great tip, I\'ll try that tomorrow! Thank you 🙏', daysBack: 2 },
      ],
    },
    {
      partnerIdx: 2,
      msgs: [
        { from: 'partner', text: 'Hey! Are you based in London? We should do a pet meetup! 😊', daysBack: 5 },
        { from: 'me',      text: 'Yes! Notting Hill area 🌊 That would be so fun!', daysBack: 5 },
        { from: 'partner', text: 'I have a Golden, super social, loves everyone 😄', daysBack: 4 },
        { from: 'me',      text: 'Biscuit tolerates dogs on a good day 😂 but worth trying!', daysBack: 4 },
        { from: 'partner', text: 'Ha! Maybe they\'ll become unexpected best friends 🐱🐶', daysBack: 4 },
        { from: 'me',      text: 'Hyde Park on Saturday? Weather looks decent 🌞', daysBack: 3 },
        { from: 'partner', text: 'Perfect! Saturday afternoon works great for me', daysBack: 3 },
        { from: 'me',      text: 'Let\'s say 3pm by the Serpentine? ☀️', daysBack: 3 },
      ],
    },
    {
      partnerIdx: 3,
      msgs: [
        { from: 'partner', text: 'Any advice for a first-time cat owner? Just got a kitten! 🐱', daysBack: 7 },
        { from: 'me',      text: 'Congratulations!! 🎉 What breed?', daysBack: 7 },
        { from: 'partner', text: 'Scottish Fold, 3 months old, absolutely tiny 🥺', daysBack: 6 },
        { from: 'me',      text: 'So cute! Did you get a vet check done first?', daysBack: 6 },
        { from: 'partner', text: 'Yes, vaccinations are up to date. What litter box do you recommend?', daysBack: 6 },
        { from: 'me',      text: 'Go for a covered one — less mess. Silica litter is great 👍', daysBack: 5 },
        { from: 'partner', text: 'Noted! Any food brand recommendations?', daysBack: 5 },
        { from: 'me',      text: 'Royal Canin or Hills — grain-free is best for kittens 🐾', daysBack: 5 },
        { from: 'partner', text: 'This is so helpful, thank you so much! Following for more tips 😊❤️', daysBack: 4 },
      ],
    },
    {
      partnerIdx: 4,
      msgs: [
        { from: 'partner', text: 'Your content is the reason I joined this app 🥰', daysBack: 10 },
        { from: 'me',      text: 'That is the nicest thing, thank you!! 😊🐱', daysBack: 10 },
        { from: 'partner', text: 'Those amber eyes in your last post — what color exactly?', daysBack: 9 },
        { from: 'me',      text: 'Amber gold 💛 Really common in British Shorthairs', daysBack: 9 },
        { from: 'partner', text: 'Gorgeous! I\'ve been thinking about getting a cat', daysBack: 9 },
        { from: 'me',      text: 'Do it! Life genuinely changes completely, in the best way 😄🐾', daysBack: 8 },
      ],
    },
    {
      partnerIdx: 5,
      msgs: [
        { from: 'partner', text: 'Love your posts, keep them coming! 🌟', daysBack: 12 },
        { from: 'me',      text: 'Thank you, that means a lot 🙏😊', daysBack: 12 },
        { from: 'partner', text: 'My parrot hates being photographed 😅 any tips?', daysBack: 11 },
        { from: 'me',      text: 'Haha! Try catching them mid-play, less aware of the camera 😂', daysBack: 11 },
        { from: 'partner', text: 'Will try that, thanks! 🦜❤️', daysBack: 11 },
      ],
    },
    {
      partnerIdx: 6,
      msgs: [
        { from: 'partner', text: 'Hey! Any good vets in London you\'d recommend? 🏥', daysBack: 14 },
        { from: 'me',      text: 'Hi! Notting Hill Vets is brilliant, very thorough 👨‍⚕️', daysBack: 14 },
        { from: 'partner', text: 'Thanks! Are they expensive?', daysBack: 13 },
        { from: 'me',      text: 'Mid-range but really worth it. You can book online too', daysBack: 13 },
        { from: 'partner', text: 'Perfect, I\'ll check them out! You\'re so helpful 🙏', daysBack: 13 },
        { from: 'me',      text: 'Happy to help anytime 😊🐾', daysBack: 12 },
      ],
    },
    {
      partnerIdx: 7,
      msgs: [
        { from: 'partner', text: 'Hi! When did you get Biscuit spayed? Any advice?', daysBack: 16 },
        { from: 'me',      text: 'Hi! Around 6 months — definitely the right call 👍', daysBack: 16 },
        { from: 'partner', text: 'Did her personality change much afterwards?', daysBack: 15 },
        { from: 'me',      text: 'A tiny bit calmer but still super playful 😄 Watch the weight though!', daysBack: 15 },
        { from: 'partner', text: 'Good to know! Thank you, you\'re so informative 🙏', daysBack: 15 },
        { from: 'me',      text: 'Good luck! Feel free to message anytime 🐱💕', daysBack: 15 },
      ],
    },
    {
      partnerIdx: 8,
      msgs: [
        { from: 'partner', text: 'Congrats on the great posts! Biscuit is so photogenic 🐱✨', daysBack: 20 },
        { from: 'me',      text: 'Thank you 😊 Your bunny is insanely cute too!', daysBack: 20 },
        { from: 'partner', text: 'I wonder what Biscuit would think of Thumper 😄', daysBack: 19 },
        { from: 'me',      text: 'Ha! Biscuit is suspicious of everything, rabbit included 😂', daysBack: 19 },
        { from: 'partner', text: 'Bunnies are actually quite bold, might surprise her 😅', daysBack: 19 },
        { from: 'me',      text: 'I need that video honestly 😄🐰🐱', daysBack: 18 },
        { from: 'partner', text: 'Maybe one day! Would be great content 📸', daysBack: 18 },
      ],
    },
    {
      partnerIdx: 9,
      msgs: [
        { from: 'partner', text: 'Hi! Just joined PetCircle, what\'s it like here? 😊', daysBack: 25 },
        { from: 'me',      text: 'Welcome! 🎉 It\'s a lovely community, very friendly pet people', daysBack: 25 },
        { from: 'partner', text: 'Awesome! What kind of content does well here?', daysBack: 24 },
        { from: 'me',      text: 'Pet photos, daily moments, care tips — anything goes really 🐾', daysBack: 24 },
        { from: 'partner', text: 'I have a ferret, don\'t see many of those on here', daysBack: 24 },
        { from: 'me',      text: 'That\'s exactly why you should post! Unique pets get so much love 😊', daysBack: 23 },
        { from: 'partner', text: 'Amazing, thank you! Just followed you 🦡❤️', daysBack: 23 },
        { from: 'me',      text: 'Followed back! Can\'t wait to see those ferret photos 📸', daysBack: 23 },
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
      for (const msg of script.msgs) {
        const senderId = msg.from === 'me' ? wId : partner.id;
        const isRead = msg.from === 'me' ? 1 : (msg.daysBack > 1 ? 1 : 0);
        msgStmt.run(conv.id, senderId, msg.text, isRead, daysAgo(msg.daysBack));
      }
    }
  })();

  // ── 18 notifications ──
  const notifStmt = db.prepare('INSERT INTO notifications (recipient_id,sender_id,type,post_id,read,created_at) VALUES (?,?,?,?,?,?)');
  db.transaction(() => {
    for (let i = 0; i < 6; i++) {
      notifStmt.run(wId, others[i].id, 'follow', null, i < 3 ? 0 : 1, daysAgo(randInt(i + 1, i + 5)));
    }
    for (let i = 6; i < 12; i++) {
      const pid = postIds[(i - 6) % postIds.length];
      notifStmt.run(wId, others[i].id, 'like', pid, i < 9 ? 0 : 1, daysAgo(randInt(1, 10)));
    }
    for (let i = 12; i < 16; i++) {
      const pid = postIds[(i - 12) % postIds.length];
      notifStmt.run(wId, others[i % others.length].id, 'comment', pid, i < 14 ? 0 : 1, daysAgo(randInt(1, 8)));
    }
    for (let i = 16; i < 18; i++) {
      notifStmt.run(wId, others[i % others.length].id, 'message', null, 0, daysAgo(randInt(1, 3)));
    }
  })();

  console.log(' done.');
}

// ---------------------------------------------------------------------------
// Stories (1-2 per user, expire in 48h so they're valid after deploy)
// ---------------------------------------------------------------------------
function seedStories(users) {
  process.stdout.write('Inserting stories...');
  const stmt = db.prepare(`
    INSERT INTO stories (user_id, image_url, caption, created_at, expires_at)
    VALUES (@user_id, @image_url, @caption, @created_at, @expires_at)
  `);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
  let total = 0;
  let imgCounter = 500;
  db.transaction(() => {
    for (const user of users) {
      const count = randInt(1, 2);
      const d = petData[user.pet_type] || petData.cat;
      for (let s = 0; s < count; s++) {
        stmt.run({
          user_id: user.id,
          image_url: getPostImage(user.pet_type, imgCounter++),
          caption: Math.random() > 0.4 ? pickRandom(d.captions || ['#petlife']) : null,
          created_at: daysAgo(0),
          expires_at: expiresAt,
        });
        total++;
      }
    }
  })();
  console.log(` done (${total} stories).`);
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
  seedStories(allUsers);

  const uCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const pCount = db.prepare('SELECT COUNT(*) AS c FROM posts').get().c;
  const lCount = db.prepare('SELECT COUNT(*) AS c FROM likes').get().c;
  const cCount = db.prepare('SELECT COUNT(*) AS c FROM comments').get().c;
  const fCount = db.prepare('SELECT COUNT(*) AS c FROM follows').get().c;
  const mCount = db.prepare('SELECT COUNT(*) AS c FROM messages').get().c;
  const nCount = db.prepare('SELECT COUNT(*) AS c FROM notifications').get().c;
  const sCount = db.prepare('SELECT COUNT(*) AS c FROM stories').get().c;

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
  console.log(`  Stories       : ${sCount}`);
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
