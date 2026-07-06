import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className="flex items-center gap-2 text-xs label-eq hover:text-foreground transition-colors"
    >
      {isDark ? (
        <>
          <Sun className="h-3.5 w-3.5" />
          Claro
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5" />
          Oscuro
        </>
      )}
    </button>
  );
}
