import React from 'react';
import { Link } from 'react-router-dom';

function ErrorBoundaryComponent({ error }) {
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-red-100 rounded-lg">
      <h2 className="text-2xl font-bold text-red-700">Something went wrong!</h2>
      <p className="text-red-600">{error.message}</p>
      <div className="mt-4 space-x-4">
        <button
          onClick={() => window.location.reload()}
          className="bg-primary-blue text-white px-4 py-2 rounded hover:bg-blue-700"
          aria-label="Reload page"
        >
          Reload Page
        </button>
        <Link
          to="/dashboard"
          className="bg-primary-yellow text-primary-blue px-4 py-2 rounded hover:bg-yellow-600"
          aria-label="Back to dashboard"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default ErrorBoundaryComponent;