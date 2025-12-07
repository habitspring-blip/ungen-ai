"use client"

import React, { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/UserContext"
import Link from "next/link"


export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()
  const { setUser } = useUser()

  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: false
  })
  const [checkingSession, setCheckingSession] = useState(true)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [showPassword, setShowPassword] = useState(false)

  // Session check
  const checkSession = useCallback(async () => {
    try {
      // Add timeout to prevent hanging
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session check timeout')), 5000)
      )

      const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any

      if (data.session) {
        router.replace("/dashboard")
      } else {
        setCheckingSession(false)
      }
    } catch (error) {
      console.error("Session check error:", error)
      setCheckingSession(false)
    }
  }, [router, supabase])

  useEffect(() => {
    checkSession()
  }, [checkSession])


  // Form validation
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (isSignUp) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password"
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      if (isSignUp) {
        // Sign up flow
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        })

        if (error) {
          setErrors({ general: error.message })
          return
        }

        setErrors({ general: "Account created successfully! Please check your email to verify your account." })
        setIsSignUp(false) // Switch to sign in mode
      } else {
        // Sign in flow
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) {
          setErrors({ general: error.message })
          return
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          setErrors({ general: "Failed to retrieve user information" })
          return
        }

        const userData = {
          name: user.user_metadata.full_name || user.email?.split('@')[0] || "User",
          email: user.email!,
          avatar: user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'U')}&background=6366f1&color=fff`,
          plan: "Free",
          credits: 5000,
          creditsUsed: 0,
          creditsLimit: 1000,
        }

        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))

        // Check if there's a pending tool redirect
        const returnUrl = sessionStorage.getItem('pending-return-url') || '/dashboard'
        sessionStorage.removeItem('pending-return-url')
        router.push(returnUrl)
      }
    } catch (error) {
      console.error(`${isSignUp ? 'Signup' : 'Login'} error:`, error)
      setErrors({ general: "An unexpected error occurred. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setErrors({})

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_APP_URL : process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setErrors({ general: error.message })
        setGoogleLoading(false)
        return
      }

      // The OAuth flow will handle the redirect, no need to set loading to false here

    } catch (error) {
      console.error("Google login error:", error)
      setErrors({ general: "Failed to initiate Google login. Please try again." })
      setGoogleLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Checking session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-brand rounded-xl mb-6 shadow-lg">
            <span className="text-2xl font-bold text-white">U</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            UngenAI
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Advanced AI writing platform for enterprise teams.
            Transform your content creation workflow with intelligent analysis and real-time enhancement.
          </p>
          <div className="mt-6 flex justify-center space-x-6 text-sm text-slate-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              SOC 2 Compliant
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Enterprise Security
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="text-center mb-6 lg:hidden">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-brand rounded-xl mb-4 shadow-lg">
              <span className="text-xl font-bold text-white">U</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">UngenAI</h1>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 mb-6">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-md transition-all duration-200 ${
                !isSignUp
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-md transition-all duration-200 ${
                isSignUp
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {isSignUp ? 'Create your account' : 'Welcome back'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isSignUp ? 'Get started with UngenAI today' : 'Sign in to your account'}
                </p>
              </div>
            {/* Error Alert */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm font-medium">{errors.general}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`w-full px-4 py-3 pl-11 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                    }`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                  <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    required
                    className={`w-full px-4 py-3 pl-11 pr-11 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                    }`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                  <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <button
                    type="button"
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field (Sign Up only) */}
              {isSignUp && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      className={`w-full px-4 py-3 pl-11 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                        errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                      }`}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    />
                    <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    checked={formData.rememberMe}
                    onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-slate-600">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-premium text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSignUp ? 'Creating Account...' : 'Signing in...'}
                  </>
                ) : (
                  isSignUp ? 'Sign Up' : 'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 mb-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500 font-medium">Or continue with</span>
                </div>
              </div>
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {googleLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 pb-4 text-center">
            <p className="text-sm text-slate-600">
              {isSignUp ? 'Already have an account?' : 'New to UnGenAI?'}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign up now'}
              </button>
            </p>
          </div>
        </div>

        </div>
      </div>
    </div>
  )
}
