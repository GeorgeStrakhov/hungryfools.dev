import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Define protected route patterns
  const protectedRoutes = [
    "/onboarding",
    "/profile/edit", // Only profile editing requires auth, not viewing
    "/settings",
    "/admin",
    "/post-auth", // Auth routing helper
  ];

  // Check if current path needs protection
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Redirect unauthenticated users to landing page
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/", req.nextUrl.origin);
    return Response.redirect(loginUrl);
  }

  // Allow authenticated access or unprotected routes
  return;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|video|android-chrome|apple-touch|site.webmanifest).*)",
  ],
};
