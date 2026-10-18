import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="mt-2 text-ink-muted">That address doesn't match anything here.</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-signal">Go to the start page</Link>
      </div>
    </div>
  );
}
