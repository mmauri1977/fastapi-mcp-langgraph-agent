import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Check if the path is the chatbot page
  if (request.nextUrl.pathname.startsWith("/chatbot")) {
    // This is a simple check - in a real app, you'd verify the token
    // Since we can't access localStorage in middleware, we'd use a cookie instead
    // For this example, we'll just redirect if there's no auth cookie

    // In a real implementation, you would:
    // 1. Set a cookie when storing the token in localStorage
    // 2. Check that cookie here

    // For now, we'll just let the client-side check handle authentication
    return NextResponse.next()
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/chatbot/:path*"],
}
