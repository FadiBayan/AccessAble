"use client"

import { useState, useEffect, useCallback } from "react";
import { FollowButton } from "@/components/FollowButton";
import { FollowersList } from "@/components/FollowersList";
import { FollowingList } from "@/components/FollowingList";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSupabaseClient } from "@/lib/supabaseClient";
import ProfilePostsClient from "./ProfilePostsClient";
import ErrorBoundary from "@/components/ErrorBoundary";

interface ProfileClientProps {
  profile: any;
  posts: any[];
  ngo: boolean;
}

export default function ProfileClient({ profile, posts, ngo }: ProfileClientProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);

  const getCurrentUser = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  }, []);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const supabase = getSupabaseClient();
        const [{ count: followers }, { count: following }] = await Promise.all([
          supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
          supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
        ]);
        console.log('Fetched counts for user:', profile.id, 'followers:', followers, 'following:', following);
        setFollowersCount(followers || 0);
        setFollowingCount(following || 0);
      } catch (e) {
        console.error('Error fetching follow counts:', e);
      }
    }
    fetchCounts();
  }, [profile.id]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Follow + Counts */}
        <div className="flex items-center justify-center gap-10">
          <FollowButton targetUserId={profile.id} currentUserId={currentUserId} showCount={false} />
          <button
            className="text-center hover:bg-accent hover:scale-105 transition-all duration-200 rounded-lg p-3 cursor-pointer border border-transparent hover:border-border group"
            onClick={() => {
              console.log('Opening followers dialog for user:', profile.id);
              setFollowersOpen(true);
            }}
            aria-label="View followers"
            title="Click to view followers"
          >
            <div className="text-2xl font-extrabold text-foreground text-center">{followersCount}</div>
            <div className="text-xs text-muted-foreground text-center group-hover:text-foreground">Followers</div>
          </button>
          <button
            className="text-center hover:bg-accent hover:scale-105 transition-all duration-200 rounded-lg p-3 cursor-pointer border border-transparent hover:border-border group"
            onClick={() => {
              console.log('Opening following dialog for user:', profile.id);
              setFollowingOpen(true);
            }}
            aria-label="View following"
            title="Click to view following"
          >
            <div className="text-2xl font-extrabold text-foreground text-center">{followingCount}</div>
            <div className="text-xs text-muted-foreground text-center group-hover:text-foreground">Following</div>
          </button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <ProfilePostsClient posts={posts} profile={profile} ngo={ngo} />
          </TabsContent>

          {/* Followers/Following moved to dialogs */}

          <TabsContent value="about" className="mt-6">
            <div className="space-y-4">
              {profile.bio && (
                <div className="bg-card p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-foreground">Bio</h3>
                  <p className="text-muted-foreground">{profile.bio}</p>
                </div>
              )}
              
              {profile.location && (
                <div className="bg-card p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-foreground">Location</h3>
                  <p className="text-muted-foreground">{profile.location}</p>
                </div>
              )}

              {profile.title && (
                <div className="bg-card p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-foreground">Title</h3>
                  <p className="text-muted-foreground">{profile.title}</p>
                </div>
              )}

              {profile.company && (
                <div className="bg-card p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-foreground">Company</h3>
                  <p className="text-muted-foreground">{profile.company}</p>
                </div>
              )}

              {profile.accessibility_needs && profile.accessibility_needs.length > 0 && (
                <div className="bg-card p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-foreground">Accessibility Needs</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.accessibility_needs.map((need: string, index: number) => (
                      <span key={index} className="bg-mustard text-white px-2 py-1 rounded text-sm">
                        {need}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div className="bg-card p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-foreground">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill: string, index: number) => (
                      <span key={index} className="bg-accent text-accent-foreground px-2 py-1 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Followers Dialog */}
        <Dialog open={followersOpen} onOpenChange={setFollowersOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Followers ({followersCount})</DialogTitle>
            </DialogHeader>
            <FollowersList userId={profile.id} currentUserId={currentUserId} />
          </DialogContent>
        </Dialog>

        {/* Following Dialog */}
        <Dialog open={followingOpen} onOpenChange={setFollowingOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Following ({followingCount})</DialogTitle>
            </DialogHeader>
            <FollowingList userId={profile.id} currentUserId={currentUserId} />
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
} 