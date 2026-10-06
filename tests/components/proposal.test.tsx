import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { SubDial } from '@/components/dial/sub-dial';
import { ProposalSheet } from '@/components/proposal/proposal-sheet';
import { documentTotals } from '@/domain/proposal/document';
import { documentFromTemplate } from '@/domain/proposal/templates';
import { MoneyInput, PercentInput, Segmented } from '@/features/proposals/editor/inputs';
import { StatusBadge } from '@/features/proposals/components/status-badge';

describe('ProposalSheet', () => {
  it('renders the document with server-identical totals and separates excluded scope', () => {
    const document = documentFromTemplate('web-app', '2026-10-06');
    render(
      <ProposalSheet document={document} totals={documentTotals(document)} number="PB-2026-0042" />,
    );

    expect(screen.getByRole('article', { name: /PB-2026-0042/ })).toBeTruthy();
    expect(screen.getAllByText('USD 7,500.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Not included')).toBeTruthy();
    expect(screen.getByText(/Offline support/)).toBeTruthy();
    expect(screen.getByText('Valid until November 5, 2026')).toBeTruthy();
  });
});

describe('SubDial', () => {
  it('lists every segment in words for assistive technology', () => {
    render(
      <SubDial
        segments={[
          { label: 'Deposit', detail: '30%', share: 0.3 },
          { label: 'Launch', detail: '70%', share: 0.7 },
        ]}
        centerLabel="Total"
        centerValue="USD 1,000.00"
        caption="Payment schedule: deposit 30%, launch 70%."
      />,
    );
    expect(screen.getByText('Payment schedule: deposit 30%, launch 70%.')).toBeTruthy();
    expect(screen.getByText('Deposit')).toBeTruthy();
    expect(screen.getByText('USD 1,000.00')).toBeTruthy();
  });
});

function MoneyHarness({ initial }: { initial: number }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <MoneyInput aria-label="Rate" value={value} onChange={setValue} />
      <output data-testid="minor">{String(value)}</output>
    </>
  );
}

describe('MoneyInput', () => {
  it('edits minor units as a decimal and reformats on blur', () => {
    render(<MoneyHarness initial={3_000} />);
    const input = screen.getByLabelText('Rate') as HTMLInputElement;
    expect(input.value).toBe('30.00');

    fireEvent.change(input, { target: { value: '1,250.5' } });
    expect(screen.getByTestId('minor').textContent).toBe('125050');
    fireEvent.blur(input);
    expect(input.value).toBe('1250.50');

    fireEvent.change(input, { target: { value: '12.345' } });
    expect(screen.getByTestId('minor').textContent).toBe('NaN');
  });
});

describe('PercentInput', () => {
  it('maps percentages to basis points', () => {
    let latest = 0;
    render(<PercentInput aria-label="Tax" value={2_100} onChange={(value) => (latest = value)} />);
    const input = screen.getByLabelText('Tax') as HTMLInputElement;
    expect(input.value).toBe('21');
    fireEvent.change(input, { target: { value: '12.5' } });
    expect(latest).toBe(1_250);
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(latest).toBeNaN();
  });
});

describe('Segmented', () => {
  it('is a radio group with the current option checked', () => {
    let selected = 'none';
    render(
      <Segmented
        label="Discount type"
        value="none"
        onChange={(value) => (selected = value)}
        options={[
          { value: 'none', label: 'None' },
          { value: 'percent', label: 'Percent' },
        ]}
      />,
    );
    expect((screen.getByRole('radio', { name: 'None' }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Percent' }));
    expect(selected).toBe('percent');
  });
});

describe('StatusBadge', () => {
  it('always writes the status as a word', () => {
    render(<StatusBadge status="accepted" />);
    expect(screen.getByText('Accepted')).toBeTruthy();
  });
});
