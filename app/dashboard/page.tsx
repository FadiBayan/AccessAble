export const dynamic = "force-dynamic";

"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Header } from "@/components/header"
import { PostCreation } from "@/components/post-creation"
import PostsList from "@/components/PostsList"
import { ProfileSidebar } from "@/components/profile-sidebar"
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
      }
    }
    checkAuth();
  }, [router]);

 
  return (
    <div className="min-h-screen bg-background relative">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70">
          <Loader2 className="animate-spin h-12 w-12 text-mustard" />
        </div>
      )}
      <Header />
      <main id="main-content" className="container-responsive max-w-7xl mx-auto px-4 py-6">
        <div className="grid min-w-0 flex-wrap grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Profile */}
          <div className="lg:col-span-3 order-1 lg:order-1">
            <div className="sticky top-24">
              <ProfileSidebar />
            </div>
          </div>

          {/* Main Content - Feed */}
          <div className="lg:col-span-6 order-3 lg:order-2">
            <PostCreation />
            <hr className="my-4 border-border" />
            <PostsList />
          </div>

          {/* Right Sidebar - Recommended Jobs */}
          <div className="lg:col-span-3 order-2 lg:order-3">
            <div className="sticky top-24">
              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Recommended Jobs</h3>
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">AI-powered job recommendations</p>
                  <p className="text-xs mt-2">Coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
