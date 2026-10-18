const styles = {
  primary: 'bg-signal text-white hover:bg-signal-dark',
  secondary: 'border border-line bg-white text-ink hover:bg-paper',
  danger: 'bg-bad text-white hover:bg-red-800',
  ghost: 'text-signal hover:bg-signal-soft',
};

export default function Button({ variant = 'primary', size = 'md', className = '', loading, children, ...rest }) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button
      type="button"
      disabled={loading || rest.disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${pad} ${styles[variant]} ${className}`}
      {...rest}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}
