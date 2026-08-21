'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Leaf,
  LayoutDashboard,
  ClipboardList,
  FolderOpen,
  FileText,
  HelpCircle,
  LogOut,
  Menu,
  X,
  User,
  Building,
  Bell
} from 'lucide-react'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*, companies(*)')
            .eq('id', user.id)
            .single()

          if (profileData) {
            setProfile(profileData)
            if (profileData.role !== 'client_user' && pathname.startsWith('/portal')) {
              router.push('/admin')
            }
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn('Supabase fetch failed, loading local fallback:', err)
      }

      // Offline mock session fallback
      const demoSession = localStorage.getItem('demo_session')
      if (demoSession) {
        const parsed = JSON.parse(demoSession)
        setProfile({
          full_name: parsed.full_name,
          role: parsed.role,
          companies: {
            name: 'Airtel India Network',
            gst_number: '27AAAAA1111A1Z1',
            location: 'Gurugram, Haryana'
          }
        })
      } else {
        router.push('/login')
      }
      setLoading(false)
    }

    fetchSession()
  }, [pathname, router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { name: 'Dashboard', href: '/portal', icon: LayoutDashboard },
    { name: 'Requests', href: '/portal/requests', icon: ClipboardList },
    { name: 'Projects', href: '/portal/projects', icon: FolderOpen },
    { name: 'Documents', href: '/portal/documents', icon: FileText },
    { name: 'Support', href: '/portal/support', icon: HelpCircle },
  ]

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50 text-slate-500 font-semibold">
        <div className="flex flex-col items-center space-y-2">
          <Leaf className="h-8 w-8 text-emerald-700 animate-spin" />
          <span className="text-sm">Loading Client Workspace...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex bg-slate-50 min-h-screen relative overflow-hidden">
      {/* MOBILE HEADER */}
      <header className="md:hidden absolute top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between z-30">
        <Link href="/" className="flex items-center space-x-1">
          <Leaf className="h-5 w-5 text-emerald-700" />
          <span className="text-md font-bold tracking-tight text-emerald-950">ReviveX</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* SIDEBAR NAVIGATION (Desktop & Mobile) */}
      <aside
        className={`w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-6 z-40 fixed md:sticky top-0 bottom-0 left-0 transition-transform duration-300 md:transform-none ${
          sidebarOpen ? 'translate-x-0 pt-20 md:pt-6' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* LOGO */}
          <Link href="/" className="hidden md:flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-emerald-700" />
            <span className="text-xl font-extrabold tracking-tight text-emerald-950">
              Revive<span className="text-emerald-700">X</span>
            </span>
          </Link>

          {/* COMPANY / PROFILE BLOCK */}
          <div className="p-3 bg-slate-50 rounded-2xl flex items-center space-x-3 border border-slate-100">
            <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              {profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-800 truncate">{profile?.full_name}</h4>
              <p className="text-[10px] text-slate-400 font-semibold truncate flex items-center mt-0.5">
                <Building className="h-3 w-3 mr-1 flex-shrink-0" />
                {profile?.companies?.name || 'No Company'}
              </p>
            </div>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href || (link.href !== '/portal' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-900/5'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* BOTTOM USER MENU / ACTIONS */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium">
              <User className="h-4 w-4" />
              <span className="font-semibold uppercase text-[9px] tracking-wider">Client Member</span>
            </div>
            <span className="text-[8px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase">
              B2B Client
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all border border-transparent hover:border-red-100"
          >
            <LogOut className="h-4.5 w-4.5 text-red-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0 overflow-y-auto">
        <main className="p-6 md:p-10 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
