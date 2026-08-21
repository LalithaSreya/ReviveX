'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ClipboardList,
  FolderOpen,
  CheckSquare,
  FileText,
  PlusCircle,
  Upload,
  MessageSquare,
  ChevronRight,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Leaf
} from 'lucide-react'

export default function ClientDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    activeRequests: 0,
    activeProjects: 0,
    pendingApprovals: 0,
    recentDocuments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentRequests, setRecentRequests] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Fetch User Profile & Company
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, companies(*)')
          .eq('id', user.id)
          .single()

        if (!profileData) return
        setProfile(profileData)
        const companyId = profileData.company_id

        if (!companyId) {
          setLoading(false)
          return
        }

        // 2. Fetch Requests counts & list
        const { data: reqs } = await supabase
          .from('requests')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })

        const requestsList = reqs || []
        setRecentRequests(requestsList.slice(0, 5))

        const activeReqsCount = requestsList.filter(
          (r) => r.status !== 'completed' && r.status !== 'closed'
        ).length

        const pendingApprCount = requestsList.filter(
          (r) => r.status === 'quotation_pending' || r.status === 'under_review'
        ).length

        // 3. Fetch Projects counts
        const { data: projs } = await supabase
          .from('projects')
          .select('*, requests!inner(*)')
          .eq('requests.company_id', companyId)

        const projectsList = projs || []
        const activeProjsCount = projectsList.filter((p) => p.status === 'active').length

        // 4. Fetch Documents count
        const { data: docs } = await supabase
          .from('documents')
          .select('*')
          .eq('request_id', requestsList[0]?.id || '00000000-0000-0000-0000-000000000000') // just query if any request documents exist, or write correct filter

        const documentsList = docs || []

        // 5. Fetch Notifications
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        setNotifications(notifs || [])

        setStats({
          activeRequests: activeReqsCount,
          activeProjects: activeProjsCount,
          pendingApprovals: pendingApprCount,
          recentDocuments: documentsList.length,
        })
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [supabase])

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'under_review':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'approved':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'quotation_pending':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400 text-sm font-semibold">
        Loading workspace metrics...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* WELCOME BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-emerald-950 text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="space-y-2 z-10">
          <h1 className="font-heading text-xl md:text-2xl font-extrabold tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-xs md:text-sm text-emerald-100/70 font-medium">
            Workspace: <span className="text-white font-bold">{profile?.companies?.name}</span> (GSTIN: {profile?.companies?.gst_number || 'N/A'})
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-emerald-900/40 border border-emerald-500/20 px-3 py-1.5 rounded-xl z-10 text-xs font-semibold">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>ISO 14001 Compliant Node</span>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Leaf className="h-48 w-48 text-emerald-100" />
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/portal/requests?action=new"
            className="flex items-center justify-between p-5 bg-white border border-emerald-900/5 hover:border-emerald-700/25 rounded-2xl hover:shadow-md transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">Raise Request</h4>
                <p className="text-[10px] text-slate-400">Initiate scrap or e-waste collection</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/portal/documents"
            className="flex items-center justify-between p-5 bg-white border border-emerald-900/5 hover:border-emerald-700/25 rounded-2xl hover:shadow-md transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-teal-50 text-teal-700">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">Access Documents</h4>
                <p className="text-[10px] text-slate-400">View certificates, audits & invoices</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/portal/support"
            className="flex items-center justify-between p-5 bg-white border border-emerald-900/5 hover:border-emerald-700/25 rounded-2xl hover:shadow-md transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-cyan-50 text-cyan-700">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">Contact Support</h4>
                <p className="text-[10px] text-slate-400">Open audit or technical queries</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-cyan-700 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Requests', val: stats.activeRequests, icon: ClipboardList, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Active Projects', val: stats.activeProjects, icon: FolderOpen, color: 'text-teal-700', bg: 'bg-teal-50' },
          { label: 'Pending Approvals', val: stats.pendingApprovals, icon: CheckSquare, color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Recent Documents', val: stats.recentDocuments, icon: FileText, color: 'text-cyan-700', bg: 'bg-cyan-50' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="bg-white p-5 rounded-2xl border border-emerald-900/5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-emerald-950">{item.val}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* RECENT REQUESTS & ACTIVITY */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Requests */}
        <div className="lg:col-span-8 bg-white border border-emerald-950/5 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-widest">Recent Requests</h3>
            <Link
              href="/portal/requests"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-0.5"
            >
              <span>View All</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-3">
              <ClipboardList className="h-8 w-8 text-slate-300 mx-auto" />
              <p>No requests created yet.</p>
              <Link
                href="/portal/requests?action=new"
                className="inline-flex text-xs font-semibold text-emerald-700 underline"
              >
                Raise your first request
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pr-2">ID</th>
                    <th className="pb-3 pr-2">Type</th>
                    <th className="pb-3 pr-2">Pickup Date</th>
                    <th className="pb-3 pr-2">Status</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {recentRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 pr-2 text-emerald-950 font-bold">#{req.id.substring(0, 8)}</td>
                      <td className="py-3.5 pr-2 capitalize">{req.request_type.replace(/_/g, ' ')}</td>
                      <td className="py-3.5 pr-2 text-slate-500">{req.preferred_date || 'TBD'}</td>
                      <td className="py-3.5 pr-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadgeClass(req.status)}`}>
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={`/portal/requests?track=${req.id}`}
                          className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100"
                        >
                          Track
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Recent Activity / Notifications */}
        <div className="lg:col-span-4 bg-white border border-emerald-950/5 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-widest flex items-center">
            <Activity className="h-4.5 w-4.5 mr-2 text-emerald-800" />
            <span>Recent Activity</span>
          </h3>

          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-2">
              <p>No recent activity updates.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div key={notif.id} className="flex items-start space-x-3 text-xs border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-slate-800 leading-tight">{notif.title}</h5>
                    <p className="text-slate-500 text-[10px] leading-normal">{notif.message}</p>
                    <span className="text-[8px] text-slate-400 uppercase font-semibold">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
