import { AlertIcon, InboxIcon } from "./icons.jsx";

export function StatePanel({ icon = "inbox", title, children, action }) {
  const Icon = icon === "alert" ? AlertIcon : InboxIcon;
  return (
    <div className="state-panel">
      <Icon className="state-icon" />
      <h2>{title}</h2>
      {children}
      {action}
    </div>
  );
}
