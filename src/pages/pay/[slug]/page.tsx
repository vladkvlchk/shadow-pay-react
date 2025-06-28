"use client";

import { useState, useEffect } from "react";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { IntMaxWalletConnection } from "@/components/intmax-wallet-connection";
import { formatAddress } from "@/lib/utils";
import { useIntMaxWallet } from "@/hooks/use-intmax-wallet";
import { getPaymentById, updatePaymentStatus } from "@/lib/payments-db";
import { type Payment } from "@/lib/supabase";
import { useParams } from "react-router-dom";

export default function PaymentPage() {
  const { slug } = useParams();
  const { 
    client, 
    balances, 
    isProcessingPayment, 
    error, 
    clearError,
    connect 
  } = useIntMaxWallet();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        setPageError(null);

        const paymentData = await getPaymentById(slug as string);
        if (!paymentData) {
          setPageError("Payment not found or has expired.");
          return;
        }

        setPayment(paymentData);

        // If payment is already paid, show success state
        if (paymentData.status === "paid") {
          setPaymentStatus("success");
          setTxHash(paymentData.tx_hash || null);
        }
      } catch (err) {
        console.error("Error fetching payment:", err);
        setPageError("Failed to load payment details.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPayment();
    }
  }, [slug]);

  const handlePayment = async () => {
    if (!client?.isLoggedIn || !payment) return;

    try {
      setPaymentStatus("processing");
      clearError();

      // Get token information
      const tokens = await client.getTokensList();
      const token = tokens.find(t => t.symbol === payment.token);
      
      if (!token) {
        throw new Error(`Token ${payment.token} not found`);
      }

      // Get current balances for debugging
      const { balances: currentBalances } = await client.fetchTokenBalances();
      const userBalance = currentBalances.find(b => b.token.tokenIndex === token.tokenIndex);
      
      console.log(`User balance for ${payment.token}: ${userBalance?.amount.toString() || '0'}`);
      console.log(`Token info:`, token);

      console.log(`Payment amount: ${payment.amount} ${payment.token}`);
      console.log(`Payment receiver: ${payment.receiver}`);

      // Check if receiver is a valid INTMAX address
      if (!payment.receiver || typeof payment.receiver !== 'string' || payment.receiver.length < 10) {
        throw new Error(`Invalid receiver address: ${payment.receiver}`);
      }

      // Create transfer request
      const transferRequest = {
        token,
        amount: payment.amount,
        receiver: payment.receiver,
        address: client.address,
        comment: payment.comment || undefined,
      };

      // Broadcast the transaction
      const transactionResponse = await client.broadcastTransaction(
        [transferRequest],
        false // isWithdrawal = false for regular transfer
      );

      console.log(`Transaction response:`, transactionResponse);

      // Check if transaction was successful
      if (transactionResponse.txTreeRoot) {
        // Use the real transaction hash from the response
        const txHash = transactionResponse.txTreeRoot;

        // Update payment status in database
        const updatedPayment = await updatePaymentStatus(
          payment.id,
          "paid",
          client.address,
          txHash
        );

        if (updatedPayment) {
          setPayment(updatedPayment);
          setTxHash(txHash);
          setPaymentStatus("success");
        }
      } else {
        throw new Error("Transaction failed - no txTreeRoot received");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setPaymentStatus("error");
      
      // Handle specific error types
      let errorMessage = "Payment failed. Please try again.";
      
      if (err.message.includes("Merkle proof verification failed")) {
        errorMessage = "Transaction verification failed. This might be a temporary network issue. Please try again in a few minutes.";
      } else if (err.message.includes("Failed to finalize tx")) {
        errorMessage = "Transaction could not be finalized. Please try again or contact support if the issue persists.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error("Payment failed:", errorMessage);
    }
  };

  const getExplorerUrl = (txHash: string): string => {
    // Use INTMAX2 explorer format
    return `https://testnet-explorer.intmax.io/tx/${txHash}`;
  };

  const isConnected = client?.isLoggedIn || false;
  // Remove balance checking - let users sign transactions directly
  
  // Convert payment amount to BigInt (assuming amount is in smallest unit)
  const paymentAmount = payment ? BigInt(Math.floor(Number(payment.amount) * 1000000)) : BigInt(0);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <h1 className="text-2xl font-bold">Complete Payment</h1>
        </div>

        {loading ? (
          <Card className="bg-neutral-900 border-neutral-800 text-white">
            <CardHeader>
              <Skeleton className="h-8 w-3/4 bg-neutral-800" />
              <Skeleton className="h-4 w-1/2 bg-neutral-800 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-20 w-full bg-neutral-800" />
                <Skeleton className="h-12 w-full bg-neutral-800" />
              </div>
            </CardContent>
          </Card>
        ) : pageError && !payment ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{pageError}</AlertDescription>
          </Alert>
        ) : payment ? (
          <div className="max-w-md mx-auto">
            <Card className="bg-neutral-900 border-neutral-800 mb-6 text-white">
              <CardHeader>
                <CardTitle>
                  {payment.status === "paid"
                    ? "Payment Completed"
                    : "Payment Request"}
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  {payment.status === "paid"
                    ? "This payment has been completed successfully"
                    : "Connect your INTMAX wallet to complete this payment"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-neutral-800 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-neutral-400">Amount:</span>
                    <span className="font-bold text-lg">
                      {payment.amount} {payment.token}
                    </span>
                  </div>

                  {payment.comment && (
                    <div className="flex justify-between mb-2">
                      <span className="text-neutral-400">Comment:</span>
                      <span>{payment.comment}</span>
                    </div>
                  )}

                  <div className="flex justify-between mb-2">
                    <span className="text-neutral-400">Receiver:</span>
                    <span className="text-sm font-mono">
                      {formatAddress(payment.receiver)}
                    </span>
                  </div>

                  {payment.sender_address && (
                    <div className="flex justify-between mb-2">
                      <span className="text-neutral-400">Sender:</span>
                      <span className="text-sm font-mono">
                        {formatAddress(payment.sender_address)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between mb-2">
                    <span className="text-neutral-400">Status:</span>
                    <span
                      className={`text-sm font-medium ${
                        payment.status === "paid"
                          ? "text-green-400"
                          : payment.status === "pending"
                          ? "text-yellow-400"
                          : "text-neutral-400"
                      }`}
                    >
                      {payment.status === "paid"
                        ? "✓ Paid"
                        : payment.status === "pending"
                        ? "⏳ Pending"
                        : "Expired"}
                    </span>
                  </div>

                  <div className="flex justify-between mb-2">
                    <span className="text-neutral-400">Token:</span>
                    <span className="text-sm font-medium">{payment.token}</span>
                  </div>
                </div>

                {paymentStatus === "success" || payment.status === "paid" ? (
                  <Alert className="bg-green-900/20 border-green-900 text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription className="text-green-400">
                      Payment completed successfully!
                    </AlertDescription>
                  </Alert>
                ) : paymentStatus === "error" || error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {error || "Payment failed. Please try again."}
                    </AlertDescription>
                  </Alert>
                ) : null}

                {(txHash || payment.tx_hash) && (
                  <div className="text-center">
                    <a
                      href={getExplorerUrl(txHash || payment.tx_hash!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 flex items-center justify-center gap-1 text-sm"
                    >
                      View transaction <ExternalLink className="h-3 w-4" />
                    </a>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                {payment.status === "paid" ? (
                  <Button
                    variant="outline"
                    className="w-full border-green-700 text-green-400 bg-green-700/20 hover:bg-green-400/20 hover:text-green-400/50 cursor-pointer"
                    onClick={() => (window.location.href = "/")}
                  >
                    Return to Home
                  </Button>
                ) : !isConnected ? (
                  <IntMaxWalletConnection />
                ) : paymentStatus === "success" ? (
                  <Button
                    variant="outline"
                    className="w-full border-green-700 text-green-400 bg-green-700/20 hover:bg-green-400/20 hover:text-green-400/50 cursor-pointer"
                    onClick={() => (window.location.href = "/")}
                  >
                    Return to Home
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={handlePayment}
                    disabled={
                      isProcessingPayment ||
                      !client
                    }
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Payment...
                      </>
                    ) : !client ? (
                      "Connect Wallet"
                    ) : (
                      `Sign & Pay ${payment.amount} ${payment.token}`
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>

            <div className="text-center text-neutral-500 text-sm">
              <p>Powered by INTMAX & ShadowPay</p>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}