'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  FolderLock,
  ClipboardList,
  Calendar,
  IndianRupee,
  Package,
  ArrowUpRight,
  TrendingUp,
  Truck,
  CheckCircle2,
  Clock
} from 'lucide-react'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClients: 0,
    activeProjects: 0,
    pendingRequests: 0,
    totalInventoryWeight: 0,
  })
  const [pendingRequestsList, setPendingRequestsList] = useState<any[]>([])
  const [logisticsSchedule, setLogisticsSchedule] = useState<any[]>([])
  
  const supabase = createClient()

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        // 1. Fetch Companies (Clients)
        const { data: companies } = await supabase.from('companies').select('id')
        const clientsCount = companies?.length || 0

        // 2. Fetch Active Projects
        const { data: projs } = await supabase
          .from('projects')
          .select('id')
          .eq('status', 'active')
        const activeProjsCount = projs?.length || 0

        // 3. Fetch Pending Requests
        const { data: reqs } = await supabase
          .from('requests')
          .select('*, companies(*)')
          .in('status', ['submitted', 'under_review', 'quotation_pending'])
          .order('created_at', { ascending: false })
        
        const pendingReqsCount = reqs?.length || 0
        setPendingRequestsList((reqs || []).slice(0, 5))

        // 4. Fetch Inventory weights sum
        const { data: inv } = await supabase.from('inventory').select('weight')
        const totalWeight = inv?.reduce((acc, curr) => acc + (parseFloat(curr.weight) || 0), 0) || 0

        // 5. Fetch Scheduled Collections for Logistics feed
        const { data: colls } = await supabase
          .from('collections')
          .select('*, projects(*, requests(*, companies(*)))')
          .eq('status', 'scheduled')
          .order('scheduled_date', { ascending: true })

        setLogisticsSchedule(colls || [])

        setStats({
          totalClients: clientsCount,
          activeProjects: activeProjsCount,
          pendingRequests: pendingReqsCount,
          totalInventoryWeight: totalWeight,
        })
      } catch (err) {
        console.error('Error fetching admin dashboard statistics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminStats()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400 text-sm font-semibold">
        Loading administrative metrics...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Operations Control</h1>
        <p className="text-xs text-slate-500 mt-1">Supervise B2B requests, pickup logs, segregation yards, and recycling audits</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Registered Clients', val: stats.totalClients, icon: Users, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Active Projects', val: stats.activeProjects, icon: FolderLock, color: 'text-teal-700', bg: 'bg-teal-50' },
          { label: 'Pending Requests', val: stats.pendingRequests, icon: ClipboardList, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Inventory Stocked', val: `${stats.totalInventoryWeight.toLocaleString()} kg`, icon: Package, color: 'text-cyan-700', bg: 'bg-cyan-50' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-slate-900">{item.val}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* QUICK METRICS & REVENUE */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Commercial Revenue</span>
            <h4 className="text-xl font-bold text-slate-800 flex items-center">
              <IndianRupee className="h-4 w-4 mr-0.5" />
              <span>4,52,000</span>
            </h4>
            <span className="text-[9px] text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" /> +12.4% vs last month
            </span>
          </div>
          <div className="p-3 rounded-full bg-emerald-50 text-emerald-700">
            <IndianRupee className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Recycling Rate</span>
            <h4 className="text-xl font-bold text-slate-800">92.4%</h4>
            <span className="text-[9px] text-slate-400 font-semibold">ISO 14001 Target: 90%</span>
          </div>
          <div className="p-3 rounded-full bg-teal-50 text-teal-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Today\'s Pickups</span>
            <h4 className="text-xl font-bold text-slate-800">{logisticsSchedule.length} active</h4>
            <span className="text-[9px] text-slate-400 font-semibold">GPS fleet tracked</span>
          </div>
          <div className="p-3 rounded-full bg-cyan-50 text-cyan-700">
            <Truck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* OPERATIONS FEED */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Pending Requests Column */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Awaiting Reviews</h3>
            <Link
              href="/admin/requests"
              className="text-xs font-semibold text-teal-700 hover:underline flex items-center space-x-0.5"
            >
              <span>Verify Queue</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {pendingRequestsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-2">
              <p>Request queue is empty.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequestsList.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-4 border border-slate-50 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{req.companies?.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 capitalize">
                      {req.request_type.replace(/_/g, ' ')} • Preferred: {req.preferred_date || 'TBD'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200 capitalize">
                      {req.status}
                    </span>
                    <Link
                      href={`/admin/requests?review=${req.id}`}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-2 py-1 rounded-lg font-bold"
                    >
                      Audit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logistics Schedule Feed */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center">
              <Calendar className="h-4.5 w-4.5 mr-2 text-teal-800" />
              <span>Logistics Schedule</span>
            </h3>
            <Link
              href="/admin/operations"
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              Dispatch Control
            </Link>
          </div>

          {logisticsSchedule.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-2">
              <p>No pickups scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logisticsSchedule.map((coll) => (
                <div key={coll.id} className="flex items-start space-x-3 text-xs border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-700 flex-shrink-0">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h5 className="font-bold text-slate-800 truncate">
                        {coll.projects?.requests?.companies?.name || 'Client pickup'}
                      </h5>
                      <span className="text-[8px] bg-teal-100 text-teal-800 font-extrabold px-1 py-0.5 rounded uppercase flex items-center">
                        <Clock className="h-2.5 w-2.5 mr-0.5" /> Scheduled
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px]">
                      Vehicle: {coll.vehicle_number || 'TBD'} • Driver: {coll.driver_name || 'TBD'}
                    </p>
                    <span className="text-[8px] text-slate-400 font-bold block pt-1 uppercase">
                      Date: {new Date(coll.scheduled_date).toLocaleDateString()}
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
