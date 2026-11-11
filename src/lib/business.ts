import {
  Activity, BarChart3, Briefcase, Clock, DollarSign, Landmark, Percent, Receipt, Rocket, Store, Users, Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Trend } from "@/components/app/TrendBadge";
import { formatMoney } from "@/lib/currency";
import type { Tone } from "@/lib/tones";

/**
 * Business types drive which numbers the Financial form asks for and which KPIs
 * Dashboard/Analytics show. Everything type-specific lives in this file, so a new
 * type is one more entry in BUSINESS_TYPES.
 */
export type BusinessType = "agency" | "saas" | "general";

export const DEFAULT_BUSINESS_TYPE: BusinessType = "agency";
/** Workspaces created before business types existed used the SaaS form. */
export const LEGACY_BUSINESS_TYPE: BusinessType = "saas";

export type ReportValues = Record<string, number>;

/** Anything with a short month label and raw form values (FinancialReport fits). */
export interface ReportLike {
  label: string;
  raw: ReportValues;
}

export interface FieldDef {
  key: string;
  label: string;
  money?: boolean;
  wide?: boolean;
  hint?: string;
}

export interface SectionDef {
  title: string;
  icon: LucideIcon;
  tone: Tone;
  fields: FieldDef[];
}

export interface KpiCard {
  label: string;
  value: string;
  change: string;
  trend: Trend;
  icon: LucideIcon;
  tone: Tone;
  lowerIsBetter?: boolean;
  sparkline?: number[];
}

export interface SummaryTile {
  label: string;
  value: string;
  note: string;
}

export interface LiveTile {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}

type BarColor = "primary" | "info" | "violet";

export interface BusinessConfig {
  id: BusinessType;
  label: string;
  description: string;
  icon: LucideIcon;
  sections: SectionDef[];
  /** Added up into revenue; also the stacks in Analytics → Revenue by Type. */
  revenueStreams: { key: string; label: string; color: BarColor }[];
  /** Subtracted from revenue (refunds, discounts). */
  deductions: string[];
  expenses: { key: string; label: string; tone: Tone }[];
  /** Feeds Analytics → new vs lost chart. */
  customers: { title: string; noun: string; newKey: string; lostKey?: string };
  /** Two type-specific tiles in the Financial live summary. */
  liveTiles: (values: ReportValues, currency: string) => LiveTile[];
  /** Four Dashboard/Analytics KPI cards, from reports ordered oldest → newest. */
  kpis: (history: ReportLike[], currency: string) => KpiCard[];
  /** Four Analytics summary tiles for the latest month. */
  summary: (history: ReportLike[], currency: string) => SummaryTile[];
  /** Returns a message when the numbers can't be right. */
  validate?: (values: ReportValues) => string | null;
}

/* ── helpers ── */

const num = (values: ReportValues | undefined, key: string) => Number(values?.[key]) || 0;

export function reportTotals(config: BusinessConfig, values: ReportValues | undefined) {
  const revenue =
    config.revenueStreams.reduce((sum, stream) => sum + num(values, stream.key), 0) -
    config.deductions.reduce((sum, key) => sum + num(values, key), 0);
  const expenses = config.expenses.reduce((sum, row) => sum + num(values, row.key), 0);
  const netProfit = revenue - expenses;
  return { revenue, expenses, netProfit, margin: revenue > 0 ? (netProfit / revenue) * 100 : null };
}

const ratio = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : null);
const percent = (value: number | null, digits = 1) => (value === null ? "—" : `${value.toFixed(digits)}%`);
const count = (value: number) => Math.round(value).toLocaleString("en-US");

function signed(value: number, digits = 0, unit = "") {
  const formatted = Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatted}${unit}`;
}

/** % change of an amount vs the previous month. */
function amountChange(current: number, previous: number | undefined): Pick<KpiCard, "change" | "trend"> {
  if (previous === undefined) return { change: "New", trend: "stable" };
  if (previous === 0) return current === 0 ? { change: "0%", trend: "stable" } : { change: "New", trend: current > 0 ? "up" : "down" };
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return { change: signed(change, 1, "%"), trend: Math.abs(change) < 0.05 ? "stable" : change > 0 ? "up" : "down" };
}

/** Percentage-point change of a rate vs the previous month. */
function rateChange(current: number | null, previous: number | null | undefined): Pick<KpiCard, "change" | "trend"> {
  if (current === null || previous === null || previous === undefined) return { change: "New", trend: "stable" };
  const change = current - previous;
  return { change: signed(change, 1, " pt"), trend: Math.abs(change) < 0.05 ? "stable" : change > 0 ? "up" : "down" };
}

const spark = (history: ReportLike[], pick: (values: ReportValues) => number | null) =>
  history.length > 1 ? history.slice(-6).map((report) => pick(report.raw) ?? 0) : undefined;

function latestPair(history: ReportLike[]) {
  return { latest: history.at(-1), previous: history.at(-2) };
}

function revenueCard(config: BusinessConfig, history: ReportLike[], currency: string): KpiCard {
  const { latest, previous } = latestPair(history);
  const revenue = reportTotals(config, latest?.raw).revenue;
  return {
    label: "Total Revenue",
    value: formatMoney(revenue, currency),
    ...amountChange(revenue, previous ? reportTotals(config, previous.raw).revenue : undefined),
    icon: DollarSign,
    tone: "primary",
    sparkline: spark(history, (values) => reportTotals(config, values).revenue),
  };
}

const vsPrevious = (previous: ReportLike | undefined) => (previous ? ` vs ${previous.label}` : "");

function runway(cash: number, expenses: number) {
  if (expenses <= 0) return "—";
  const months = cash / expenses;
  return `${months.toFixed(1)} ${months === 1 ? "month" : "months"}`;
}

/* ── Digital agency ── */

const agencyUtilization = (values: ReportValues | undefined) => ratio(num(values, "billableHours"), num(values, "totalHours"));

/** Share of clients kept this month: clients at the start of the month minus the ones who left. */
function agencyRetention(values: ReportValues | undefined) {
  const start = num(values, "activeClients") - num(values, "newClients") + num(values, "lostClients");
  return start > 0 ? ((start - num(values, "lostClients")) / start) * 100 : null;
}

const agency: BusinessConfig = {
  id: "agency",
  label: "Digital Agency",
  description: "Retainers, projects, billable hours and clients.",
  icon: Briefcase,
  sections: [
    {
      title: "Revenue",
      icon: DollarSign,
      tone: "primary",
      fields: [
        { key: "retainerRevenue", label: "Retainer Revenue", money: true, hint: "Monthly fees from ongoing clients." },
        { key: "projectRevenue", label: "Project Revenue", money: true, hint: "One-off projects billed this month." },
        { key: "otherIncome", label: "Other Income", money: true },
        { key: "writeOffs", label: "Discounts / Write-offs", money: true },
      ],
    },
    {
      title: "Clients",
      icon: Users,
      tone: "success",
      fields: [
        { key: "newClients", label: "New Clients" },
        { key: "lostClients", label: "Lost Clients" },
        { key: "activeClients", label: "Active Clients", wide: true, hint: "Clients you worked for at the end of the month." },
      ],
    },
    {
      title: "Team & Time",
      icon: Clock,
      tone: "info",
      fields: [
        { key: "billableHours", label: "Billable Hours", hint: "Hours you can charge a client for." },
        { key: "totalHours", label: "Total Hours Worked", hint: "All hours the team logged, billable or not." },
        { key: "teamMembers", label: "Team Members", wide: true },
      ],
    },
    {
      title: "Expenses",
      icon: Receipt,
      tone: "warning",
      fields: [
        { key: "payroll", label: "Salaries & Freelancers", money: true },
        { key: "softwareTools", label: "Software & Tools", money: true },
        { key: "marketing", label: "Marketing & Sales", money: true },
        { key: "officeOperations", label: "Office & Operations", money: true },
      ],
    },
    {
      title: "Cash",
      icon: Wallet,
      tone: "violet",
      fields: [
        { key: "cashInBank", label: "Cash in Bank", money: true, hint: "Balance at the end of the month." },
        { key: "unpaidInvoices", label: "Unpaid Invoices", money: true, hint: "Invoices sent but not paid yet." },
      ],
    },
  ],
  revenueStreams: [
    { key: "retainerRevenue", label: "Retainers", color: "primary" },
    { key: "projectRevenue", label: "Projects", color: "info" },
    { key: "otherIncome", label: "Other", color: "violet" },
  ],
  deductions: ["writeOffs"],
  expenses: [
    { key: "payroll", label: "Salaries & freelancers", tone: "primary" },
    { key: "softwareTools", label: "Software & tools", tone: "info" },
    { key: "marketing", label: "Marketing & sales", tone: "violet" },
    { key: "officeOperations", label: "Office & operations", tone: "warning" },
  ],
  customers: { title: "Clients", noun: "clients", newKey: "newClients", lostKey: "lostClients" },
  liveTiles: (values) => {
    const net = num(values, "newClients") - num(values, "lostClients");
    return [
      { label: "Utilization Rate", value: percent(agencyUtilization(values)) },
      { label: "Net Clients", value: signed(net), tone: net > 0 ? "positive" : net < 0 ? "negative" : undefined },
    ];
  },
  kpis: (history, currency) => {
    const { latest, previous } = latestPair(history);
    const margin = (values?: ReportValues) => reportTotals(agency, values).margin;
    return [
      revenueCard(agency, history, currency),
      {
        label: "Net Margin", value: percent(margin(latest?.raw)), ...rateChange(margin(latest?.raw), previous && margin(previous.raw)),
        icon: Percent, tone: "success", sparkline: spark(history, margin),
      },
      {
        label: "Utilization Rate", value: percent(agencyUtilization(latest?.raw)),
        ...rateChange(agencyUtilization(latest?.raw), previous && agencyUtilization(previous.raw)),
        icon: Clock, tone: "warning", sparkline: spark(history, agencyUtilization),
      },
      {
        label: "Client Retention", value: percent(agencyRetention(latest?.raw)),
        ...rateChange(agencyRetention(latest?.raw), previous && agencyRetention(previous.raw)),
        icon: Users, tone: "info", sparkline: spark(history, agencyRetention),
      },
    ];
  },
  summary: (history, currency) => {
    const { latest } = latestPair(history);
    const totals = reportTotals(agency, latest?.raw);
    const unpaid = num(latest?.raw, "unpaidInvoices");
    const unpaidShare = ratio(unpaid, totals.revenue);
    return [
      { label: "Net Profit", value: formatMoney(totals.netProfit, currency), note: "Revenue minus expenses" },
      { label: "Retainer Share", value: percent(ratio(num(latest?.raw, "retainerRevenue"), totals.revenue)), note: "Revenue that repeats every month" },
      { label: "Cash Runway", value: runway(num(latest?.raw, "cashInBank"), totals.expenses), note: "How long your cash covers this month's costs" },
      { label: "Unpaid Invoices", value: formatMoney(unpaid, currency), note: unpaidShare === null ? "Waiting to be paid" : `${percent(unpaidShare, 0)} of this month's revenue` },
    ];
  },
  validate: (values) => {
    if (num(values, "billableHours") > num(values, "totalHours") && num(values, "totalHours") > 0) {
      return "Billable hours can't be more than total hours worked.";
    }
    if (num(values, "billableHours") > 0 && num(values, "totalHours") === 0) {
      return "Add total hours worked so the utilization rate can be calculated.";
    }
    return null;
  },
};

/* ── Startup / SaaS ── */

const saasChurn = (values: ReportValues | undefined) => ratio(num(values, "lostCustomers"), num(values, "activeCustomers"));
const saasUsers = (values: ReportValues | undefined) => num(values, "monthlyActiveUsers") || num(values, "activeCustomers");

const saas: BusinessConfig = {
  id: "saas",
  label: "Startup / SaaS",
  description: "Subscriptions, users, churn and product usage.",
  icon: Rocket,
  sections: [
    {
      title: "Revenue",
      icon: DollarSign,
      tone: "primary",
      fields: [
        { key: "subscriptionRevenue", label: "Subscription Revenue", money: true },
        { key: "enterpriseRevenue", label: "Enterprise Revenue", money: true },
        { key: "oneTimeRevenue", label: "One-Time Revenue", money: true },
        { key: "refunds", label: "Refunds / Discounts", money: true },
      ],
    },
    {
      title: "Customers",
      icon: Users,
      tone: "success",
      fields: [
        { key: "newCustomers", label: "New Customers" },
        { key: "lostCustomers", label: "Lost Customers" },
        { key: "activeCustomers", label: "Active Customers" },
        { key: "trialUsers", label: "Trial Users" },
      ],
    },
    {
      title: "Expenses",
      icon: Receipt,
      tone: "warning",
      fields: [
        { key: "payrollExpenses", label: "Payroll Expenses", money: true },
        { key: "marketingSpend", label: "Marketing Spend", money: true },
        { key: "infrastructureCost", label: "Infrastructure Cost", money: true },
        { key: "softwareLicenses", label: "Software Licenses", money: true },
        { key: "operationalExpenses", label: "Operational Expenses", money: true, wide: true },
      ],
    },
    {
      title: "Operations",
      icon: Activity,
      tone: "info",
      fields: [
        { key: "monthlyActiveUsers", label: "Monthly Active Users" },
        { key: "supportTickets", label: "Support Tickets" },
        { key: "avgSessionMinutes", label: "Avg. Session Duration (Minutes)", wide: true, hint: "Example: 6.5 = 6m 30s" },
      ],
    },
  ],
  revenueStreams: [
    { key: "subscriptionRevenue", label: "Subscription", color: "primary" },
    { key: "enterpriseRevenue", label: "Enterprise", color: "info" },
    { key: "oneTimeRevenue", label: "One-time", color: "violet" },
  ],
  deductions: ["refunds"],
  expenses: [
    { key: "payrollExpenses", label: "Payroll", tone: "primary" },
    { key: "marketingSpend", label: "Marketing", tone: "info" },
    { key: "infrastructureCost", label: "Infrastructure", tone: "violet" },
    { key: "operationalExpenses", label: "Operational", tone: "warning" },
    { key: "softwareLicenses", label: "Software licenses", tone: "success" },
  ],
  customers: { title: "Customers", noun: "customers", newKey: "newCustomers", lostKey: "lostCustomers" },
  liveTiles: (values) => {
    const net = num(values, "newCustomers") - num(values, "lostCustomers");
    return [
      { label: "Churn Rate", value: percent(saasChurn(values), 2) },
      { label: "Net Customers", value: signed(net), tone: net > 0 ? "positive" : net < 0 ? "negative" : undefined },
    ];
  },
  kpis: (history, currency) => {
    const { latest, previous } = latestPair(history);
    const net = num(latest?.raw, "newCustomers") - num(latest?.raw, "lostCustomers");
    const session = num(latest?.raw, "avgSessionMinutes");
    return [
      revenueCard(saas, history, currency),
      {
        label: "Active Users", value: count(saasUsers(latest?.raw)),
        change: latest ? `${signed(net)} net` : "New", trend: net > 0 ? "up" : net < 0 ? "down" : "stable",
        icon: Users, tone: "info", sparkline: spark(history, saasUsers),
      },
      {
        label: "Avg. Session", value: `${Math.floor(session)}m ${Math.round((session % 1) * 60)}s`,
        ...amountChange(session, previous && num(previous.raw, "avgSessionMinutes")),
        icon: Clock, tone: "warning", sparkline: spark(history, (values) => num(values, "avgSessionMinutes")),
      },
      {
        label: "Churn Rate", value: percent(saasChurn(latest?.raw), 2),
        ...rateChange(saasChurn(latest?.raw), previous && saasChurn(previous.raw)),
        icon: BarChart3, tone: "neutral", lowerIsBetter: true, sparkline: spark(history, saasChurn),
      },
    ];
  },
  summary: (history, currency) => {
    const { latest, previous } = latestPair(history);
    const totals = reportTotals(saas, latest?.raw);
    const previousMargin = previous ? reportTotals(saas, previous.raw).margin : null;
    const tickets = num(latest?.raw, "supportTickets");
    return [
      { label: "Net Profit", value: formatMoney(totals.netProfit, currency), note: "Revenue minus expenses" },
      {
        label: "Profit Margin", value: percent(totals.margin),
        note: totals.margin !== null && previousMargin !== null ? `${signed(totals.margin - previousMargin, 1)} pt${vsPrevious(previous)}` : "First report on record",
      },
      { label: "Active Customers", value: count(num(latest?.raw, "activeCustomers")), note: `${count(num(latest?.raw, "trialUsers"))} trial users` },
      {
        label: "Support Tickets", value: count(tickets),
        note: previous ? `${signed(tickets - num(previous.raw, "supportTickets"))}${vsPrevious(previous)}` : "First report on record",
      },
    ];
  },
  validate: (values) =>
    num(values, "activeCustomers") > 0 && num(values, "lostCustomers") > num(values, "activeCustomers")
      ? "Lost customers can't be more than active customers."
      : null,
};

/* ── General business ── */

function generalGrossMargin(values: ReportValues | undefined) {
  const revenue = reportTotals(general, values).revenue;
  return ratio(revenue - num(values, "costOfGoods"), revenue);
}

const general: BusinessConfig = {
  id: "general",
  label: "General Business",
  description: "Shops, services and anything else: sales, costs and cash.",
  icon: Store,
  sections: [
    {
      title: "Revenue",
      icon: DollarSign,
      tone: "primary",
      fields: [
        { key: "salesRevenue", label: "Sales Revenue", money: true, hint: "Everything you sold this month." },
        { key: "otherIncome", label: "Other Income", money: true },
        { key: "returns", label: "Returns / Discounts", money: true, wide: true },
      ],
    },
    {
      title: "Customers",
      icon: Users,
      tone: "success",
      fields: [
        { key: "customersServed", label: "Customers Served", hint: "Everyone who bought something this month." },
        { key: "newCustomers", label: "New Customers", hint: "First-time buyers." },
      ],
    },
    {
      title: "Expenses",
      icon: Receipt,
      tone: "warning",
      fields: [
        { key: "costOfGoods", label: "Cost of Goods Sold", money: true, hint: "What you paid for the goods or materials you sold." },
        { key: "payroll", label: "Payroll", money: true },
        { key: "rentUtilities", label: "Rent & Utilities", money: true },
        { key: "marketing", label: "Marketing", money: true },
        { key: "otherExpenses", label: "Other Expenses", money: true, wide: true },
      ],
    },
    {
      title: "Cash",
      icon: Landmark,
      tone: "violet",
      fields: [{ key: "cashInBank", label: "Cash in Bank", money: true, wide: true, hint: "Balance at the end of the month." }],
    },
  ],
  revenueStreams: [
    { key: "salesRevenue", label: "Sales", color: "primary" },
    { key: "otherIncome", label: "Other", color: "info" },
  ],
  deductions: ["returns"],
  expenses: [
    { key: "costOfGoods", label: "Cost of goods", tone: "primary" },
    { key: "payroll", label: "Payroll", tone: "info" },
    { key: "rentUtilities", label: "Rent & utilities", tone: "violet" },
    { key: "marketing", label: "Marketing", tone: "warning" },
    { key: "otherExpenses", label: "Other", tone: "success" },
  ],
  customers: { title: "Customers", noun: "customers", newKey: "newCustomers" },
  liveTiles: (values) => [
    { label: "Gross Margin", value: percent(generalGrossMargin(values)) },
    { label: "Customers Served", value: count(num(values, "customersServed")) },
  ],
  kpis: (history, currency) => {
    const { latest, previous } = latestPair(history);
    const profit = (values?: ReportValues) => reportTotals(general, values).netProfit;
    return [
      revenueCard(general, history, currency),
      {
        label: "Net Profit", value: formatMoney(profit(latest?.raw), currency),
        ...amountChange(profit(latest?.raw), previous && profit(previous.raw)),
        icon: Wallet, tone: "success", sparkline: spark(history, profit),
      },
      {
        label: "Gross Margin", value: percent(generalGrossMargin(latest?.raw)),
        ...rateChange(generalGrossMargin(latest?.raw), previous && generalGrossMargin(previous.raw)),
        icon: Percent, tone: "warning", sparkline: spark(history, generalGrossMargin),
      },
      {
        label: "Customers Served", value: count(num(latest?.raw, "customersServed")),
        ...amountChange(num(latest?.raw, "customersServed"), previous && num(previous.raw, "customersServed")),
        icon: Users, tone: "info", sparkline: spark(history, (values) => num(values, "customersServed")),
      },
    ];
  },
  summary: (history, currency) => {
    const { latest } = latestPair(history);
    const totals = reportTotals(general, latest?.raw);
    const served = num(latest?.raw, "customersServed");
    return [
      { label: "Net Margin", value: percent(totals.margin), note: "Profit kept from every sale" },
      { label: "Avg. Sale per Customer", value: served > 0 ? formatMoney(totals.revenue / served, currency) : "—", note: "Revenue ÷ customers served" },
      { label: "Cash Runway", value: runway(num(latest?.raw, "cashInBank"), totals.expenses), note: "How long your cash covers this month's costs" },
      { label: "Total Expenses", value: formatMoney(totals.expenses, currency), note: "Including cost of goods" },
    ];
  },
};

export const BUSINESS_TYPES: BusinessConfig[] = [agency, saas, general];

export function getBusinessConfig(type: string | null | undefined): BusinessConfig {
  return BUSINESS_TYPES.find((config) => config.id === type) ?? saas;
}

export function isBusinessType(value: unknown): value is BusinessType {
  return BUSINESS_TYPES.some((config) => config.id === value);
}

export function formFieldKeys(config: BusinessConfig) {
  return config.sections.flatMap((section) => section.fields.map((field) => field.key));
}
