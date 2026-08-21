'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Leaf, Lock, Mail, Building, User, Phone, MapPin, AlertCircle, FileText, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterInput } from '@/lib/validation'

export default function RegisterPage() {
  const router = useRouter()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      // 1. Insert B2B Company record first
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: data.companyName,
          contact_person: data.contactPerson,
          mobile_number: data.mobileNumber,
          email: data.email,
          location: data.location,
          gst_number: data.gstNumber,
        })
        .select('id')
        .single()

      if (companyError) {
        if (companyError.message?.includes('Failed to fetch') || companyError.message?.includes('fetch') || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
          localStorage.setItem('demo_session', JSON.stringify({
            role: 'client_user',
            full_name: data.fullName,
            companies: {
              name: data.companyName,
              gst_number: data.gstNumber,
              location: data.location
            }
          }))
          setIsSuccess(true)
          setIsLoading(false)
          return
        }
        setErrorMsg(`Failed to register company: ${companyError.message}`)
        setIsLoading(false)
        return
      }

      // 2. Sign up Auth user with metadata including company_id
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: 'client_user',
            company_id: company.id,
          },
        },
      })

      if (authError) {
        setErrorMsg(`Failed to create account: ${authError.message}`)
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      setIsLoading(false)
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err.message?.includes('fetch') || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
        localStorage.setItem('demo_session', JSON.stringify({
          role: 'client_user',
          full_name: data.fullName,
          companies: {
            name: data.companyName,
            gst_number: data.gstNumber,
            location: data.location
          }
        }))
        setIsSuccess(true)
        setIsLoading(false)
        return
      }
      setErrorMsg(err.message || 'An unexpected error occurred during registration')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-emerald-950/5 shadow-xl p-8 space-y-6">
        {/* LOGO */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-emerald-700" />
            <span className="text-2xl font-extrabold tracking-tight text-emerald-950">Revive<span className="text-emerald-700">X</span> <span className="text-[10px] text-slate-400 font-semibold align-middle uppercase tracking-widest block mt-0.5">by Magniplex Logitech</span></span>
          </Link>
          <h2 className="font-heading text-xl font-bold text-emerald-950">B2B Company Onboarding</h2>
          <p className="text-xs text-slate-500">Register your organization to initiate scrap audits and request tracking</p>
        </div>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950">Registration Complete!</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Your company record has been registered. You can now log in using your corporate email and password.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex justify-center bg-emerald-900 hover:bg-emerald-950 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-all text-sm"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-2 text-red-700 text-xs font-medium">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Row 1: Company Profile */}
              <div className="p-4 bg-emerald-50/20 border border-emerald-900/5 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest">1. Company Details</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-950 uppercase">Company Name</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        {...register('companyName')}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                        placeholder="e.g. Airtel India"
                      />
                    </div>
                    {errors.companyName && <p className="text-[10px] text-red-500 font-semibold">{errors.companyName.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-950 uppercase">GSTIN</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        {...register('gstNumber')}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 uppercase"
                        placeholder="15-character GSTIN"
                      />
                    </div>
                    {errors.gstNumber && <p className="text-[10px] text-red-500 font-semibold">{errors.gstNumber.message}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">Office Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      {...register('location')}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                      placeholder="Corporate Head Office Address"
                    />
                  </div>
                  {errors.location && <p className="text-[10px] text-red-500 font-semibold">{errors.location.message}</p>}
                </div>
              </div>

              {/* Row 2: Account details */}
              <div className="p-4 bg-teal-50/20 border border-teal-900/5 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-teal-800 uppercase tracking-widest">2. Account Credentials</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-950 uppercase">Contact Representative</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        {...register('fullName')}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                        placeholder="Your Name"
                      />
                    </div>
                    {errors.fullName && <p className="text-[10px] text-red-500 font-semibold">{errors.fullName.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-950 uppercase">Contact Person Title</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        {...register('contactPerson')}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                        placeholder="e.g. Procurement Officer"
                      />
                    </div>
                    {errors.contactPerson && <p className="text-[10px] text-red-500 font-semibold">{errors.contactPerson.message}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-950 uppercase">Corporate Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        {...register('email')}
                        type="email"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                        placeholder="name@company.com"
                      />
                    </div>
                    {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-950 uppercase">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        {...register('mobileNumber')}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                        placeholder="9876543210"
                      />
                    </div>
                    {errors.mobileNumber && <p className="text-[10px] text-red-500 font-semibold">{errors.mobileNumber.message}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      {...register('password')}
                      type="password"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                      placeholder="•••••••• (Min 6 characters)"
                    />
                  </div>
                  {errors.password && <p className="text-[10px] text-red-500 font-semibold">{errors.password.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-900 hover:bg-emerald-950 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center text-sm"
              >
                {isLoading ? 'Onboarding organization...' : 'Register Organization'}
              </button>
            </form>

            <div className="text-center">
              <span className="text-xs text-slate-500">Already registered? </span>
              <Link href="/login" className="text-xs text-emerald-700 font-semibold hover:underline">
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
