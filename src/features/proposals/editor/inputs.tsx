'use client';

import { type ComponentProps, useId, useState } from 'react';

import { Input } from '@/components/ui/field';
import { parseMoney, toDecimalString } from '@/domain/proposal/money';
import { cn } from '@/lib/cn';

type NumericInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
  value: number;
  onChange: (value: number) => void;
};

/**
 * Edits an amount in minor units as a decimal. Invalid text reports NaN, so the schema shows
 * "Enter a price" instead of silently keeping the previous amount. Reformats on blur.
 */
export function MoneyInput({ value, onChange, onBlur, ...props }: NumericInputProps) {
  const [text, setText] = useState(() => (Number.isFinite(value) ? toDecimalString(value) : ''));
  return (
    <Input
      {...props}
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        onChange(parseMoney(event.target.value) ?? Number.NaN);
      }}
      onBlur={(event) => {
        if (Number.isFinite(value)) setText(toDecimalString(value));
        onBlur?.(event);
      }}
      className={cn('text-right', props.className)}
    />
  );
}

/** Edits basis points as a percentage with up to two decimals: 1250 bps is shown as "12.5". */
export function PercentInput({ value, onChange, onBlur, ...props }: NumericInputProps) {
  const [text, setText] = useState(() => (Number.isFinite(value) ? String(value / 100) : ''));
  return (
    <div className="relative">
      <Input
        {...props}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          const match = /^\s*(\d{1,3})(?:\.(\d{1,2}))?\s*$/.exec(event.target.value);
          onChange(
            match ? Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0')) : Number.NaN,
          );
        }}
        onBlur={onBlur}
        className={cn('pr-8 text-right', props.className)}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-3"
      >
        %
      </span>
    </div>
  );
}

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

/** A labelled on/off switch with the state written next to it. */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  const id = useId();
  return (
    <span className="inline-flex items-center gap-2.5">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full border transition-colors duration-150 ease-(--ease-out) disabled:opacity-50',
          checked ? 'border-ink bg-ink' : 'border-steel bg-raised',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-0.5 left-0.5 size-4 rounded-full transition-transform duration-200 ease-(--ease-out)',
            checked ? 'translate-x-4 bg-white' : 'bg-steel',
          )}
        />
      </button>
      <span aria-hidden className="text-sm text-ink-2">
        {checked ? 'Included' : 'Excluded'}
      </span>
    </span>
  );
}

type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

/** Two to four mutually exclusive options. Native radios keep arrow-key navigation. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: SegmentedProps<T>) {
  const name = useId();
  return (
    <fieldset
      disabled={disabled}
      className="inline-flex rounded-sm border border-steel bg-raised p-0.5 disabled:opacity-50"
    >
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'cursor-pointer rounded-[2px] px-3 py-1.5 text-sm transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus',
            value === option.value
              ? 'bg-ink font-[560] text-white'
              : 'text-ink-2 hover:bg-sunk hover:text-ink',
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
