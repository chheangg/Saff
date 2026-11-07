// Seed content for the demo. Ali: edit freely (spots, bios, chat lines).

export const ME = {
  id: 'me',
  name: 'Evan',
  email: 'evan@ucsd.edu',
  campus: 'ucsd',
  gender: 'brother',
  major: 'Computer Science',
  year: '3rd year',
  linkedin: 'https://www.linkedin.com/',
  instagram: 'https://www.instagram.com/',
  streak: 6,
  prayedToday: { fajr: true, dhuhr: true },
};

// Manara network campuses. Each has its own spots and email domain.
// Seed spots for non-UCSD campuses are placeholders; swap in real ones.
// lat/lng are approximate (for the prayer map). Walk them and correct.
export const CAMPUSES = [
  {
    id: 'ucsd', name: 'UC San Diego', short: 'UCSD', domain: 'ucsd.edu',
    spots: [
      { id: 'pc', name: 'Price Center', walk: 5, lat: 32.8797, lng: -117.2362 },
      { id: 'geisel', name: 'Geisel, 2nd floor', walk: 7, lat: 32.8812, lng: -117.2376 },
      { id: 'libwalk', name: 'Library Walk lawn', walk: 4, lat: 32.8791, lng: -117.2371 },
      { id: 'osc', name: 'Old Student Center', walk: 8, lat: 32.8778, lng: -117.2408 },
      { id: 'rimac', name: 'RIMAC field', walk: 12, lat: 32.8852, lng: -117.2400 },
    ],
  },
  {
    id: 'sdsu', name: 'San Diego State', short: 'SDSU', domain: 'sdsu.edu',
    spots: [
      { id: 'union', name: 'Aztec Student Union', walk: 5, lat: 32.7757, lng: -117.0717 },
      { id: 'love', name: 'Love Library', walk: 6, lat: 32.7752, lng: -117.0710 },
      { id: 'quad', name: 'Main Quad', walk: 4, lat: 32.7762, lng: -117.0705 },
    ],
  },
  {
    id: 'mesa', name: 'San Diego Mesa College', short: 'Mesa', domain: 'sdccd.edu',
    spots: [
      { id: 'lrc', name: 'Learning Resource Center', walk: 4, lat: 32.8041, lng: -117.1695 },
      { id: 'ssc', name: 'Student Services Center', walk: 5, lat: 32.8033, lng: -117.1705 },
    ],
  },
  {
    id: 'usd', name: 'University of San Diego', short: 'USD', domain: 'sandiego.edu',
    spots: [
      { id: 'copley', name: 'Copley Library', walk: 6, lat: 32.7717, lng: -117.1878 },
      { id: 'slp', name: 'Student Life Pavilion', walk: 4, lat: 32.7723, lng: -117.1886 },
    ],
  },
];

export const campusOf = (id) => CAMPUSES.find((c) => c.id === id) ?? CAMPUSES[0];
export const SPOTS = CAMPUSES[0].spots; // back-compat

// Demo-mode stand-ins for what the server tracks in live mode.
// count = jama'ahs your campus/gender held there; last = where this prayer's group met last time.
export const DEMO_SPOT_STATS = { pc: { count: 23, last: true }, libwalk: { count: 14 }, geisel: { count: 9 }, osc: { count: 2 } };
export const DEMO_NETWORK = { prayers: 37, campuses: 4 };

const link = { linkedin: 'https://www.linkedin.com/', instagram: 'https://www.instagram.com/' };

export const BOTS = {
  brother: [
    { id: 'b1', name: 'Yusuf', major: 'Bioengineering', year: '2nd year', streak: 12, ...link },
    { id: 'b2', name: 'Omar', major: 'Economics', year: '4th year', streak: 41, ...link },
    { id: 'b3', name: 'Hamza', major: 'Data Science', year: '1st year', streak: 3, ...link },
    { id: 'b4', name: 'Bilal', major: 'Mechanical Eng.', year: '3rd year', streak: 8, ...link },
  ],
  sister: [
    { id: 's1', name: 'Maryam', major: 'Cognitive Science', year: '2nd year', streak: 15, ...link },
    { id: 's2', name: 'Aisha', major: 'Public Health', year: '4th year', streak: 27, ...link },
    { id: 's3', name: 'Noor', major: 'Computer Science', year: '1st year', streak: 4, ...link },
    { id: 's4', name: 'Sara', major: 'Political Science', year: '3rd year', streak: 9, ...link },
  ],
};

// ms after the adhan fires: when each bot taps "I'm free"
export const JOIN_TIMES = [1200, 2400, 3600, 4800];

// ms after the chat opens: [botIndex, text]
export const CHAT_SCRIPT = [
  [0, 'Salam everyone! Who is close to Price Center?'],
  [2, 'Just got out of lecture in CSE, 5 min away'],
  [1, 'Price Center in 10? I have an extra prayer mat'],
];

export const REPLY = [3, 'Perfect, see you there insha\'Allah'];

// ---------- Past jama'ahs (demo history for the Chat tab) ----------
const MORE = {
  brother: [
    { id: 'b5', name: 'Zaid', major: 'Biology', year: '2nd year', streak: 19, ...link },
    { id: 'b6', name: 'Ibrahim', major: 'Cognitive Science', year: '4th year', streak: 33, ...link },
    { id: 'b7', name: 'Musa', major: 'Electrical Eng.', year: '1st year', streak: 5, ...link },
  ],
  sister: [
    { id: 's5', name: 'Fatima', major: 'Biochemistry', year: '3rd year', streak: 22, ...link },
    { id: 's6', name: 'Hana', major: 'Economics', year: '2nd year', streak: 11, ...link },
    { id: 's7', name: 'Layla', major: 'Data Science', year: '4th year', streak: 6, ...link },
  ],
};

const day = (n) => {
  if (n === 0) return 'Today';
  if (n === 1) return 'Yesterday';
  return new Date(Date.now() - n * 864e5).toLocaleDateString('en-US', { weekday: 'long' });
};

// Each past chat: who prayed, where, and the conversation (read-only).
export function demoHistory(gender) {
  const [a, b, c, d] = BOTS[gender];
  const [e, f, g] = MORE[gender];
  const H = (id, n, prayer, time, spot, members, lines) => ({
    id,
    prayer,
    when: `${day(n)} · ${time}`,
    spot,
    members,
    messages: lines.map(([u, text], i) => ({ id: `${id}-${i}`, userId: u.id, text })),
  });
  return [
    H('h1', 0, 'Dhuhr', '11:34 AM', 'Price Center', [a, b, e], [[a, 'Salam! Price Center in 5?'], [e, 'On my way from Geisel'], [b, 'Saving a spot by the window'], [a, 'JazakAllah khair everyone']]),
    H('h2', 0, 'Fajr', '5:02 AM', 'Library Walk lawn', [c, f], [[c, 'Anyone up for Fajr?'], [f, 'Yes! Library Walk?'], [c, 'Bring a jacket, it is cold']]),
    H('h3', 1, 'Isha', '6:04 PM', 'Geisel, 2nd floor', [a, d, g, e], [[d, 'Isha at Geisel 2nd floor, quiet room'], [g, 'Coming after lab'], [e, 'Who wants food after?'], [a, 'Halal truck on Library Walk 🔥']]),
    H('h4', 1, 'Asr', '2:32 PM', 'Price Center', [b, c, f], [[b, 'Asr after the midterm?'], [f, 'Price Center, 10 min'], [c, 'Good luck everyone, insha\'Allah']]),
    H('h5', 2, 'Maghrib', '4:55 PM', 'Old Student Center', [a, b, c, d, g], [[a, 'Maghrib at Old Student Center'], [g, 'Big group today, alhamdulillah'], [d, 'Who is leading?'], [b, 'Omar has the nicest recitation 😄']]),
    H('h6', 3, 'Dhuhr', '11:35 AM', 'RIMAC field', [e, f], [[e, 'Dhuhr at RIMAC after pickup?'], [f, 'Down, 12 min walk']]),
  ];
}
