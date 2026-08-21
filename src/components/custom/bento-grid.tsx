'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  )
}

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  onClick,
}: {
  className?: string
  title?: string | React.ReactNode
  description?: string | React.ReactNode
  header?: React.ReactNode
  icon?: React.ReactNode
  onClick?: () => void
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        "row-span-1 rounded-2xl group/bento hover:shadow-md transition duration-200 shadow-sm p-6 bg-white border border-emerald-900/10 justify-between flex flex-col space-y-4 cursor-pointer",
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-1 transition duration-200">
        {icon}
        <div className="font-sans font-semibold text-emerald-950 mb-1 mt-2 text-lg">
          {title}
        </div>
        <div className="font-sans font-normal text-emerald-800/70 text-sm">
          {description}
        </div>
      </div>
    </motion.div>
  )
}
