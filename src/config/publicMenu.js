function readEnv(name, fallback = "") {
  const fromVite = import.meta.env?.[name];
  const fromNode = typeof process !== "undefined" ? process.env?.[name] : "";
  const value = String(fromVite || fromNode || "").trim();
  return value || fallback;
}

export const PUBLIC_MENU_OPTIONS_SOURCE = readEnv(
  "VITE_PUBLIC_MENU_OPTIONS_SOURCE",
  "hybrid"
);
