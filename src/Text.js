// App-wide Text: always applies the Geist file for the requested weight and the theme ink
// color, so text is never invisible in dark mode (RN's default is black). Use this instead of
// react-native's Text everywhere.
import { forwardRef } from 'react';
import { StyleSheet, Text as RNText } from 'react-native';
import { C, F } from './theme';

export const Text = forwardRef(function Text(props, ref) {
  const flat = StyleSheet.flatten(props.style) || {};
  const add = {};
  if (!flat.fontFamily) {
    const w = String(flat.fontWeight ?? '400');
    add.fontFamily = F[w] ?? (Number(w) >= 600 ? F[600] : F[400]);
    add.fontWeight = undefined; // custom fonts carry their own weight
  }
  return <RNText ref={ref} {...props} style={[{ color: C.black }, props.style, add]} />;
});
