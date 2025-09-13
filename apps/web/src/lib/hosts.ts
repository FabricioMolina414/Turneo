export type Surface = "public" | "admin";
export type HostInfo =
  | { surface: Surface; slug?: string; host: string }
  | { surface: Surface; slug?: string; host: string };

const BASE = process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN ?? "turneo.com";
const ADMIN_SUB = process.env.NEXT_PUBLIC_ADMIN_SUBDOMAIN ?? "admin";

export function parseHost(hostHeader?: string): HostInfo | null {
  if (!hostHeader) return null;
  const host = hostHeader.toLowerCase();

  // dev/local (localhost) -> no hay subdominio real
  if (host.includes("localhost") || host.startsWith("127.0.0.1")) {
    return { surface: "public", host }; // lo refinamos por path en server
  }

  // admin.{slug}.BASE
  const adminPrefix = `.${BASE}`;
  if (host.endsWith(adminPrefix) && host.split(".")[0] === ADMIN_SUB) {
    // host formato "admin.{slug}.BASE" -> extrae slug
    const parts = host.split(".");
    const slug = parts.length >= 3 ? parts[1] : undefined;
    return { surface: "admin", slug, host };
  }

  // {slug}.BASE  (público)
  if (host.endsWith(`.${BASE}`)) {
    const slug = host.replace(`.${BASE}`, "");
    return { surface: "public", slug, host };
  }

  // dominio custom (puede ser público o admin) -> lo decide la DB
  return { surface: "public", host }; // lo refinamos consultando DB por dominio exacto
}
