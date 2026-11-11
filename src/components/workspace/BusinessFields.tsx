import { Check } from "lucide-react";
import { BUSINESS_TYPES, type BusinessType } from "@/lib/business";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BusinessTypePickerProps {
  value: BusinessType;
  onChange: (value: BusinessType) => void;
  disabled?: boolean;
  labelledBy?: string;
}

/** Radio cards for the workspace's business type. */
export function BusinessTypePicker({ value, onChange, disabled, labelledBy }: BusinessTypePickerProps) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="grid gap-2">
      {BUSINESS_TYPES.map((type) => {
        const selected = value === type.id;
        return (
          <button
            key={type.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(type.id)}
            className={cn(
              "flex items-center gap-3 rounded-[10px] border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
              selected ? "border-primary bg-primary-soft/60" : "border-border hover:border-border-strong hover:bg-surface-2"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]",
                selected ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"
              )}
            >
              <type.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-label text-foreground">{type.label}</span>
              <span className="block text-caption font-normal text-muted-foreground">{type.description}</span>
            </span>
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                selected ? "border-primary bg-primary text-primary-foreground" : "border-border-strong"
              )}
              aria-hidden="true"
            >
              {selected && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface CurrencySelectProps {
  id?: string;
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
  disabled?: boolean;
  describedBy?: string;
}

export function CurrencySelect({ id, value, onChange, disabled, describedBy }: CurrencySelectProps) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as CurrencyCode)} disabled={disabled}>
      <SelectTrigger id={id} aria-describedby={describedBy}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <span className="inline-block w-10 font-semibold tabular">{currency.code}</span>
            {currency.name} ({currency.symbol})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
