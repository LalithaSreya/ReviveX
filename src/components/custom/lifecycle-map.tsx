'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Truck, Layers, Cpu, Wrench, RotateCcw, Repeat } from 'lucide-react'

interface Stage {
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgLight: string
  borderCol: string
}

const STAGES: Stage[] = [
  {
    name: 'Collection',
    description: 'B2B scrap and e-waste scheduled pickups directly from client warehouses and manufacturing units.',
    icon: Truck,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    borderCol: 'border-emerald-500/30',
  },
  {
    name: 'Segregation',
    description: 'Incoming materials are sorted by material categories (copper, iron, aluminium, plastics, electronic circuits).',
    icon: Layers,
    color: 'text-teal-600',
    bgLight: 'bg-teal-50',
    borderCol: 'border-teal-500/30',
  },
  {
    name: 'Recovery',
    description: 'Extraction of high-value components, valuable precious metals, and functional spare parts from retired assets.',
    icon: Cpu,
    color: 'text-cyan-600',
    bgLight: 'bg-cyan-50',
    borderCol: 'border-cyan-500/30',
  },
  {
    name: 'Refurbishment',
    description: 'Diagnosing, repairing, and testing industrial machinery, IT hardware, and telecom gear back to OEM standards.',
    icon: Wrench,
    color: 'text-sky-600',
    bgLight: 'bg-sky-50',
    borderCol: 'border-sky-500/30',
  },
  {
    name: 'Recycling',
    description: 'Processing non-repairable scrap metals and materials safely into raw inputs for manufacturing industries.',
    icon: RotateCcw,
    color: 'text-lime-600',
    bgLight: 'bg-lime-50',
    borderCol: 'border-lime-500/30',
  },
  {
    name: 'Reuse',
    description: 'Closing the circular economy loop by selling refurbished goods, supply of recovered parts, and material resale.',
    icon: Repeat,
    color: 'text-emerald-700',
    bgLight: 'bg-emerald-50/50',
    borderCol: 'border-emerald-700/20',
  },
]

export const MaterialLifecycleMap = () => {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % STAGES.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  // Calculate coordinates on a circle of radius R
  const radius = 140
  const width = 360
  const height = 360
  const cx = width / 2
  const cy = height / 2

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-12 max-w-5xl mx-auto p-6 bg-slate-50/40 rounded-3xl border border-emerald-950/5 shadow-sm">
      {/* SVG Interactive Wheel */}
      <div className="relative" style={{ width, height }}>
        {/* Connection line circle */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`}>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="url(#gradient-teal)"
            strokeWidth="2"
            strokeDasharray="6,6"
            className="opacity-40"
          />
          <defs>
            <linearGradient id="gradient-teal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
        </svg>

        {/* Nodes */}
        {STAGES.map((stage, index) => {
          const angle = (index * 2 * Math.PI) / STAGES.length - Math.PI / 2 // Start at top
          const x = cx + radius * Math.cos(angle)
          const y = cy + radius * Math.sin(angle)
          const Icon = stage.icon
          const isActive = index === activeIndex

          return (
            <div
              key={stage.name}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: x, top: y }}
              onClick={() => setActiveIndex(index)}
            >
              <div
                className={`relative flex items-center justify-center h-14 w-14 rounded-full border transition-all duration-300 ${
                  isActive
                    ? `bg-emerald-900 border-emerald-900 text-white shadow-lg shadow-emerald-900/20 scale-110`
                    : `bg-white border-slate-200 hover:border-emerald-700/30 ${stage.color} hover:scale-105`
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] font-semibold tracking-wider text-emerald-950 uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap bg-white px-2 py-0.5 rounded shadow-sm">
                  {stage.name}
                </span>
              </div>
            </div>
          )
        })}

        {/* Center Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
          <div className="h-32 w-32 rounded-full bg-white flex flex-col items-center justify-center border border-emerald-950/5 shadow-sm p-4">
            <span className="text-[10px] font-semibold text-emerald-800/60 uppercase tracking-widest">Active Step</span>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <span className="text-sm font-bold text-emerald-950 mt-1 text-center leading-tight">
                  {STAGES[activeIndex].name}
                </span>
                <div className={`mt-2 h-1 w-8 rounded-full ${STAGES[activeIndex].color.replace('text', 'bg')}`} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Description Panel */}
      <div className="flex-1 max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={`p-8 rounded-3xl border ${STAGES[activeIndex].borderCol} ${STAGES[activeIndex].bgLight} shadow-sm`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl bg-white shadow-sm border ${STAGES[activeIndex].borderCol}`}>
                {React.createElement(STAGES[activeIndex].icon, { className: `h-6 w-6 ${STAGES[activeIndex].color}` })}
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest">Ecosystem Phase</span>
                <h3 className="text-xl font-bold text-emerald-950 leading-none mt-0.5">{STAGES[activeIndex].name}</h3>
              </div>
            </div>
            <p className="mt-4 text-emerald-900/80 leading-relaxed text-sm">
              {STAGES[activeIndex].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
