import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { ImageResponse } from 'next/og';

import { formatMoney } from '@/domain/proposal/money';
import { EXAMPLE } from '@/features/landing/example';

export const alt = 'Proposal Builder by Folder IT: branded proposals priced to the cent';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const fonts = path.join(process.cwd(), 'src/assets/fonts');
const [serifLight, sans, sansSemibold] = await Promise.all([
  readFile(path.join(fonts, 'source-serif-4-latin-300-normal.woff')),
  readFile(path.join(fonts, 'hanken-grotesk-latin-400-normal.woff')),
  readFile(path.join(fonts, 'hanken-grotesk-latin-600-normal.woff')),
]);

/** Social card: the promise in the serif, and the example total on a dial. */
export default function OpengraphImage() {
  const total = formatMoney(EXAMPLE.totals.total, EXAMPLE.document.pricing.currency);
  const ticks = Array.from({ length: 60 }, (_, index) => index);
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#eef0f3',
        color: '#1c2a44',
        padding: 72,
        fontFamily: 'Hanken Grotesk',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={{ fontFamily: 'Source Serif', fontSize: 36 }}>Proposal Builder</span>
          <span style={{ fontSize: 22, color: '#465266' }}>by Folder IT</span>
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Source Serif',
            fontSize: 72,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            maxWidth: 620,
          }}
        >
          Proposals that add up, to the cent.
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 20,
            color: '#5c6779',
            letterSpacing: 2,
            fontWeight: 600,
          }}
        >
          LIVE PREVIEW · EXACT TOTALS · PDF EXPORT
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: 380,
          height: 380,
          alignSelf: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            inset: 0,
            borderRadius: 190,
            background: '#ffffff',
            border: '1px solid #d5d9df',
          }}
        />
        {ticks.map((tick) => (
          <div
            key={tick}
            style={{
              display: 'flex',
              position: 'absolute',
              left: 189,
              top: 6,
              width: tick % 5 === 0 ? 2 : 1,
              height: tick % 5 === 0 ? 18 : 9,
              background: tick % 5 === 0 ? '#1c2a44' : '#808a99',
              transformOrigin: '1px 184px',
              transform: `rotate(${tick * 6}deg)`,
            }}
          />
        ))}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            left: 181,
            top: 0,
            width: 0,
            height: 0,
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderTop: '16px solid #9a7b46',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            inset: 0,
            gap: 6,
          }}
        >
          <span style={{ fontSize: 16, letterSpacing: 2, color: '#5c6779', fontWeight: 600 }}>
            TOTAL
          </span>
          <span style={{ fontFamily: 'Source Serif', fontSize: 40 }}>{total}</span>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Source Serif', data: serifLight, weight: 300 },
        { name: 'Hanken Grotesk', data: sans, weight: 400 },
        { name: 'Hanken Grotesk', data: sansSemibold, weight: 600 },
      ],
    },
  );
}
