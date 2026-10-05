/**
 * Public identity of the app. Every route is served below BASE_PATH and canonical URLs are
 * built from SITE_ORIGIN.
 */
export const BASE_PATH = '/apps/proposal-builder';

export const siteConfig = {
  name: 'Proposal Builder',
  shortDescription:
    'Build branded commercial proposals with scope, services, exact pricing and terms, see the document update as you type, then export a PDF or share a link.',
  repositoryUrl: 'https://github.com/FolderITDev/web-proposal-builder',
  locale: 'en_US',
  company: {
    name: 'Folder IT',
    url: 'https://folderit.net',
    logoUrl: 'https://www.folderit.net/docs/Header.webp',
    description:
      'Folder IT is a nearshore software development company that builds custom web and mobile applications, business platforms and AI-ready engineering teams for U.S. companies.',
    sameAs: [
      'https://www.linkedin.com/company/folderit',
      'https://x.com/folderit',
      'https://www.youtube.com/@folderit',
      'https://github.com/FolderITDev',
    ],
  },
} as const;

/** Origin without a trailing slash, e.g. https://folderit.net. */
export function siteOrigin(): string {
  return (process.env.SITE_ORIGIN ?? 'https://folderit.net').replace(/\/+$/, '');
}

/** Absolute URL for a path inside the app, e.g. absoluteUrl('/proposals'). */
export function absoluteUrl(path = '/'): string {
  const suffix = path === '/' ? '' : path;
  return `${siteOrigin()}${BASE_PATH}${suffix}`;
}
