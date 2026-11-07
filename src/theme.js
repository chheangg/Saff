// Saff design tokens (mirrors design/saff.pen): modern, soft neutrals, Geist type,
// indigo brand, emerald for "free to pray", orange streak flame.
export const C = {
  // neutrals (old names kept so every screen picks up the new palette)
  black: '#0B0B0F', // ink
  white: '#FFFFFF',
  canvas: '#F4F4F2',
  line: '#ECECEA',
  g50: '#F4F4F2',
  g100: '#ECECEA',
  g300: '#D4D4D1',
  g500: '#A1A1A0',
  g700: '#6B6B6A',
  // emerald: free / prayed
  accent: '#10B981',
  accentDark: '#047857',
  accentSoft: '#E7F8F0',
  // indigo brand
  brand: '#6366F1',
  brandDark: '#4F46E5',
  brandSoft: '#EEF2FF',
  // streak
  flame: '#F97316',
  flameSoft: '#FFF7ED',
};

// Font family per weight (custom fonts can't rely on fontWeight).
export const F = {
  400: 'Geist_400Regular',
  500: 'Geist_500Medium',
  600: 'Geist_600SemiBold',
  700: 'Geist_700Bold',
  800: 'Geist_700Bold',
  mono: 'GeistMono_500Medium',
};

export const T = {
  h1: { fontSize: 32, fontFamily: F[700], letterSpacing: -1, color: C.black },
  h2: { fontSize: 22, fontFamily: F[600], letterSpacing: -0.6, color: C.black },
  body: { fontSize: 16, fontFamily: F[400], color: C.black },
  meta: { fontSize: 13, fontFamily: F[400], color: C.g700 },
  kicker: { fontSize: 11, fontFamily: F.mono, letterSpacing: 0.6, color: C.g700, textTransform: 'uppercase' },
};

// Hero gradient (indigo night sky) and avatar colors.
export const HERO = ['#1E1B4B', '#4338CA', '#7C3AED'];
export const FLAME = ['#FDBA74', '#F97316', '#EA580C'];
// Clean borderless card: white on canvas with a whisper of shadow.
export const CARD = { backgroundColor: '#FFFFFF', borderRadius: 28, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 1 };
const AVATAR = ['#F97316', '#6366F1', '#A855F7', '#EF4444', '#0EA5E9', '#10B981', '#EC4899'];
export const avatarColor = (id = '') => (id === 'me' ? C.black : AVATAR[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length]);
