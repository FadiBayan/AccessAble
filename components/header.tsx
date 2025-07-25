"use client"

import { Search, Bell, Users, Briefcase, Home, ChevronDown, User, Settings, LogOut, Accessibility } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link"
import { useAccessibility } from "./accessibility-provider"
import { AccessibilitySettingsModal } from "./accessibility-settings-modal"

export function Header() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showAccessibilityModal, setShowAccessibilityModal] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const { settings } = useAccessibility()

  useEffect(() => {
    async function fetchUserProfile() {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      }
    }
    fetchUserProfile();
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push('/auth');
  };

  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname === '/dashboard') return 'home'
    if (pathname === '/network') return 'network'
    if (pathname === '/jobs') return 'jobs'
    if (pathname === '/notifications') return 'notifications'
    return 'home'
  }

  const activeTab = getActiveTab()

  return (
    <>
      <header className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 min-w-0">
            {/* Logo and Search */}
            <div className="flex items-center space-x-4 lg:space-x-6 flex-1 min-w-0">
              <Link href="/dashboard" className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-mustard to-forest-green bg-clip-text text-transparent hover:opacity-80 transition-opacity flex-shrink-0">
                Access<span className="text-foreground">Able</span>
              </Link>
              <div className="relative group flex-1 max-w-md lg:max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-mustard transition-colors" />
                <Input
                  placeholder="Search for jobs, people, companies..."
                  className="pl-10 w-full bg-muted border-border focus:bg-background focus:border-mustard transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                  aria-label="Search for jobs, people, companies"
                />
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
              {[
                { icon: Home, label: "Home", key: "home", badge: null, href: "/dashboard" },
                { icon: Users, label: "Network", key: "network", badge: null, href: "/network" },
                { icon: Briefcase, label: "Jobs", key: "jobs", badge: null, href: "/jobs" },
                { icon: Bell, label: "Notifications", key: "notifications", badge: null, href: "/notifications" },
              ].map(({ icon: Icon, label, key, badge, href }) => (
                <Link key={key} href={href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col items-center p-2 lg:p-3 h-auto relative transition-all duration-200 hover:bg-accent min-w-0 ${
                      activeTab === key ? "text-mustard bg-accent" : "text-foreground"
                    }`}
                    aria-label={`Navigate to ${label}`}
                  >
                    <div className="relative">
                      <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                      {badge && (
                        <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs bg-mustard hover:bg-mustard text-foreground">
                          {badge}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs mt-1 font-medium hidden sm:block">{label}</span>
                    {activeTab === key && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-mustard rounded-full" />
                    )}
                  </Button>
                </Link>
              ))}

              {/* Accessibility Settings Button - hide on /profile */}
              {pathname !== "/profile" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center p-2 lg:p-3 h-auto hover:bg-accent transition-colors min-w-0 text-foreground"
                  onClick={() => setShowAccessibilityModal(true)}
                  aria-label="Accessibility settings"
                >
                  <Accessibility className="h-4 w-4 lg:h-5 lg:w-5" />
                  <span className="text-xs mt-1 font-medium hidden sm:block">Access</span>
                </Button>
              )}

              {/* Profile Menu */}
              <div className="ml-2 lg:ml-4 pl-2 lg:pl-4 border-l border-border relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 p-2 h-auto hover:bg-accent transition-colors min-w-0"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  aria-label="Profile menu"
                >
                  <Avatar className="h-6 w-6 lg:h-8 lg:w-8 ring-2 ring-mustard flex-shrink-0">
                    <AvatarImage src={userProfile?.avatar_url || "/placeholder.svg?height=32&width=32"} alt={`${userProfile?.first_name || 'User'} profile picture`} />
                    <AvatarFallback className="bg-gradient-to-br from-mustard to-forest-green text-white text-xs lg:text-sm">
                      {userProfile ? `${userProfile.first_name?.[0] || ''}${userProfile.last_name?.[0] || ''}` : 'ME'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-xs font-medium text-foreground truncate">Me</span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                </Button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg border border-border z-50" ref={profileMenuRef}>
                    <div className="py-1">
                      <Link href="/profile">
                        <Button
                          variant="ghost"
                          className="w-full justify-start px-4 py-2 text-sm text-foreground hover:bg-accent"
                          onClick={() => setShowProfileMenu(false)}
                          aria-label="Edit profile"
                        >
                          <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                          Edit Profile
                        </Button>
                      </Link>
                      <hr className="my-1 border-border" />
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                        onClick={handleSignOut}
                        aria-label="Sign out of account"
                      >
                        <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Accessibility Settings Modal - hide on /profile */}
      {pathname !== "/profile" && (
        <AccessibilitySettingsModal 
          isOpen={showAccessibilityModal}
          onClose={() => setShowAccessibilityModal(false)}
        />
      )}
    </>
  )
}
