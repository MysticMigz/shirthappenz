'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useUser } from '@/context/UserContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import SecurityHeaders from '@/components/SecurityHeaders';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (!errorParam) return;

    // NextAuth common errors: https://next-auth.js.org/configuration/pages#sign-in-page
    const message =
      errorParam === 'CredentialsSignin'
        ? 'Incorrect email or password.'
        : errorParam === 'AccessDenied'
        ? 'Access denied. Please contact support if you believe this is a mistake.'
        : errorParam === 'OAuthAccountNotLinked'
        ? 'This email is already associated with a different sign-in method.'
        : errorParam === 'Configuration'
        ? 'Sign in is temporarily unavailable. Please try again later.'
        : 'Sign in failed. Please try again.';

    setError(message);
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (error) setError('');
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔍 [Login] Starting login process for:', formData.email);

    try {
      // Get callback URL from query params
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl') || (formData.email.includes('admin') || formData.email.includes('@') ? '/admin/dashboard' : '/');
      
      console.log('🔍 [Login] Callback URL:', callbackUrl);
      console.log('🔍 [Login] Using redirect: true to ensure cookie is set...');
      
      // IMPORTANT: Use redirect: true instead of false
      // When redirect: false, NextAuth doesn't set the cookie via Set-Cookie headers
      // Using redirect: true ensures the cookie is properly set in the browser
      const result = await signIn('credentials', {
        redirect: true,
        email: formData.email,
        password: formData.password,
        callbackUrl: callbackUrl,
      });

      // If we get here, redirect was successful and cookie should be set
      // The redirect will happen automatically, so we don't need to handle it
      console.log('✅ [Login] signIn called with redirect - cookie should be set');
      
    } catch (err) {
      console.error('❌ [Login] Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
    // Note: We don't set loading to false here because the redirect will happen
    // If there's an error, it will be caught above
  };

  return (
    <>
      <SecurityHeaders 
        title="Sign In - Mr SHIRT PERSONALISATION"
        description="Sign in to your account to access your personalized apparel"
      />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full p-8">
        <div className="flex flex-col items-center mb-6">
          <a href="https://mrshirtpersonalisation.co.uk" target="_blank" rel="noopener noreferrer">
            <img src="https://res.cloudinary.com/dfjgvffou/image/upload/v1753210261/logo_yqmosx.png" alt="Mr Shirt Personalisation Logo" style={{ maxWidth: '180px', margin: '0 auto 24px auto', display: 'block' }} />
          </a>
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in to your account</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5" />
                  ) : (
                    <FaEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-end mb-4">
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot your password?</Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-white hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-red)] ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-sm text-center">
            <Link href="/auth/register" className="font-medium text-purple-600 hover:text-purple-500">
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
      </div>
    </>
  );
} 