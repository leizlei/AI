import RawMaskedView from '@react-native-masked-view/masked-view';
import RawSlider from '@react-native-community/slider';
// Both libraries type their default export as a class over RN's legacy NativeMethods, which RN 0.87's strict types reject as a JSX element.
export const Slider = RawSlider;
export const MaskedView = RawMaskedView;
