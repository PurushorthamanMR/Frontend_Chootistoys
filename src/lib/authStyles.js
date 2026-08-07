// Shared Tailwind class strings for the auth pages (Login, Register, Apply
// Seller, Seller Login). Mobile uses a colored-label / underline-input /
// pill-button look; desktop keeps the existing boxed-input card design.
// Centralized here so all four forms stay visually consistent instead of
// each hand-rolling the same long responsive className strings.

export const authLabelClass =
  'block text-xs font-semibold text-wa-green-dark dark:text-wa-green uppercase tracking-wide mb-1 ' +
  'md:text-sm md:font-medium md:normal-case md:tracking-normal md:text-gray-700 md:dark:text-gray-300';

export const authInputClass =
  'w-full border-0 border-b-2 border-gray-200 dark:border-neutral-700 focus:border-wa-green dark:focus:border-wa-green ' +
  'focus:outline-none bg-transparent px-0 py-2 text-gray-900 dark:text-gray-100 ' +
  'placeholder:text-gray-400 dark:placeholder:text-neutral-600 ' +
  'md:border md:rounded md:border-gray-300 md:dark:border-neutral-700 md:dark:bg-neutral-800 md:px-3 md:py-2';

export const authButtonClass =
  'w-full text-white font-semibold py-3.5 md:py-2.5 rounded-full md:rounded-md ' +
  'bg-gradient-to-r from-wa-teal to-wa-green-dark hover:opacity-90 ' +
  'md:bg-none md:bg-wa-green md:hover:bg-wa-green-dark md:hover:opacity-100 ' +
  'disabled:opacity-60 md:disabled:opacity-100 md:disabled:bg-gray-300 md:dark:disabled:bg-neutral-700';
