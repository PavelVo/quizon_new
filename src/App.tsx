import React, { Suspense } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const OrganizerRoom = React.lazy(() => import('./pages/OrganizerRoom'));
const SignInPage = React.lazy(() => import('./pages/SignInPage'));
const Rooms = React.lazy(() => import('./pages/Rooms')); // Добавлено для страницы комнат

// Get the publishable key from environment variables
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
}

function App() {
  return (
    <ErrorBoundary>
      <ClerkProvider 
        publishableKey={CLERK_PUBLISHABLE_KEY}
        appearance={{
          layout: {
            socialButtonsPlacement: 'bottom',
            socialButtonsVariant: 'iconButton',
          },
          variables: {
            colorPrimary: '#4F46E5',
          },
        }}
      >
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/sign-in" element={<SignInPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/:roomId/"
                element={
                  <ProtectedRoute>
                    <OrganizerRoom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/room/:roomId"
                element={
                  <ProtectedRoute>
                    <Rooms />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
          <Toaster position="top-right" />
        </Router>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;
