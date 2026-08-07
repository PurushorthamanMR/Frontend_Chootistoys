import { createContext, useContext, useEffect, useState } from 'react';
import { CURRENCIES } from '../lib/currency';

const CurrencyContext = createContext(null);
const STORAGE_KEY = 'ccs_currency';

export function CurrencyProvider({ children }) {
  const [code, setCode] = useState(() => localStorage.getItem(STORAGE_KEY) || 'LKR');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, code);
  }, [code]);

  const currency = CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];

  function formatPrice(lkrAmount) {
    const value = Number(lkrAmount) * currency.rate;
    if (currency.code === 'LKR') {
      return `Rs. ${value.toLocaleString('en-LK', { maximumFractionDigits: 0 })}/=`;
    }
    return `${currency.symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: setCode, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
