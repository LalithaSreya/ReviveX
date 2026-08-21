'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Truck,
  Layers,
  Search,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Activity,
  Plus
} from 'lucide-react'

export default function AdminOperationsPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'logistics' | 'materials'>('logistics')
  const [collections, setCollections] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])

  // Scheduling states
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [scheduledDate, setScheduledDate] = useState('')
  const [driverName, setDriverName] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch Collections and Materials
  const fetchOperationsData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Collections
      const { data: colls } = await supabase
        .from('collections')
        .select('*, projects(*, requests(*, companies(*)))')
      setCollections(colls || [])

      // If collections are empty, let's auto-create some records based on approved requests for demonstration!
      // This is a great touch that keeps the mock yards filled for client inspection.
      const { data: projects } = await supabase.from('projects').select('id')
      if (projects && projects.length > 0 && (!colls || colls.length === 0)) {
        for (const proj of projects) {
          await supabase.from('collections').insert({
            project_id: proj.id,
            status: 'scheduled',
            driver_name: 'Rajesh Kumar',
            vehicle_number: 'MH-12-PQ-9081',
          }).select()
        }
        // Refetch
        const { data: updatedColls } = await supabase
          .from('collections')
          .select('*, projects(*, requests(*, companies(*)))')
        setCollections(updatedColls || [])
      }

      // 2. Fetch Materials
      const { data: mats } = await supabase
        .from('materials')
        .select('*, requests(*, companies(*))')
      setMaterials(mats || [])
    } catch (err) {
      console.error('Error fetching operations logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOperationsData()
  }, [supabase])

  // Schedule pickup
  const handleSchedulePickup = async () => {
    if (!schedulingId || !scheduledDate || !driverName || !vehicleNumber) return
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const { error } = await supabase
        .from('collections')
        .update({
          scheduled_date: new Date(scheduledDate).toISOString(),
          driver_name: driverName,
          vehicle_number: vehicleNumber,
          status: 'in_transit',
        })
        .eq('id', schedulingId)

      if (error) throw error

      setSuccessMsg('Logistics scheduled! Truck is marked in transit.')
      setSchedulingId(null)
      setDriverName('')
      setVehicleNumber('')
      setScheduledDate('')
      await fetchOperationsData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Logistics schedule failed.')
    } finally {
      setLoading(false)
    }
  }

  // Update logistics status
  const handleUpdateLogisticsStatus = async (collectionId: string, newStatus: string) => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const payload: any = { status: newStatus }
      if (newStatus === 'collected') {
        payload.collected_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('collections')
        .update(payload)
        .eq('id', collectionId)

      if (error) throw error

      setSuccessMsg(`Logistics status marked as: ${newStatus}`)
      
      // Update request status correspondingly
      const coll = collections.find((c) => c.id === collectionId)
      if (coll?.projects?.requests?.id) {
        const correspondingRequestStatus = newStatus === 'collected' ? 'material_collected' : 'pickup_scheduled'
        await supabase
          .from('requests')
          .update({ status: correspondingRequestStatus })
          .eq('id', coll.projects.requests.id)
      }

      await fetchOperationsData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Logistics status update failed.')
    } finally {
      setLoading(false)
    }
  }

  // Segregate material & select processing path
  const handleSegregateMaterial = async (materialId: string, segregationStatus: string, processingPath: string) => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const { error } = await supabase
        .from('materials')
        .update({
          segregation_status: segregationStatus,
          processing_path: processingPath,
        })
        .eq('id', materialId)

      if (error) throw error

      setSuccessMsg('Materials sorted and path declared! Inventory records updated.')
      
      // Update request status correspondingly if segregated
      const mat = materials.find((m) => m.id === materialId)
      if (mat?.request_id) {
        const correspondingRequestStatus = segregationStatus === 'segregated' ? 'under_processing' : 'material_collected'
        await supabase
          .from('requests')
          .update({ status: correspondingRequestStatus })
          .eq('id', mat.request_id)
      }

      await fetchOperationsData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Material segregation failed.')
    } finally {
      setLoading(false)
    }
  }

  if (loading && collections.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400 text-sm font-semibold">
        Loading operations dashboard...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Logistics & Yard Operations</h1>
        <p className="text-xs text-slate-500 mt-1">Schedule driver routes and manage recycling segregation paths</p>
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

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-100 self-start text-xs font-bold shadow-sm max-w-[320px]">
        {[
          { id: 'logistics', label: 'Logistics Control' },
          { id: 'materials', label: 'Segregation Yard' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-4 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-teal-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==========================================
          TAB 1: LOGISTICS CONTROL PANEL
          ========================================== */}
      {activeTab === 'logistics' && (
        <div className="space-y-6">
          {/* Scheduling Overlay panel */}
          {schedulingId && (
            <div className="p-6 border border-teal-900/10 bg-teal-50/20 rounded-3xl space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">Schedule Pickup Dispatch</h4>
                <button
                  onClick={() => setSchedulingId(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Cancel
                </button>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-teal-950 uppercase">Driver Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-teal-950 uppercase">Vehicle Number</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
                    placeholder="e.g. MH-12-PQ-9081"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-teal-950 uppercase">Pickup Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
                  />
                </div>
              </div>
              <button
                onClick={handleSchedulePickup}
                disabled={!driverName || !vehicleNumber || !scheduledDate}
                className="w-full py-2 bg-teal-900 hover:bg-teal-950 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
              >
                Dispatch Fleet Truck
              </button>
            </div>
          )}

          {/* Logistics list */}
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="p-4">B2B Client</th>
                  <th className="p-4">Scheduled Date</th>
                  <th className="p-4">Driver details</th>
                  <th className="p-4">Logistics Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {collections.map((coll) => (
                  <tr key={coll.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">
                        {coll.projects?.requests?.companies?.name || 'Client pickup'}
                      </span>
                      <span className="text-[10px] text-slate-400">Project: #{coll.project_id.substring(0, 8)}</span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {coll.scheduled_date ? new Date(coll.scheduled_date).toLocaleDateString() : 'Unscheduled'}
                    </td>
                    <td className="p-4">
                      {coll.driver_name ? (
                        <div>
                          <span className="font-bold text-slate-800 block">{coll.driver_name}</span>
                          <span className="text-[10px] text-slate-400">{coll.vehicle_number}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending schedule</span>
                      )}
                    </td>
                    <td className="p-4 capitalize">
                      <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-bold">
                        {coll.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {coll.status === 'scheduled' && (
                        <button
                          onClick={() => setSchedulingId(coll.id)}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-2 py-1.5 rounded-lg font-bold"
                        >
                          Schedule Dispatch
                        </button>
                      )}
                      {coll.status === 'in_transit' && (
                        <button
                          onClick={() => handleUpdateLogisticsStatus(coll.id, 'collected')}
                          className="bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 px-2.5 py-1.5 rounded-lg font-bold"
                        >
                          Mark Collected
                        </button>
                      )}
                      {coll.status === 'collected' && (
                        <button
                          onClick={() => handleUpdateLogisticsStatus(coll.id, 'verified')}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-2.5 py-1.5 rounded-lg font-bold"
                        >
                          Verify weights
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: MATERIAL SEGREGATION YARD
          ========================================== */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="p-4">Material Category</th>
                  <th className="p-4">Estimated Weight</th>
                  <th className="p-4">Segregation status</th>
                  <th className="p-4">Processing Path</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {materials.map((mat) => (
                  <tr key={mat.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block capitalize">{mat.category.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[200px] block">Client: {mat.requests?.companies?.name}</span>
                    </td>
                    <td className="p-4 text-slate-500 font-semibold">
                      {mat.weight} {mat.units} ({mat.quantity} items)
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                        mat.segregation_status === 'segregated'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {mat.segregation_status}
                      </span>
                    </td>
                    <td className="p-4 capitalize text-slate-600">
                      {mat.processing_path ? mat.processing_path.replace(/_/g, ' ') : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {mat.segregation_status === 'pending' && (
                        <div className="inline-flex space-x-1">
                          <button
                            onClick={() => handleSegregateMaterial(mat.id, 'segregated', 'recycling_disposal')}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 px-2 py-1 rounded-lg font-bold text-[10px]"
                          >
                            Recycle Path
                          </button>
                          <button
                            onClick={() => handleSegregateMaterial(mat.id, 'segregated', 'repairing_refurbishment')}
                            className="bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-200 px-2 py-1 rounded-lg font-bold text-[10px]"
                          >
                            Refurbish Path
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
