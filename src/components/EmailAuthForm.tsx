'use client';

import { useState } from 'react';
import { signInWithEmail, signUpWithEmail, resetPassword, resendConfirmation } from '@/lib/auth';

type AuthMode = 'signin' | 'signup' | 'reset' | 'confirm';

interface EmailAuthFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EmailAuthForm({ onSuccess, onCancel }: EmailAuthFormProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const validateForm = () => {
    if (!formData.email) {
      setError('Please enter your email.');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email format.');
      return false;
    }

    if (mode === 'reset') {
      return true; // Only email needed for reset
    }

    if (!formData.password) {
      setError('Please enter your password.');
      return false;
    }

    if (mode === 'signup') {
      if (!formData.fullName) {
        setError('Please enter your full name.');
        return false;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      switch (mode) {
        case 'signin':
          await signInWithEmail(formData.email, formData.password);
          setSuccess('로그인되었습니다!');
          onSuccess?.();
          break;

        case 'signup':
          await signUpWithEmail(formData.email, formData.password, formData.fullName);
          setSuccess('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
          setMode('confirm');
          break;

        case 'reset':
          await resetPassword(formData.email);
          setSuccess('패스워드 리셋 이메일을 발송했습니다.');
          setMode('signin');
          break;

        case 'confirm':
          await resendConfirmation(formData.email);
          setSuccess('확인 이메일을 다시 발송했습니다.');
          break;
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Handle specific Supabase auth errors
      switch (err.message) {
        case 'Invalid login credentials':
          setError('이메일 또는 패스워드가 올바르지 않습니다.');
          break;
        case 'User already registered':
          setError('이미 가입된 이메일입니다.');
          break;
        case 'Email not confirmed':
          setError('이메일 확인이 필요합니다.');
          setMode('confirm');
          break;
        case 'Signup requires a valid password':
          setError('올바른 패스워드를 입력해주세요.');
          break;
        default:
          setError(err.message || '오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: ''
    });
    setError(null);
    setSuccess(null);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const getTitle = () => {
    switch (mode) {
      case 'signin': return 'Sign In with Email';
      case 'signup': return 'Sign Up with Email';
      case 'reset': return 'Reset Password';
      case 'confirm': return 'Verify Email';
      default: return 'Sign In';
    }
  };

  const getButtonText = () => {
    if (loading) return 'Processing...';
    
    switch (mode) {
      case 'signin': return 'Sign In';
      case 'signup': return 'Sign Up';
      case 'reset': return 'Send Reset Email';
      case 'confirm': return 'Resend Confirmation';
      default: return 'Confirm';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-card rounded-lg p-6 border border-white/20">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{getTitle()}</h2>
          {mode === 'confirm' ? (
            <p className="text-sm text-gray-300">
              A confirmation email has been sent to {formData.email}.
            </p>
          ) : (
            <p className="text-sm text-gray-300">
              Please enter your account information
            </p>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-300">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading || mode === 'confirm'}
              className="w-full px-3 py-2 glass-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="your.email@example.com"
              required
            />
          </div>

          {/* Full Name (Signup only) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 glass-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your full name"
                required
              />
            </div>
          )}

          {/* Password */}
          {mode !== 'reset' && mode !== 'confirm' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 glass-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="At least 6 characters"
                required
              />
            </div>
          )}

          {/* Confirm Password (Signup only) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 glass-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Re-enter your password"
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 glass-button border border-white/20 rounded-lg text-sm font-medium text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {getButtonText()}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 space-y-2">
          {mode === 'signin' && (
            <>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-400">Don&apos;t have an account? </span>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Sign up
                </button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div className="text-center">
              <span className="text-sm text-gray-400">Already have an account? </span>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Sign in
              </button>
            </div>
          )}

          {(mode === 'reset' || mode === 'confirm') && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                ← Back to sign in
              </button>
            </div>
          )}

          {/* Cancel Button */}
          {onCancel && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 