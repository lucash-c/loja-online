function readEnv(name) {
  const fromVite = import.meta.env?.[name];
  const fromNode = typeof process !== "undefined" ? process.env?.[name] : "";
  return String(fromVite || fromNode || "").trim();
}

function getRequiredEnv(name) {
  const value = readEnv(name);

  if (!value) {
    throw new Error(
      `Variável de ambiente obrigatória não configurada: ${name}`
    );
  }

  return value.replace(/\/$/, "");
}

export const API_URLS = {
  backend: getRequiredEnv("VITE_BACKEND_API_URL"),
  payment: getRequiredEnv("VITE_PAYMENT_API_URL"),
  imageHost: getRequiredEnv("VITE_IMAGE_HOST_API_URL"),
  distance: getRequiredEnv("VITE_DISTANCE_API_URL"),
};
