export function applyCompanyTheme(theme: {
  primaryColor?: string;
  accentColor?: string;
  name?: string;
}) {
  if (!theme) return;
  if (theme.primaryColor)
    document.documentElement.style.setProperty("--primary", theme.primaryColor);
  if (theme.accentColor)
    document.documentElement.style.setProperty("--accent", theme.accentColor);
  if (theme.name)
    document.documentElement.setAttribute("data-theme", theme.name);
}
