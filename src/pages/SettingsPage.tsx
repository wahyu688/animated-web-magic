import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Bell, CreditCard, Puzzle, Camera } from "lucide-react";

const tabs = [
  { icon: User, label: "General" },
  { icon: Lock, label: "Security" },
  { icon: Bell, label: "Notifications" },
  { icon: CreditCard, label: "Billing" },
  { icon: Puzzle, label: "Integrations" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("General");

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your account settings and preferences.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Nav */}
        <nav className="w-full lg:w-64 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.label
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 bg-card rounded-2xl shadow-card border border-border overflow-hidden w-full"
        >
          <div className="px-6 py-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Profile Details</h2>
            <p className="text-sm text-muted-foreground mt-1">Update your photo and personal details here.</p>
          </div>

          <div className="p-6 space-y-8">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative group cursor-pointer">
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl ring-4 ring-muted">
                  A
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                  <Camera className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Profile Photo</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-3">Accepts JPG, GIF or PNG. 1MB Max.</p>
                <div className="flex gap-3">
                  <button className="px-3 py-1.5 text-xs font-medium bg-card border border-border rounded-lg shadow-sm hover:bg-muted text-foreground transition-colors">
                    Upload New
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">First Name</label>
                <input
                  type="text"
                  defaultValue="Alex"
                  className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Name</label>
                <input
                  type="text"
                  defaultValue="Morgan"
                  className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  defaultValue="alex@nexus.com"
                  className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Bio
                  <span className="float-right text-[10px] normal-case font-normal">275 characters left</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us a little about yourself..."
                  className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors resize-none"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Timezone</label>
                <select className="block w-full rounded-xl border border-border bg-card text-foreground shadow-sm focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 transition-colors">
                  <option>Pacific Standard Time (PST)</option>
                  <option>Eastern Standard Time (EST)</option>
                  <option>Greenwich Mean Time (GMT)</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors">
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-xl shadow-primary-glow hover:opacity-90 transition-opacity"
              >
                Save Changes
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
