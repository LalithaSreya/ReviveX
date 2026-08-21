'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MessageSquare, Phone, Mail, Clock, CheckCircle2, ShieldAlert } from 'lucide-react'

const ticketSchema = z.object({
  subject: z.string().min(4, { message: 'Subject must be at least 4 characters' }),
  category: z.enum(['audit', 'logistics', 'valuation', 'billing', 'technical']),
  message: z.string().min(10, { message: 'Message details must be at least 10 characters' }),
})

type TicketInput = z.infer<typeof ticketSchema>

export default function SupportPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TicketInput>({
    resolver: zodResolver(ticketSchema),
  })

  const onSubmitTicket = async (data: TicketInput) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitted(true)
    reset()
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-emerald-950">Help & Operational Support</h1>
        <p className="text-xs text-slate-500 mt-1">Open a ticket with our relationship manager or logistics supervisor</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-stretch">
        {/* Contact panel */}
        <div className="lg:col-span-4 bg-emerald-950 text-white rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-8">
          <div className="space-y-4">
            <MessageSquare className="h-7 w-7 text-emerald-400" />
            <h3 className="text-lg font-bold">Direct Assistance</h3>
            <p className="text-xs text-emerald-100/70 leading-relaxed">
              For urgent logistics modifications, loading delay updates, or security gate clearance issues, call our dispatch line directly.
            </p>
          </div>

          <div className="space-y-4 text-xs font-semibold text-emerald-100">
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-emerald-400" />
              <span>+91 1800 200 4567 (Toll-Free)</span>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-emerald-400" />
              <span>B2B.support@revivex.co</span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>Mon - Sat: 9:00 AM - 7:00 PM</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-900/40 border border-emerald-500/10 rounded-2xl flex items-center space-x-2 text-[10px]">
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
            <span>Escalation: SLA responses within 4 hours</span>
          </div>
        </div>

        {/* Ticket Form */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-center">
          {isSubmitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-emerald-950">Support Ticket Raised!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your ticket has been generated. Our operations executive will respond via email or call within 2 hours.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-xs font-bold text-emerald-700 hover:underline pt-2"
              >
                Raise another ticket
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmitTicket)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">Ticket Category</label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl bg-white text-slate-700 font-medium"
                  >
                    <option value="audit">Site Inspection / Audit</option>
                    <option value="logistics">Logistics & Driver delays</option>
                    <option value="valuation">Scrap Valuation Quote</option>
                    <option value="billing">Invoicing & Taxes</option>
                    <option value="technical">Portal Technical Issues</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">Subject</label>
                  <input
                    {...register('subject')}
                    type="text"
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl font-medium"
                    placeholder="Brief summary of request"
                  />
                  {errors.subject && <p className="text-[10px] text-red-500 font-semibold">{errors.subject.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-emerald-950 uppercase">Details & Description</label>
                <textarea
                  {...register('message')}
                  rows={4}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl font-medium"
                  placeholder="Provide precise details, request IDs if applicable, or driver names..."
                />
                {errors.message && <p className="text-[10px] text-red-500 font-semibold">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-900 hover:bg-emerald-950 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center text-xs"
              >
                {isSubmitting ? 'Raising ticket...' : 'Raise Support Ticket'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
