import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'
import { CurrencyProvider } from './context/CurrencyContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ConnectivityGate from './components/ConnectivityGate.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ConnectivityGate>
        <BrowserRouter>
          <ThemeProvider>
            <SettingsProvider>
              <CurrencyProvider>
                <AuthProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <App />
                    </WishlistProvider>
                  </CartProvider>
                </AuthProvider>
              </CurrencyProvider>
            </SettingsProvider>
          </ThemeProvider>
        </BrowserRouter>
      </ConnectivityGate>
    </ErrorBoundary>
  </StrictMode>,
)
