// Loads Geist and maps fontWeight -> the matching Geist file for every <Text>,
// so existing screens that only set fontWeight still get the new typeface.
import { Text } from 'react-native';
import { useFonts, Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold } from '@expo-google-fonts/geist';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import { StyleSheet } from 'react-native';
import { C, F } from './theme';

let patched = false;
function patchText() {
  if (patched || typeof Text.render !== 'function') return;
  patched = true;
  const render = Text.render;
  Text.render = function (props, ref) {
    const flat = StyleSheet.flatten(props.style) || {};
    const add = {};
    if (!flat.fontFamily) {
      const w = String(flat.fontWeight ?? '400');
      add.fontFamily = F[w] ?? (Number(w) >= 600 ? F[600] : F[400]);
      add.fontWeight = undefined;
    }
    // Default text color follows the theme (RN defaults to black, invisible in dark mode).
    if (!flat.color) add.color = C.black;
    if (Object.keys(add).length) props = { ...props, style: [{ color: C.black }, props.style, add] };
    return render.call(this, props, ref);
  };
}

export function useAppFonts() {
  const [loaded] = useFonts({ Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold, GeistMono_500Medium });
  if (loaded) patchText();
  return loaded;
}
