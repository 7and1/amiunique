/**
 * Font detection utility using canvas measurement technique
 * Detects installed fonts by comparing text width against a baseline
 */

import { sha256 } from './hash.js';

/**
 * Comprehensive list of fonts to test
 * Includes common system fonts across Windows, macOS, Linux
 */
const TEST_FONTS = [
  // Windows fonts
  'Arial',
  'Arial Black',
  'Arial Narrow',
  'Calibri',
  'Cambria',
  'Cambria Math',
  'Comic Sans MS',
  'Consolas',
  'Courier',
  'Courier New',
  'Georgia',
  'Helvetica',
  'Impact',
  'Lucida Console',
  'Lucida Sans Unicode',
  'Microsoft Sans Serif',
  'Palatino Linotype',
  'Segoe UI',
  'Segoe UI Symbol',
  'Tahoma',
  'Times',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
  'Webdings',
  'Wingdings',

  // macOS fonts
  'American Typewriter',
  'Andale Mono',
  'Apple Chancery',
  'Apple Color Emoji',
  'Apple SD Gothic Neo',
  'Avenir',
  'Avenir Next',
  'Baskerville',
  'Big Caslon',
  'Brush Script MT',
  'Chalkboard',
  'Chalkboard SE',
  'Cochin',
  'Copperplate',
  'Didot',
  'Futura',
  'Geneva',
  'Gill Sans',
  'Helvetica Neue',
  'Herculanum',
  'Hoefler Text',
  'Lucida Grande',
  'Luminari',
  'Marker Felt',
  'Menlo',
  'Monaco',
  'Noteworthy',
  'Optima',
  'Papyrus',
  'Phosphate',
  'Rockwell',
  'Savoye LET',
  'SF Pro',
  'SF Pro Display',
  'SF Pro Text',
  'SignPainter',
  'Skia',
  'Snell Roundhand',
  'Zapfino',

  // Linux fonts
  'Cantarell',
  'DejaVu Sans',
  'DejaVu Sans Mono',
  'DejaVu Serif',
  'Droid Sans',
  'Droid Sans Mono',
  'Droid Serif',
  'FreeMono',
  'FreeSans',
  'FreeSerif',
  'Liberation Mono',
  'Liberation Sans',
  'Liberation Serif',
  'Noto Sans',
  'Noto Serif',
  'Ubuntu',
  'Ubuntu Mono',

  // Chinese fonts
  'Microsoft YaHei',
  'SimHei',
  'SimSun',
  'NSimSun',
  'FangSong',
  'KaiTi',
  'PingFang SC',
  'STHeiti',
  'STKaiti',
  'STSong',
  'STFangsong',
  'Heiti SC',
  'Songti SC',

  // Japanese fonts
  'MS Gothic',
  'MS Mincho',
  'MS PGothic',
  'MS PMincho',
  'Meiryo',
  'Meiryo UI',
  'Yu Gothic',
  'Yu Mincho',
  'Hiragino Sans',
  'Hiragino Kaku Gothic Pro',
  'Hiragino Mincho Pro',

  // Korean fonts
  'Malgun Gothic',
  'Gulim',
  'Dotum',
  'Batang',
  'Apple SD Gothic Neo',

  // Arabic fonts
  'Arabic Typesetting',
  'Simplified Arabic',
  'Traditional Arabic',

  // Programming fonts
  'Fira Code',
  'JetBrains Mono',
  'Source Code Pro',
  'Inconsolata',
  'Hack',
  'Anonymous Pro',
  'IBM Plex Mono',
  'Cascadia Code',
  'Cascadia Mono',
];

/**
 * Detect installed fonts using canvas measurement
 * @returns Array of detected font names
 */
export function detectFonts(): string[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const baseFont = 'monospace';
  const testString = 'mmmmmmmmmmlli';
  const fontSize = 72;

  // Get baseline width with monospace
  ctx.font = `${fontSize}px ${baseFont}`;
  const baseWidth = ctx.measureText(testString).width;

  const detected: string[] = [];

  for (const font of TEST_FONTS) {
    ctx.font = `${fontSize}px '${font}', ${baseFont}`;
    const width = ctx.measureText(testString).width;

    // If width differs from baseline, font is installed
    if (width !== baseWidth) {
      detected.push(font);
    }
  }

  return detected;
}

/**
 * Get a hash of installed fonts for fingerprinting
 * @returns SHA-256 hash of sorted font list
 */
export async function getFontsHash(): Promise<string> {
  const detected = detectFonts();
  const sortedFonts = detected.sort().join(',');
  return sha256(sortedFonts);
}

/**
 * Get font count for statistics
 * @returns Number of detected fonts
 */
export function getFontCount(): number {
  return detectFonts().length;
}
