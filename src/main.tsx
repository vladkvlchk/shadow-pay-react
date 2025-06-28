import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { IntMaxWalletProvider } from "./hooks/use-intmax-wallet"
import App from "./App.tsx"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <IntMaxWalletProvider>
        <App />
      </IntMaxWalletProvider>
    </BrowserRouter>
  </StrictMode>,
)
