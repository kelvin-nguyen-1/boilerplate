import Link from "next/link"

import { Button } from "@/components/ui/button"

export function MainNav() {
  return (
    <nav className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center space-x-4">
        <Link href="/" className="text-lg font-bold">
          My App
        </Link>
        {/* <div className="hidden md:flex space-x-2">
          <Button variant="ghost" asChild>
            <Link href="#">Home</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="#">Dashboard</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="#">Settings</Link>
          </Button>
        </div> */}
      </div>
      {/* <div className="flex items-center space-x-2">
        <Button variant="outline" asChild>
          <Link href="#">Sign In</Link>
        </Button>
        <Button asChild>
          <Link href="#">Sign Up</Link>
        </Button>
      </div> */}
    </nav>
  )
}
