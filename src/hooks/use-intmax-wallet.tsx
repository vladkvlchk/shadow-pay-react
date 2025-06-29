"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import { IntMaxClient as IntmaxClient } from "intmax2-client-sdk"
import type { INTMAXClient, Token, TokenBalance, Transaction, FetchWithdrawalsResponse } from "intmax2-client-sdk"

type IntMaxWalletContextType = {
  client: INTMAXClient | null
  tokens: Token[]
  balances: TokenBalance[]
  transactions: Transaction[]
  deposits: (Transaction | null)[]
  withdrawals: FetchWithdrawalsResponse
  isConnecting: boolean
  isProcessingPayment: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: () => Promise<void>
  getPrivateKey: () => Promise<void>
  refreshData: () => Promise<void>
  fetchTransactionHistory: () => Promise<void>
  clearError: () => void
}

const IntMaxWalletContext = createContext<IntMaxWalletContextType>({
  client: null,
  tokens: [],
  balances: [],
  transactions: [],
  deposits: [],
  withdrawals: {
    requested: [],
    relayed: [],
    success: [],
    need_claim: [],
    failed: []
  },
  isConnecting: false,
  isProcessingPayment: false,
  error: null,
  connect: async () => {},
  disconnect: async () => {},
  signMessage: async () => {},
  getPrivateKey: async () => {},
  refreshData: async () => {},
  fetchTransactionHistory: async () => {},
  clearError: () => {},
})

export function IntMaxWalletProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<INTMAXClient | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [deposits, setDeposits] = useState<(Transaction | null)[]>([])
  const [withdrawals, setWithdrawals] = useState<FetchWithdrawalsResponse>({
    requested: [],
    relayed: [],
    success: [],
    need_claim: [],
    failed: []
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize client on component mount
  useEffect(() => {
    const initClient = async () => {
      try {
        console.log("Initializing INTMAX client...")
        console.log("Browser supports WebAssembly:", typeof WebAssembly !== 'undefined')
        
        const initializedClient = await IntmaxClient.init({
          environment: "testnet", // Change to 'mainnet' for production
        })
        setClient(initializedClient)
      } catch (error) {
        console.error("Failed to initialize client:", error)
        setError(error instanceof Error ? error.message : "Failed to initialize client")
      }
    }

    initClient()
  }, [])

  // Fetch data when client is logged in
  useEffect(() => {
    if (client?.isLoggedIn) {
      fetchTokens()
      fetchBalances()
    }
  }, [client?.isLoggedIn])

  const connect = async () => {
    if (!client) return

    try {
      setIsConnecting(true)
      setError(null)

      await client.login()

      // Fetch initial data after login
      await Promise.all([fetchTokens(), fetchBalances()])

      setIsConnecting(false)
    } catch (error) {
      console.error("Login failed:", error)

      let errorMessage = "Login failed"

      if (error instanceof Error) {
        if (error.message.includes("User rejected the request")) {
          errorMessage = "Connection rejected. Please accept the wallet connection request."
        } else if (error.message.includes("wallet must has at least one account")) {
          errorMessage = "Your wallet needs at least one account. Please create an account in your wallet first."
        } else if (error.message.includes("No accounts found")) {
          errorMessage = "No wallet accounts found. Please unlock your wallet and ensure you have at least one account."
        } else {
          errorMessage = error.message
        }
      }

      setIsConnecting(false)
      setError(errorMessage)
    }
  }

  const disconnect = async () => {
    if (!client) return

    try {
      setIsConnecting(true)
      setError(null)

      await client.logout()

      setIsConnecting(false)
      setTokens([])
      setBalances([])
      setTransactions([])
      setDeposits([])
      setWithdrawals({
        requested: [],
        relayed: [],
        success: [],
        need_claim: [],
        failed: []
      })
    } catch (error) {
      console.error("Logout failed:", error)
      setIsConnecting(false)
      setError(error instanceof Error ? error.message : "Logout failed")
    }
  }

  const fetchTokens = async () => {
    if (!client) return

    try {
      const fetchedTokens = await client.getTokensList()
      setTokens(fetchedTokens)
    } catch (error) {
      console.error("Failed to fetch tokens:", error)
    }
  }

  const fetchBalances = async () => {
    if (!client) return

    try {
      const response = await client.fetchTokenBalances()
      setBalances(response.balances)
    } catch (error) {
      console.error("Failed to fetch balances:", error)
    }
  }

  const fetchTransactionHistory = async () => {
    if (!client) return

    try {
      setIsProcessingPayment(true)
      const [depositsData, transactionsData, withdrawalsData] = await Promise.all([
        client.fetchDeposits({}),
        client.fetchTransactions({}),
        client.fetchWithdrawals({
          pubkey: "",
          signature: ["", "", "", ""]
        }),
      ])

      setDeposits(depositsData)
      setTransactions(transactionsData)
      setWithdrawals(withdrawalsData)
    } catch (error) {
      console.error("Failed to fetch transaction history:", error)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const signMessage = async () => {
    if (!client) return

    try {
      setIsProcessingPayment(true)
      setError(null)

      const message = "Hello from INTMAX!"
      const signature = await client.signMessage(message)

      // Verify the signature
      const isValid = await client.verifySignature(signature, message)

      alert(`Message signed successfully!\nSignature: ${signature}\nValid: ${isValid}`)

      setIsProcessingPayment(false)
    } catch (error) {
      console.error("Message signing failed:", error)
      setIsProcessingPayment(false)
      setError(error instanceof Error ? error.message : "Message signing failed")
    }
  }

  const getPrivateKey = async () => {
    if (!client) return

    try {
      setIsProcessingPayment(true)
      setError(null)

      const privateKey = await client.getPrivateKey()

      if (privateKey) {
        // In a real app, handle private key securely
        alert(`Private Key: ${privateKey.substring(0, 10)}...`)
      } else {
        alert("No private key available")
      }

      setIsProcessingPayment(false)
    } catch (error) {
      console.error("Failed to get private key:", error)
      setIsProcessingPayment(false)
      setError(error instanceof Error ? error.message : "Failed to get private key")
    }
  }

  const refreshData = async () => {
    if (!client || !client.isLoggedIn) return

    setIsProcessingPayment(true)
    setError(null)

    try {
      await Promise.all([fetchTokens(), fetchBalances()])
    } catch (error) {
      console.error("Failed to refresh data:", error)
    }

    setIsProcessingPayment(false)
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <IntMaxWalletContext.Provider
      value={{
        client,
        tokens,
        balances,
        transactions,
        deposits,
        withdrawals,
        isConnecting,
        isProcessingPayment,
        error,
        connect,
        disconnect,
        signMessage,
        getPrivateKey,
        refreshData,
        fetchTransactionHistory,
        clearError,
      }}
    >
      {children}
    </IntMaxWalletContext.Provider>
  )
}

export function useIntMaxWallet() {
  return useContext(IntMaxWalletContext)
}
