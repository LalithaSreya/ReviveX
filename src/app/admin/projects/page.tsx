'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FolderLock,
  User,
  Calendar,
  Building,
  CheckCircle,
  PlusCircle,
  AlertCircle,
  Dot,
  FileCheck
} from 'lucide-react'

export default function AdminProjectsPage() {
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  
  // Assignment overlay/overlay states
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [assigneeId, setAssigneeId] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch Projects & Staff
  useEffect(() => {
    const fetchProjectsData = async () => {
      setLoading(true)
      try {
        const { data: projs } = await supabase
          .from('projects')
          .select('*, requests(*, companies(*)), profiles(*)')
          .order('created_at', { ascending: false })

        setProjects(projs || [])

        // Fetch staff candidates (role !== client_user)
        const { data: staff } = await supabase
          .from('profiles')
          .select('*')
          .neq('role', 'client_user')
        setStaffList(staff || [])
      } catch (err) {
        console.error('Error fetching admin projects:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectsData()
  }, [supabase])

  // Handle staff assignment
  const handleAssignStaff = async () => {
    if (!selectedProjectId || !assigneeId) return
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const { error } = await supabase
        .from('projects')
        .update({ assigned_staff_id: assigneeId })
        .eq('id', selectedProjectId)

      if (error) throw error

      setSuccessMsg('Staff executive successfully assigned to project.')
      
      // Update local state
      const assignedStaff = staffList.find((s) => s.id === assigneeId)
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProjectId ? { ...p, assigned_staff_id: assigneeId, profiles: assignedStaff } : p
        )
      )
      setSelectedProjectId(null)
      setAssigneeId('')
    } catch (err: any) {
      setErrorMsg(err.message || 'Staff assignment failed.')
    } finally {
      setLoading(false)
    }
  }

  // Handle status update (Active -> Completed -> Closed)
  const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId)

      if (error) throw error

      setSuccessMsg(`Project status updated to: ${newStatus}`)
      
      // Sync Request status as well if completed or closed
      const project = projects.find((p) => p.id === projectId)
      if (project?.requests?.id) {
        const correspondingRequestStatus = newStatus === 'completed' ? 'completed' : newStatus === 'closed' ? 'closed' : 'in_progress'
        await supabase
          .from('requests')
          .update({ status: correspondingRequestStatus })
          .eq('id', project.requests.id)
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      )
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update project status.')
    } finally {
      setLoading(false)
    }
  }

  if (loading && projects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400 text-sm font-semibold">
        Loading project tracking sheets...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Projects Control Center</h1>
        <p className="text-xs text-slate-500 mt-1">Assign relationship executives and oversee ongoing e-waste recycling operations</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-2 text-red-700 text-xs font-medium">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-2 text-emerald-800 text-xs font-medium">
          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Staff assignment overlay widget */}
      {selectedProjectId && (
        <div className="p-6 border border-teal-900/10 bg-teal-50/20 rounded-3xl space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">Assign Operations Executive</h4>
            <button
              onClick={() => setSelectedProjectId(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700 font-semibold flex-1"
            >
              <option value="">Select Staff Member...</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.role.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignStaff}
              disabled={!assigneeId}
              className="px-5 py-2 bg-teal-900 hover:bg-teal-950 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
            >
              Confirm Assignment
            </button>
          </div>
        </div>
      )}

      {/* Grid view of projects */}
      <div className="grid md:grid-cols-2 gap-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{proj.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Project ID: #{proj.id.substring(0, 8)}</p>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold capitalize ${
                  proj.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {proj.status}
                </span>
              </div>

              {/* Company Info Block */}
              <div className="flex items-center space-x-3 bg-slate-50/50 p-4 border border-slate-50 rounded-2xl text-xs font-semibold text-slate-700">
                <Building className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">B2B Onboarded Client</span>
                  <span className="text-slate-800 font-bold truncate block">{proj.requests?.companies?.name}</span>
                </div>
              </div>

              {/* Assignment details */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-600">
                    Staff Assigned: <span className="text-slate-800 font-bold">{proj.profiles?.full_name || 'Unassigned'}</span>
                  </span>
                </div>
                <button
                  onClick={() => setSelectedProjectId(proj.id)}
                  className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 px-2 py-1 rounded-lg font-bold"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-50 flex justify-between gap-2">
              <button
                onClick={() => handleUpdateProjectStatus(proj.id, 'completed')}
                disabled={proj.status === 'completed' || proj.status === 'closed'}
                className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
              >
                Mark Completed
              </button>
              <button
                onClick={() => handleUpdateProjectStatus(proj.id, 'closed')}
                disabled={proj.status === 'closed'}
                className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
              >
                Close Project
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
