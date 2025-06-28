"use client"

import { useIntMaxWallet } from "@/hooks/use-intmax-wallet"

export function WalletDashboard() {
  const {
    client,
    tokens,
    balances,
    isConnecting,
    error,
    connect,
    disconnect,
    signMessage,
    getPrivateKey,
    refreshData,
    clearError
  } = useIntMaxWallet()

  return (
    <div className="wallet-dashboard-page">
      <header className="app-header">
        <h1>INTMAX2 Wallet Dashboard</h1>
        <p>Manage your INTMAX2 assets and transactions.</p>
        <div className="environment-badge">
          Environment: <span className="testnet">Testnet</span>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
            <button onClick={clearError}>×</button>
          </div>
        )}

        <div className="troubleshooting-section">
          <h2>Wallet Setup Guide</h2>
          <div className="setup-steps">
            <div className="step">
              <h4>1. Install a Web3 Wallet</h4>
              <p>Make sure you have MetaMask, Rabby, or another compatible wallet installed.</p>
            </div>
            <div className="step">
              <h4>2. Create/Import an Account</h4>
              <p>Your wallet must have at least one account. Create a new account or import an existing one.</p>
            </div>
            <div className="step">
              <h4>3. Unlock Your Wallet</h4>
              <p>Ensure your wallet is unlocked and connected to the correct network.</p>
            </div>
            <div className="step">
              <h4>4. Accept Connection Requests</h4>
              <p>When prompted, accept both the wallet connection and message signing requests.</p>
            </div>
          </div>
        </div>

        <div className="wallet-section">
          <h2>Wallet Connection</h2>

          {!client ? (
            <div className="loading">Initializing client...</div>
          ) : !client.isLoggedIn ? (
            <div className="login-section">
              <p>Connect your wallet to get started with INTMAX2</p>
              <button onClick={connect} disabled={isConnecting} className="connect-button">
                {isConnecting ? "Connecting..." : "Login to INTMAX2"}
              </button>
            </div>
          ) : (
            <div className="wallet-info">
              <div className="status">
                <span className="status-indicator connected"></span>
                <span>Connected</span>
              </div>

              <div className="wallet-details">
                <div className="detail-item">
                  <label>Address:</label>
                  <span className="address">{client.address}</span>
                </div>
              </div>

              <div className="wallet-actions">
                <button onClick={refreshData} disabled={isConnecting} className="action-button">
                  {isConnecting ? "Loading..." : "Refresh Data"}
                </button>

                <button onClick={signMessage} disabled={isConnecting} className="action-button">
                  Sign Message
                </button>

                <button onClick={getPrivateKey} disabled={isConnecting} className="action-button">
                  Get Private Key
                </button>

                <button onClick={disconnect} className="disconnect-button">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {client?.isLoggedIn && (
          <>
            <div className="tokens-section">
              <h2>Available Tokens ({tokens.length})</h2>
              {tokens.length > 0 ? (
                <div className="tokens-grid">
                  {tokens.slice(0, 6).map((token, index) => (
                    <div key={index} className="token-card">
                      <div className="token-info">
                        <div className="token-symbol">{token.symbol || `Token ${token.tokenIndex}`}</div>
                        <div className="token-details">
                          <span>Index: {token.tokenIndex}</span>
                          <span>Type: {token.tokenType}</span>
                          {token.decimals && <span>Decimals: {token.decimals}</span>}
                        </div>
                        {token.price > 0 && <div className="token-price">${token.price.toFixed(4)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No tokens available</p>
              )}
            </div>

            <div className="balances-section">
              <h2>Token Balances ({balances.length})</h2>
              {balances.length > 0 ? (
                <div className="balances-list">
                  {balances.map((balance, index) => (
                    <div key={index} className="balance-item">
                      <div className="balance-token">
                        <span className="token-symbol">
                          {balance.token.symbol || `Token ${balance.token.tokenIndex}`}
                        </span>
                        <span className="token-type">{balance.token.tokenType}</span>
                      </div>
                      <div className="balance-amount">
                        {balance.amount.toString()} {balance.token.symbol}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No balances found</p>
              )}
            </div>
          </>
        )}

        <div className="info-section">
          <h3>SDK Features</h3>
          <div className="features-grid">
            <div className="feature-item">
              <h4>Account Management</h4>
              <ul>
                <li>Login/Logout</li>
                <li>Message signing</li>
                <li>Private key access</li>
              </ul>
            </div>
            <div className="feature-item">
              <h4>Token Operations</h4>
              <ul>
                <li>Token list retrieval</li>
                <li>Balance checking</li>
                <li>Multi-token support</li>
              </ul>
            </div>
            <div className="feature-item">
              <h4>Transactions</h4>
              <ul>
                <li>Deposits (ETH, ERC20, NFTs)</li>
                <li>Withdrawals</li>
                <li>Transaction history</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
