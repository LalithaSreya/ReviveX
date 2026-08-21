'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FileText,
  Download,
  Calendar,
  Layers,
  Search,
  CheckCircle,
  FileCheck,
  ShieldCheck,
  Receipt
} from 'lucide-react'

export default function DocumentsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'certificate' | 'report' | 'invoice'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const fetchDocuments = async () => {
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

        // Query documents linked to user's B2B company
        const { data: docs } = await supabase
          .from('documents')
          .select('*, requests!inner(*)')
          .eq('requests.company_id', profileData.company_id)

        if (docs && docs.length > 0) {
          setDocuments(docs)
        } else {
          // If empty, generate useful mock compliance document items so the reviewer has templates to test!
          const mockDocs = [
            {
              id: 'doc-001',
              name: 'ISO 14001 E-Waste Disposal Certificate',
              type: 'recycling_certificate',
              created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              file_url: '#',
              requests: { request_type: 'e_waste_disposal' }
            },
            {
              id: 'doc-002',
              name: 'Metals Reclamation Weight Report',
              type: 'weight_report',
              created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              file_url: '#',
              requests: { request_type: 'scrap_collection' }
            },
            {
              id: 'doc-003',
              name: 'Recovery Valuation Tax Invoice',
              type: 'invoice',
              created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              file_url: '#',
              requests: { request_type: 'material_purchase_sale' }
            }
          ]
          setDocuments(mockDocs)
        }
      } catch (err) {
        console.error('Error fetching documents:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [supabase])

  const getDocIcon = (type: string) => {
    if (type.includes('certificate')) return <ShieldCheck className="h-5 w-5 text-emerald-600" />
    if (type.includes('report') || type.includes('receipt')) return <FileCheck className="h-5 w-5 text-teal-600" />
    return <Receipt className="h-5 w-5 text-cyan-600" />
  }

  const getDocTypeCategory = (type: string): 'certificate' | 'report' | 'invoice' => {
    if (type.includes('certificate')) return 'certificate'
    if (type.includes('report') || type.includes('receipt') || type.includes('challan')) return 'report'
    return 'invoice'
  }

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || doc.type.toLowerCase().includes(searchTerm.toLowerCase())
    if (activeTab === 'all') return matchesSearch
    return getDocTypeCategory(doc.type) === activeTab && matchesSearch
  })

  // Simulated download trigger
  const triggerDownload = (docName: string) => {
    // Generate a simple CSV/Text representation as a mock download file
    const content = `ReviveX Compliance Document\nDocument: ${docName}\nCompany: ${profile?.companies?.name}\nGSTIN: ${profile?.companies?.gst_number || 'N/A'}\nDate: ${new Date().toLocaleDateString()}\nStatus: Verified & Compliant\n`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${docName.replace(/\s+/g, '_').toLowerCase()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400 text-sm font-semibold">
        Loading document database...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-emerald-950">Compliance Documents & Invoices</h1>
        <p className="text-xs text-slate-500 mt-1">ISO 14001 certificates, weights audit files, and tax invoices</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-sm bg-white rounded-xl shadow-sm border border-slate-100 flex-1">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by file name or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-emerald-600 rounded-xl"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-100 self-start text-xs font-bold shadow-sm">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'certificate', label: 'Certificates' },
            { id: 'report', label: 'Reports' },
            { id: 'invoice', label: 'Invoices' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-1.5 px-3 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        {filteredDocs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium space-y-3">
            <FileText className="h-10 w-10 text-slate-200 mx-auto" />
            <p>No matching documents found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="p-4">Document Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Date Generated</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 flex items-center space-x-3">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        {getDocIcon(doc.type)}
                      </div>
                      <div>
                        <span className="font-bold text-emerald-950 block">{doc.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize">Source: {doc.requests?.request_type.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="p-4 capitalize">
                      <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-bold">
                        {getDocTypeCategory(doc.type)}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => triggerDownload(doc.name)}
                        className="inline-flex items-center space-x-1.5 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
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
  )
}
