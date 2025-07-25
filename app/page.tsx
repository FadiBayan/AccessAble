'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function checkAuth() {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Redirect authenticated users to dashboard
        router.push('/dashboard');
      } else {
        setUser(null);
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-charcoal mb-4">
            Welcome to <span className="bg-gradient-to-r from-mustard to-forest-green bg-clip-text text-transparent">AccessAble</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            The professional network designed for people with disabilities
          </p>
          <div className="space-x-4">
            <Link href="/auth">
              <Button className="bg-mustard hover:bg-forest-green text-white px-8 py-3">
                Get Started
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline" className="px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
