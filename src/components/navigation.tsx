import { useLocation } from "react-router-dom"
import { QrCode, Scan } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function Navigation() {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <header className="border-b border-gray-800 bg-black">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="logo" width="70" height={40} />
            <span className="font-bold text-xl">ShadowPay</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn("text-gray-400 hover:text-black", pathname === "/create" && "text-purple-400 bg-gray-900")}
            >
              <Link to="/create" className="flex items-center gap-1">
                <QrCode className="h-4 w-4" />
                <span>Create</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn("text-gray-400 hover:text-black", pathname === "/scan" && "text-purple-400 bg-gray-900")}
            >
              <Link to="/scan" className="flex items-center gap-1">
                <Scan className="h-4 w-4" />
                <span>Scan</span>
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
