import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");
    const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
    const isMonitoring = req.nextUrl.pathname.startsWith("/monitoring");

    if (isAuthPage) {
      if (isAuth) {
        if (token?.role === "koordinator") {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.redirect(new URL("/monitoring", req.url));
      }
      return null;
    }

    if (!isAuth) {
      if (isDashboard || isMonitoring) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    if (isDashboard && token?.role !== "koordinator") {
      return NextResponse.redirect(new URL("/monitoring", req.url));
    }

    return null;
  },
  {
    callbacks: {
      authorized: () => true, // Let the proxy function handle the logic
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/monitoring/:path*", "/login"],
};
