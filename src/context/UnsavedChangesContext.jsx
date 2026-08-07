import { createContext, useContext, useEffect, useState } from 'react';

const UnsavedChangesContext = createContext(null);

// Set by AdminSettings while a section is in Edit mode; consulted by
// AdminSidebar before any navigation so leaving mid-edit needs confirmation.
export function UnsavedChangesProvider({ children }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Covers an actual browser-level navigation (refresh, close tab, typed URL)
  // - in-app route changes are guarded separately in AdminSidebar since this
  // native prompt can't be styled or use our own confirm dialog.
  useEffect(() => {
    function handler(e) {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  return (
    <UnsavedChangesContext.Provider value={{ hasUnsavedChanges, setHasUnsavedChanges }}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext);
}
