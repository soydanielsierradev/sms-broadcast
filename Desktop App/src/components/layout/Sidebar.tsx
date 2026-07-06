import {
  History,
  LayoutDashboard,
  List as ListIcon,
  Send,
  Settings,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { SignalIndicator } from "./SignalIndicator";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contactos", label: "Contactos", icon: Users },
  { to: "/listas", label: "Listas", icon: ListIcon },
  { to: "/campana/nueva", label: "Nueva campaña", icon: Send },
  { to: "/historial", label: "Historial", icon: History },
  { to: "/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="flex w-60 flex-col bg-panel border-r border-border">
      <div className="px-5 py-6">
        <div className="flex items-center gap-2">
          <span className="led led-active" aria-hidden />
          <span className="font-display text-sm font-semibold tracking-tight uppercase">
            SMS Broadcast
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isNewCampaign = item.to === "/campana/nueva";
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors group",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn("led", isActive && "led-active")}
                    aria-hidden
                  />
                  <Icon className="h-4 w-4 opacity-70" />
                  <span
                    className={cn(
                      "flex-1",
                      isNewCampaign && "font-medium",
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 pt-4 pb-4 space-y-3 border-t border-border">
        <SignalIndicator />
        <div className="flex justify-between items-center px-1">
          <span className="label-eq text-[0.625rem]">TEMA</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
