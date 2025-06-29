"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, Loader2, AlertCircle, LogOut, Copy, Eye, EyeOff } from "lucide-react"
import { useIntMaxWallet } from "@/hooks/use-intmax-wallet"
import { formatAddress } from "@/lib/utils"
import { useState } from "react"

export function IntMaxWalletConnection() {
  const { 
    client, 
    balances, 
    isConnecting, 
    error, 
    connect, 
    disconnect, 
    clearError,
    getPrivateKey 
  } = useIntMaxWallet()
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [privateKey, setPrivateKey] = useState<string>("")

  const handleCopyAddress = async () => {
    if (client?.address) {
      await navigator.clipboard.writeText(client.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleGetPrivateKey = async () => {
    try {
      await getPrivateKey()
    } catch (error) {
      console.error("Failed to get private key:", error)
    }
  }

  if (client?.isLoggedIn) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-purple-400" />
            INTMAX Wallet Connected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Address:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{formatAddress(client.address)}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopyAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {copied && <span className="text-xs text-green-400">Copied!</span>}
          </div>

          {balances.length > 0 && (
            <div className="text-sm">
              <span className="text-gray-400">Balances: </span>
              <div className="mt-1 space-y-1">
                {balances.slice(0, 3).map((balance, index) => (
                  <div key={index} className="text-xs">
                    <span className="font-medium">
                      {balance.amount.toString()} {balance.token.symbol || `Token ${balance.token.tokenIndex}`}
                    </span>
                  </div>
                ))}
                {balances.length > 3 && (
                  <span className="text-xs text-gray-500">+{balances.length - 3} more</span>
                )}
              </div>
            </div>
          )}

          <div className="text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Private Key:</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
              >
                {showPrivateKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            {showPrivateKey && (
              <div className="font-mono text-xs text-gray-300 break-all mt-1">
                {privateKey || "Click to reveal"}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetPrivateKey}
              className="flex-1 text-xs"
            >
              Get Private Key
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={disconnect}
              className="flex-1 text-xs"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-neutral-800 border-neutral-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Wallet className="h-4 w-4 text-neutral-400" />
          Connect INTMAX Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-gray-400">
          Connect your Web3 wallet to use INTMAX features
        </div>

        <Button
          onClick={connect}
          disabled={isConnecting || !client}
          className="w-full"
          size="sm"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Connecting...
            </>
          ) : !client ? (
            "Initializing..."
          ) : (
            <>
              <Wallet className="h-3 w-3 mr-2" />
              Connect Wallet
            </>
          )}
        </Button>

        {!client && (
          <div className="text-xs text-gray-500 text-center">
            Initializing INTMAX client...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
