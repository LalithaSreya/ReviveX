'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ClipboardCheck,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  MapPin,
  Building,
  AlertCircle,
  Dot,
  FileCheck,
  ArrowLeft
} from 'lucide-react'

export default function AdminRequestsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reviewId = searchParams.get('review')

  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<any[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])

  // Audit actions state
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [inspectionDate, setInspectionDate] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const supabase = createClient()

  // 1. Fetch Request Queue
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true)
      try {
        const { data: reqs } = await supabase
          .from('requests')
          .select('*, companies(*)')
          .order('created_at', { ascending: false })

        setRequests(reqs || [])
      } catch (err) {
        console.error('Error fetching admin requests:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [supabase])

  // 2. Fetch specific review details
  useEffect(() => {
    const fetchReviewDetails = async () => {
      if (!reviewId) return
      setLoading(true)
      setErrorMsg(null)
      setSuccessMsg(null)
      try {
        const { data: req } = await supabase
          .from('requests')
          .select('*, companies(*)')
          .eq('id', reviewId)
          .single()

        if (req) {
          setSelectedRequest(req)
          
          // Fetch materials
          const { data: mats } = await supabase
            .from('materials')
            .select('*')
            .eq('request_id', reviewId)
          setMaterials(mats || [])

          // Fetch staff members available for assignment (non client_users)
          const { data: staff } = await supabase
            .from('profiles')
            .select('*')
            .neq('role', 'client_user')
          setStaffList(staff || [])
        }
      } catch (err) {
        console.error('Error fetching review details:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchReviewDetails()
  }, [reviewId, supabase])

  // 3. Approve Request (Triggers Project creation automatically via DB Trigger)
  const handleApprove = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'approved' })
        .eq('id', reviewId)

      if (error) throw error

      setSuccessMsg('Request approved! Circular project has been created and synced automatically.')
      
      // Update local state
      setSelectedRequest((prev: any) => ({ ...prev, status: 'approved' }))
      setRequests((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: 'approved' } : r))
      )
    } catch (err: any) {
      setErrorMsg(err.message || 'Approval operation failed.')
    } finally {
      setLoading(false)
    }
  }

  // 4. Update Status (e.g. Schedule Assessment, Staff Assigned)
  const handleUpdateStatus = async (newStatus: string) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const updatePayload: any = { status: newStatus }
      
      // Handle scheduling details if applicable
      if (newStatus === 'inspection_scheduled' && inspectionDate) {
        updatePayload.site_requirements = `Site Audit Scheduled: ${inspectionDate}`
      }

      const { error } = await supabase
        .from('requests')
        .update(updatePayload)
        .eq('id', reviewId)

      if (error) throw error

      setSuccessMsg(`Request status updated to: ${newStatus.replace(/_/g, ' ')}`)
      
      // Update local state
      setSelectedRequest((prev: any) => ({ ...prev, ...updatePayload }))
      setRequests((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, ...updatePayload } : r))
      )
    } catch (err: any) {
      setErrorMsg(err.message || 'Status update failed.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      submitted: 'bg-blue-50 text-blue-700 border-blue-200',
      under_review: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      completed: 'bg-teal-50 text-teal-700 border-teal-200',
      quotation_pending: 'bg-purple-50 text-purple-700 border-purple-200',
      closed: 'bg-slate-100 text-slate-600 border-slate-200',
    }
    return classes[status] || 'bg-slate-50 text-slate-700 border-slate-200'
  }

  if (loading && !reviewId) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400 text-sm font-semibold">
        Loading requests database...
      </div>
    )
  }

  // ==========================================
  // CASE A: DETAIL AUDIT / REVIEW WORKSPACE
  // ==========================================
  if (reviewId && selectedRequest) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push('/admin/requests')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white px-3 py-2 border border-slate-100 rounded-xl shadow-sm animate-fade-in"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Request Queue</span>
        </button>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Main workspace */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">Auditing Yard Intake</span>
                <h1 className="text-xl font-bold text-slate-900 mt-1">
                  Audit Workspace for Request #{selectedRequest.id.substring(0, 8)}
                </h1>
                <p className="text-xs text-slate-400 mt-1">Company: {selectedRequest.companies?.name}</p>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold capitalize ${getStatusBadge(selectedRequest.status)}`}>
                {selectedRequest.status.replace(/_/g, ' ')}
              </span>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-2 text-red-700 text-xs font-medium">
                <AlertCircle className="h-4.5 w-4.5 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-2 text-emerald-800 text-xs font-medium">
                <CheckCircle className="h-4.5 w-4.5 mt-0.5 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* AUDIT DETAILS PANEL */}
            <div className="grid sm:grid-cols-2 gap-6 text-xs border border-slate-100 p-6 rounded-2xl bg-slate-50/20">
              <div className="space-y-3 font-semibold text-slate-700">
                <h4 className="font-bold text-emerald-950 uppercase tracking-wider text-[10px]">Client Contacts</h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Representative:</span>
                  <span>{selectedRequest.contact_person || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pickup Address:</span>
                  <span className="truncate max-w-[180px]">{selectedRequest.pickup_location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GSTIN:</span>
                  <span>{selectedRequest.companies?.gst_number || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-3 font-semibold text-slate-700">
                <h4 className="font-bold text-emerald-950 uppercase tracking-wider text-[10px]">Material Estimates</h4>
                {materials.map((mat) => (
                  <div key={mat.id} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Category:</span>
                      <span className="capitalize">{mat.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Weight:</span>
                      <span>{mat.weight} {mat.units}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Count / Qty:</span>
                      <span>{mat.quantity} units</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AUDIT OPERATIONS ACTIONS */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Technical Actions</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Site Inspection Scheduling */}
                <div className="p-5 border border-slate-100 rounded-2xl space-y-3 bg-white">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Schedule Inspection</span>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={inspectionDate}
                      onChange={(e) => setInspectionDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
                    />
                    <button
                      onClick={() => handleUpdateStatus('inspection_scheduled')}
                      disabled={!inspectionDate || loading}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                    >
                      Assign Inspector Date
                    </button>
                  </div>
                </div>

                {/* Operations Review Move */}
                <div className="p-5 border border-slate-100 rounded-2xl space-y-3 bg-white flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operational Audit</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateStatus('under_review')}
                      disabled={selectedRequest.status === 'under_review' || loading}
                      className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-[10px] transition-all"
                    >
                      Mark Under Review
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('quotation_pending')}
                      disabled={selectedRequest.status === 'quotation_pending' || loading}
                      className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-[10px] transition-all"
                    >
                      Mark Valuation
                    </button>
                  </div>
                </div>
              </div>

              {/* Commercial approval (Automated database project initialization) */}
              <div className="p-6 border border-emerald-900/10 bg-emerald-50/20 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">B2B Agreement Signed & Commercial Approval</h4>
                  <p className="text-[10px] text-emerald-800/70 mt-0.5">Spawns tracking files, assigning logistics and operations boards automatically.</p>
                </div>
                <button
                  onClick={handleApprove}
                  disabled={selectedRequest.status === 'approved' || loading}
                  className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-950 disabled:bg-emerald-900/30 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-1 flex-shrink-0"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Execute Approval</span>
                </button>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Compliance Audit rules</h3>
            <ul className="space-y-3 text-xs leading-relaxed text-slate-500 list-disc pl-4 font-medium">
              <li>Inspect if GST numbers match official tax logs.</li>
              <li>Telecom scrap containing circuitry requires double signature data-wiping clearance.</li>
              <li>Verify if scheduled pickup weight matches vehicle carrying capacity limits.</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // CASE B: QUEUE LIST VIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Request Queue Manager</h1>
        <p className="text-xs text-slate-500 mt-1">Audit incoming B2B scrap intake lists and commercial valuations</p>
      </div>

      {/* Queue List Table */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        {requests.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium space-y-3">
            <ClipboardCheck className="h-10 w-10 text-slate-200 mx-auto" />
            <p>Queue is empty. No active B2B requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="p-4">Request ID</th>
                  <th className="p-4">B2B Client</th>
                  <th className="p-4">Service Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-900 font-bold">#{req.id.substring(0, 8)}</td>
                    <td className="p-4 font-bold text-slate-900">{req.companies?.name}</td>
                    <td className="p-4 capitalize">{req.request_type.replace(/_/g, ' ')}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold capitalize ${getStatusBadge(req.status)}`}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/requests?review=${req.id}`}
                        className="inline-flex items-center text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm"
                      >
                        <span>Audit Workspace</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
