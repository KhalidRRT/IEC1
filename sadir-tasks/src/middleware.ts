import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // حماية صفحات معينة حسب الصلاحية
    if (pathname.startsWith("/users") && !["SYSTEM_ADMIN", "PROJECT_MANAGER", "SUPERVISOR"].includes(token?.role as string)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/templates") && token?.role !== "SYSTEM_ADMIN" && token?.role !== "PROJECT_MANAGER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/reports") && !["SYSTEM_ADMIN", "PROJECT_MANAGER"].includes(token?.role as string)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/my-tasks/:path*",
    "/users/:path*",
    "/templates/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/api/projects/:path*",
    "/api/tasks/:path*",
    "/api/users/:path*",
    "/api/custom-fields/:path*",
    "/api/comments/:path*",
    "/api/attachments/:path*",
    "/api/reports/:path*",
    "/api/templates/:path*",
  ],
};
