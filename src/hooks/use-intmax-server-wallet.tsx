"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"

type TokenBalance = {
  token: {
    symbol: string
    address: string
    decimals: number
  }
  amount: number
}

type IntMaxServerWalletContextType = {
  address: string | null
  privateKey: string | null
  isConnected: boolean
  isConnecting: boolean
  balances: TokenBalance[]
  createWallet: () => Promise<void>
  importWallet: (privateKey: string) => Promise<void>
  disconnect: () => Promise<void>
  refreshBalances: () => Promise<void>
  sendPayment: (recipientAddress: string, amount: number, tokenAddress?: string) => Promise<any>
  error: string | null
}

const IntMaxServerWalletContext = createContext<IntMaxServerWalletContextType>({
  address: null,
  privateKey: null,
  isConnected: false,
  isConnecting: false,
  balances: [],
  createWallet: async () => {},
  importWallet: async () => {},
  disconnect: async () => {},
  refreshBalances: async () => {},
  sendPayment: async () => {},
  error: null,
})

export function IntMaxServerWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [privateKey, setPrivateKey] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [error, setError] = useState<string | null>(null)

  // Load wallet from localStorage on mount
  useEffect(() => {
    const savedPrivateKey = localStorage.getItem("intmax_private_key")
    const savedAddress = localStorage.getItem("intmax_address")

    if (savedPrivateKey && savedAddress) {
      setPrivateKey(savedPrivateKey)
      setAddress(savedAddress)
      setIsConnected(true)
      refreshBalances()
    }
  }, [])

  const createWallet = async () => {
    try {
      setIsConnecting(true)
      setError(null)

      const response = await fetch("/api/wallet/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      const { address: newAddress, privateKey: newPrivateKey } = result.data

      setAddress(newAddress)
      setPrivateKey(newPrivateKey)
      setIsConnected(true)

      // Save to localStorage
      localStorage.setItem("intmax_private_key", newPrivateKey)
      localStorage.setItem("intmax_address", newAddress)

      await refreshBalances()
    } catch (err: any) {
      console.error("Create wallet error:", err)
      setError(err.message || "Failed to create wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const importWallet = async (importPrivateKey: string) => {
    try {
      setIsConnecting(true)
      setError(null)

      const response = await fetch("/api/wallet/info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ privateKey: importPrivateKey }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      const { address: walletAddress } = result.data

      setAddress(walletAddress)
      setPrivateKey(importPrivateKey)
      setIsConnected(true)

      // Save to localStorage
      localStorage.setItem("intmax_private_key", importPrivateKey)
      localStorage.setItem("intmax_address", walletAddress)

      await refreshBalances()
    } catch (err: any) {
      console.error("Import wallet error:", err)
      setError(err.message || "Failed to import wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = async () => {
    try {
      setAddress(null)
      setPrivateKey(null)
      setIsConnected(false)
      setBalances([])
      setError(null)

      // Clear localStorage
      localStorage.removeItem("intmax_private_key")
      localStorage.removeItem("intmax_address")
    } catch (err: any) {
      console.error("Disconnect error:", err)
      setError(err.message || "Failed to disconnect")
    }
  }

  const refreshBalances = async () => {
    if (!privateKey) return

    try {
      const response = await fetch("/api/wallet/balances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ privateKey }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setBalances(result.data || [])
    } catch (err: any) {
      console.error("Error fetching balances:", err)
      setError(err.message || "Failed to fetch balances")
    }
  }

  const sendPayment = async (recipientAddress: string, amount: number, tokenAddress?: string) => {
    if (!privateKey) {
      throw new Error("Wallet not connected")
    }

    try {
      setError(null)

      const response = await fetch("/api/wallet/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          privateKey,
          recipientAddress,
          amount,
          tokenAddress,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      await refreshBalances() // Refresh balances after payment
      return result.data
    } catch (err: any) {
      console.error("Payment error:", err)
      setError(err.message || "Payment failed")
      throw err
    }
  }

  return (
    <IntMaxServerWalletContext.Provider
      value={{
        address,
        privateKey,
        isConnected,
        isConnecting,
        balances,
        createWallet,
        importWallet,
        disconnect,
        refreshBalances,
        sendPayment,
        error,
      }}
    >
      {children}
    </IntMaxServerWalletContext.Provider>
  )
}

export function useIntMaxServerWallet() {
  return useContext(IntMaxServerWalletContext)
}
