import './globals.css';

import { type Metadata, type Viewport } from 'next';

import { absoluteUrl, siteConfig } from '@/config/site';
import { cn } from '@/lib/cn';

import { hankenGrotesk, sourceSerif } from './fonts';

const title = `${siteConfig.name}: commercial proposals with exact pricing, by Folder IT`;

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl('/')),
  title: { default: title, template: `%s · ${siteConfig.name}` },
  description: siteConfig.shortDescription,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.company.name, url: siteConfig.company.url }],
  creator: siteConfig.company.name,
  publisher: siteConfig.company.name,
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: '#eef0f3',
  colorScheme: 'light',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn(hankenGrotesk.variable, sourceSerif.variable)}
    >
      <body className="min-h-dvh">
        <a
          href="#main"
          className="fixed top-3 left-3 z-50 -translate-y-20 rounded-sm bg-ink px-3 py-2 text-sm text-white focus-visible:translate-y-0"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
