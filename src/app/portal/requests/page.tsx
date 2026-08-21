'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileUploadWidget } from '@/components/custom/upload-widget'
import { Timeline, type TimelineStep } from '@/components/custom/timeline'
import {
  ClipboardList,
  Plus,
  Search,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Truck,
  FileText,
  AlertCircle,
  Calendar,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  ArrowUpRight
} from 'lucide-react'

// Timeline stage mappings
const STATUS_STAGES = [
  'submitted',
  'under_review',
  'staff_assigned',
  'inspection_scheduled',
  'quotation_pending',
  'approved',
  'pickup_scheduled',
  'material_collected',
  'under_processing',
  'in_progress',
  'completed',
  'closed',
]

const TIMELINE_STEPS: TimelineStep[] = [
  { label: 'Request Submitted', description: 'Request registered and queued for verification.' },
  { label: 'Under Review', description: 'Client details and estimated scrap items are under initial audit.' },
  { label: 'Staff Assigned', description: 'Relationship manager has been appointed to coordinate.' },
  { label: 'Inspection Scheduled', description: 'Field executive scheduled for site volume audit.' },
  { label: 'Quotation Pending', description: 'Valuation and contract paperwork generated; awaiting signature.' },
  { label: 'Approved', description: 'Commercial agreement executed by both parties.' },
  { label: 'Pickup Scheduled', description: 'Logistics crew and transport scheduled.' },
  { label: 'Material Collected', description: 'Scrap weights verified and loaded onto vehicles.' },
  { label: 'Under Processing', description: 'Material received at sorting facility.' },
  { label: 'Processing in Progress', description: 'Refurbishment diagnosis or safe recycling underway.' },
  { label: 'Completed', description: 'Destruction certificates, repair reports, or spares extracted.' },
  { label: 'Closed', description: 'Project closed and accounting settled.' },
]

export default function RequestsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const action = searchParams.get('action')
  const trackId = searchParams.get('track')

  const [profile, setProfile] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Tracking State
  const [trackedRequest, setTrackedRequest] = useState<any>(null)
  const [trackedMaterials, setTrackedMaterials] = useState<any[]>([])
  const [trackedCollection, setTrackedCollection] = useState<any>(null)

  // Request Wizard State
  const [step, setStep] = useState(1)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // Step 1: Company Details
    companyName: '',
    contactPerson: '',
    mobileNumber: '',
    email: '',
    location: '',
    gstNumber: '',
    // Step 2: Request Type
    requestType: 'e_waste_disposal',
    // Step 3: Material Information
    category: 'e_waste',
    description: '',
    quantity: '0',
    weight: '0',
    units: 'kg',
    // Step 4: Uploaded Files
    uploadedFiles: [] as File[],
    // Step 5: Location & Schedule
    pickupLocation: '',
    preferredDate: '',
    siteRequirements: '',
    specialInstructions: '',
  })

  const supabase = createClient()

  // 1. Fetch Requests & Profile
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        
        // Populate Wizard Step 1 from current company profile
        setFormData((prev) => ({
          ...prev,
          companyName: profileData.companies?.name || '',
          contactPerson: profileData.full_name || '',
          mobileNumber: profileData.companies?.mobile_number || '',
          email: profileData.email || '',
          location: profileData.companies?.location || '',
          gstNumber: profileData.companies?.gst_number || '',
          pickupLocation: profileData.companies?.location || '',
        }))

        // Fetch Requests
        const { data: reqs } = await supabase
          .from('requests')
          .select('*')
          .eq('company_id', profileData.company_id)
          .order('created_at', { ascending: false })

        setRequests(reqs || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [router, supabase])

  // 2. Fetch specific tracked request details
  useEffect(() => {
    const fetchTrackedDetails = async () => {
      if (!trackId) return
      setLoading(true)
      try {
        const { data: req } = await supabase
          .from('requests')
          .select('*, companies(*)')
          .eq('id', trackId)
          .single()

        if (req) {
          setTrackedRequest(req)

          // Fetch materials
          const { data: mats } = await supabase
            .from('materials')
            .select('*')
            .eq('request_id', trackId)

          setTrackedMaterials(mats || [])

          // Fetch collections via project (if exists)
          const { data: proj } = await supabase
            .from('projects')
            .select('id')
            .eq('request_id', trackId)
            .single()

          if (proj) {
            const { data: coll } = await supabase
              .from('collections')
              .select('*')
              .eq('project_id', proj.id)
              .single()

            setTrackedCollection(coll)
          } else {
            setTrackedCollection(null)
          }
        }
      } catch (err) {
        console.error('Error fetching tracked details:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTrackedDetails()
  }, [trackId, supabase])

  const getActiveTimelineIndex = (status: string) => {
    return STATUS_STAGES.indexOf(status)
  }

  // 3. Wizard Submit Handler
  const handleWizardSubmit = async () => {
    setErrorMsg(null)
    setLoading(true)

    try {
      if (!profile?.company_id) {
        throw new Error('User profile does not contain a company ID association.')
      }

      // a. Create Request row
      const { data: request, error: reqError } = await supabase
        .from('requests')
        .insert({
          company_id: profile.company_id,
          client_user_id: profile.id,
          request_type: formData.requestType,
          pickup_location: formData.pickupLocation,
          preferred_date: formData.preferredDate || null,
          site_requirements: formData.siteRequirements,
          special_instructions: formData.specialInstructions,
          status: 'submitted',
        })
        .select('id')
        .single()

      if (reqError) throw reqError

      // b. Create Material row associated with the request
      const { error: matError } = await supabase
        .from('materials')
        .insert({
          request_id: request.id,
          category: formData.category,
          description: formData.description,
          quantity: parseFloat(formData.quantity) || 0,
          weight: parseFloat(formData.weight) || 0,
          units: formData.units,
          segregation_status: 'pending',
        })

      if (matError) throw matError

      // c. Create audit log / notification
      await supabase.from('notifications').insert({
        user_id: profile.id,
        title: 'New Request Raised',
        message: `Your ${formData.requestType.replace(/_/g, ' ')} request is successfully queued. ID: #${request.id.substring(0, 8)}`,
      })

      // Refresh requests list
      const { data: updatedReqs } = await supabase
        .from('requests')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
      setRequests(updatedReqs || [])

      // Redirect to newly raised request tracker
      router.push(`/portal/requests?track=${request.id}`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit request.')
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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

  const filteredRequests = requests.filter(
    (r) =>
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.request_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && !trackId) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400 text-sm font-semibold">
        Loading requests portal...
      </div>
    )
  }

  // ==========================================
  // CASE A: TRACK REQUEST TIMELINE VIEW
  // ==========================================
  if (trackId && trackedRequest) {
    const activeIndex = getActiveTimelineIndex(trackedRequest.status)

    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push('/portal/requests')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white px-3 py-2 border border-slate-100 rounded-xl shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Requests</span>
        </button>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Timeline checklist */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                  Live Operations Feed
                </span>
                <h1 className="text-xl font-bold text-emerald-950 mt-1">
                  Tracking Request #{trackedRequest.id.substring(0, 8)}
                </h1>
                <p className="text-xs text-slate-400 mt-1 capitalize">
                  Type: {trackedRequest.request_type.replace(/_/g, ' ')}
                </p>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold capitalize ${getStatusBadge(trackedRequest.status)}`}>
                {trackedRequest.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Custom Interactive Timeline */}
            <Timeline steps={TIMELINE_STEPS} currentStepIndex={activeIndex} />
          </div>

          {/* Details Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Material overview */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-widest">Material Valuation</h3>
              {trackedMaterials.map((mat) => (
                <div key={mat.id} className="space-y-2 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-500 uppercase tracking-wider">Category</span>
                    <span className="text-emerald-950 capitalize">{mat.category.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-500 uppercase tracking-wider">Quantity</span>
                    <span className="text-emerald-950">{mat.quantity} {mat.units}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-500 uppercase tracking-wider">Weight (Est)</span>
                    <span className="text-emerald-950">{mat.weight} kg</span>
                  </div>
                  <div className="pt-2 border-t border-slate-50 text-slate-500">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Description:</span>
                    <p className="mt-1 leading-relaxed">{mat.description || 'No description provided'}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Logistics Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-widest flex items-center">
                <Truck className="h-4.5 w-4.5 mr-2 text-emerald-700" />
                <span>Logistics Details</span>
              </h3>
              {trackedCollection ? (
                <div className="space-y-2 text-xs font-medium text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Driver:</span>
                    <span className="font-bold text-slate-800">{trackedCollection.driver_name || 'Assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle:</span>
                    <span className="font-bold text-slate-800">{trackedCollection.vehicle_number || 'Assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Logistics Status:</span>
                    <span className="text-emerald-700 font-bold uppercase text-[10px]">{trackedCollection.status}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Logistics scheduling is pending quotation approval.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // CASE B: RAISE REQUEST 6-STEP WIZARD
  // ==========================================
  if (action === 'new') {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl shadow-md overflow-hidden">
        {/* Wizard Header */}
        <div className="bg-emerald-950 text-white p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/portal/requests')}
              className="text-emerald-300 hover:text-white flex items-center text-xs font-semibold space-x-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <span className="text-xs bg-emerald-900 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-200 font-bold">
              Step {step} of 6
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold">Raise Recovery Request</h1>
            <p className="text-xs text-emerald-100/70 mt-1">Guided multi-step B2B scrap pickup checklist</p>
          </div>
        </div>

        {errorMsg && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-2 text-red-700 text-xs font-medium">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-6 md:p-8 space-y-6">
          {/* STEP 1: COMPANY DETAILS */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-widest flex items-center">
                <Building className="h-4 w-4 mr-2 text-emerald-700" />
                <span>Confirm Organization Profile</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">Company Name</label>
                  <input
                    disabled
                    value={formData.companyName}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-100 rounded-xl text-slate-400 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">GSTIN (Compliance)</label>
                  <input
                    disabled
                    value={formData.gstNumber}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-100 rounded-xl text-slate-400 font-semibold"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">Contact Representative</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">Mobile Number</label>
                  <input
                    type="text"
                    value={formData.mobileNumber}
                    onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-emerald-950 uppercase">Corporate Head Office</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* STEP 2: REQUEST TYPE */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Select Recovery Service</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'e_waste_disposal', label: 'E-Waste Disposal', desc: 'Secure data-wiping and circuitry recycling.' },
                  { value: 'scrap_collection', label: 'Scrap Collection', desc: 'Metals, structural steel, or copper wires.' },
                  { value: 'tender_project', label: 'Tender Project', desc: 'Heavy warehouse or manufacturing yard closure.' },
                  { value: 'repairing', label: 'Asset Repairing', desc: 'Diagnosis and restoration of electrical parts.' },
                  { value: 'spare_parts_requirement', label: 'Spare Parts supply', desc: 'Ordering component spares.' },
                  { value: 'material_purchase_sale', label: 'Material Resale', desc: 'Direct raw scrap buying or selling.' },
                ].map((type) => (
                  <label
                    key={type.value}
                    onClick={() => handleInputChange('requestType', type.value)}
                    className={`p-4 border rounded-2xl cursor-pointer flex flex-col justify-between hover:shadow-sm transition-all ${
                      formData.requestType === type.value
                        ? 'border-emerald-600 bg-emerald-50/20'
                        : 'border-slate-200 hover:border-emerald-700/25'
                    }`}
                  >
                    <span className="text-xs font-bold text-emerald-950">{type.label}</span>
                    <span className="text-[10px] text-slate-400 mt-1">{type.desc}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: MATERIAL DETAILS */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Provide Material Estimates</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">Material Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl bg-white"
                  >
                    <option value="e_waste">E-Waste / Circuit Cards</option>
                    <option value="copper">Copper Wires / Cabling</option>
                    <option value="aluminium">Aluminium Profiles</option>
                    <option value="iron">Iron / Structural Metals</option>
                    <option value="wood">Wood Scrap / Pallets</option>
                    <option value="other_scrap">Other Scrap Materials</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-950 uppercase">Est. Weight</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-950 uppercase">Units</label>
                    <select
                      value={formData.units}
                      onChange={(e) => handleInputChange('units', e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl bg-white"
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="tons">Tons</option>
                      <option value="units">Piece Count (units)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">Item Count / Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">Item Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl"
                    placeholder="Specify wire gauges or router models"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: UPLOADS */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-widest flex items-center">
                <FileText className="h-4.5 w-4.5 mr-2 text-emerald-700" />
                <span>Upload Supporting Documents</span>
              </h3>
              <FileUploadWidget
                onFilesChange={(files) => handleInputChange('uploadedFiles', files)}
                accept=".jpg,.jpeg,.png,.csv,.xlsx,.xls,.pdf"
              />
            </div>
          )}

          {/* STEP 5: LOCATION & SCHEDULE */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-widest flex items-center">
                <Calendar className="h-4.5 w-4.5 mr-2 text-emerald-700" />
                <span>Logistics & Schedule details</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">Pickup Location Address</label>
                  <input
                    type="text"
                    value={formData.pickupLocation}
                    onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">Preferred Pickup Date</label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl bg-white text-slate-700"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">Site Access / Loading Requirements</label>
                  <input
                    type="text"
                    value={formData.siteRequirements}
                    onChange={(e) => handleInputChange('siteRequirements', e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl"
                    placeholder="e.g. Crane required, forklift entry"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-950 uppercase">Special Instructions</label>
                  <input
                    type="text"
                    value={formData.specialInstructions}
                    onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 focus:outline-none focus:border-emerald-600 rounded-xl"
                    placeholder="e.g. Security clearance needed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW & SUBMIT */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-widest flex items-center">
                <CheckCircle className="h-4.5 w-4.5 mr-2 text-emerald-700" />
                <span>Verify Form Inputs</span>
              </h3>
              
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden text-xs">
                <div className="p-3 bg-slate-50 flex justify-between">
                  <span className="font-bold text-slate-500 uppercase">Service Type</span>
                  <span className="text-emerald-950 font-bold capitalize">{formData.requestType.replace(/_/g, ' ')}</span>
                </div>
                <div className="p-3 bg-white flex justify-between">
                  <span className="font-bold text-slate-500 uppercase">Material Category</span>
                  <span className="text-emerald-950 font-bold capitalize">{formData.category.replace(/_/g, ' ')}</span>
                </div>
                <div className="p-3 bg-slate-50 flex justify-between">
                  <span className="font-bold text-slate-500 uppercase">Estimated Weight</span>
                  <span className="text-emerald-950 font-bold">{formData.weight} {formData.units}</span>
                </div>
                <div className="p-3 bg-white flex justify-between">
                  <span className="font-bold text-slate-500 uppercase">Pickup Location</span>
                  <span className="text-emerald-950 font-bold truncate max-w-[280px]">{formData.pickupLocation}</span>
                </div>
                <div className="p-3 bg-slate-50 flex justify-between">
                  <span className="font-bold text-slate-500 uppercase">Preferred Date</span>
                  <span className="text-emerald-950 font-bold">{formData.preferredDate || 'TBD'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer controls */}
        <div className="border-t border-slate-100 p-6 flex justify-between bg-slate-50/50">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-100 px-4 py-2.5 rounded-xl shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center space-x-1 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-950 px-5 py-2.5 rounded-xl shadow-sm"
            >
              <span>Next Step</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleWizardSubmit}
              className="inline-flex items-center space-x-1 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-950 px-6 py-2.5 rounded-xl shadow-sm"
            >
              <span>Submit Request</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // CASE C: LIST VIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header and Raise Action */}
      <div className="flex justify-between items-center pb-2">
        <div>
          <h1 className="text-xl font-extrabold text-emerald-950">Disposal & Recovery Requests</h1>
          <p className="text-xs text-slate-500 mt-1">Audit, scrap collection, and asset tracking logs</p>
        </div>
        <button
          onClick={() => router.push('/portal/requests?action=new')}
          className="inline-flex items-center space-x-1.5 text-xs font-bold bg-emerald-900 hover:bg-emerald-950 text-white px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Raise Request</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="relative max-w-sm bg-white rounded-xl shadow-sm border border-slate-100">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search requests by ID, type, status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-emerald-600 rounded-xl"
        />
      </div>

      {/* List Container */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        {filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium space-y-3">
            <ClipboardList className="h-10 w-10 text-slate-200 mx-auto" />
            <p>No matching requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="p-4">Request ID</th>
                  <th className="p-4">Service Type</th>
                  <th className="p-4">Preferred Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-emerald-950 font-bold">#{req.id.substring(0, 8)}</td>
                    <td className="p-4 capitalize">{req.request_type.replace(/_/g, ' ')}</td>
                    <td className="p-4 text-slate-500">{req.preferred_date || 'TBD'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold capitalize ${getStatusBadge(req.status)}`}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/portal/requests?track=${req.id}`}
                        className="inline-flex items-center space-x-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm"
                      >
                        <span>Track Operations</span>
                        <ArrowUpRight className="h-3 w-3" />
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
