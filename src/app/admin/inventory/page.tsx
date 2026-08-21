'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Package,
  Search,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Download,
  AlertCircle,
  CheckCircle,
  Truck,
  RotateCcw,
  Boxes
} from 'lucide-react'

export default function AdminInventoryPage() {
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Stock Adjustments
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('0')
  const [adjustWeight, setAdjustWeight] = useState('0')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Add New Item State
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    category: 'copper',
    name: '',
    quantity: '0',
    weight: '0',
    units: 'kg',
  })

  const supabase = createClient()

  // Fetch Inventory
  const fetchInventory = async () => {
    setLoading(true)
    try {
      const { data: inv } = await supabase.from('inventory').select('*')
      
      if (inv && inv.length > 0) {
        setInventory(inv)
      } else {
        // Populate standard commodities if database warehouse is currently empty
        const defaultStock = [
          { id: 'inv-1', category: 'copper', name: 'Refined Copper Shreds', quantity: 0, weight: 1250, units: 'kg', status: 'available' },
          { id: 'inv-2', category: 'aluminium', name: 'Aluminium Extrusions Grade A', quantity: 0, weight: 890, units: 'kg', status: 'available' },
          { id: 'inv-3', category: 'e_waste', name: 'PCB Boards Recovered', quantity: 150, weight: 320, units: 'units', status: 'available' },
          { id: 'inv-4', category: 'refurbished_products', name: 'Refurbished Cisco ISR 4331', quantity: 12, weight: 72, units: 'units', status: 'available' },
          { id: 'inv-5', category: 'recovered_spare_parts', name: 'Power Supply Units 12V B2B', quantity: 45, weight: 90, units: 'units', status: 'available' }
        ]
        
        for (const item of defaultStock) {
          await supabase.from('inventory').insert(item)
        }
        
        const { data: populatedInv } = await supabase.from('inventory').select('*')
        setInventory(populatedInv || [])
      }
    } catch (err) {
      console.error('Error fetching inventory warehouse logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [supabase])

  // Handle stock adjustments (e.g. Dispatched or Add)
  const handleUpdateStock = async (itemId: string, action: 'add' | 'dispatch') => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const item = inventory.find((i) => i.id === itemId)
      if (!item) return

      const deltaQty = parseFloat(adjustAmount) || 0
      const deltaWeight = parseFloat(adjustWeight) || 0

      let finalQty = parseFloat(item.quantity)
      let finalWeight = parseFloat(item.weight)

      if (action === 'add') {
        finalQty += deltaQty
        finalWeight += deltaWeight
      } else {
        if (finalQty < deltaQty || finalWeight < deltaWeight) {
          throw new Error('Insufficient stock weight/quantity available for dispatch.')
        }
        finalQty -= deltaQty
        finalWeight -= deltaWeight
      }

      const updatePayload: any = {
        quantity: finalQty,
        weight: finalWeight,
        updated_at: new Date().toISOString(),
      }

      if (finalWeight === 0 && finalQty === 0) {
        updatePayload.status = 'dispatched'
      }

      const { error } = await supabase
        .from('inventory')
        .update(updatePayload)
        .eq('id', itemId)

      if (error) throw error

      setSuccessMsg(`Warehouse item adjusted successfully.`)
      setAdjustingId(null)
      setAdjustAmount('0')
      setAdjustWeight('0')
      await fetchInventory()
    } catch (err: any) {
      setErrorMsg(err.message || 'Stock adjustment failed.')
    } finally {
      setLoading(false)
    }
  }

  // Handle create new inventory item manually
  const handleAddNewItem = async () => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const { error } = await supabase.from('inventory').insert({
        category: newItem.category,
        name: newItem.name,
        quantity: parseFloat(newItem.quantity) || 0,
        weight: parseFloat(newItem.weight) || 0,
        units: newItem.units,
        status: 'available',
      })

      if (error) throw error

      setSuccessMsg(`New inventory batch created: ${newItem.name}`)
      setShowAddForm(false)
      setNewItem({ category: 'copper', name: '', quantity: '0', weight: '0', units: 'kg' })
      await fetchInventory()
    } catch (err: any) {
      setErrorMsg(err.message || 'Creation of item failed.')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredList = () => {
    return inventory.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase())
      if (activeCategory === 'all') return matchesSearch
      return item.category === activeCategory && matchesSearch
    })
  }

  if (loading && inventory.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400 text-sm font-semibold">
        Loading inventory ledger...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex justify-between items-center pb-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Inventory Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">Warehouse balances of copper shreds, functional spares, and refurbished gear</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center space-x-1.5 text-xs font-bold bg-teal-900 hover:bg-teal-950 text-white px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Stock Batch</span>
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

      {/* Manual Stock Batch Creation Panel */}
      {showAddForm && (
        <div className="p-6 border border-teal-900/10 bg-teal-50/20 rounded-3xl space-y-4 animate-fade-in text-xs font-semibold">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">Log Manual Stock Intake</h4>
            <button onClick={() => setShowAddForm(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
          </div>
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-teal-950 uppercase">Category</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700 font-semibold"
              >
                <option value="copper">Copper</option>
                <option value="aluminium">Aluminium</option>
                <option value="iron">Iron</option>
                <option value="e_waste">E-Waste</option>
                <option value="wood">Wood</option>
                <option value="recovered_spare_parts">Recovered Spare Parts</option>
                <option value="refurbished_products">Refurbished Products</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-teal-950 uppercase">Batch Name</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
                placeholder="e.g. Copper wire scrap batch"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-teal-950 uppercase">Weight</label>
              <input
                type="number"
                value={newItem.weight}
                onChange={(e) => setNewItem((p) => ({ ...p, weight: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-teal-950 uppercase">Units</label>
              <input
                type="text"
                value={newItem.units}
                onChange={(e) => setNewItem((p) => ({ ...p, units: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
              />
            </div>
          </div>
          <button
            onClick={handleAddNewItem}
            disabled={!newItem.name}
            className="w-full py-2 bg-teal-900 hover:bg-teal-950 text-white font-bold rounded-xl shadow-sm transition-all"
          >
            Create Batch Entry
          </button>
        </div>
      )}

      {/* Adjustment Control Panel overlay */}
      {adjustingId && (
        <div className="p-6 border border-teal-900/10 bg-teal-50/20 rounded-3xl space-y-4 animate-fade-in text-xs font-semibold">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">Log Dispatch / Stock Adjustment</h4>
            <button onClick={() => setAdjustingId(null)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-teal-950 uppercase">Amount (Units/Pieces to move)</label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-teal-950 uppercase">Weight (kg to move)</label>
              <input
                type="number"
                value={adjustWeight}
                onChange={(e) => setAdjustWeight(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleUpdateStock(adjustingId, 'add')}
              className="flex-1 py-2 bg-teal-900 hover:bg-teal-950 text-white font-bold rounded-xl shadow-sm transition-all"
            >
              Add Stock Intake
            </button>
            <button
              onClick={() => handleUpdateStock(adjustingId, 'dispatch')}
              className="flex-1 py-2 bg-red-900 hover:bg-red-950 text-white font-bold rounded-xl shadow-sm transition-all"
            >
              Dispatch Circular Sale
            </button>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-sm bg-white rounded-xl shadow-sm border border-slate-100 flex-1">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search warehouse logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-teal-600 rounded-xl"
          />
        </div>

        {/* Categories filters */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-100 self-start text-xs font-bold shadow-sm overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Stock' },
            { id: 'copper', label: 'Copper' },
            { id: 'aluminium', label: 'Aluminium' },
            { id: 'iron', label: 'Iron' },
            { id: 'e_waste', label: 'E-Waste' },
            { id: 'recovered_spare_parts', label: 'Spares' },
            { id: 'refurbished_products', label: 'Refurbished' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`py-1.5 px-3 rounded-lg transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-teal-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredList().map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[9px] bg-slate-50 text-slate-500 font-extrabold px-2 py-0.5 rounded border border-slate-200 uppercase">
                  {item.category.replace(/_/g, ' ')}
                </span>
                <span className={`inline-flex h-2 w-2 rounded-full ${item.status === 'available' ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 leading-tight">{item.name}</h4>
                <span className="text-[10px] text-slate-400 font-semibold block pt-0.5">Last updated: {new Date(item.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-50 text-xs font-semibold">
                <div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider block">Quantity</span>
                  <span className="text-slate-800">{item.quantity} units</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider block">Weight Balance</span>
                  <span className="text-emerald-950 font-bold">{item.weight} {item.units}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setAdjustingId(item.id)}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              Adjust / Dispatch Stock
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
