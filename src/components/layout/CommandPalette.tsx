import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Calendar, Moon, SquareKanban, Sun, User } from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { navGroups, settingsNavItem } from "@/components/layout/navigation";
import { supabase } from "@/lib/supabase";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null;
}

interface SearchResults {
  tasks: { id: string; title: string; column_id: string }[];
  events: { id: string; title: string; date_str: string; time: string }[];
  people: { id: string; first_name: string | null; last_name: string | null; email: string | null }[];
}

const EMPTY_RESULTS: SearchResults = { tasks: [], events: [], people: [] };

/** Drops characters that have meaning in PostgREST `or()` filters or `ilike` patterns. */
function toPattern(query: string) {
  return `%${query.replace(/[%_,.()*\\"]/g, " ").trim()}%`;
}

export default function CommandPalette({ open, onOpenChange, companyId }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (!companyId || term.length < 2) {
      setResults(EMPTY_RESULTS);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const pattern = toPattern(term);
      const [tasks, events, people] = await Promise.all([
        supabase.from("kanban_tasks").select("id, title, column_id").eq("company_id", companyId).ilike("title", pattern).limit(5),
        supabase.from("calendar_events").select("id, title, date_str, time").eq("company_id", companyId).ilike("title", pattern).limit(5),
        supabase
          .from("user_profiles")
          .select("id, first_name, last_name, email")
          .eq("company_id", companyId)
          .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern}`)
          .limit(5),
      ]);

      if (cancelled) return;
      setResults({
        tasks: tasks.data ?? [],
        events: events.data ?? [],
        people: people.data ?? [],
      });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [companyId, query]);

  const run = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  const pages = [...navGroups.flatMap((group) => group.items), settingsNavItem];
  const hasResults = results.tasks.length + results.events.length + results.people.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search tasks, people, events…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results for “{query}”.</CommandEmpty>

        {hasResults && (
          <>
            {results.tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {results.tasks.map((task) => (
                  <CommandItem key={task.id} value={`task-${task.id}-${task.title}`} onSelect={() => run(() => navigate("/kanban"))}>
                    <SquareKanban strokeWidth={1.75} />
                    <span className="truncate">{task.title || "Untitled task"}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.people.length > 0 && (
              <CommandGroup heading="People">
                {results.people.map((person) => {
                  const name = [person.first_name, person.last_name].filter(Boolean).join(" ") || person.email || "Member";
                  return (
                    <CommandItem key={person.id} value={`person-${person.id}-${name}-${person.email ?? ""}`} onSelect={() => run(() => navigate("/team"))}>
                      <User strokeWidth={1.75} />
                      <span className="truncate">{name}</span>
                      {person.email && <span className="ml-auto truncate text-caption text-subtle">{person.email}</span>}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {results.events.length > 0 && (
              <CommandGroup heading="Events">
                {results.events.map((event) => (
                  <CommandItem key={event.id} value={`event-${event.id}-${event.title}`} onSelect={() => run(() => navigate("/calendar"))}>
                    <Calendar strokeWidth={1.75} />
                    <span className="truncate">{event.title}</span>
                    <span className="ml-auto text-caption text-subtle tabular">{event.date_str} · {event.time}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Go to">
          {pages.map((page) => (
            <CommandItem key={page.path} value={`page-${page.label}`} onSelect={() => run(() => navigate(page.path))}>
              <page.icon strokeWidth={1.75} />
              {page.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Preferences">
          <CommandItem value="toggle-theme" onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}>
            {resolvedTheme === "dark" ? <Sun strokeWidth={1.75} /> : <Moon strokeWidth={1.75} />}
            Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
