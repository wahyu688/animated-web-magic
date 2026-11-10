import { Link } from "react-router-dom";
import Logo from "@/components/brand/Logo";

// Items without `to` have no page yet; they render as plain text instead of dead links.
const columns: { title: string; items: { label: string; to?: string }[] }[] = [
  {
    title: "Product",
    items: [
      { label: "Features", to: "/#features" },
      { label: "Pricing", to: "/pricing" },
      { label: "Integrations" },
      { label: "Changelog" },
    ],
  },
  {
    title: "Company",
    items: [{ label: "About Us", to: "/about" }, { label: "Careers" }, { label: "Blog" }, { label: "Press" }],
  },
  {
    title: "Legal",
    items: [{ label: "Privacy Policy" }, { label: "Terms of Service" }, { label: "Cookie Policy" }],
  },
];

interface PublicFooterProps {
  /** "full" adds the brand blurb and link columns (Landing); "compact" is just the bottom row. */
  variant?: "full" | "compact";
}

export default function PublicFooter({ variant = "compact" }: PublicFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-[1200px] px-5 pb-8 pt-6 sm:px-6 md:pb-9 md:pt-16 xl:px-0">
        {variant === "full" && (
          <>
            <div className="hidden justify-between gap-12 md:flex">
              <div className="max-w-[340px] flex-1 space-y-4">
                <Logo size="lg" />
                <p className="text-small leading-[21px] text-muted-foreground">
                  The modern standard for operational intelligence. Built for teams that value speed, security, and growth.
                </p>
              </div>
              <div className="grid w-full max-w-[606px] grid-cols-3 gap-12">
                {columns.map((column) => (
                  <div key={column.title} className="space-y-3">
                    <p className="text-label text-foreground">{column.title}</p>
                    <ul className="space-y-3">
                      {column.items.map((item) => (
                        <li key={item.label} className="text-small text-muted-foreground">
                          {item.to ? (
                            <Link to={item.to} className="transition-colors hover:text-foreground">
                              {item.label}
                            </Link>
                          ) : (
                            item.label
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="my-12 hidden h-px bg-border md:block" />
          </>
        )}

        <div className="flex flex-col items-start gap-3.5 md:flex-row md:items-center md:justify-between">
          <div className="md:hidden">
            <Logo size="sm" />
          </div>
          <p className="text-caption font-normal text-muted-foreground md:text-small">© {year} NexusFlow Inc.</p>
        </div>
      </div>
    </footer>
  );
}
