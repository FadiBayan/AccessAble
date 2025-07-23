"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Accessibility, Eye, Volume2, Edit, RefreshCw } from "lucide-react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAccessibility } from "@/components/accessibility-provider";

export function ProfileSidebar({ showEditButton = true }: { showEditButton?: boolean }) {
  const { settings } = useAccessibility();
  const highContrast = settings.highContrast;
  const [profile, setProfile] = useState<any>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  const fetchProfileAndCounts = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        setLoading(false);
        return;
      }
      
      if (!user) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      console.log('Fetching profile for user:', user.id);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        setLoading(false);
        return;
      }

      console.log('Profile data:', profileData);
      setProfile(profileData);

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);
      setFollowers(followersCount || 0);

      // Fetch following count
      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id);
      setFollowing(followingCount || 0);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndCounts();
  }, []);

  // Refresh profile data every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchProfileAndCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <Card className="bg-white shadow-md rounded-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-mustard" />
          <span className="ml-2 text-gray-600">Loading profile...</span>
        </div>
      </CardContent>
    </Card>
  );

  if (!profile) return (
    <Card className="bg-white shadow-md rounded-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="text-center py-8">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className={`shadow-md rounded-lg overflow-hidden ${highContrast ? 'bg-[#1f2937] text-white border border-white/10' : 'bg-white text-charcoal'}`}>
      <CardHeader className="relative p-0">
        <div className="h-20 bg-gradient-to-r from-mustard to-forest-green" />
        <div className="absolute top-8 left-1/2 -translate-x-1/2">
          <Avatar className={`h-24 w-24 ring-4 ${highContrast ? 'ring-white/20' : 'ring-white'}`}> 
            <AvatarImage src={profile?.avatar_url || "/placeholder.svg?height=96&width=96"} alt={profile?.first_name} />
            <AvatarFallback className="bg-gradient-to-br from-mustard to-forest-green text-white text-3xl">
              {profile?.first_name?.[0] || ''}{profile?.last_name?.[0] || ''}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-16 text-center">
        <h2 className={`text-xl font-bold ${highContrast ? 'text-white' : 'text-charcoal'}`}>{profile?.first_name} {profile?.last_name}</h2>
        <p className={`text-sm mb-4 ${highContrast ? 'text-gray-200' : 'text-gray-600'}`}>{profile?.title}</p>
        <div className="flex justify-around text-center mb-4">
          <div>
            <p className={`text-sm font-semibold ${highContrast ? 'text-white' : 'text-charcoal'}`}>{followers}</p>
            <p className={`text-xs ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>Followers</p>
          </div>
          <div>
            <p className={`text-sm font-semibold ${highContrast ? 'text-white' : 'text-charcoal'}`}>{following}</p>
            <p className={`text-xs ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>Following</p>
          </div>
        </div>
        {showEditButton && (
          <Link href="/profile">
            <Button className={`w-full ${highContrast ? 'bg-yellow-400 text-black hover:bg-yellow-500 transition' : 'bg-mustard hover:bg-forest-green text-white font-medium'}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        )}
        <Separator className="my-4" />
        <CardTitle className={`text-lg font-bold mb-3 flex items-center justify-center ${highContrast ? 'text-white' : 'text-charcoal'}`}>
          <Accessibility className="h-5 w-5 mr-2 text-mustard" />
          Accessibility Profile
        </CardTitle>
        <div className="space-y-2">
          {(profile?.accessibility_needs || []).map((need: string) => (
            <div key={need} className={`flex items-center justify-center space-x-2 ${highContrast ? 'text-gray-200' : 'text-gray-700'}`}>
              {need === "visual" && <Eye className="h-4 w-4 text-indigo" />}
              {need === "hearing" && <Volume2 className="h-4 w-4 text-indigo" />}
              {/* Add more icons as needed */}
              <span className="text-sm">{need.replace(/^\w/, c => c.toUpperCase())} Impairment</span>
            </div>
          ))}
          {(profile?.accessibility_needs || []).length === 0 && (
            <p className={`text-sm text-center ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>No accessibility needs specified</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}