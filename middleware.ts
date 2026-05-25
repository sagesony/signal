export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/((?!api/auth|api/register|api/ads/import|login|register|_next/static|_next/image|favicon.ico).*)",
  ],
}
