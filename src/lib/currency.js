// Approximate, hardcoded LKR conversion rates for display purposes only.
// The store always charges and records orders in LKR - this never affects checkout/orders.
export const CURRENCIES = [
  { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee', rate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 / 300 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 1 / 380 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 1 / 325 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1 / 3.6 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1 / 200 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1 / 220 },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', rate: 1 / 82 },
];
