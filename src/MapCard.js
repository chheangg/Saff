// Prayer map (iOS/Android): campus spots as pins, the pinned jama'ah spot in emerald.
// Tap a pin to choose it. Web uses MapCard.web.js.
import { View } from 'react-native';
import { Text } from './Text';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { C, DARK } from './theme';
import { MapInfo, cardStyle, regionFor } from './mapShared';

export default function MapCard({ spots, pinnedId, hint, onPick }) {
  const pinned = spots.find((s) => s.id === pinnedId);
  return (
    <View style={cardStyle}>
      <MapView
        style={{ height: 180 }}
        initialRegion={regionFor(spots)}
        showsUserLocation
        showsPointsOfInterest={false}
        userInterfaceStyle={DARK ? 'dark' : 'light'}
        toolbarEnabled={false}
      >
        {spots.map((s) => {
          const on = s.id === pinnedId;
          return (
            <Marker key={s.id} coordinate={{ latitude: s.lat, longitude: s.lng }} onPress={() => onPick(s)} tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={{ alignItems: 'center', gap: 2 }}>
                <View
                  style={{
                    width: on ? 34 : 22,
                    height: on ? 34 : 22,
                    borderRadius: 17,
                    backgroundColor: on ? C.accent : C.white,
                    borderWidth: on ? 3 : 1,
                    borderColor: on ? '#FFFFFF' : C.g300,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={on ? 'moon' : 'location'} size={on ? 16 : 12} color={on ? '#FFFFFF' : C.g700} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: on ? '600' : '500', color: C.black }}>{s.name.split(',')[0]}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>
      <MapInfo spot={pinned} hint={hint} />
    </View>
  );
}
