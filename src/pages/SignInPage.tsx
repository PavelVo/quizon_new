import React from 'react';
import { SignIn, useAuth } from '@clerk/clerk-react';
import { useLocation, Navigate } from 'react-router-dom';

const SignInPage: React.FC = () => {
  const { isSignedIn } = useAuth();
  const location = useLocation();

  if (isSignedIn) {
    const from = (location.state as any)?.from || '/';
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl',
              headerTitle: 'text-2xl font-bold text-gray-900',
              headerSubtitle: 'text-gray-600',
              formButtonPrimary: 'btn btn-primary w-full',
              formFieldInput: 'input',
              dividerLine: 'bg-gray-200',
              dividerText: 'text-gray-500',
              socialButtonsBlockButton: 'btn btn-secondary',
              footerActionLink: 'text-blue-600 hover:text-blue-700',
            },
          }}
        />
      </div>
    </div>
  );
};

export default SignInPage;