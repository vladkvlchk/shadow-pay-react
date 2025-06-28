"use client"

import type React from "react"
import { useState, createContext, useContext } from "react"

type SimpleMockWallet = {
  address: string
  privateKey: string
  balances: {
    ETH: number
    USDC: number
  }
}

type SimpleMockWalletContextType = {
  wallet: SimpleMockWallet | null
  isConnected: boolean
  isCreating: boolean
  createWallet: () => Promise<void>
  sendPayment: (recipientAddress: string, amount: number, token: "ETH" | "USDC") => Promise<{ hash: string }>
  error: string | null
}

const SimpleMockWalletContext = createContext<SimpleMockWalletContextType>({
  wallet: null,
  isConnected: false,
  isCreating: false,
  createWallet: async () => {},
  sendPayment: async () => ({ hash: "" }),
  error: null,
})

// Helper functions
function generateMockAddress(): string {
  const chars = "0123456789abcdef"
  let address = "0x"
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)]
  }
  return address
}

function generateMockPrivateKey(): string {
  const chars = "0123456789abcdef"
  let privateKey = "0x"
  for (let i = 0; i < 64; i++) {
    privateKey += chars[Math.floor(Math.random() * chars.length)]
  }
  return privateKey
}

function generateMockTxHash(): string {
  const chars = "0123456789abcdef"
  let hash = "0x"
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)]
  }
  return hash
}

export function SimpleMockWalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<SimpleMockWallet | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createWallet = async () => {
    try {
      setIsCreating(true)
      setError(null)

      console.log("🔄 Creating mock wallet...")

      // Simulate wallet creation delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newWallet: SimpleMockWallet = {
        address: generateMockAddress(),
        privateKey: generateMockPrivateKey(),
        balances: {
          ETH: Math.random() * 5 + 1, // 1-6 ETH
          USDC: Math.random() * 1000 + 100, // 100-1100 USDC
        },
      }

      setWallet(newWallet)
      console.log("✅ Mock wallet created:", newWallet.address)
    } catch (err: any) {
      console.error("❌ Error creating wallet:", err)
      setError(err.message || "Failed to create wallet")
    } finally {
      setIsCreating(false)
    }
  }

  const sendPayment = async (recipientAddress: string, amount: number, token: "ETH" | "USDC") => {
    if (!wallet) {
      throw new Error("No wallet connected")
    }

    if (wallet.balances[token] < amount) {
      throw new Error(`Insufficient ${token} balance`)
    }

    try {
      console.log(`🔄 Sending ${amount} ${token} to ${recipientAddress}...`)

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update balance
      const updatedWallet = {
        ...wallet,
        balances: {
          ...wallet.balances,
          [token]: wallet.balances[token] - amount,
        },
      }
      setWallet(updatedWallet)

      const txHash = generateMockTxHash()
      console.log("✅ Payment sent, tx hash:", txHash)

      return { hash: txHash }
    } catch (err: any) {
      console.error("❌ Payment failed:", err)
      throw err
    }
  }

  return (
    <SimpleMockWalletContext.Provider
      value={{
        wallet,
        isConnected: !!wallet,
        isCreating,
        createWallet,
        sendPayment,
        error,
      }}
    >
      {children}
    </SimpleMockWalletContext.Provider>
  )
}

export function useSimpleMockWallet() {
  return useContext(SimpleMockWalletContext)
}
