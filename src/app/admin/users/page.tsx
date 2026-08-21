'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  Search,
  CheckCircle,
  AlertCircle,
  UserCheck,
  ShieldAlert,
  Building
} from 'lucide-react'

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .order('created_at', { ascending: false })

      setUsers(profiles || [])
    } catch (err) {
      console.error('Error fetching profiles:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [supabase])

  // Handle Role Update
  const handleUpdateRole = async (userId: string) => {
    if (!selectedRole) return
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error

      setSuccessMsg('User role updated successfully.')
      setEditingUserId(null)
      setSelectedRole('')
      await fetchUsers()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user role.')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    const classes: Record<string, string> = {
      super_admin: 'bg-red-50 text-red-700 border-red-200',
      operations_executive: 'bg-teal-50 text-teal-700 border-teal-200',
      field_executive: 'bg-blue-50 text-blue-700 border-blue-200',
      repair_technical_executive: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      accounts_inventory_executive: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      client_relationship_executive: 'bg-purple-50 text-purple-700 border-purple-200',
      client_user: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }
    return classes[role] || 'bg-slate-50 text-slate-700 border-slate-200'
  }

  const filteredUsers = users.filter((u) => {
    return (
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (loading && users.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400 text-sm font-semibold">
        Loading user registry...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">User Registry & Permissions</h1>
        <p className="text-xs text-slate-500 mt-1">Manage corporate accounts and assign role-based credentials for operations yards</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-2 text-red-700 text-xs font-medium">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-2 text-emerald-800 text-xs font-medium">
          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Editing Roles panel */}
      {editingUserId && (
        <div className="p-6 border border-teal-900/10 bg-teal-50/20 rounded-3xl space-y-4 animate-fade-in text-xs font-semibold">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">Modify Role Permissions</h4>
            <button onClick={() => setEditingUserId(null)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-slate-200 focus:outline-none focus:border-teal-600 rounded-xl bg-white text-slate-700 font-semibold flex-1"
            >
              <option value="">Select Role Class...</option>
              <option value="super_admin">Super Admin</option>
              <option value="operations_executive">Operations Executive</option>
              <option value="client_relationship_executive">Client Relationship Executive</option>
              <option value="field_executive">Field Executive</option>
              <option value="repair_technical_executive">Repair & Technical Executive</option>
              <option value="accounts_inventory_executive">Accounts / Inventory Executive</option>
              <option value="client_user">B2B Client User</option>
            </select>
            <button
              onClick={() => handleUpdateRole(editingUserId)}
              disabled={!selectedRole}
              className="px-5 py-2 bg-teal-900 hover:bg-teal-950 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
            >
              Save Permission
            </button>
          </div>
        </div>
      )}

      {/* Toolbar Search */}
      <div className="relative max-w-sm bg-white rounded-xl shadow-sm border border-slate-100">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search users by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-teal-600 rounded-xl"
        />
      </div>

      {/* Users table */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm text-xs">
        {filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium space-y-3">
            <Users className="h-10 w-10 text-slate-200 mx-auto" />
            <p>No matching users registered.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="p-4">User Details</th>
                  <th className="p-4">B2B Company / Group</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{u.full_name || 'Member'}</span>
                      <span className="text-[10px] text-slate-400">{u.email}</span>
                    </td>
                    <td className="p-4">
                      {u.companies ? (
                        <span className="inline-flex items-center text-slate-700 font-semibold">
                          <Building className="h-3.5 w-3.5 mr-1 text-slate-400" />
                          {u.companies.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Internal Staff</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase ${getRoleBadgeColor(u.role)}`}>
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setEditingUserId(u.id)
                          setSelectedRole(u.role)
                        }}
                        className="inline-flex items-center space-x-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Update Permissions</span>
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
