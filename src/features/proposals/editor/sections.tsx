'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { type ReactNode } from 'react';
import { Controller, get, useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { SubDial } from '@/components/dial/sub-dial';
import { BrandLogo } from '@/components/proposal/brand-logo';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { CURRENCIES, CURRENCY_LABEL, formatMoney } from '@/domain/proposal/money';
import { formatBasisPoints } from '@/domain/proposal/totals';
import { LOGO_LABEL } from '@/lib/brand/logo';
import { cn } from '@/lib/cn';
import { UNIT_LABEL } from '@/lib/proposal-format';
import {
  BRAND_LOGOS,
  LineUnitSchema,
  type ProposalDocument,
  type ProposalTotals,
} from '@/lib/validation/proposal';

import { MoneyInput, PercentInput, Segmented, Switch } from './inputs';

export const BRAND_COLORS = [
  '#1c2a44',
  '#1f4e5a',
  '#2d4a3e',
  '#5a2430',
  '#3f2e56',
  '#2b2f36',
] as const;

function useError(path: string): string | undefined {
  const { formState } = useFormContext<ProposalDocument>();
  return get(formState.errors, path)?.message as string | undefined;
}

export function EditorSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex scroll-mt-32 flex-col gap-6 border-t border-ink pt-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="serif text-[1.5rem] font-[380] tracking-[-0.01em]">
          {title}
        </h2>
        {description ? <p className="text-sm text-ink-3">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function TextField({
  name,
  label,
  optional,
  hint,
  placeholder,
  type = 'text',
}: {
  name: string;
  label: string;
  optional?: boolean;
  hint?: string;
  placeholder?: string;
  type?: string;
}) {
  const { register } = useFormContext<ProposalDocument>();
  const error = useError(name);
  return (
    <Field label={label} optional={optional} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          {...register(name as never)}
        />
      )}
    </Field>
  );
}

function TextAreaField({
  name,
  label,
  optional,
  hint,
  rows = 3,
}: {
  name: string;
  label: string;
  optional?: boolean;
  hint?: string;
  rows?: number;
}) {
  const { register } = useFormContext<ProposalDocument>();
  const error = useError(name);
  return (
    <Field label={label} optional={optional} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <Textarea
          id={id}
          rows={rows}
          className="min-h-0"
          aria-describedby={describedBy}
          aria-invalid={invalid}
          {...register(name as never)}
        />
      )}
    </Field>
  );
}

type RowActionsProps = {
  index: number;
  count: number;
  label: string;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
};

function RowActions({ index, count, label, onMove, onRemove }: RowActionsProps) {
  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="quiet"
        size="sm"
        className="px-2"
        aria-label={`Move ${label} up`}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        <ArrowUp aria-hidden />
      </Button>
      <Button
        variant="quiet"
        size="sm"
        className="px-2"
        aria-label={`Move ${label} down`}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <ArrowDown aria-hidden />
      </Button>
      <Button
        variant="quiet"
        size="sm"
        className="px-2"
        aria-label={`Remove ${label}`}
        onClick={() => onRemove(index)}
      >
        <Trash2 aria-hidden />
      </Button>
    </div>
  );
}

export function ClientSection() {
  return (
    <EditorSection id="client" title="Client" description="Who the proposal is addressed to.">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="client.company" label="Company" />
        <TextField name="client.contactName" label="Contact person" optional />
        <TextField name="client.email" label="Email" type="email" optional />
        <TextField name="client.address" label="Address" optional />
      </div>
      <TextAreaField
        name="client.notes"
        label="Internal notes"
        optional
        hint="Not shown on the proposal."
        rows={2}
      />
    </EditorSection>
  );
}

export function ProjectSection() {
  const { control, register } = useFormContext<ProposalDocument>();
  const durationError = useError('project.durationWeeks');
  const startDateError = useError('project.startDate');
  return (
    <EditorSection id="project" title="Project" description="What you will build and why.">
      <TextField name="title" label="Proposal title" />
      <TextField name="project.name" label="Project name" />
      <TextAreaField name="project.summary" label="Summary" optional rows={4} />
      <Controller
        control={control}
        name="project.objectives"
        render={({ field, fieldState }) => (
          <Field
            label="Objectives"
            optional
            hint="One per line, at most eight."
            error={fieldState.error?.message}
          >
            {({ id, describedBy, invalid }) => (
              <Textarea
                id={id}
                rows={3}
                className="min-h-0"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                value={field.value.join('\n')}
                onChange={(event) =>
                  field.onChange(
                    event.target.value
                      .split('\n')
                      .filter((line, index, lines) => line.trim() || index === lines.length - 1),
                  )
                }
                onBlur={() => {
                  field.onChange(field.value.map((line) => line.trim()).filter(Boolean));
                  field.onBlur();
                }}
              />
            )}
          </Field>
        )}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Start date" optional error={startDateError}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="date"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('project.startDate', { setValueAs: (value: string) => value || null })}
            />
          )}
        </Field>
        <Field label="Duration in weeks" optional error={durationError}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="number"
              min={1}
              max={260}
              inputMode="numeric"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('project.durationWeeks', {
                setValueAs: (value: string) =>
                  value === '' || value === null ? null : Number(value),
              })}
            />
          )}
        </Field>
      </div>
    </EditorSection>
  );
}

export function ScopeSection() {
  const { control, register } = useFormContext<ProposalDocument>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'scope' });
  return (
    <EditorSection
      id="scope"
      title="Scope"
      description="List what is included, and what is deliberately left out."
    >
      {fields.length === 0 ? <p className="text-sm text-ink-3">No scope items yet.</p> : null}
      <ol className="flex flex-col gap-4">
        {fields.map((field, index) => (
          <li
            key={field.id}
            className="flex flex-col gap-4 rounded-md border border-rule bg-raised p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="index text-ink-3">Item {index + 1}</span>
              <div className="flex items-center gap-3">
                <Controller
                  control={control}
                  name={`scope.${index}.included`}
                  render={({ field: toggle }) => (
                    <Switch
                      checked={toggle.value}
                      onChange={toggle.onChange}
                      label={`Include scope item ${index + 1}`}
                    />
                  )}
                />
                <RowActions
                  index={index}
                  count={fields.length}
                  label={`scope item ${index + 1}`}
                  onMove={move}
                  onRemove={remove}
                />
              </div>
            </div>
            <TextField name={`scope.${index}.name`} label="Name" />
            <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
              <TextAreaField
                name={`scope.${index}.description`}
                label="Description"
                optional
                rows={2}
              />
              <Field label="Notes" optional error={undefined}>
                {({ id }) => (
                  <Textarea
                    id={id}
                    rows={2}
                    className="min-h-0"
                    {...register(`scope.${index}.notes`)}
                  />
                )}
              </Field>
            </div>
          </li>
        ))}
      </ol>
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        disabled={fields.length >= 40}
        onClick={() => append({ name: '', description: '', included: true, notes: '' })}
      >
        <Plus aria-hidden />
        Add scope item
      </Button>
    </EditorSection>
  );
}

export function ServicesSection({ totals }: { totals: ProposalTotals }) {
  const { control, register } = useFormContext<ProposalDocument>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'lineItems' });
  const currency = useWatch({ control, name: 'pricing.currency' });
  const discountType = useWatch({ control, name: 'pricing.discountType' });
  const lineItems = useWatch({ control, name: 'lineItems' });
  const money = (minor: number) => formatMoney(minor, currency);
  const segments = totals.subtotal
    ? lineItems.map((item, index) => ({
        label: item.service || `Service ${index + 1}`,
        detail: money(totals.lines[index] ?? 0),
        share: (totals.lines[index] ?? 0) / totals.subtotal,
      }))
    : [];

  return (
    <EditorSection
      id="services"
      title="Services and pricing"
      description="Quantities accept two decimals; amounts are exact to the cent."
    >
      {fields.length === 0 ? <p className="text-sm text-ink-3">No services yet.</p> : null}
      <ol className="flex flex-col gap-4">
        {fields.map((field, index) => {
          const unit = lineItems[index]?.unit;
          return (
            <li
              key={field.id}
              className="flex flex-col gap-4 rounded-md border border-rule bg-raised p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="index text-ink-3">Service {index + 1}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-[600]">{money(totals.lines[index] ?? 0)}</span>
                  <RowActions
                    index={index}
                    count={fields.length}
                    label={`service ${index + 1}`}
                    onMove={move}
                    onRemove={remove}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr]">
                <TextField name={`lineItems.${index}.service`} label="Service" />
                <TextField name={`lineItems.${index}.description`} label="Description" optional />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Unit" error={undefined}>
                  {({ id }) => (
                    <Select
                      id={id}
                      className="h-11 w-full"
                      {...register(`lineItems.${index}.unit`)}
                    >
                      {LineUnitSchema.options.map((option) => (
                        <option key={option} value={option}>
                          {UNIT_LABEL[option]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <QuantityField index={index} disabled={unit === 'fixed'} />
                <Controller
                  control={control}
                  name={`lineItems.${index}.unitPriceMinor`}
                  render={({ field: price, fieldState }) => (
                    <Field
                      label={unit === 'fixed' ? `Fee (${currency})` : `Rate (${currency})`}
                      error={fieldState.error?.message}
                      className="col-span-2 sm:col-span-1"
                    >
                      {({ id, describedBy, invalid }) => (
                        <MoneyInput
                          id={id}
                          aria-describedby={describedBy}
                          aria-invalid={invalid}
                          value={price.value}
                          onChange={price.onChange}
                          onBlur={price.onBlur}
                        />
                      )}
                    </Field>
                  )}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        disabled={fields.length >= 40}
        onClick={() =>
          append({ service: '', description: '', unit: 'hour', quantity: 1, unitPriceMinor: 0 })
        }
      >
        <Plus aria-hidden />
        Add service
      </Button>

      <div className="grid gap-8 rounded-md border border-rule bg-surface p-5 xl:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="flex flex-col gap-5">
          <Field label="Currency" error={undefined}>
            {({ id }) => (
              <Select id={id} className="h-11 w-full" {...register('pricing.currency')}>
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code} · {CURRENCY_LABEL[code]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-[560]">Discount</span>
            <Controller
              control={control}
              name="pricing.discountType"
              render={({ field: type }) => (
                <Segmented
                  label="Discount type"
                  value={type.value}
                  onChange={type.onChange}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'percent', label: 'Percent' },
                    { value: 'fixed', label: 'Amount' },
                  ]}
                />
              )}
            />
            {discountType !== 'none' ? (
              <Controller
                key={discountType}
                control={control}
                name="pricing.discountValue"
                render={({ field: discount, fieldState }) => (
                  <Field
                    label={
                      discountType === 'percent'
                        ? 'Discount percentage'
                        : `Discount amount (${currency})`
                    }
                    error={fieldState.error?.message}
                  >
                    {({ id, describedBy, invalid }) =>
                      discountType === 'percent' ? (
                        <PercentInput
                          id={id}
                          aria-describedby={describedBy}
                          aria-invalid={invalid}
                          value={discount.value}
                          onChange={discount.onChange}
                          onBlur={discount.onBlur}
                        />
                      ) : (
                        <MoneyInput
                          id={id}
                          aria-describedby={describedBy}
                          aria-invalid={invalid}
                          value={discount.value}
                          onChange={discount.onChange}
                          onBlur={discount.onBlur}
                        />
                      )
                    }
                  </Field>
                )}
              />
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField name="pricing.taxLabel" label="Tax label" optional placeholder="VAT" />
            <Controller
              control={control}
              name="pricing.taxRateBps"
              render={({ field: tax, fieldState }) => (
                <Field label="Tax rate" error={fieldState.error?.message}>
                  {({ id, describedBy, invalid }) => (
                    <PercentInput
                      id={id}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      value={tax.value}
                      onChange={tax.onChange}
                      onBlur={tax.onBlur}
                    />
                  )}
                </Field>
              )}
            />
          </div>
          <dl className="flex flex-col gap-1 border-t border-rule pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-2">Subtotal</dt>
              <dd>{money(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-2">Discount</dt>
              <dd>− {money(totals.discount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-2">Tax</dt>
              <dd>{money(totals.tax)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-ink pt-2">
              <dt className="font-[600]">Total</dt>
              <dd className="serif text-[1.25rem]" aria-live="polite">
                {money(totals.total)}
              </dd>
            </div>
          </dl>
        </div>
        {segments.length ? (
          <SubDial
            size={180}
            segments={segments}
            centerLabel="Subtotal"
            centerValue={money(totals.subtotal)}
            caption={`Services mix: ${segments.map((segment) => `${segment.label}, ${segment.detail}`).join('; ')}.`}
            className="hidden xl:flex"
          />
        ) : null}
      </div>
    </EditorSection>
  );
}

function QuantityField({ index, disabled }: { index: number; disabled: boolean }) {
  const { register } = useFormContext<ProposalDocument>();
  const error = useError(`lineItems.${index}.quantity`);
  return (
    <Field label="Quantity" error={error}>
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          type="number"
          step="0.01"
          min="0.01"
          inputMode="decimal"
          readOnly={disabled}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className="text-right read-only:bg-sunk"
          {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
        />
      )}
    </Field>
  );
}

export function TermsSection({ totals }: { totals: ProposalTotals }) {
  const { control, register } = useFormContext<ProposalDocument>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'terms.milestones' });
  const milestones = useWatch({ control, name: 'terms.milestones' });
  const currency = useWatch({ control, name: 'pricing.currency' });
  const assigned = milestones.reduce(
    (sum, milestone) => sum + (Number.isFinite(milestone.percentBps) ? milestone.percentBps : 0),
    0,
  );
  const milestonesError = useError('terms.milestones');
  const validUntilError = useError('terms.validUntil');

  return (
    <EditorSection
      id="terms"
      title="Terms"
      description="How and when you get paid, and the conditions that apply."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="terms.paymentTerms"
          label="Payment terms"
          optional
          placeholder="Net 15 from each invoice"
        />
        <Field label="Valid until" optional error={validUntilError}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="date"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('terms.validUntil', { setValueAs: (value: string) => value || null })}
            />
          )}
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-[600]">Payment schedule</h3>
          {fields.length ? (
            <span
              className={cn('text-sm', assigned === 10_000 ? 'text-ink-2' : 'text-danger')}
              aria-live="polite"
            >
              {formatBasisPoints(assigned)} of 100% assigned
            </span>
          ) : null}
        </div>
        {milestonesError && typeof milestonesError === 'string' ? (
          <p role="alert" className="text-[0.8125rem] text-danger">
            {milestonesError}
          </p>
        ) : null}
        <ol className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <li
              key={field.id}
              className="grid gap-3 rounded-md border border-rule bg-raised p-4 sm:grid-cols-[1.4fr_1fr_7rem_auto] sm:items-end"
            >
              <TextField name={`terms.milestones.${index}.name`} label="Milestone" />
              <TextField
                name={`terms.milestones.${index}.due`}
                label="Due"
                optional
                placeholder="Week 4"
              />
              <Controller
                control={control}
                name={`terms.milestones.${index}.percentBps`}
                render={({ field: share, fieldState }) => (
                  <Field label="Share" error={fieldState.error?.message}>
                    {({ id, describedBy, invalid }) => (
                      <PercentInput
                        id={id}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        value={share.value}
                        onChange={share.onChange}
                        onBlur={share.onBlur}
                      />
                    )}
                  </Field>
                )}
              />
              <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                <span className="text-sm text-ink-2">
                  {formatMoney(totals.milestones[index] ?? 0, currency)}
                </span>
                <RowActions
                  index={index}
                  count={fields.length}
                  label={`milestone ${index + 1}`}
                  onMove={move}
                  onRemove={remove}
                />
              </div>
            </li>
          ))}
        </ol>
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          disabled={fields.length >= 12}
          onClick={() =>
            append({ name: '', due: '', percentBps: Math.max(0, 10_000 - assigned) || 1 })
          }
        >
          <Plus aria-hidden />
          Add milestone
        </Button>
      </div>

      <TextAreaField name="terms.conditions" label="Commercial conditions" optional rows={4} />
      <TextAreaField name="terms.notes" label="Notes" optional rows={2} />
    </EditorSection>
  );
}

export function BrandingSection() {
  const { control } = useFormContext<ProposalDocument>();
  const companyName = useWatch({ control, name: 'branding.companyName' });
  const color = useWatch({ control, name: 'branding.color' });
  return (
    <EditorSection
      id="branding"
      title="Branding"
      description="Your company as it appears on the document."
    >
      <TextField name="branding.companyName" label="Company name" />
      <Controller
        control={control}
        name="branding.logo"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-[560]">Logo</legend>
            <div className="flex flex-wrap gap-3">
              {BRAND_LOGOS.map((logo) => (
                <label
                  key={logo}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-md border bg-raised px-3 py-2 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus',
                    field.value === logo ? 'border-ink' : 'border-rule hover:border-steel',
                  )}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={logo}
                    checked={field.value === logo}
                    onChange={() => field.onChange(logo)}
                    className="sr-only"
                  />
                  <BrandLogo
                    logo={logo}
                    companyName={companyName || 'Company'}
                    color={color}
                    size={26}
                  />
                  {LOGO_LABEL[logo]}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      />
      <Controller
        control={control}
        name="branding.color"
        render={({ field, fieldState }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-[560]">Brand color</legend>
            <div className="flex flex-wrap items-center gap-2">
              {BRAND_COLORS.map((swatch) => (
                <label
                  key={swatch}
                  className="cursor-pointer rounded-full has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={swatch}
                    checked={field.value.toLowerCase() === swatch}
                    onChange={() => field.onChange(swatch)}
                    className="sr-only"
                  />
                  <span className="sr-only">{swatch}</span>
                  <span
                    aria-hidden
                    className={cn(
                      'block size-8 rounded-full ring-offset-2 ring-offset-dial',
                      field.value.toLowerCase() === swatch && 'ring-2 ring-ink',
                    )}
                    style={{ backgroundColor: swatch }}
                  />
                </label>
              ))}
              <Input
                aria-label="Custom brand color, as hex"
                className="ml-2 h-9 w-28 font-mono text-sm"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={Boolean(fieldState.error)}
              />
            </div>
            {fieldState.error ? (
              <p className="text-[0.8125rem] text-danger">{fieldState.error.message}</p>
            ) : null}
          </fieldset>
        )}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="branding.email" label="Email" type="email" optional />
        <TextField name="branding.phone" label="Phone" optional />
        <TextField name="branding.website" label="Website" optional />
        <TextField name="branding.address" label="Address" optional />
      </div>
    </EditorSection>
  );
}
