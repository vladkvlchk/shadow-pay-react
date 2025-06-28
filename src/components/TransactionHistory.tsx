"use client"

import { useState } from "react"
import type { INTMAXClient, Transaction } from "intmax2-client-sdk"

interface TransactionHistoryProps {
  client: INTMAXClient
}

export function TransactionHistory({ client }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [deposits, setDeposits] = useState<(Transaction | null)[]>([])
  const [withdrawals, setWithdrawals] = useState<any>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchTransactionHistory = async () => {
    setIsLoading(true)
    try {
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
    }
    setIsLoading(false)
  }

  return (
    <div className="transaction-history">
      <div className="section-header">
        <h2>Transaction History</h2>
        <button onClick={fetchTransactionHistory} disabled={isLoading} className="action-button">
          {isLoading ? "Loading..." : "Fetch History"}
        </button>
      </div>

      {(transactions.length > 0 || deposits.length > 0) && (
        <div className="history-sections">
          {deposits.length > 0 && (
            <div className="history-section">
              <h3>Deposits ({deposits.length})</h3>
              <div className="transaction-list">
                {deposits.slice(0, 5).map((deposit, index) => (
                  <div key={index} className="transaction-item">
                    <span className="tx-type deposit">Deposit</span>
                    <span className="tx-details">{deposit ? `Transaction ${index + 1}` : "Pending"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {transactions.length > 0 && (
            <div className="history-section">
              <h3>Transactions ({transactions.length})</h3>
              <div className="transaction-list">
                {transactions.slice(0, 5).map((tx, index) => (
                  <div key={index} className="transaction-item">
                    <span className="tx-type transfer">Transfer</span>
                    <span className="tx-details">Transaction {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
