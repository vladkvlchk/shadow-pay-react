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

// Progress indicator component
const PaymentProgress = ({ currentStep }: { currentStep: 'signing' | 'broadcasting' | 'completed' | null }) => {
  if (!currentStep) return null;

  const steps = [
    { id: 'signing', label: 'Signing Transaction', icon: Loader2 },
    { id: 'broadcasting', label: 'Broadcasting to Network', icon: Loader2 },
    { id: 'completed', label: 'Payment Completed', icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-neutral-300 mb-3">Payment Progress</div>
      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep === 'completed' && index < 2;
          const isPending = !isActive && !isCompleted;

          return (
            <div key={step.id} className="flex items-center space-x-3">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-neutral-600'
              }`}>
                {isActive ? (
                  <Icon className="w-3 h-3 text-white animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-3 h-3 text-white" />
                ) : (
                  <div className="w-2 h-2 bg-neutral-400 rounded-full" />
                )}
              </div>
              <span className={`text-sm ${
                isActive ? 'text-blue-400 font-medium' : 
                isCompleted ? 'text-green-400' : 'text-neutral-500'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function PaymentPage() {
  const { slug } = useParams();
  const { 
    client, 
    balances, 
    isProcessingPayment, 
    error: intmaxError, 
    clearError,
    connect 
  } = useIntMaxWallet();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [currentStep, setCurrentStep] = useState<'signing' | 'broadcasting' | 'completed' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [transferFee, setTransferFee] = useState<any>(null);

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

        // Fetch transfer fee if client is connected
        if (client?.isLoggedIn) {
          try {
            const fee = await client.getTransferFee();
            setTransferFee(fee);
          } catch (err) {
            console.error("Failed to fetch transfer fee:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching payment:", err);
        setPageError("Failed to load payment");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPayment();
    }
  }, [slug]);

  // Fetch fees when client connects
  useEffect(() => {
    if (client?.isLoggedIn && payment) {
      const fetchFees = async () => {
        try {
          const fee = await client.getTransferFee();
          setTransferFee(fee);
        } catch (err) {
          console.error("Failed to fetch transfer fee:", err);
        }
      };
      fetchFees();
    }
  }, [client?.isLoggedIn, payment]);

  const handlePayment = async () => {
    if (!client?.isLoggedIn || !payment) return;

    try {
      setPaymentStatus("processing");
      setCurrentStep("signing");
      clearError();
      setError(null);

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

      // Get transfer fee to check if user has enough ETH for fees
      const transferFee = await client.getTransferFee();
      console.log(`Transfer fee:`, transferFee);
      setTransferFee(transferFee);
      
      // Check if user has enough ETH for fees
      const ethBalance = currentBalances.find(b => b.token.tokenIndex === 0); // ETH has tokenIndex 0
      if (ethBalance && transferFee?.fee) {
        const requiredFee = BigInt(transferFee.fee.amount);
        const userEthBalance = ethBalance.amount;
        
        console.log(`User ETH balance: ${userEthBalance.toString()}`);
        console.log(`Required fee: ${requiredFee.toString()}`);
        
        if (userEthBalance < requiredFee) {
          throw new Error(`Insufficient ETH for fees. You need at least ${Number(requiredFee) / 1e18} ETH for transaction fees.`);
        }
      }

      console.log(`Payment amount: ${payment.amount} ${payment.token}`);
      console.log(`Payment receiver: ${payment.receiver}`);
      console.log(`Client address: ${client.address}`);
      console.log(`Receiver type: ${typeof payment.receiver}`);
      console.log(`Receiver length: ${payment.receiver?.length}`);

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

      console.log(`Transfer request:`, transferRequest);

      // Move to broadcasting step
      setCurrentStep("broadcasting");

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
          setCurrentStep("completed");
        }
      } else {
        throw new Error("Transaction failed - no txTreeRoot received");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setPaymentStatus("error");
      setCurrentStep(null);
      
      // Handle specific error types
      let errorMessage = "Payment failed. Please try again.";
      
      if (err.message.includes("Merkle proof verification failed")) {
        errorMessage = "Transaction verification failed. This might be a temporary network issue. Please try again in a few minutes.";
      } else if (err.message.includes("Failed to finalize tx")) {
        errorMessage = "Transaction could not be finalized. Please try again or contact support if the issue persists.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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

                  {transferFee && (
                    <div className="border-t border-neutral-700 pt-2 mt-2">
                      <div className="text-xs text-neutral-500 mb-2">Transaction Fees:</div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-neutral-400">Network Fee:</span>
                        <span className="text-xs text-yellow-400">
                          {transferFee.fee ? `${Number(transferFee.fee.amount) / 1e18} ETH` : 'Calculating...'}
                        </span>
                      </div>
                      {transferFee.collateral_fee && (
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-neutral-400">Collateral Fee:</span>
                          <span className="text-xs text-orange-400">
                            {Number(transferFee.collateral_fee.amount) / 1e18} ETH
                          </span>
                        </div>
                      )}
                      <div className="text-xs text-neutral-500 mt-1">
                        * Collateral fee is refunded if transaction completes successfully
                      </div>
                    </div>
                  )}
                </div>

                {paymentStatus === "success" || payment.status === "paid" ? (
                  <Alert className="bg-green-900/20 border-green-900 text-green-400 animate-pulse">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription className="text-green-400">
                      <div className="space-y-2">
                        <div className="font-semibold flex items-center gap-2">
                          <span className="animate-bounce">🎉</span>
                          Payment completed successfully!
                          <span className="animate-bounce">🎉</span>
                        </div>
                        {txHash && (
                          <div className="text-xs text-green-300">
                            Transaction: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                          </div>
                        )}
                        <div className="text-xs text-green-300">
                          Your payment has been confirmed on the INTMAX2 network.
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : paymentStatus === "processing" ? (
                  <Alert className="bg-blue-900/20 border-blue-900 text-blue-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription className="text-blue-400">
                      <div className="space-y-2">
                        <div className="font-semibold">Processing your payment...</div>
                        <div className="text-xs text-blue-300">
                          Please wait while we confirm your transaction on the INTMAX2 network.
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : paymentStatus === "error" || error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div>{error || "Payment failed. Please try again."}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 border-red-700 text-red-400 hover:bg-red-700/20"
                          onClick={() => {
                            setPaymentStatus("idle");
                            setCurrentStep(null);
                            setError(null);
                          }}
                        >
                          Try Again
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : null}

                {/* Payment Progress Indicator */}
                {currentStep && (
                  <div className="bg-neutral-800 p-4 rounded-lg">
                    <PaymentProgress currentStep={currentStep} />
                  </div>
                )}

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
                      !client ||
                      paymentStatus === "processing" ||
                      currentStep !== null
                    }
                  >
                    {currentStep === "signing" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing Transaction...
                      </>
                    ) : currentStep === "broadcasting" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Broadcasting Transaction...
                      </>
                    ) : isProcessingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
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