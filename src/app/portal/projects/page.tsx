'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  FolderOpen,
  Calendar,
  Layers,
  ArrowUpRight,
  ClipboardList,
  Wrench,
  CheckCircle,
  Clock,
  User
} from 'lucide-react'

export default function ProjectsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'tender'>('active')
  
  const supabase = createClient()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, companies(*)')
          .eq('id', user.id)
          .single()

        if (!profileData) return
        setProfile(profileData)

        // Query projects related to user's B2B company requests
        const { data: projs, error } = await supabase
          .from('projects')
          .select('*, requests!inner(*), profiles(*)')
          .eq('requests.company_id', profileData.company_id)

        if (projs) {
          setProjects(projs)
        }
      } catch (err) {
        console.error('Error fetching projects:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [supabase])

  const activeProjects = projects.filter((p) => p.status === 'active')
  const completedProjects = projects.filter((p) => p.status === 'completed' || p.status === 'closed')
  const tenderProjects = projects.filter((p) => p.requests?.request_type === 'tender_project')

  const getFilteredList = () => {
    if (activeTab === 'active') return activeProjects
    if (activeTab === 'completed') return completedProjects
    return tenderProjects
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400 text-sm font-semibold">
        Loading project tracking sheets...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-extrabold text-emerald-950">Circular Asset Projects</h1>
        <p className="text-xs text-slate-500 mt-1">Lifecycle monitoring of your company\'s active recycling, refurbishment, and tender programs</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        {[
          { id: 'active', label: `Active Programs (${activeProjects.length})` },
          { id: 'completed', label: `Completed Programs (${completedProjects.length})` },
          { id: 'tender', label: `Tender Projects (${tenderProjects.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-4 -mb-px border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-emerald-700 text-emerald-950 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid List */}
      <div className="grid md:grid-cols-2 gap-6">
        {getFilteredList().length === 0 ? (
          <div className="md:col-span-2 bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 text-xs font-medium space-y-3">
            <FolderOpen className="h-10 w-10 text-slate-200 mx-auto" />
            <p>No projects in this category.</p>
          </div>
        ) : (
          getFilteredList().map((proj) => (
            <div
              key={proj.id}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">{proj.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Project ID: #{proj.id.substring(0, 8)}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    proj.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {proj.status === 'active' ? (
                      <Clock className="h-3 w-3 mr-1" />
                    ) : (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    <span className="capitalize">{proj.status}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs font-medium">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Service Type</span>
                    <p className="text-slate-700 capitalize">{proj.requests?.request_type.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Initiated On</span>
                    <p className="text-slate-700 flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      {new Date(proj.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {proj.profiles && (
                  <div className="flex items-center space-x-3 text-xs p-1">
                    <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                      {proj.profiles.full_name?.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Assigned Executive</span>
                      <span className="font-bold text-slate-800 text-xs">{proj.profiles.full_name}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                <Link
                  href={`/portal/requests?track=${proj.requests?.id}`}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                >
                  <span>View Operations Timeline</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
