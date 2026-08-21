import { z } from 'zod'

// 1. Authentication Schemas
export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

export const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  fullName: z.string().min(2, { message: 'Full name is required' }),
  companyName: z.string().min(2, { message: 'Company name is required' }),
  contactPerson: z.string().min(2, { message: 'Contact person name is required' }),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number' }),
  location: z.string().min(5, { message: 'Office location address is required' }),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Enter a valid 15-character GSTIN (e.g. 22AAAAA0000A1Z5)',
  }),
})

// 2. Request Wizard Multi-Step Schemas
export const step1CompanySchema = z.object({
  companyName: z.string().min(2, { message: 'Company name is required' }),
  contactPerson: z.string().min(2, { message: 'Contact person is required' }),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number' }),
  email: z.string().email({ message: 'Invalid email address' }),
  location: z.string().min(5, { message: 'Location is required' }),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Enter a valid 15-character GSTIN',
  }),
})

export const step2RequestTypeSchema = z.object({
  requestType: z.enum([
    'e_waste_disposal',
    'scrap_collection',
    'tender_project',
    'repairing',
    'spare_parts_requirement',
    'material_purchase_sale',
  ], {
    message: 'Please select a request type',
  }),
})

export const step3MaterialSchema = z.object({
  category: z.enum(['copper', 'aluminium', 'iron', 'e_waste', 'wood', 'other_scrap'], {
    message: 'Please select a material category',
  }),
  description: z.string().min(3, { message: 'Description must be at least 3 characters' }),
  quantity: z.preprocess(
    (val) => Number(val),
    z.number().positive({ message: 'Quantity must be greater than 0' })
  ),
  weight: z.preprocess(
    (val) => Number(val),
    z.number().positive({ message: 'Weight must be greater than 0' })
  ),
  units: z.enum(['kg', 'tons', 'units'], {
    message: 'Please select a unit of measurement',
  }),
})

export const step4UploadsSchema = z.object({
  images: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
})

export const step5LocationScheduleSchema = z.object({
  pickupLocation: z.string().min(5, { message: 'Pickup address is required' }),
  preferredDate: z.string().min(1, { message: 'Preferred pickup date is required' }),
  siteRequirements: z.string().optional(),
  specialInstructions: z.string().optional(),
})

// Unified combined request schema
export const requestWizardSchema = z.object({
  ...step1CompanySchema.shape,
  ...step2RequestTypeSchema.shape,
  ...step3MaterialSchema.shape,
  ...step4UploadsSchema.shape,
  ...step5LocationScheduleSchema.shape,
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type RequestWizardInput = z.infer<typeof requestWizardSchema>
