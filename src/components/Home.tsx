import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { QrCode, Scan } from "lucide-react"
import { Link } from "react-router-dom"

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Hero Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-30"
          style={{ filter: "brightness(1)" }}
        >
          <source src="/hero-animation.mp4" type="video/mp4" />
          {/* Fallback gradient if video fails to load */}
          <div className="w-full h-full bg-gradient-to-b from-black via-gray-900 to-black" />
        </video>
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-12">
          <header className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="logo"  width="70" height={40} />
              <span className="font-bold text-xl">ShadowPay</span>
            </div>
            <nav>
              <Button variant="ghost" asChild>
                <Link to="/about">About</Link>
              </Button>
            </nav>
          </header>

          <section className="mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">Private Crypto Payments</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8 drop-shadow-md">
              {/* Send and receive crypto payments using QR codes and be sure than nobody can see your balance.  */}
              Automatically process queues of people using a secure "kiosk mode" based on the private transactions of the INTMAX network.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <Link to="/create" className="group">
                <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:bg-gray-750/80 hover:border-purple-600 transition-all duration-300 h-full">
                  <CardContent className="p-8 flex flex-col items-center text-center">
                    <div className="bg-purple-900/30 p-4 rounded-full mb-4 group-hover:bg-purple-900/50 transition-colors">
                      <QrCode className="h-12 w-12 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Create Payment</h3>
                    <p className="text-gray-400">Generate a QR code for someone to scan and pay you</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/scan" className="group">
                <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:bg-gray-750/80 hover:border-purple-600 transition-all duration-300 h-full">
                  <CardContent className="p-8 flex flex-col items-center text-center">
                    <div className="bg-purple-900/30 p-4 rounded-full mb-4 group-hover:bg-purple-900/50 transition-colors">
                      <Scan className="h-12 w-12 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Scan Payment</h3>
                    <p className="text-gray-400">Scan a QR code to receive a payment</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>

          <footer className="text-center text-gray-400 py-8">
            <p>ShadowPay - Powered by INTMAX</p>
            <p className="text-sm mt-2">Private, Stateless, Near-Zero Fee Transactions</p>
          </footer>
        </div>
      </div>
    </main>
  )
}
