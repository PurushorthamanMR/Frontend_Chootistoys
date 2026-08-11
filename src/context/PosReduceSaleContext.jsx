import { createContext, useContext, useState } from 'react';
import { useSettings } from './SettingsContext';

const STORAGE_KEY = 'pos_reduce_sale_active';
const PosReduceSaleContext = createContext(null);

function readStored() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function PosReduceSaleProvider({ children }) {
  const { settings } = useSettings();
  const [active, setActive] = useState(readStored);
  const [toggling, setToggling] = useState(false);

  const min = Number(settings?.pos_reduce_sale_min) || 0;
  const max = Number(settings?.pos_reduce_sale_max) || 0;
  const configured = max > 0 && min >= 0 && min <= max;

  function toggleReduceSale() {
    if (!configured || toggling) return false;
    setToggling(true);
    window.setTimeout(() => {
      setActive((prev) => {
        const next = !prev;
        try {
          if (next) sessionStorage.setItem(STORAGE_KEY, '1');
          else sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore storage errors */
        }
        return next;
      });
      setToggling(false);
    }, 1000);
    return true;
  }

  return (
    <PosReduceSaleContext.Provider
      value={{
        reducedSaleActive: active && configured,
        reduceSaleConfigured: configured,
        reduceSaleToggling: toggling,
        toggleReduceSale,
      }}
    >
      {children}
    </PosReduceSaleContext.Provider>
  );
}

export function usePosReduceSale() {
  const ctx = useContext(PosReduceSaleContext);
  if (!ctx) {
    return {
      reducedSaleActive: false,
      reduceSaleConfigured: false,
      reduceSaleToggling: false,
      toggleReduceSale: () => false,
    };
  }
  return ctx;
}
