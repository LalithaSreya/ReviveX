'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowRight,
  Shield,
  Cpu,
  Layers,
  Wrench,
  RotateCcw,
  Repeat,
  FileBarChart,
  CheckCircle2,
  Building,
  Phone,
  Mail,
  User,
  MapPin,
  ChevronRight,
  Sparkles,
  Leaf
} from 'lucide-react'
import { MaterialLifecycleMap } from '@/components/custom/lifecycle-map'
import { ProgressRing } from '@/components/custom/progress-ring'
import { AnimatedCounter } from '@/components/custom/counter'
import { BentoGrid, BentoGridItem } from '@/components/custom/bento-grid'

// Contact form schema
const contactFormSchema = z.object({
  fullName: z.string().min(2, { message: 'Name is required' }),
  companyName: z.string().min(2, { message: 'Company name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().regex(/^[6-9]\d{9}$/, { message: 'Enter valid 10-digit number' }),
  message: z.string().min(10, { message: 'Details must be at least 10 characters' }),
})

type ContactFormInput = z.infer<typeof contactFormSchema>

export default function HomePage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [activeTab, setActiveTab] = useState<'tracking' | 'analytics'>('tracking')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
  })

  const onSubmitContact = async (data: ContactFormInput) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitted(true)
    reset()
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-emerald-950/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-emerald-700" />
            <span className="text-xl font-bold tracking-tight text-emerald-950">Revive<span className="text-emerald-700">X</span></span>
          </Link>
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-emerald-900/80">
            <a href="#what-we-do" className="hover:text-emerald-950 transition-colors">What We Do</a>
            <a href="#how-it-works" className="hover:text-emerald-950 transition-colors">How It Works</a>
            <a href="#industries" className="hover:text-emerald-950 transition-colors">Industries</a>
            <a href="#impact" className="hover:text-emerald-950 transition-colors">Sustainability Impact</a>
            <a href="#assessment" className="hover:text-emerald-950 transition-colors">Free Assessment</a>
          </nav>
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2 text-emerald-900 hover:text-emerald-950 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-emerald-900 hover:bg-emerald-950 text-white px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 items-center gap-12">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-900/10 rounded-full px-3 py-1 text-emerald-900 text-xs font-semibold">
              <Sparkles className="h-3 w-3 text-emerald-700" />
              <span>B2B Circular Economy Platform</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-emerald-950 leading-tight">
              Transforming Industrial Waste Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-600">Sustainable Value</span>
            </h1>
            <p className="text-slate-600 text-lg sm:text-xl font-medium leading-relaxed">
              End-to-end e-waste management, scrap recovery, refurbishment, repair services, spare parts recovery, and sustainability reporting for enterprises.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-emerald-900 hover:bg-emerald-950 text-white font-semibold px-6 py-3.5 rounded-xl shadow-md transition-all group"
              >
                <span>Raise a Request</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#assessment"
                className="w-full sm:w-auto inline-flex items-center justify-center border border-slate-200 hover:border-emerald-700/30 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3.5 rounded-xl transition-all"
              >
                Schedule Assessment
              </a>
            </div>
          </div>

          {/* Hero Right Visual */}
          <div className="lg:col-span-6 flex justify-center">
            <MaterialLifecycleMap />
          </div>
        </div>
      </section>

      {/* WHAT WE DO (BENTO GRID) */}
      <section id="what-we-do" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Our Capabilities</span>
            <h2 className="font-heading text-3xl font-extrabold text-emerald-950 sm:text-4xl">What We Do</h2>
            <p className="text-slate-500">Structured asset recovery and recycling procedures built specifically for corporate industries and telecom sectors.</p>
          </div>

          <BentoGrid>
            <BentoGridItem
              title="E-Waste Management"
              description="Secure recycling of telecom gear, computer hardware, servers, and heavy logic boards with active data sanitization."
              icon={<Cpu className="h-6 w-6 text-emerald-700" />}
              className="md:col-span-2"
              header={<img src="/images/e_waste_management.png" alt="E-Waste Management" className="h-28 w-full object-cover rounded-xl border border-emerald-950/5" />}
            />
            <BentoGridItem
              title="Scrap Collection"
              description="Scheduled collection of structural scrap, copper cabling, industrial aluminium, and fabrication scrap."
              icon={<Layers className="h-6 w-6 text-teal-600" />}
              header={<img src="/images/scrap_collection.png" alt="Scrap Collection" className="h-28 w-full object-cover rounded-xl border border-emerald-950/5" />}
            />
            <BentoGridItem
              title="Asset Recovery"
              description="Auditing and recovery of industrial plant parts, turbines, and reusable assets to optimize depreciation."
              icon={<Shield className="h-6 w-6 text-cyan-600" />}
              header={<img src="/images/asset_recovery.png" alt="Asset Recovery" className="h-28 w-full object-cover rounded-xl border border-emerald-950/5" />}
            />
            <BentoGridItem
              title="Refurbishment"
              description="Diagnostic overhaul and testing of networking hardware, transformers, and industrial switches back to OEM standards."
              icon={<Wrench className="h-6 w-6 text-sky-600" />}
              className="md:col-span-2"
              header={<img src="/images/refurbishment.png" alt="Refurbishment" className="h-28 w-full object-cover rounded-xl border border-emerald-950/5" />}
            />
            <BentoGridItem
              title="Spare Parts Supply"
              description="Vast marketplace of verified recovered spares, reducing standard procurement costs by up to 60%."
              icon={<Repeat className="h-6 w-6 text-lime-600" />}
              header={<img src="/images/spare_parts.png" alt="Spare Parts Supply" className="h-28 w-full object-cover rounded-xl border border-emerald-950/5" />}
            />
            <BentoGridItem
              title="Sustainability Reporting"
              description="Automated carbon accounting, ESG compliance documentation, and green recycling certifications."
              icon={<FileBarChart className="h-6 w-6 text-emerald-800" />}
              className="md:col-span-2"
              header={<img src="/images/sustainability_reporting.png" alt="Sustainability Reporting" className="h-28 w-full object-cover rounded-xl border border-emerald-950/5" />}
            />
          </BentoGrid>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">Workflow Operations</span>
            <h2 className="font-heading text-3xl font-extrabold text-emerald-950 sm:text-4xl">How It Works</h2>
            <p className="text-slate-500">6 simple steps designed to integrate smoothly with standard procurement processes.</p>
          </div>

          <div className="grid md:grid-cols-6 gap-6 relative mt-10">
            {[
              { step: '1', title: 'Request', desc: 'Raise a B2B pickup request specifying categories.' },
              { step: '2', title: 'Assessment', desc: 'Our technical teams review lists and inspect site details.' },
              { step: '3', title: 'Approval', desc: 'Confirm quotations, values, and formal agreements.' },
              { step: '4', title: 'Collection', desc: 'GPS-tracked pickup from your designated locations.' },
              { step: '5', title: 'Processing', desc: 'Segregation, testing, repairing, or certified recycling.' },
              { step: '6', title: 'Closure', desc: 'Obtain carbon savings report, invoices, and certificates.' },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="relative bg-slate-50/60 p-6 rounded-2xl border border-emerald-950/5 shadow-sm text-center flex flex-col items-center"
              >
                <div className="h-10 w-10 bg-emerald-900 text-white rounded-full flex items-center justify-center text-sm font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-md font-bold text-emerald-950 mb-1">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                {idx < 5 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 text-emerald-900/30">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES WE SERVE */}
      <section id="industries" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Sectors</span>
            <h2 className="font-heading text-3xl font-extrabold text-emerald-950 sm:text-4xl">Industries We Serve</h2>
            <p className="text-slate-500">Trusted by India’s largest enterprise networks, manufacturing hubs, and heavy plants.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 text-center">
            {[
              { name: 'Airtel', cat: 'Telecom' },
              { name: 'Jio', cat: 'Telecom' },
              { name: 'Vodafone Idea', cat: 'Telecom' },
              { name: 'UltraTech Cement', cat: 'Manufacturing' },
              { name: 'Heidelberg', cat: 'Cement' },
              { name: 'Healthcare', cat: 'Equipment' },
              { name: 'Power & Grid', cat: 'Energy' },
            ].map((ind, idx) => (
              <motion.div
                key={ind.name}
                whileHover={{ scale: 1.03 }}
                className="bg-white p-6 rounded-2xl border border-emerald-900/5 shadow-sm flex flex-col items-center justify-center min-h-[120px]"
              >
                <Building className="h-7 w-7 text-emerald-900/60 mb-2" />
                <h4 className="text-sm font-bold text-emerald-950">{ind.name}</h4>
                <span className="text-[10px] text-teal-700 font-semibold uppercase tracking-wider mt-1">{ind.cat}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SUSTAINABILITY IMPACT */}
      <section id="impact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">Sustainability Dashboard</span>
            <h2 className="font-heading text-3xl font-extrabold text-emerald-950 sm:text-4xl">Eco-Impact Metrics</h2>
            <p className="text-slate-500">Real-time calculations of carbon offsets and resource extraction rates across client sites.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <ProgressRing value={84} title="Carbon Reduction Rate" subtext="CO2 Saved" color="stroke-emerald-600" />
            <ProgressRing value={92} title="Material Recovery Rate" subtext="Reclaimed" color="stroke-teal-600" />
            <ProgressRing value={76} title="Refurbished Reuse Percentage" subtext="Recirculated" color="stroke-cyan-600" />
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-900/10 text-center flex flex-col justify-center">
              <span className="text-5xl font-extrabold text-emerald-950 tracking-tight">
                <AnimatedCounter value={45280} suffix=" kg" />
              </span>
              <p className="mt-2 text-sm font-semibold text-emerald-800 uppercase tracking-widest">Total Industrial Waste Processed</p>
            </div>
            <div className="bg-teal-50/50 p-8 rounded-3xl border border-teal-900/10 text-center flex flex-col justify-center">
              <span className="text-5xl font-extrabold text-teal-950 tracking-tight">
                <AnimatedCounter value={12850} suffix="+" />
              </span>
              <p className="mt-2 text-sm font-semibold text-teal-800 uppercase tracking-widest">Assets Recovered & Refurbished</p>
            </div>
          </div>
        </div>
      </section>

      {/* CLIENT PORTAL PREVIEW */}
      <section className="py-20 bg-slate-50 border-y border-emerald-950/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Info */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Transparency Control</span>
              <h2 className="font-heading text-3xl font-extrabold text-emerald-950 sm:text-4xl">Client Portal Preview</h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                Get full operational transparency with a custom dashboard built for procurement managers and compliance teams. Track the complete recovery timeline of your project and view instant sustainability metrics.
              </p>
              
              <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-xl max-w-[280px]">
                <button
                  onClick={() => setActiveTab('tracking')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'tracking' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Project Tracker
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'analytics' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Impact Analytics
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  'Live status tracking timelines from pickup to closure',
                  'Download government-compliant recycling certificates',
                  'Generate internal audit reports for ISO 14001 validation',
                ].map((pt) => (
                  <div key={pt} className="flex items-start space-x-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700 mt-0.5 flex-shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Screen Mock */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-emerald-950/10 shadow-xl overflow-hidden p-6">
              {activeTab === 'tracking' ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">Airtel Telecom Scrap Pickup</h4>
                      <p className="text-xs text-slate-400">Project: #ART-82910</p>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Under Processing
                    </span>
                  </div>
                  
                  {/* Timeline Tracker Mock */}
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-600">
                    <div className="relative">
                      <span className="absolute -left-6 top-1 h-4 w-4 rounded-full bg-emerald-600 ring-4 ring-white flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </span>
                      <h5 className="text-xs font-bold text-slate-800">Request Submitted & Approved</h5>
                      <p className="text-[10px] text-slate-400">Aug 18, 2026</p>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-6 top-1 h-4 w-4 rounded-full bg-emerald-600 ring-4 ring-white flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </span>
                      <h5 className="text-xs font-bold text-slate-800">Pickup Completed</h5>
                      <p className="text-[10px] text-slate-400">Aug 20, 2026 - Driver: Rajesh K. (MH-12-XX-8822)</p>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-6 top-1 h-4 w-4 rounded-full bg-emerald-600 ring-4 ring-white flex items-center justify-center animate-pulse">
                        <span className="h-2.5 w-2.5 rounded-full bg-white" />
                      </span>
                      <h5 className="text-xs font-bold text-emerald-900">Material Segregation & Testing</h5>
                      <p className="text-[10px] text-emerald-700/60 font-medium">In Progress (Copper & Circuits sorted)</p>
                    </div>
                    <div className="relative opacity-40">
                      <span className="absolute -left-6 top-1 h-4 w-4 rounded-full bg-slate-200 ring-4 ring-white" />
                      <h5 className="text-xs font-bold text-slate-400">Recycling Certificates Generated</h5>
                      <p className="text-[10px] text-slate-400">Awaiting processing completion</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">Airtel ESG Dashboard</h4>
                      <p className="text-xs text-slate-400">Total Company Savings</p>
                    </div>
                    <Link href="/login" className="text-xs text-emerald-700 font-semibold hover:underline">View Live Portal →</Link>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border border-slate-100 p-4 rounded-xl text-center">
                      <span className="text-2xl font-bold text-emerald-950">84.2</span>
                      <p className="text-[9px] text-slate-400 uppercase font-semibold mt-1">Tons CO2 Saved</p>
                    </div>
                    <div className="border border-slate-100 p-4 rounded-xl text-center">
                      <span className="text-2xl font-bold text-teal-600">96.8%</span>
                      <p className="text-[9px] text-slate-400 uppercase font-semibold mt-1">Landfill Divert</p>
                    </div>
                    <div className="border border-slate-100 p-4 rounded-xl text-center">
                      <span className="text-2xl font-bold text-cyan-600">8,520 kg</span>
                      <p className="text-[9px] text-slate-400 uppercase font-semibold mt-1">Copper Reclaimed</p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/30 border border-emerald-900/5 rounded-2xl flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-emerald-950">Active Recycling Audit Complete</h5>
                      <p className="text-[10px] text-emerald-800/70">ISO 14001 alignment certificate ready for download.</p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT & ASSESSMENT FORM */}
      <section id="assessment" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 max-w-5xl mx-auto items-stretch">
            {/* Left Info Card */}
            <div className="lg:col-span-5 bg-emerald-950 text-white rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <Leaf className="h-8 w-8 text-emerald-400" />
                <h3 className="text-2xl font-bold mt-6 leading-tight">Request a Waste Audit & Commercial Proposal</h3>
                <p className="text-emerald-100/70 text-sm mt-3 leading-relaxed">
                  Provide your organization details and material estimation. Our operations and compliance experts will arrange a site audit within 48 hours.
                </p>
              </div>

              <div className="space-y-4 mt-8 lg:mt-0 text-sm">
                <div className="flex items-center space-x-3 text-emerald-100/95">
                  <Phone className="h-4 w-4 text-emerald-400" />
                  <span>+91 1800 200 4567</span>
                </div>
                <div className="flex items-center space-x-3 text-emerald-100/95">
                  <Mail className="h-4 w-4 text-emerald-400" />
                  <span>partnerships@revivex.co</span>
                </div>
                <div className="flex items-center space-x-3 text-emerald-100/95">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <span>HQ: Nariman Point, Mumbai, India</span>
                </div>
              </div>
            </div>

            {/* Right Form Card */}
            <div className="lg:col-span-7 bg-slate-50 rounded-3xl p-8 border border-emerald-950/5 flex flex-col justify-center">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h4 className="text-xl font-bold text-emerald-950">Audit Request Received!</h4>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    Thank you. Our relationship executive will contact you shortly to schedule the physical site inspection.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-xs font-bold text-emerald-700 hover:underline pt-2"
                  >
                    Submit another request
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmitContact)} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-emerald-950 uppercase">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          {...register('fullName')}
                          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                          placeholder="Contact Person"
                        />
                      </div>
                      {errors.fullName && <p className="text-xs text-red-500 font-semibold">{errors.fullName.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-emerald-950 uppercase">Company Name</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          {...register('companyName')}
                          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                          placeholder="e.g. Airtel, UltraTech"
                        />
                      </div>
                      {errors.companyName && <p className="text-xs text-red-500 font-semibold">{errors.companyName.message}</p>}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-emerald-950 uppercase">Corporate Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          {...register('email')}
                          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                          placeholder="name@company.com"
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-500 font-semibold">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-emerald-950 uppercase">Mobile Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          {...register('phone')}
                          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                          placeholder="9876543210"
                        />
                      </div>
                      {errors.phone && <p className="text-xs text-red-500 font-semibold">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-emerald-950 uppercase">Material & Volume Estimation</label>
                    <textarea
                      {...register('message')}
                      rows={3}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                      placeholder="Specify material categories (e.g. Copper wire, B2B routers, industrial batteries) and estimated weight (e.g. 5 tons)..."
                    />
                    {errors.message && <p className="text-xs text-red-500 font-semibold">{errors.message.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-900 hover:bg-emerald-950 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request & Schedule Assessment'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SDG ALIGNMENT SECTION */}
      <section className="py-12 bg-slate-50 border-t border-emerald-950/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest">Global Standards</span>
          <h3 className="text-lg font-bold text-emerald-950 mt-1 mb-6">Our SDG Commitments</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            {[
              { id: 'SDG 9', title: 'Industry & Infrastructure', desc: 'Fostering industrial innovation through parts recovery.' },
              { id: 'SDG 11', title: 'Sustainable Cities', desc: 'Reducing urban landfills through secure scrap pickup.' },
              { id: 'SDG 12', title: 'Responsible Consumption', desc: 'Promoting B2B zero-waste-to-landfill circular loops.' },
              { id: 'SDG 13', title: 'Climate Action', desc: 'Documenting co2 savings audits for emission offsets.' },
            ].map((sdg) => (
              <div key={sdg.id} className="bg-white p-5 rounded-2xl border border-emerald-900/5 shadow-sm">
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  {sdg.id}
                </span>
                <h4 className="text-xs font-bold text-emerald-950 mt-3">{sdg.title}</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{sdg.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-emerald-950 text-emerald-100/70 border-t border-emerald-900/20 py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-white">
              <Leaf className="h-6 w-6 text-emerald-400" />
              <span className="text-xl font-bold tracking-tight">ReviveX</span>
            </div>
            <p className="text-xs leading-relaxed">
              Enterprise sustainability and circular economy scrap recovery platform. ISO 14001 & ISO 9001 certified operations.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Operations</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#what-we-do" className="hover:underline">E-Waste Disposal</a></li>
              <li><a href="#what-we-do" className="hover:underline">Scrap Management</a></li>
              <li><a href="#what-we-do" className="hover:underline">Asset Refurbishing</a></li>
              <li><a href="#what-we-do" className="hover:underline">Precious Metal Recovery</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:underline">Disposal Certificates</a></li>
              <li><a href="#" className="hover:underline">ESG Carbon Accounting</a></li>
              <li><a href="#" className="hover:underline">Government Authorizations</a></li>
              <li><a href="#" className="hover:underline">E-Waste Rules 2022</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Portal Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/login" className="hover:underline">Client Sign In</Link></li>
              <li><Link href="/register" className="hover:underline">Register B2B Company</Link></li>
              <li><Link href="/login?role=super_admin" className="hover:underline">Internal Admin Portal</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 border-t border-emerald-900/10 mt-8 pt-6 text-center text-xs">
          <span>&copy; {new Date().getFullYear()} ReviveX Technologies Private Limited. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
