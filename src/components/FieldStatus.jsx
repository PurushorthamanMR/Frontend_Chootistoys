export default function FieldStatus({ status, duplicateMessage = 'This is already in use', invalidMessage, invalid }) {
  if (invalid) return <p className="text-xs text-red-500 mt-1">{invalidMessage}</p>;
  if (status === 'checking') return <p className="text-xs text-gray-400 mt-1">Checking...</p>;
  if (status === 'duplicate') return <p className="text-xs text-red-500 mt-1">{duplicateMessage}</p>;
  return null;
}
