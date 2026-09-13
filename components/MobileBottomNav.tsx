"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Sparkles, Cpu, UserCheck } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/check", label: "Check PC", icon: CheckSquare },
    { href: "/recommend", label: "Find PC", icon: Cpu },
    { href: "/ai", label: "Local AI", icon: Sparkles },
    { href: "/software", label: "Catalog", icon: UserCheck },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-card/95 backdrop-blur-md border-t border-border-subtle px-2 py-1 shadow-lg"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all touch-target ${
                isActive
                  ? "text-brand-primary font-bold"
                  : "text-content-muted hover:text-content-body"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-brand-primary" : "text-content-muted"}`} />
              <span className="text-[9px] tracking-tight mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
