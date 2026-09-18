import { useTheme } from "../hooks/useTheme";
import { AutoThemeIcon, MoonIcon, SunIcon } from "./icons.jsx";

const ICONS = { system: AutoThemeIcon, light: SunIcon, dark: MoonIcon };
const LABELS = { system: "System theme", light: "Light theme", dark: "Dark theme" };

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const Icon = ICONS[theme];

  return (
    <button
      type="button"
      className="btn btn-icon btn-ghost"
      onClick={cycleTheme}
      title={`${LABELS[theme]} — click to change`}
      aria-label={LABELS[theme]}
    >
      <Icon width={17} height={17} />
    </button>
  );
}
