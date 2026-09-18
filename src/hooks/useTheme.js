import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

// "system" | "light" | "dark"
export function useTheme() {
  const [theme, setTheme] = useLocalStorage("asset-admin-theme", "system");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  function cycleTheme() {
    setTheme((current) => {
      if (current === "system") return "light";
      if (current === "light") return "dark";
      return "system";
    });
  }

  return { theme, cycleTheme };
}
