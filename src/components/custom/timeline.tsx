'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TimelineStep {
  label: string
  description?: string
  date?: string
}

export const Timeline = ({
  steps,
  currentStepIndex,
  className,
}: {
  steps: TimelineStep[]
  currentStepIndex: number
  className?: string
}) => {
  return (
    <div className={cn("flow-root", className)}>
      <ul role="list" className="-mb-8">
        {steps.map((step, stepIdx) => {
          const isCompleted = stepIdx < currentStepIndex
          const isActive = stepIdx === currentStepIndex
          const isLast = stepIdx === steps.length - 1

          return (
            <li key={step.label}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className={cn(
                      "absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100",
                      isCompleted && "bg-emerald-600"
                    )}
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white transition-all duration-300",
                        isCompleted && "bg-emerald-600 text-white shadow-sm",
                        isActive && "bg-white border-2 border-emerald-600 text-emerald-600 shadow-md",
                        !isCompleted && !isActive && "bg-slate-50 text-slate-300 border border-slate-100"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4 stroke-[3]" />
                      ) : isActive ? (
                        <motion.div
                          animate={{ scale: [0.8, 1.2, 0.8] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <Circle className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                        </motion.div>
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      )}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p
                        className={cn(
                          "text-sm text-slate-400 font-medium",
                          isActive && "text-emerald-950 font-bold",
                          isCompleted && "text-slate-800 font-semibold"
                        )}
                      >
                        {step.label}
                      </p>
                      {step.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                      )}
                    </div>
                    {step.date && (
                      <div className="text-right text-xs whitespace-nowrap text-slate-400">
                        <time>{step.date}</time>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
