import { Assistant } from "./assistant";

// export default function Home() {
//   return <Assistant />;
// }

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Welcome</h1>
          <p className="mt-4 text-gray-500">Please login or register to continue</p>
        </div>
        <div className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}