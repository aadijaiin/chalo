import { cssInterop } from 'nativewind';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

/**
 * A ScrollView that keeps the focused input above the keyboard, moving in step
 * with the keyboard's own animation. Android draws edge-to-edge, so the window
 * no longer shrinks for the keyboard and a plain ScrollView leaves fields hidden.
 */
export const KeyboardScrollView = cssInterop(KeyboardAwareScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});
