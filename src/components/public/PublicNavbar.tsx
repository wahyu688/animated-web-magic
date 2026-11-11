import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronRight, LogOut, Mail, Menu, X } from "lucide-react";
import Logo from "@/components/brand/Logo";
import InvitationPopoverBody from "@/components/invitations/InvitationPopover";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { clearCompanyCache } from "@/lib/company";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

function usePendingInviteCount(email: string | undefined, refreshKey: number) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!email) {
        setCount(0);
        return;
      }
      const { count: total, error } = await supabase
        .from("invitations")
        .select("id", { count: "exact", head: true })
        .eq("email", email.toLowerCase().trim())
        .eq("status", "pending");

      if (!isMounted) return;
      if (error) {
        console.error("Load pending invites error:", error);
        setCount(0);
        return;
      }
      setCount(total ?? 0);
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [email, refreshKey]);

  return count;
}

export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshAuth } = useAuth();
  const { companyId } = useCompany();

  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteOpenKey, setInviteOpenKey] = useState(0);
  const [inviteRefreshKey, setInviteRefreshKey] = useState(0);
  const pendingInvites = usePendingInviteCount(user?.email, inviteRefreshKey);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearCompanyCache();
      await refreshAuth();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const inviteLabel = `${pendingInvites} invite${pendingInvites === 1 ? "" : "s"}`;

  const authActions = user ? (
    <>
      {companyId && (
        <Button asChild variant="ghost">
          <Link to="/dashboard">
            Dashboard <ArrowRight />
          </Link>
        </Button>
      )}
      {pendingInvites > 0 && (
        <Popover
          open={inviteOpen}
          onOpenChange={(open) => {
            setInviteOpen(open);
            if (open) setInviteOpenKey((key) => key + 1);
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-warning/30 bg-warning-soft px-3 text-label text-warning transition-colors hover:border-warning/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Mail className="h-4 w-4" strokeWidth={1.75} />
              {inviteLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={12} className="w-[min(400px,calc(100vw-32px))] p-4">
            <InvitationPopoverBody
              openKey={inviteOpenKey}
              onClose={() => setInviteOpen(false)}
              onResolved={() => setInviteRefreshKey((key) => key + 1)}
            />
          </PopoverContent>
        </Popover>
      )}
      <Button variant="secondary" onClick={handleLogout}>
        <LogOut strokeWidth={1.75} /> Log out
      </Button>
    </>
  ) : (
    <>
      <Button asChild variant="ghost">
        <Link to="/login">Log in</Link>
      </Button>
      <Button asChild>
        <Link to="/login?mode=signup">
          Get Started <ArrowRight />
        </Link>
      </Button>
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4 sm:px-6 lg:h-[72px] xl:px-0">
          <Link to="/" aria-label="NexusFlow home" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Logo size="lg" />
          </Link>

          <nav aria-label="Main" className="hidden flex-1 justify-center md:flex">
            <ul className="flex items-center gap-1.5">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end
                    className={({ isActive }) =>
                      cn(
                        "block rounded-lg px-3.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive ? "bg-surface-2 font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">{authActions}</div>

          <div className="flex flex-1 justify-end md:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="public-mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {menuOpen ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 top-16 z-40 bg-[#0b1220]/40 md:hidden"
              aria-hidden="true"
            />
            <motion.div
              key="menu"
              id="public-mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-x-0 top-16 z-50 border-b border-border bg-card px-4 pb-5 pt-4 shadow-md md:hidden"
            >
              <ul>
                {links.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      end
                      className={({ isActive }) =>
                        cn(
                          "flex h-12 items-center justify-between rounded-[10px] px-3 text-[16px] transition-colors",
                          isActive ? "bg-surface-2 font-semibold text-foreground" : "text-foreground hover:bg-surface-2"
                        )
                      }
                    >
                      {link.label}
                      <ChevronRight className="h-[18px] w-[18px] text-subtle" strokeWidth={1.75} />
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className="my-3 h-px bg-border" />
              <div className="flex flex-col gap-2.5 [&>*]:w-full">
                {user ? (
                  <>
                    {companyId && (
                      <Button asChild size="lg">
                        <Link to="/dashboard">
                          Go to Dashboard <ArrowRight />
                        </Link>
                      </Button>
                    )}
                    {pendingInvites > 0 && (
                      <Button
                        variant="soft"
                        size="lg"
                        onClick={() => {
                          setMenuOpen(false);
                          setInviteOpenKey((key) => key + 1);
                          setInviteDialogOpen(true);
                        }}
                      >
                        <Mail strokeWidth={1.75} /> View {inviteLabel}
                      </Button>
                    )}
                    <Button variant="secondary" size="lg" onClick={handleLogout}>
                      <LogOut strokeWidth={1.75} /> Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg">
                      <Link to="/login?mode=signup">
                        Get Started <ArrowRight />
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg">
                      <Link to="/login">Log in</Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile: the navbar pill is hidden, so invitations open in a dialog instead of the popover. */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-[400px] p-4" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Workspace invitations</DialogTitle>
          <InvitationPopoverBody
            openKey={inviteOpenKey}
            onClose={() => setInviteDialogOpen(false)}
            onResolved={() => setInviteRefreshKey((key) => key + 1)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
