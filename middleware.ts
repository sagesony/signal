import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Pass-through middleware — no auth required (single-user tool)
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}
