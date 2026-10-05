"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconActivity,
  IconBriefcase,
  IconChart,
  IconEdit,
  IconExternal,
  IconFileText,
  IconInbox,
  IconMail,
  IconMessageSquare,
  IconTarget,
  IconUserPlus,
  IconUsers,
} from "./icons";

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = React.useMemo(() => {
    const go = (id: string, label: string, href: string, icon: React.ReactNode): CommandItem => ({ id, label, icon, action: () => router.push(href), category: "Go to" });
    return [
      go("today", "Today", "/admin", <IconActivity size={16} />),
      go("leads", "Leads", "/admin/leads", <IconTarget size={16} />),
      go("outreach", "Outreach", "/admin/outreach", <IconMail size={16} />),
      go("replies", "Outreach replies", "/admin/outreach/replies", <IconMail size={16} />),
      go("chats", "Ask Craefto chats", "/admin/chats", <IconMessageSquare size={16} />),
      go("clients", "Clients", "/admin/members", <IconBriefcase size={16} />),
      go("applications", "Applications", "/admin/applications", <IconInbox size={16} />),
      go("journal", "Journal", "/admin/journal", <IconFileText size={16} />),
      go("subscribers", "Journal subscribers", "/admin/subscribers", <IconUsers size={16} />),
      go("analytics", "Analytics", "/admin/analytics", <IconChart size={16} />),
      { id: "new-client", label: "Add a client", icon: <IconUserPlus size={16} />, action: () => router.push("/admin/members?add=1"), category: "Do" },
      { id: "new-article", label: "Write a journal article", icon: <IconEdit size={16} />, action: () => router.push("/admin/journal/new"), category: "Do" },
      { id: "view-site", label: "Open the site", icon: <IconExternal size={16} />, action: () => window.open("/", "_blank"), category: "Do" },
      { id: "view-portal", label: "Open the client portal", icon: <IconExternal size={16} />, action: () => window.open("/portal", "_blank"), category: "Do" },
    ];
  }, [router]);

  const filteredCommands = React.useMemo(() => {
    if (!search) return commands;
    const searchLower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(searchLower) ||
        cmd.category.toLowerCase().includes(searchLower)
    );
  }, [commands, search]);

  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }

      // Close with Escape
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setSearch("");
        setSelectedIndex(0);
      }

      // Navigate with arrow keys
      if (isOpen && filteredCommands.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
        }
        if (e.key === "Enter") {
          e.preventDefault();
          filteredCommands[selectedIndex]?.action();
          setIsOpen(false);
          setSearch("");
          setSelectedIndex(0);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selection when search changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  return (
    <>
      {/* Trigger hint (optional, can be shown in sidebar) */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-2 w-full text-left text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background-muted))] rounded-xl transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="flex-1 text-sm">Quick actions</span>
        <kbd className="text-xs px-1.5 py-0.5 rounded bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-subtle))]">
          ⌘K
        </kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOpen(false);
                setSearch("");
                setSelectedIndex(0);
              }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />

            {/* Palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
            >
              <div className="bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] rounded-2xl shadow-2xl overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--color-border))]">
                  <svg className="w-5 h-5 text-[hsl(var(--color-foreground-subtle))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search commands..."
                    className="flex-1 bg-transparent text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-subtle))] focus:outline-none"
                  />
                  <kbd className="text-xs px-1.5 py-0.5 rounded bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-subtle))]">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {filteredCommands.length === 0 ? (
                    <div className="py-8 text-center text-[hsl(var(--color-foreground-subtle))]">
                      No commands found
                    </div>
                  ) : (
                    Object.entries(groupedCommands).map(([category, items]) => (
                      <div key={category}>
                        <div className="px-3 py-2 text-xs font-medium text-[hsl(var(--color-foreground-subtle))] uppercase tracking-wider">
                          {category}
                        </div>
                        {items.map((cmd) => {
                          const globalIndex = filteredCommands.findIndex(
                            (c) => c.id === cmd.id
                          );
                          const isSelected = globalIndex === selectedIndex;
                          return (
                            <button
                              key={cmd.id}
                              onClick={() => {
                                cmd.action();
                                setIsOpen(false);
                                setSearch("");
                                setSelectedIndex(0);
                              }}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                                isSelected
                                  ? "bg-[hsl(var(--color-accent))] text-[hsl(var(--color-accent-foreground))]"
                                  : "text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background-muted))]"
                              }`}
                            >
                              <span className={isSelected ? "text-[hsl(var(--color-accent-foreground))]" : "text-[hsl(var(--color-foreground-muted))]"}>
                                {cmd.icon}
                              </span>
                              <span className="flex-1 text-left">{cmd.label}</span>
                              {cmd.shortcut && (
                                <kbd className={`text-xs px-1.5 py-0.5 rounded ${
                                  isSelected
                                    ? "bg-white/20"
                                    : "bg-[hsl(var(--color-background-muted))] text-[hsl(var(--color-foreground-subtle))]"
                                }`}>
                                  {cmd.shortcut}
                                </kbd>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-background-muted))]">
                  <div className="flex items-center gap-4 text-xs text-[hsl(var(--color-foreground-subtle))]">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded bg-[hsl(var(--color-background))]">↑↓</kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded bg-[hsl(var(--color-background))]">↵</kbd>
                      Select
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
