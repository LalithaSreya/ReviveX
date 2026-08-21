'use client'

import React from 'react'
import { motion } from 'framer-motion'

export const ProgressRing = ({
  value,
  size = 120,
  strokeWidth = 10,
  title,
  subtext,
  color = "stroke-emerald-600",
}: {
  value: number
  size?: number
  strokeWidth?: number
  title?: string
  subtext?: string
  color?: string
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-emerald-900/5 shadow-sm">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            className="stroke-emerald-100/50"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Animated progress circle */}
          <motion.circle
            className={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            r={radius}
            cx={size / 2}
            cy={size / 2}
            strokeLinecap="round"
          />
        </svg>
        {/* Centered Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold text-emerald-950">{value}%</span>
          {subtext && <span className="text-[10px] text-emerald-800/60 uppercase font-semibold">{subtext}</span>}
        </div>
      </div>
      {title && <h4 className="mt-3 text-sm font-semibold text-emerald-950">{title}</h4>}
    </div>
  )
}
