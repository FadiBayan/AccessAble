'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Header } from "../../components/header"
import { PostCreation } from "../../components/post-creation"
import { NGOProfileSidebar } from "../../components/NGOProfileSidebar"
import { JobSidebar } from "../../components/job-sidebar"
import PostsList from '@/components/PostsList';
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function checkAuth() {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
      } else {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-mustard mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-mustard mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream relative">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid min-w-0 flex-wrap grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <NGOProfileSidebar />
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <PostCreation />
            <PostsList />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-yellow-50 rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-charcoal mb-4">Recommended Jobs</h3>
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">AI-powered job recommendations</p>
                <p className="text-xs mt-2">Coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 