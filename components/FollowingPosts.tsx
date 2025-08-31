"use client"

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Sparkles, User } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { FeedPost } from "@/components/feed-post";

interface FollowingPostsProps {
  currentUserId?: string;
  refreshKey?: number; // Add this to force refresh when posts are created
}

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  likes: number;
  comments: number;
  shares: number;
  image_url?: string;
  video_url?: string;
  is_job_post?: boolean;
  author_name: string;
  avatar_url?: string;
  is_following: boolean;
  is_own_post: boolean;
}

export function FollowingPosts({ currentUserId, refreshKey }: FollowingPostsProps) {
  console.log('=== FollowingPosts component rendered ===');
  console.log('Props - currentUserId:', currentUserId, 'refreshKey:', refreshKey);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    console.log('=== FollowingPosts fetchPosts called ===');
    console.log('currentUserId:', currentUserId);
    
    if (!currentUserId) {
      console.log('No currentUserId, skipping fetch');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();

      // First, get the users that the current user is following
      const { data: followingData, error: followingError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUserId);

      if (followingError) {
        console.error('Error fetching following:', followingError);
        setError('Failed to load posts');
        return;
      }

      const followingIds = followingData?.map(follow => follow.following_id) || [];
      
      console.log('Following IDs:', followingIds);
      console.log('Current User ID:', currentUserId);
      
      // Get posts from users being followed AND your own posts
      let followingPosts;
      let followingPostsError;
      
      if (followingIds.length > 0) {
        // If you're following people, get their posts + your posts
        const result = await supabase
          .from('posts')
          .select('*')
          .in('user_id', [...followingIds, currentUserId])
          .order('created_at', { ascending: false });
        followingPosts = result.data;
        followingPostsError = result.error;
      } else {
        // If you're not following anyone, just get your own posts
        const result = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false });
        followingPosts = result.data;
        followingPostsError = result.error;
      }
      
      console.log('Following posts result:', followingPosts);

      if (followingPostsError) {
        console.error('Error fetching following posts:', followingPostsError);
        setError('Failed to load posts');
        return;
      }

      // Get other posts (suggested) - exclude your own posts and following posts
      let suggestedPosts;
      let suggestedPostsError;
      
      if (followingIds.length > 0) {
        // If you're following people, exclude their posts and your posts
        const result = await supabase
          .from('posts')
          .select('*')
          .not('user_id', 'in', `(${[...followingIds, currentUserId].join(',')})`)
          .order('created_at', { ascending: false })
          .limit(10);
        suggestedPosts = result.data;
        suggestedPostsError = result.error;
      } else {
        // If you're not following anyone, just exclude your own posts
        const result = await supabase
          .from('posts')
          .select('*')
          .neq('user_id', currentUserId)
          .order('created_at', { ascending: false })
          .limit(10);
        suggestedPosts = result.data;
        suggestedPostsError = result.error;
      }
      
      console.log('Suggested posts result:', suggestedPosts);

      if (suggestedPostsError) {
        console.error('Error fetching suggested posts:', suggestedPostsError);
        setError('Failed to load suggested posts');
        return;
      }

      // Get profile data for all post authors
      const allUserIds = [
        ...(followingPosts?.map(post => post.user_id) || []),
        ...(suggestedPosts?.map(post => post.user_id) || [])
      ];

      console.log('All user IDs for profile lookup:', allUserIds);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization_name, account_type')
        .in('id', allUserIds);
        
      console.log('Profiles data:', profilesData);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setError('Failed to load profile data');
        return;
      }

      // Create a map of profiles
      const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || []);

      // Process following posts and your own posts
      const processedFollowingPosts = followingPosts?.map(post => {
        const isOwnPost = post.user_id === currentUserId;
        const isFollowing = !isOwnPost && followingIds.includes(post.user_id);
        
        console.log(`Post ${post.id}: user_id=${post.user_id}, isOwnPost=${isOwnPost}, isFollowing=${isFollowing}`);
        
        return {
          ...post,
          author_name: getDisplayName(profilesMap.get(post.user_id)),
          avatar_url: profilesMap.get(post.user_id)?.avatar_url,
          is_following: isFollowing,
          is_own_post: isOwnPost
        };
      }) || [];

      // Process suggested posts
      const processedSuggestedPosts = suggestedPosts?.map(post => ({
        ...post,
        author_name: getDisplayName(profilesMap.get(post.user_id)),
        avatar_url: profilesMap.get(post.user_id)?.avatar_url,
        is_following: false,
        is_own_post: false
      })) || [];

      // Combine posts with following posts first
      const allPosts = [...processedFollowingPosts, ...processedSuggestedPosts];
      
      console.log('Final posts breakdown:');
      console.log('- Following posts (including own):', processedFollowingPosts.length);
      console.log('- Suggested posts:', processedSuggestedPosts.length);
      console.log('- Total posts:', allPosts.length);
      
      // Log each post's categorization
      allPosts.forEach(post => {
        console.log(`Post "${post.title}": user_id=${post.user_id}, is_own_post=${post.is_own_post}, is_following=${post.is_following}`);
      });
      
      setPosts(allPosts);

    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  const getDisplayName = (profile: any) => {
    if (!profile) return 'Unknown User';
    if (profile.account_type === 'NGO' || profile.account_type === 'NGO / Organization') {
      return profile.organization_name || 'Organization';
    }
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, refreshKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading posts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p className="mb-4">{error}</p>
            <button 
              onClick={fetchPosts}
              className="bg-mustard text-white px-4 py-2 rounded hover:bg-forest-green transition"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p>Start following people to see their posts here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Separate following and suggested posts
  const followingPosts = posts.filter(post => post.is_following || post.is_own_post);
  const suggestedPosts = posts.filter(post => !post.is_following && !post.is_own_post);

  return (
    <div className="space-y-6">
      {/* Following Posts Section */}
      {followingPosts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-mustard" />
            <h2 className="text-lg font-semibold text-foreground">Your Posts & Following</h2>
            <Badge className="bg-mustard text-white">{followingPosts.length}</Badge>
          </div>
          
          {followingPosts.map((post) => (
            <div key={post.id} className="relative">
              <div className="absolute top-4 right-4 z-10">
                {!post.is_own_post && (
                  <Badge className="bg-mustard text-white flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Following
                  </Badge>
                )}
              </div>

              <FeedPost
                postId={post.id}
                author={post.author_name}
                title={post.title || ""}
                time={new Date(post.created_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true
                })}
                content={post.content || ""}
                likes={post.likes || 0}
                comments={post.comments || 0}
                shares={post.shares || 0}
                avatar={post.avatar_url}
                isVerified={false}
                imageUrl={post.image_url}
                videoUrl={post.video_url}
                isJobPost={post.is_job_post}
                currentUserId={currentUserId}
                postUserId={post.user_id}
              />
            </div>
          ))}
        </div>
      )}

      {/* Suggested Posts Section */}
      {suggestedPosts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Suggested for You</h2>
            <Badge variant="outline">{suggestedPosts.length}</Badge>
          </div>
          
          {suggestedPosts.map((post) => (
            <div key={post.id} className="relative">
              <div className="absolute top-4 right-4 z-10">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Suggested
                </Badge>
              </div>

              <FeedPost
                postId={post.id}
                author={post.author_name}
                title={post.title || ""}
                time={new Date(post.created_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true
                })}
                content={post.content || ""}
                likes={post.likes || 0}
                comments={post.comments || 0}
                shares={post.shares || 0}
                avatar={post.avatar_url}
                isVerified={false}
                imageUrl={post.image_url}
                videoUrl={post.video_url}
                isJobPost={post.is_job_post}
                currentUserId={currentUserId}
                postUserId={post.user_id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 