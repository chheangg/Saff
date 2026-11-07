import { View } from 'react-native';
import { Text } from '../Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, T } from '../theme';
import { useStore } from '../store';
import Matching from './Matching';
import Chat from './Chat';

// The Chat tab: empty until you say yes to an adhan, then matching, then the temp group chat.
export default function ChatTab() {
  const { state } = useStore();
  const { response, chatOpen, adhan } = state;

  if (response === 'free') return chatOpen ? <Chat /> : <Matching />;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.canvas }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
        <Ionicons name="chatbubbles-outline" size={56} color={C.g300} />
        <Text style={T.h2}>{response === 'prayed' ? 'Jama\'ah complete' : 'No group yet'}</Text>
        <Text style={[T.body, { color: C.g700, textAlign: 'center' }]}>
          {response === 'prayed'
            ? `${adhan.label} done. Chat closed.`
            : 'Say yes at the next adhan to join a group.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}
