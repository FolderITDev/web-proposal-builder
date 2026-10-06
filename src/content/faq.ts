/** Questions answered on the landing page and published as FAQPage structured data. */
export const FAQ = [
  {
    question: 'Do I need an account?',
    answer:
      'No. Your proposals are tied to an anonymous cookie in this browser. Anyone with a proposal’s share link can read it, and proposals you have not edited for seven days are removed automatically.',
  },
  {
    question: 'How are totals calculated?',
    answer:
      'Every amount is an integer number of cents. Each line is quantity times rate, rounded once. The discount comes off the subtotal, tax is applied to the discounted amount, and milestone amounts are split so they add up to the total exactly. The editor, the preview, the API and the PDF all call the same function.',
  },
  {
    question: 'Which currencies are supported?',
    answer:
      'US dollar, euro, British pound, Canadian dollar, Australian dollar, Mexican peso, Brazilian real and Argentine peso. A proposal has one currency, and amounts are always shown with the ISO currency code to avoid ambiguous symbols.',
  },
  {
    question: 'What happens if I edit the same proposal in two tabs?',
    answer:
      'Every save carries the version it was based on. If another tab saved first, the second save is rejected instead of silently overwriting the first, and the editor asks you to reload the latest version.',
  },
  {
    question: 'How is the PDF generated?',
    answer:
      'On the server, with React PDF, from the saved proposal. It uses the same document model and totals as the live preview, with self-hosted fonts, so it does not depend on a browser print dialog.',
  },
  {
    question: 'Who built Proposal Builder?',
    answer:
      'Folder IT, a nearshore software development company that builds custom web and mobile applications and business platforms for U.S. companies. The team builds and maintains Proposal Builder with Next.js, TypeScript, REST APIs and PostgreSQL, the same stack it uses for client platforms.',
  },
  {
    question: 'Is the source code available?',
    answer:
      'Yes. The complete application, including the pricing rules, the API, the database migrations and the tests, is published on GitHub under the MIT license.',
  },
] as const;
