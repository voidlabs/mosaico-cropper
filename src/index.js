// The browser bundle includes styles; the npm module exposes JavaScript only so
// consumers can import the stylesheet explicitly or provide their own styles.
import './css/main.less';

export * from './package.js';
export { default } from './package.js';
