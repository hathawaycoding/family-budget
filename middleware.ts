import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/login", "/_next", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (publicPaths.some((publicPath) => path.startsWith(publicPath))) {
    return NextResponse.next();
  }
  if (path.startsWith("/api/uploads") || path.startsWith("/api/exports")) {
    const isLoggedIn = request.cookies.get("family-budget-session")?.value === "authenticated";
    return isLoggedIn ? NextResponse.next() : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isLoggedIn = request.cookies.get("family-budget-session")?.value === "authenticated";
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"]
};
