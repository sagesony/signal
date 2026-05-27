import { withAuth } from "next-auth/middleware"

// Protect all dashboard routes — redirect to /login if not authenticated
export default withAuth({ pages: { signIn: "/login" } })

export const config = {
  matcher: [
    "/ads/:path*",
    "/competitors/:path*",
    "/saved/:path*",
    "/settings/:path*",
    "/dashboard/:path*",
    "/insights/:path*",
  ],
}
