import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronRight, Copy, ThumbsUp, ThumbsDown, ArrowRight, BookOpen, Code, Layers, HelpCircle, Menu } from "lucide-react";

const sidebarNav = [
  {
    title: "Getting Started",
    items: [
      { label: "Introduction", active: false },
      { label: "Quickstart", active: true },
      { label: "Installation", active: false },
    ],
  },
  {
    title: "Core Concepts",
    items: [
      { label: "Workspaces", active: false },
      { label: "Projects", active: false },
      { label: "Permissions", active: false },
    ],
  },
  {
    title: "Integrations",
    items: [
      { label: "Slack", active: false },
      { label: "GitHub", active: false },
      { label: "Segment", active: false },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "API Reference", active: false },
      { label: "Changelog", active: false },
      { label: "Community", active: false },
    ],
  },
];

const tocItems = [
  { id: "environment", label: "Environment Setup", active: true },
  { id: "initialization", label: "Initialize SDK", active: false },
  { id: "next-steps", label: "Next Steps", active: false },
];

export default function DocsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-card overflow-y-auto hidden lg:block p-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search docs..."
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-muted rounded-xl border-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground text-foreground transition-all"
          />
        </div>

        {/* Nav Sections */}
        <div className="space-y-6">
          {sidebarNav.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{section.title}</h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href="#"
                      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors ${
                        item.active
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 px-6 py-10 lg:px-16 overflow-y-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <a href="#" className="hover:text-primary transition-colors">Guides</a>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Quickstart</span>
        </nav>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <header className="mb-10">
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-4">Quickstart Guide</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Updated Oct 24, 2023</span>
              <span>·</span>
              <span>5 min read</span>
            </div>
          </header>

          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <p className="text-lg font-light">
              Welcome to the NexusFlow quickstart guide. This tutorial will walk you through the essential steps to get your first project up and running in less than five minutes.
            </p>

            {/* Section 1 */}
            <h2 id="environment" className="text-2xl font-bold text-foreground border-b border-border pb-2 mt-12 mb-4 scroll-mt-24">
              Setup your environment
            </h2>
            <p>
              Before you begin, ensure you have your API credentials from the{" "}
              <a href="#" className="text-primary font-medium hover:underline">Settings dashboard</a>.
              You'll need an environment variable set up for authentication.
            </p>

            {/* Code Block 1 */}
            <div className="rounded-xl overflow-hidden my-6 border border-border">
              <div className="flex items-center justify-between px-4 py-2 bg-foreground/5 border-b border-border">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Terminal</span>
                <button
                  onClick={() => handleCopy("npm install @nexusflow/sdk\nexport NEXUS_API_KEY=your_api_key_here", "code1")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  {copied === "code1" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="p-5 bg-foreground text-primary-foreground font-mono text-sm leading-relaxed overflow-x-auto">
                <code className="text-blue-300">npm install</code> <code className="text-green-300">@nexusflow/sdk</code>
                <br />
                <code className="text-blue-300">export</code> <code className="text-primary-foreground/80">NEXUS_API_KEY=your_api_key_here</code>
              </div>
            </div>

            {/* Section 2 */}
            <h2 id="initialization" className="text-2xl font-bold text-foreground border-b border-border pb-2 mt-12 mb-4 scroll-mt-24">
              Initialize the SDK
            </h2>
            <p>
              Once the SDK is installed, you can initialize the client in your application. We recommend using a singleton pattern for the client instance.
            </p>

            {/* Code Block 2 */}
            <div className="rounded-xl overflow-hidden my-6 border border-border">
              <div className="flex items-center justify-between px-4 py-2 bg-foreground/5 border-b border-border">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">main.js</span>
                <button
                  onClick={() => handleCopy("import { Client } from '@nexusflow/sdk';\n\nconst sdk = new Client({\n  apiKey: process.env.NEXUS_API_KEY,\n  region: 'us-east-1'\n});\n\nawait sdk.init();", "code2")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  {copied === "code2" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="p-5 bg-foreground text-primary-foreground font-mono text-sm leading-relaxed overflow-x-auto">
                <span className="text-pink-400">import</span> {"{ Client }"} <span className="text-pink-400">from</span> <span className="text-green-300">'@nexusflow/sdk'</span>;
                <br /><br />
                <span className="text-pink-400">const</span> sdk = <span className="text-pink-400">new</span> <span className="text-yellow-200">Client</span>({"{"}
                <br />
                {"  "}apiKey: process.env.NEXUS_API_KEY,
                <br />
                {"  "}region: <span className="text-green-300">'us-east-1'</span>
                <br />
                {"}"});
                <br /><br />
                <span className="text-primary-foreground/50">{"// Start fetching data"}</span>
                <br />
                <span className="text-pink-400">await</span> sdk.init();
              </div>
            </div>

            {/* Section 3 */}
            <h2 id="next-steps" className="text-2xl font-bold text-foreground border-b border-border pb-2 mt-12 mb-4 scroll-mt-24">
              Next Steps
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {[
                { icon: Layers, title: "Core Concepts", desc: "Learn about workspaces, projects, and permissions." },
                { icon: Code, title: "Full API Reference", desc: "Explore every available endpoint and parameter." },
              ].map((card) => (
                <a key={card.title} href="#" className="group p-5 border border-border rounded-xl hover:border-primary/30 hover:bg-muted/50 transition-all">
                  <card.icon className="h-6 w-6 text-primary mb-3" />
                  <h4 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{card.title}</h4>
                  <p className="text-sm text-muted-foreground">{card.desc}</p>
                </a>
              ))}
            </div>

            {/* Feedback */}
            <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground font-medium">Was this page helpful?</p>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors text-foreground">
                  <ThumbsUp className="h-4 w-4" /> Yes
                </button>
                <button className="flex items-center gap-2 px-4 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors text-foreground">
                  <ThumbsDown className="h-4 w-4" /> No
                </button>
              </div>
            </div>
          </div>
        </motion.article>
      </main>

      {/* Table of Contents */}
      <aside className="w-64 shrink-0 overflow-y-auto hidden xl:block p-10">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-6">On this page</h4>
        <nav className="space-y-3">
          {tocItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`block text-sm pl-4 border-l-2 transition-colors ${
                item.active
                  ? "text-primary font-medium border-primary"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-8 bg-primary/5 rounded-xl p-4 border border-primary/10">
          <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Need help?</h5>
          <p className="text-[13px] text-muted-foreground leading-normal mb-3">
            Our support team is available 24/7 for Enterprise customers.
          </p>
          <a href="#" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
            Contact Support <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </aside>
    </div>
  );
}
