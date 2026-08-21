'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FileCheck,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Download,
  AlertCircle,
  CheckCircle,
  FileText,
  Boxes,
  Briefcase
} from 'lucide-react'

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [projectsList, setProjectsList] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])

  // Generator states
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [docType, setDocType] = useState('recycling_certificate')
  const [docName, setDocName] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch Projects and Documents
  const fetchReportsData = async () => {
    setLoading(true)
    try {
      // 1. Fetch projects
      const { data: projs } = await supabase
        .from('projects')
        .select('*, requests(*, companies(*))')
      setProjectsList(projs || [])

      // 2. Fetch documents
      const { data: docs } = await supabase
        .from('documents')
        .select('*, projects(*, requests(*, companies(*)))')
        .order('created_at', { ascending: false })
      setDocuments(docs || [])
    } catch (err) {
      console.error('Error fetching reports data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportsData()
  }, [supabase])

  // Handle generation of documents (Inserts record in DB and updates lists)
  const handleGenerateDocument = async () => {
    if (!selectedProjectId || !docType) return
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const project = projectsList.find((p) => p.id === selectedProjectId)
      if (!project) throw new Error('Selected project is invalid.')

      const companyName = project.requests?.companies?.name || 'Client'
      const generatedName = docName || `${docType.replace(/_/g, ' ').toUpperCase()} - ${companyName}`

      const { data: newDoc, error } = await supabase
        .from('documents')
        .insert({
          project_id: selectedProjectId,
          request_id: project.requests?.id,
          name: generatedName,
          type: docType,
          file_url: '#',
        })
        .select()
        .single()

      if (error) throw error

      setSuccessMsg(`Document generated: "${generatedName}". Linked to B2B portal.`)
      setSelectedProjectId('')
      setDocName('')
      await fetchReportsData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Document generation failed.')
    } finally {
      setLoading(false)
    }
  }

  // Simulated download trigger
  const triggerDownload = (doc: any) => {
    const company = doc.projects?.requests?.companies?.name || 'B2B Client'
    const gst = doc.projects?.requests?.companies?.gst_number || 'N/A'
    
    const content = `==================================================
                 REVIVEX COMPLIANCE CERTIFICATE
==================================================
Document: ${doc.name}
Category: ${doc.type.replace(/_/g, ' ').toUpperCase()}
B2B Client: ${company}
Client GSTIN: ${gst}
Audited Date: ${new Date(doc.created_at).toLocaleDateString()}
Status: VERIFIED & GOVERNMENT AUTHORIZED

This certifies that e-waste/scrap materials from the specified
B2B client yard have been safely collected, segregated, and
processed in strict accordance with the E-Waste Rules 2022
and ISO 14001 environmental standards.

Authorized Signatory
ReviveX Compliance Yard Division
==================================================
`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${doc.name.replace(/\s+/g, '_').toLowerCase()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading && documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400 text-sm font-semibold">
        Loading reports generator...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Reports & Certificates Center</h1>
        <p className="text-xs text-slate-500 mt-1">Generate ISO-compliant destruction certificates and carbon-offset reports for clients</p>
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

      {/* GENERATOR BUILDER PANEL */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-xs font-semibold">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center">
          <FileCheck className="h-4.5 w-4.5 mr-2 text-teal-800" />
          <span>Compliance Document Builder</span>
        </h3>
        
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Project dropdown */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Select Target Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700 font-semibold"
            >
              <option value="">Select B2B Program...</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Document Type select */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Document Template Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700 font-semibold"
            >
              <option value="recycling_certificate">ISO Recycling Certificate</option>
              <option value="collection_receipt">Collection Receipt</option>
              <option value="weight_report">Sorting Weights Report</option>
              <option value="warranty_info">Equipment Warranty Certificate</option>
              <option value="invoice">B2B Tax Invoice</option>
              <option value="project_completion_report">Project Completion Report</option>
            </select>
          </div>

          {/* Custom Name input */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Custom Document Name (Optional)</label>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
              placeholder="Leave blank for auto-naming"
            />
          </div>
        </div>

        <button
          onClick={handleGenerateDocument}
          disabled={!selectedProjectId || loading}
          className="w-full py-3 bg-teal-900 hover:bg-teal-950 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5"
        >
          <span>Generate Certificate Document</span>
        </button>
      </div>

      {/* GENERATED ARCHIVES */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Document Registry Archives</h3>
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm text-xs">
          {documents.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium space-y-3">
              <FileText className="h-10 w-10 text-slate-200 mx-auto" />
              <p>Registry is empty. No documents generated.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="p-4">Document Title</th>
                    <th className="p-4">B2B Client</th>
                    <th className="p-4">Generated Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{doc.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize">Template: {doc.type.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {doc.projects?.requests?.companies?.name || 'Client Onboarding'}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => triggerDownload(doc)}
                          className="inline-flex items-center space-x-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Retrieve File</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
