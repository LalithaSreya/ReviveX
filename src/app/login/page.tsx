'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Leaf, Lock, Mail, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validation'

export default function LoginPage() {
  const router = useRouter()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch') || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
          localStorage.setItem('demo_session', JSON.stringify({
            role: data.email.includes('admin') ? 'super_admin' : 'client_user',
            full_name: data.email.includes('admin') ? 'Operations Director' : 'Airtel Procurement Manager',
          }))
          router.push(data.email.includes('admin') ? '/admin' : '/portal')
          router.refresh()
          return
        }
        setErrorMsg(error.message)
        setIsLoading(false)
        return
      }

      // Query the user profile to find their role and redirect accordingly
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user?.id)
        .single()

      if (profileError || !profile) {
        router.push('/portal')
        router.refresh()
        return
      }

      if (profile.role === 'client_user') {
        router.push('/portal')
      } else {
        router.push('/admin')
      }
      router.refresh()
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err.message?.includes('fetch') || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
        localStorage.setItem('demo_session', JSON.stringify({
          role: data.email.includes('admin') ? 'super_admin' : 'client_user',
          full_name: data.email.includes('admin') ? 'Operations Director' : 'Airtel Procurement Manager',
        }))
        router.push(data.email.includes('admin') ? '/admin' : '/portal')
        router.refresh()
        return
      }
      setErrorMsg(err.message || 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  // Pre-fill helper for local testing
  const handleQuickLogin = async (role: 'client' | 'admin') => {
    setIsLoading(true)
    setErrorMsg(null)
    
    const email = role === 'client' ? 'client@revivex.co' : 'admin@revivex.co'
    const password = 'Password123'

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch') || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
          localStorage.setItem('demo_session', JSON.stringify({
            role: role === 'client' ? 'client_user' : 'super_admin',
            full_name: role === 'client' ? 'Airtel Procurement Manager' : 'Operations Director',
          }))
          router.push(role === 'client' ? '/portal' : '/admin')
          router.refresh()
          return
        }
        setErrorMsg(`Failed to log in: ${error.message}`)
        setIsLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user?.id)
        .single()

      if (profile && profile.role !== 'client_user') {
        router.push('/admin')
      } else {
        router.push('/portal')
      }
      router.refresh()
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err.message?.includes('fetch') || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
        localStorage.setItem('demo_session', JSON.stringify({
          role: role === 'client' ? 'client_user' : 'super_admin',
          full_name: role === 'client' ? 'Airtel Procurement Manager' : 'Operations Director',
        }))
        router.push(role === 'client' ? '/portal' : '/admin')
        router.refresh()
        return
      }
      setErrorMsg(err.message || 'Quick login failed')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/5 shadow-xl p-8 space-y-6">
        {/* LOGO */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-emerald-700" />
            <span className="text-2xl font-extrabold tracking-tight text-emerald-950">Revive<span className="text-emerald-700">X</span> <span className="text-[10px] text-slate-400 font-semibold align-middle uppercase tracking-widest block mt-0.5">by Magniplex Logitech</span></span>
          </Link>
          <h2 className="font-heading text-xl font-bold text-emerald-950">Sign in to your account</h2>
          <p className="text-xs text-slate-500">Access your B2B sustainability dashboard and tracking systems</p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-2 text-red-700 text-xs font-medium">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-emerald-950 uppercase">Corporate Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                {...register('email')}
                type="email"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                placeholder="name@company.com"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 font-semibold">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-emerald-950 uppercase">Password</label>
              <a href="#" className="text-xs text-emerald-700 hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                {...register('password')}
                type="password"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-xs text-red-500 font-semibold">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-900 hover:bg-emerald-950 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center text-sm"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <span className="absolute w-full h-[1px] bg-slate-100" />
          <span className="relative px-3 bg-white text-slate-400 text-xs uppercase font-bold tracking-wider">Prototype Quick Access</span>
        </div>

        {/* QUICK LOGIN ACCESS FOR TESTING */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleQuickLogin('client')}
            className="py-2.5 px-3 border border-emerald-900/10 hover:border-emerald-700/30 hover:bg-slate-50 text-emerald-950 text-xs font-semibold rounded-xl transition-all"
          >
            Demo Client User
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('admin')}
            className="py-2.5 px-3 border border-teal-900/10 hover:border-teal-700/30 hover:bg-slate-50 text-teal-950 text-xs font-semibold rounded-xl transition-all"
          >
            Demo Admin User
          </button>
        </div>

        <div className="text-center pt-2">
          <span className="text-xs text-slate-500">New company? </span>
          <Link href="/register" className="text-xs text-emerald-700 font-semibold hover:underline">
            Register B2B Company
          </Link>
        </div>
      </div>
    </div>
  )
}
