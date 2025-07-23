'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Header } from "../components/header"
import { PostCreation } from "../components/post-creation"
import { FeedPost } from "../components/feed-post"
import { ProfileSidebar } from "../components/profile-sidebar"
import { JobSidebar } from "../components/job-sidebar"
import PostsList from '@/components/PostsList';
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

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
    <div className="min-h-screen bg-cream relative">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
          <Loader2 className="animate-spin h-12 w-12 text-mustard" />
        </div>
      )}
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid min-w-0 flex-wrap grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <ProfileSidebar />
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <PostCreation />
            <PostsList />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            {pathname === "/" || pathname === "/dashboard" ? (
              <div className="bg-yellow-50 rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4">Recommended Jobs</h3>
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">AI-powered job recommendations</p>
                  <p className="text-xs mt-2">Coming soon...</p>
                </div>
              </div>
            ) : (
              <JobSidebar />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
