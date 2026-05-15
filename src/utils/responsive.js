import { Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
const BASE_W = 390; // iPhone 14 baseline
const BASE_H = 844;

// Scales a size proportionally to screen width
export const rs = (size) => Math.round((W / BASE_W) * size);

// Scales a size proportionally to screen height
export const vs = (size) => Math.round((H / BASE_H) * size);

// Moderate scale — less aggressive, good for font sizes
export const ms = (size, factor = 0.45) => Math.round(size + (rs(size) - size) * factor);

export { W, H };
