import { NextResponse, type NextRequest } from "next/server";
import { parseHost } from "./lib/hosts";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const info = parseHost(req.headers.get("host") ?? undefined);

  const res = NextResponse.next();
  if (info) {
    res.headers.set("x-tenant-host", info.host);
    if (info.slug) res.headers.set("x-tenant-slug", info.slug);
    res.headers.set("x-surface", info.surface);
  }

  // Fallback de DEV por path:
  // /s/[slug]/* => surface public con slug de la URL
  // /a/[slug]/* => surface admin  con slug de la URL
  const allowPath = process.env.NEXT_PUBLIC_ALLOW_PATH_TENANT === "true";
  if (allowPath) {
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments[0] === "s" && segments[1]) {
      res.headers.set("x-tenant-slug", segments[1]);
      res.headers.set("x-surface", "public");
    }
    if (segments[0] === "a" && segments[1]) {
      res.headers.set("x-tenant-slug", segments[1]);
      res.headers.set("x-surface", "admin");
    }
  }

  return res;
}

export const config = {
  matcher: [
    // evita assets/api estáticos
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
