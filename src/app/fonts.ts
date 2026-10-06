import localFont from 'next/font/local';

/** Source Serif 4 (SIL OFL 1.1), self-hosted with its weight and optical size axes. */
export const sourceSerif = localFont({
  src: [
    { path: './fonts/source-serif-4-variable.woff2', style: 'normal', weight: '200 900' },
    { path: './fonts/source-serif-4-variable-italic.woff2', style: 'italic', weight: '200 900' },
  ],
  variable: '--font-source-serif',
  display: 'swap',
});

/** Hanken Grotesk (SIL OFL 1.1) for the interface and every figure. */
export const hankenGrotesk = localFont({
  src: './fonts/hanken-grotesk-variable.woff2',
  variable: '--font-hanken',
  weight: '100 900',
  display: 'swap',
});
