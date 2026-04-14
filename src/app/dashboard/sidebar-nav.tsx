"use client";

import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { DashboardNavLink } from "./nav-link";

const navItems: {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/listings", label: "My Listings", icon: ClipboardList },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/ai-suggestions", label: "AI Suggestions", icon: Sparkles },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebarNav() {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <DashboardNavLink
          key={item.href}
          href={item.href}
          exact={item.exact}
          icon={item.icon}
          label={item.label}
        />
      ))}
    </nav>
  );
}
