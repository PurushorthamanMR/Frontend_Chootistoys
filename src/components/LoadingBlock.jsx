import Spinner from './Spinner';

// Drop-in replacement for a plain "Loading..." text filler - same call
// sites, just swaps the text for a spinner. `className` controls the
// wrapper's own spacing (e.g. vertical padding) since call sites vary.
export default function LoadingBlock({ className = 'py-8' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Spinner size="lg" />
    </div>
  );
}
