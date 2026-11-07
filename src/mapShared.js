import { Linking, Platform, Pressable, View } from 'react-native';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { C, CARD } from './theme';

// Walking directions in the platform's maps app.
export function openDirections(spot) {
  const { lat, lng, name } = spot;
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=w&q=${encodeURIComponent(name)}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
  Linking.openURL(url);
}

// Region that fits every spot with some breathing room.
export function regionFor(spots) {
  const lats = spots.map((s) => s.lat);
  const lngs = spots.map((s) => s.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.003, (maxLat - minLat) * 1.3),
    longitudeDelta: Math.max(0.003, (maxLng - minLng) * 1.3),
  };
}

export const cardStyle = { ...CARD, overflow: 'hidden', marginBottom: 4 };

// Bottom row: where the jama'ah is + a Go button.
export function MapInfo({ spot, hint }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: C.black }}>{spot ? spot.name : 'Pick a spot'}</Text>
        <Text style={{ fontSize: 12, color: C.g700 }}>{spot ? hint : 'Tap a pin or a chip below'}</Text>
      </View>
      {spot && (
        <Pressable onPress={() => openDirections(spot)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: C.brand }}>
          <Ionicons name="navigate" size={14} color={C.onColor} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.onColor }}>Go</Text>
        </Pressable>
      )}
    </View>
  );
}
