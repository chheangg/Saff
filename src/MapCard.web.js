// Prayer map (web): OpenStreetMap embed centered on the campus, marker on the pinned spot.
// Pins aren't tappable inside the iframe, so the spot chips below choose the spot.
import { createElement } from 'react';
import { View } from 'react-native';
import { MapInfo, cardStyle, regionFor } from './mapShared';

export default function MapCard({ spots, pinnedId, hint }) {
  const pinned = spots.find((s) => s.id === pinnedId);
  const r = regionFor(spots);
  const bbox = [r.longitude - r.longitudeDelta / 2, r.latitude - r.latitudeDelta / 2, r.longitude + r.longitudeDelta / 2, r.latitude + r.latitudeDelta / 2].join(',');
  const marker = pinned ? `&marker=${pinned.lat},${pinned.lng}` : '';
  return (
    <View style={cardStyle}>
      {createElement('iframe', {
        title: 'Prayer map',
        src: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`,
        style: { border: 0, width: '100%', height: 180, display: 'block' },
        loading: 'lazy',
      })}
      <MapInfo spot={pinned} hint={hint} />
    </View>
  );
}
