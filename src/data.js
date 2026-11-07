// Seed content for the demo. Ali: edit freely (spots, bios, chat lines).

export const ME = {
  id: 'me',
  name: 'Evan',
  email: 'evan@ucsd.edu',
  gender: 'brother',
  major: 'Computer Science',
  year: '3rd year',
  linkedin: 'https://www.linkedin.com/',
  instagram: 'https://www.instagram.com/',
  streak: 6,
  prayedToday: { fajr: true, dhuhr: true },
};

export const SPOTS = [
  { id: 'pc', name: 'Price Center', walk: 5 },
  { id: 'geisel', name: 'Geisel, 2nd floor', walk: 7 },
  { id: 'libwalk', name: 'Library Walk lawn', walk: 4 },
  { id: 'osc', name: 'Old Student Center', walk: 8 },
  { id: 'rimac', name: 'RIMAC field', walk: 12 },
];

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
