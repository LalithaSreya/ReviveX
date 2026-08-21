'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Wrench,
  Search,
  CheckCircle,
  AlertCircle,
  Shield,
  Activity,
  Cpu,
  Truck,
  Plus
} from 'lucide-react'

export default function AdminRepairPage() {
  const [loading, setLoading] = useState(true)
  const [repairs, setRepairs] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeStatus, setActiveStatus] = useState<string>('all')

  // Intake / Update states
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null)
  const [diagnosis, setDiagnosis] = useState('')
  const [warrantyMonths, setWarrantyMonths] = useState('6')
  const [sparePartsUsed, setSparePartsUsed] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Add intake form state
  const [showIntakeForm, setShowIntakeForm] = useState(false)
  const [newIntake, setNewIntake] = useState({
    projectId: '',
    productName: '',
    serialNumber: '',
    diagnosis: '',
  })
  const [projectsList, setProjectsList] = useState<any[]>([])

  const supabase = createClient()

  // Fetch Repairs & Projects
  const fetchRepairsData = async () => {
    setLoading(true)
    try {
      const { data: repList } = await supabase
        .from('repairs')
        .select('*, projects(*, requests(*, companies(*)))')

      if (repList && repList.length > 0) {
        setRepairs(repList)
      } else {
        // If empty, generate standard mock items so the dashboard is immediately reviewable with active items!
        const { data: projs } = await supabase.from('projects').select('id, title')
        if (projs && projs.length > 0) {
          const defaultRepairs = [
            {
              project_id: projs[0].id,
              product_name: 'Cisco Router ISR 4331',
              serial_number: 'SN-AIR-90182-X',
              diagnosis: 'Power supply failure due to voltage spike. Blown capacitors on secondary rail.',
              status: 'diagnosis',
              warranty_months: 12,
            },
            {
              project_id: projs[0].id,
              product_name: 'Industrial Ethernet Switch 24-Port',
              serial_number: 'SN-TEAL-88210-A',
              status: 'intake',
              diagnosis: '',
              warranty_months: 0,
            }
          ]
          for (const rep of defaultRepairs) {
            await supabase.from('repairs').insert(rep)
          }
          const { data: updatedReps } = await supabase
            .from('repairs')
            .select('*, projects(*, requests(*, companies(*)))')
          setRepairs(updatedReps || [])
        }
      }

      // Fetch projects for intake dropdown
      const { data: allProjs } = await supabase.from('projects').select('*, requests(*, companies(*))')
      setProjectsList(allProjs || [])
    } catch (err) {
      console.error('Error fetching repairs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRepairsData()
  }, [supabase])

  // Handle diagnostic notes, parts logs, and warranty assignments
  const handleUpdateRepair = async (repairId: string, nextStatus: string) => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const payload: any = { status: nextStatus }

      if (diagnosis) {
        payload.diagnosis = diagnosis
      }

      if (nextStatus === 'completed') {
        const start = new Date()
        const end = new Date()
        const months = parseInt(warrantyMonths) || 6
        end.setMonth(end.getMonth() + months)
        
        payload.warranty_months = months
        payload.warranty_start_date = start.toISOString().split('T')[0]
        payload.warranty_end_date = end.toISOString().split('T')[0]

        // Create log of spares used in database details if provided
        if (sparePartsUsed) {
          payload.diagnosis = `${diagnosis || ''}\n[Spares Used: ${sparePartsUsed}]`
        }
      }

      const { error } = await supabase
        .from('repairs')
        .update(payload)
        .eq('id', repairId)

      if (error) throw error

      setSuccessMsg(`Repair status advanced to: ${nextStatus.replace(/_/g, ' ')}`)
      setSelectedRepairId(null)
      setDiagnosis('')
      setSparePartsUsed('')
      await fetchRepairsData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Repair update failed.')
    } finally {
      setLoading(false)
    }
  }

  // Handle new B2B product intake
  const handleCreateIntake = async () => {
    if (!newIntake.projectId || !newIntake.productName) return
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const { error } = await supabase.from('repairs').insert({
        project_id: newIntake.projectId,
        product_name: newIntake.productName,
        serial_number: newIntake.serialNumber,
        diagnosis: newIntake.diagnosis,
        status: 'intake',
      })

      if (error) throw error

      setSuccessMsg('Intake completed. Item is logged in repair yard.')
      setShowIntakeForm(false)
      setNewIntake({ projectId: '', productName: '', serialNumber: '', diagnosis: '' })
      await fetchRepairsData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Intake creation failed.')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredList = () => {
    return repairs.filter((rep) => {
      const matchesSearch = rep.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || rep.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
      if (activeStatus === 'all') return matchesSearch
      return rep.status === activeStatus && matchesSearch
    })
  }

  if (loading && repairs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400 text-sm font-semibold">
        Loading technical diagnostic logs...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex justify-between items-center pb-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Repair & Refurbishment Yard</h1>
          <p className="text-xs text-slate-500 mt-1">Diagnose B2B routers, industrial machinery, and generate tracking codes</p>
        </div>
        <button
          onClick={() => setShowIntakeForm(!showIntakeForm)}
          className="inline-flex items-center space-x-1.5 text-xs font-bold bg-teal-900 hover:bg-teal-950 text-white px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Product Intake</span>
        </button>
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

      {/* Manual Product Intake Form */}
      {showIntakeForm && (
        <div className="p-6 border border-teal-900/10 bg-teal-50/20 rounded-3xl space-y-4 animate-fade-in text-xs font-semibold">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">Log Product Intake</h4>
            <button onClick={() => setShowIntakeForm(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-teal-950 uppercase">Associated B2B Project</label>
              <select
                value={newIntake.projectId}
                onChange={(e) => setNewIntake((p) => ({ ...p, projectId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700 font-semibold"
              >
                <option value="">Select Project...</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-teal-950 uppercase">Product Name</label>
              <input
                type="text"
                value={newIntake.productName}
                onChange={(e) => setNewIntake((p) => ({ ...p, productName: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
                placeholder="e.g. Cisco Switch 24-Port"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-teal-950 uppercase">Serial Number (SN)</label>
              <input
                type="text"
                value={newIntake.serialNumber}
                onChange={(e) => setNewIntake((p) => ({ ...p, serialNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
                placeholder="SN-XXX"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-teal-950 uppercase">Initial Diagnostic Symptom</label>
            <input
              type="text"
              value={newIntake.diagnosis}
              onChange={(e) => setNewIntake((p) => ({ ...p, diagnosis: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
              placeholder="e.g. Power LED does not light up"
            />
          </div>
          <button
            onClick={handleCreateIntake}
            disabled={!newIntake.projectId || !newIntake.productName}
            className="w-full py-2 bg-teal-900 hover:bg-teal-950 text-white font-bold rounded-xl shadow-sm transition-all"
          >
            Log Yard Intake
          </button>
        </div>
      )}

      {/* Diagnosis & Parts Adjustment overlay */}
      {selectedRepairId && (
        <div className="p-6 border border-teal-900/10 bg-teal-50/20 rounded-3xl space-y-4 animate-fade-in text-xs font-semibold">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">Update Diagnostic Ledger</h4>
            <button onClick={() => setSelectedRepairId(null)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-teal-950 uppercase">Detailed Diagnosis Notes</label>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
                placeholder="Blown fuse on primary, diagnostic tests completed..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-teal-950 uppercase">Spare Parts Used</label>
                <input
                  type="text"
                  value={sparePartsUsed}
                  onChange={(e) => setSparePartsUsed(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
                  placeholder="e.g. 2x 470uF Capacitors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-teal-950 uppercase">Warranty Months (Post Repair)</label>
                <input
                  type="number"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdateRepair(selectedRepairId, 'repairing')}
              className="flex-1 py-2 bg-teal-900 hover:bg-teal-950 text-white font-bold rounded-xl shadow-sm transition-all"
            >
              Mark Repairing
            </button>
            <button
              onClick={() => handleUpdateRepair(selectedRepairId, 'completed')}
              className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-sm transition-all"
            >
              Certify Completed (Warranty Issued)
            </button>
          </div>
        </div>
      )}

      {/* Toolbar Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-sm bg-white rounded-xl shadow-sm border border-slate-100 flex-1">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search diagnostic log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-teal-600 rounded-xl"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-100 self-start text-xs font-bold shadow-sm overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Jobs' },
            { id: 'intake', label: 'Intake' },
            { id: 'diagnosis', label: 'Diagnosis' },
            { id: 'repairing', label: 'Repairing' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={`py-1.5 px-3 rounded-lg transition-all whitespace-nowrap ${
                activeStatus === tab.id
                  ? 'bg-teal-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Repair cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredList().map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[9px] bg-slate-50 text-slate-500 font-extrabold px-2 py-0.5 rounded border border-slate-200 uppercase">
                  #{item.id.substring(0, 6)}
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded border text-[8px] font-extrabold uppercase ${
                  item.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  {item.status}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 leading-tight">{item.product_name}</h4>
                <span className="text-[10px] text-slate-400 font-semibold block pt-0.5">SN: {item.serial_number || 'N/A'}</span>
              </div>

              <div className="bg-slate-50/50 p-4 border border-slate-50 rounded-xl space-y-2 text-[11px] font-medium text-slate-600">
                <div>
                  <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider block">Diagnosis:</span>
                  <p className="mt-0.5 leading-relaxed text-slate-700">{item.diagnosis || 'Pending initial diagnostics'}</p>
                </div>
                {item.warranty_months > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center space-x-1.5 text-emerald-800">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Warranty: {item.warranty_months} Months Issued</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {item.status === 'intake' && (
                <button
                  onClick={() => {
                    setSelectedRepairId(item.id)
                    setDiagnosis('Initial diagnosis: ')
                  }}
                  className="w-full py-2 bg-teal-900 hover:bg-teal-950 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  Start Diagnostic Review
                </button>
              )}
              {item.status === 'diagnosis' && (
                <button
                  onClick={() => setSelectedRepairId(item.id)}
                  className="w-full py-2 bg-teal-900 hover:bg-teal-950 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  Configure Repair Action
                </button>
              )}
              {item.status === 'repairing' && (
                <button
                  onClick={() => {
                    setSelectedRepairId(item.id)
                    setDiagnosis(item.diagnosis || '')
                  }}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  Certify Restoration
                </button>
              )}
              {item.status === 'completed' && (
                <button
                  onClick={() => handleUpdateRepair(item.id, 'delivered')}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center space-x-1"
                >
                  <Truck className="h-3.5 w-3.5" />
                  <span>Dispatch Delivery</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
