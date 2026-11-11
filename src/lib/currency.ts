export type CurrencyCode = "IDR" | "USD" | "SGD" | "CNY" | "JPY" | "EUR";

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  /** Whether amounts are normally written with cents. */
  decimals: boolean;
}

/** Supported workspace currencies, in the order shown in pickers. */
export const CURRENCIES: Currency[] = [
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", decimals: false },
  { code: "USD", name: "US Dollar", symbol: "$", decimals: true },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", decimals: true },
  { code: "CNY", name: "Chinese Yuan", symbol: "CN¥", decimals: true },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", decimals: false },
  { code: "EUR", name: "Euro", symbol: "€", decimals: true },
];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function getCurrency(code: string | null | undefined): Currency {
  return CURRENCIES.find((currency) => currency.code === code) ?? CURRENCIES.find((currency) => currency.code === DEFAULT_CURRENCY)!;
}

/** "Rp" reads better with a space before the number; single-glyph symbols don't. Non-breaking, so chart ticks don't wrap. */
function withSymbol(symbol: string, amount: string) {
  return /[A-Za-z]$/.test(symbol) ? `${symbol} ${amount}` : `${symbol}${amount}`;
}

/** Whole-unit amount, e.g. "$12,400", "Rp 15,000,000", "−€300". */
export function formatMoney(value: number, code: string | null | undefined) {
  const { symbol } = getCurrency(code);
  const amount = Math.abs(Math.round(value)).toLocaleString("en-US");
  return `${value < 0 ? "−" : ""}${withSymbol(symbol, amount)}`;
}

/** Short form for chart axes and bar labels, e.g. "$200k", "Rp 1.5M". */
export function formatMoneyCompact(value: number, code: string | null | undefined) {
  const { symbol } = getCurrency(code);
  const amount = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(Math.abs(value));
  return `${value < 0 ? "−" : ""}${withSymbol(symbol, amount)}`;
}

/** A sensible starting currency from the browser language; the user can change it. */
export function guessCurrency(): CurrencyCode {
  const language = (typeof navigator !== "undefined" ? navigator.language : "").toLowerCase();
  if (language.startsWith("id")) return "IDR";
  if (language.startsWith("ja")) return "JPY";
  if (language.startsWith("zh")) return "CNY";
  if (language.endsWith("-sg")) return "SGD";
  if (/^(de|fr|es|it|nl|pt|fi|el|sk|sl|et|lv|lt)\b/.test(language) && !language.startsWith("pt-br")) return "EUR";
  return "USD";
}
