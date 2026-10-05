import path from 'node:path';

import {
  Circle,
  Document,
  Font,
  Page,
  Polygon,
  Rect,
  renderToBuffer,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';

import { formatMoney } from '@/domain/proposal/money';
import { formatBasisPoints } from '@/domain/proposal/totals';
import { initials, logoShapes } from '@/lib/brand/logo';
import { formatDocumentDate, formatQuantity } from '@/lib/proposal-format';
import { type Proposal } from '@/lib/validation/proposal';

const fonts = path.join(process.cwd(), 'src/assets/fonts');

Font.register({
  family: 'Source Serif',
  fonts: [
    { src: path.join(fonts, 'source-serif-4-latin-300-normal.woff'), fontWeight: 300 },
    { src: path.join(fonts, 'source-serif-4-latin-400-normal.woff'), fontWeight: 400 },
    {
      src: path.join(fonts, 'source-serif-4-latin-400-italic.woff'),
      fontWeight: 400,
      fontStyle: 'italic',
    },
    { src: path.join(fonts, 'source-serif-4-latin-600-normal.woff'), fontWeight: 600 },
  ],
});
Font.register({
  family: 'Hanken Grotesk',
  fonts: [
    { src: path.join(fonts, 'hanken-grotesk-latin-400-normal.woff'), fontWeight: 400 },
    { src: path.join(fonts, 'hanken-grotesk-latin-500-normal.woff'), fontWeight: 500 },
    { src: path.join(fonts, 'hanken-grotesk-latin-600-normal.woff'), fontWeight: 600 },
    { src: path.join(fonts, 'hanken-grotesk-latin-700-normal.woff'), fontWeight: 700 },
  ],
});
// Long words such as URLs should wrap, not hyphenate.
Font.registerHyphenationCallback((word) => [word]);

const INK = '#1c2a44';
const MUTED = '#5b6474';
const RULE = '#d5d9df';

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 56,
    fontFamily: 'Hanken Grotesk',
    fontSize: 9.5,
    color: INK,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 36,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { fontSize: 11, fontWeight: 600 },
  meta: { textAlign: 'right', color: MUTED, fontSize: 8.5 },
  number: { fontSize: 8.5, letterSpacing: 1, color: MUTED },
  title: {
    fontFamily: 'Source Serif',
    fontWeight: 300,
    fontSize: 26,
    lineHeight: 1.15,
    marginTop: 6,
    marginBottom: 18,
  },
  parties: {
    flexDirection: 'row',
    gap: 32,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: RULE,
    marginBottom: 28,
  },
  party: { flex: 1 },
  label: { fontSize: 7.5, letterSpacing: 1, color: MUTED, marginBottom: 4 },
  strong: { fontWeight: 600 },
  section: { marginBottom: 24 },
  heading: { fontFamily: 'Source Serif', fontWeight: 400, fontSize: 14, marginBottom: 8 },
  // No page-level line height: react-pdf drops fixed footers that inherit one.
  paragraph: { marginBottom: 6, lineHeight: 1.45 },
  muted: { color: MUTED },
  row: { flexDirection: 'row', borderBottomWidth: 0.75, borderColor: RULE, paddingVertical: 6 },
  headRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: INK,
    paddingBottom: 5,
    marginTop: 4,
  },
  th: { fontSize: 7.5, letterSpacing: 0.8, color: MUTED },
  colService: { flex: 3 },
  colQuantity: { flex: 1.2, textAlign: 'right' },
  colPrice: { flex: 1.4, textAlign: 'right' },
  colAmount: { flex: 1.5, textAlign: 'right' },
  totals: { marginTop: 10, marginLeft: 'auto', width: 230 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderColor: INK,
  },
  grandTotalValue: { fontFamily: 'Source Serif', fontSize: 16, fontWeight: 600 },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: MUTED,
  },
});

function Logo({ proposal }: { proposal: Proposal }) {
  const { logo, companyName, color } = proposal.document.branding;
  if (logo === 'monogram') {
    // Text inside a PDF SVG is not portable across viewers, so the monogram is set as real text.
    return (
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 600 }}>
          {initials(companyName)}
        </Text>
      </View>
    );
  }
  return (
    <Svg width={28} height={28} viewBox="0 0 40 40">
      {logoShapes(logo, companyName).map((shape, index) => {
        switch (shape.kind) {
          case 'circle':
            return shape.fill ? (
              <Circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} fill={color} />
            ) : (
              <Circle
                key={index}
                cx={shape.cx}
                cy={shape.cy}
                r={shape.r}
                fill="none"
                stroke={color}
                strokeWidth={shape.strokeWidth}
              />
            );
          case 'rect':
            return (
              <Rect
                key={index}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                fill={color}
                opacity={shape.opacity ?? 1}
              />
            );
          case 'polygon':
            return (
              <Polygon key={index} points={shape.points} fill={shape.fill ? color : '#ffffff'} />
            );
          case 'text':
            return null;
        }
      })}
    </Svg>
  );
}

function ProposalPdf({ proposal }: { proposal: Proposal }) {
  const { document, totals } = proposal;
  const { client, project, pricing, terms, branding } = document;
  const money = (minor: number) => formatMoney(minor, pricing.currency);
  const included = document.scope.filter((item) => item.included);
  const excluded = document.scope.filter((item) => !item.included);

  return (
    <Document
      title={`${proposal.number} · ${document.title}`}
      author={branding.companyName}
      creator="Proposal Builder by Folder IT"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.footer} fixed>
          <Text>
            {branding.companyName} · {proposal.number}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
        <View style={styles.header} fixed>
          <View style={styles.brand}>
            <Logo proposal={proposal} />
            <Text style={styles.brandName}>{branding.companyName}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.number}>COMMERCIAL PROPOSAL · {proposal.number}</Text>
            {terms.validUntil ? (
              <Text>Valid until {formatDocumentDate(terms.validUntil)}</Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.title}>{document.title}</Text>

        <View style={styles.parties}>
          <View style={styles.party}>
            <Text style={styles.label}>PREPARED FOR</Text>
            <Text style={styles.strong}>{client.company}</Text>
            {client.contactName ? <Text>{client.contactName}</Text> : null}
            {client.email ? <Text style={styles.muted}>{client.email}</Text> : null}
            {client.address ? <Text style={styles.muted}>{client.address}</Text> : null}
          </View>
          <View style={styles.party}>
            <Text style={styles.label}>PREPARED BY</Text>
            <Text style={styles.strong}>{branding.companyName}</Text>
            {branding.email ? <Text style={styles.muted}>{branding.email}</Text> : null}
            {branding.phone ? <Text style={styles.muted}>{branding.phone}</Text> : null}
            {branding.website ? <Text style={styles.muted}>{branding.website}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>{project.name}</Text>
          {project.summary ? <Text style={styles.paragraph}>{project.summary}</Text> : null}
          {project.objectives.map((objective) => (
            <Text key={objective} style={styles.paragraph}>
              — {objective}
            </Text>
          ))}
          <Text style={styles.muted}>
            {[
              project.startDate ? `Start ${formatDocumentDate(project.startDate)}` : null,
              project.durationWeeks ? `${project.durationWeeks} weeks` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>

        {document.scope.length ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Scope</Text>
            {included.map((item) => (
              <View key={item.name} style={styles.row} wrap={false}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.strong}>{item.name}</Text>
                  {item.description ? <Text style={styles.muted}>{item.description}</Text> : null}
                  {item.notes ? <Text style={styles.muted}>{item.notes}</Text> : null}
                </View>
              </View>
            ))}
            {excluded.length ? (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>NOT INCLUDED</Text>
                {excluded.map((item) => (
                  <Text key={item.name} style={styles.muted}>
                    {item.name}
                    {item.notes ? ` — ${item.notes}` : ''}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section} wrap={false}>
          <Text style={styles.heading}>Investment</Text>
          <View style={styles.headRow}>
            <Text style={[styles.th, styles.colService]}>SERVICE</Text>
            <Text style={[styles.th, styles.colQuantity]}>QUANTITY</Text>
            <Text style={[styles.th, styles.colPrice]}>RATE</Text>
            <Text style={[styles.th, styles.colAmount]}>AMOUNT</Text>
          </View>
          {document.lineItems.map((item, index) => (
            <View key={`${item.service}-${index}`} style={styles.row}>
              <View style={styles.colService}>
                <Text style={styles.strong}>{item.service}</Text>
                {item.description ? <Text style={styles.muted}>{item.description}</Text> : null}
              </View>
              <Text style={styles.colQuantity}>{formatQuantity(item.quantity, item.unit)}</Text>
              <Text style={styles.colPrice}>
                {item.unit === 'fixed' ? '' : money(item.unitPriceMinor)}
              </Text>
              <Text style={styles.colAmount}>{money(totals.lines[index] ?? 0)}</Text>
            </View>
          ))}
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.muted}>Subtotal</Text>
              <Text>{money(totals.subtotal)}</Text>
            </View>
            {totals.discount ? (
              <View style={styles.totalRow}>
                <Text style={styles.muted}>
                  Discount
                  {pricing.discountType === 'percent'
                    ? ` (${formatBasisPoints(pricing.discountValue)})`
                    : ''}
                </Text>
                <Text>− {money(totals.discount)}</Text>
              </View>
            ) : null}
            {pricing.taxRateBps ? (
              <View style={styles.totalRow}>
                <Text style={styles.muted}>
                  {pricing.taxLabel || 'Tax'} ({formatBasisPoints(pricing.taxRateBps)})
                </Text>
                <Text>{money(totals.tax)}</Text>
              </View>
            ) : null}
            <View style={styles.grandTotal}>
              <Text style={styles.strong}>Total</Text>
              <Text style={styles.grandTotalValue}>{money(totals.total)}</Text>
            </View>
          </View>
        </View>

        {terms.milestones.length ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.heading}>Payment schedule</Text>
            {terms.milestones.map((milestone, index) => (
              <View key={`${milestone.name}-${index}`} style={styles.row}>
                <Text style={{ flex: 3 }}>{milestone.name}</Text>
                <Text style={[styles.muted, { flex: 1.5 }]}>{milestone.due}</Text>
                <Text style={[styles.muted, { flex: 1, textAlign: 'right' }]}>
                  {formatBasisPoints(milestone.percentBps)}
                </Text>
                <Text style={{ flex: 1.5, textAlign: 'right' }}>
                  {money(totals.milestones[index] ?? 0)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.heading}>Terms</Text>
          {terms.paymentTerms ? (
            <Text style={styles.paragraph}>Payment: {terms.paymentTerms}</Text>
          ) : null}
          {terms.conditions ? <Text style={styles.paragraph}>{terms.conditions}</Text> : null}
          {terms.notes ? <Text style={[styles.paragraph, styles.muted]}>{terms.notes}</Text> : null}
        </View>
      </Page>
    </Document>
  );
}

/** Renders the proposal to a PDF in memory. The same totals as the editor and preview are used. */
export function renderProposalPdf(proposal: Proposal): Promise<Buffer> {
  return renderToBuffer(<ProposalPdf proposal={proposal} />);
}
