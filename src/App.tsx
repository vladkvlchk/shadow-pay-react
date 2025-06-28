"use client"

import { Routes, Route } from "react-router-dom"
import Home from "./components/Home"
import { WalletDashboard } from "./components/WalletDashboard"
import "./App.css"
import About from "./pages/about/page"
import CreatePayment from "./pages/create/page"
import PaymentPage from "./pages/pay/[slug]/page"
import ScanPayment from "./pages/scan/page"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />}/>
      <Route path="/create" element={<CreatePayment />}/>
      <Route path="/pay/:slug" element={<PaymentPage />} />
      <Route path="/scan" element={<ScanPayment />} />
      <Route path="/dashboard" element={<WalletDashboard />} />
    </Routes>
  )
}

export default App
