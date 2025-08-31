"use client";

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { FeedPost } from "@/components/feed-post";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, Sparkles } from "lucide-react";
import { formatPostTime } from '@/lib/utils';

interface TransformedPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  created_at: string;
  updated_at: string;
  author_name: string;
  avatar_url?: string;
  image_url?: string;
  video_url?: string;
  is_job_post?: boolean;
  job_metadata?: any;
}

interface FollowingPostsProps {
  currentUserId: string | null;
  refreshKey: number;
}

export function FollowingPosts({ currentUserId, refreshKey }: FollowingPostsProps) {
  const [allPosts, setAllPosts] = useState<TransformedPost[]>([]);
  const [followingPosts, setFollowingPosts] = useState<TransformedPost[]>([]);
  const [suggestedPosts, setSuggestedPosts] = useState<TransformedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPosts = async () => {
    try {
      const supabase = getSupabaseClient();
      
      // Fetch all posts with job metadata
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, job_metadata')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch profiles for all users
      const userIds = Array.from(new Set(postsData?.map(post => post.user_id) || []));
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization_name, account_type')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user profiles
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Fetch comment counts for all posts
      const postIds = postsData?.map(post => post.id) || [];
      const { data: commentCounts, error: commentError } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds);

      if (commentError) {
        console.error('Error fetching comment counts:', commentError);
      }

      // Create a map of comment counts
      const commentCountMap = new Map();
      commentCounts?.forEach(comment => {
        commentCountMap.set(comment.post_id, (commentCountMap.get(comment.post_id) || 0) + 1);
      });

      // Fetch like counts for all posts
      const { data: likeCounts, error: likeError } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds);

      if (likeError) {
        console.error('Error fetching like counts:', likeError);
      }

      // Create a map of like counts
      const likeCountMap = new Map();
      likeCounts?.forEach(like => {
        likeCountMap.set(like.post_id, (likeCountMap.get(like.post_id) || 0) + 1);
      });

      // Transform the data to include author information and real counts
      const transformedPosts: TransformedPost[] = postsData?.map((post: any) => {
        const profile = profilesMap.get(post.user_id);
        const realCommentCount = commentCountMap.get(post.id) || 0;
        const realLikeCount = likeCountMap.get(post.id) || 0;
        
        let author_name = 'Anonymous';
        if (profile) {
          if (profile.account_type === 'NGO' || profile.account_type === 'NGO / Organization') {
            author_name = profile.organization_name || 'Organization';
          } else {
            author_name = `${profile.first_name} ${profile.last_name}`.trim();
          }
        }
        return {
          id: post.id,
          user_id: post.user_id,
          title: post.title,
          content: post.content,
          tags: post.tags,
          likes: realLikeCount,
          comments: realCommentCount,
          shares: post.shares || 0,
          created_at: post.created_at,
          updated_at: post.updated_at,
          author_name,
          avatar_url: profile?.avatar_url || undefined,
          image_url: post.image_url || undefined,
          video_url: post.video_url || undefined,
          is_job_post: post.is_job_post || false,
          job_metadata: post.job_metadata,
        };
      }) || [];

      setAllPosts(transformedPosts);

      // If user is logged in, fetch their following list
      if (currentUserId) {
        const { data: followingData, error: followingError } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', currentUserId);

        if (!followingError && followingData) {
          const followingIds = followingData.map(follow => follow.following_id);
          
          // Separate posts into following and suggested
          const following = transformedPosts.filter(post => followingIds.includes(post.user_id));
          const suggested = transformedPosts.filter(post => !followingIds.includes(post.user_id) && post.user_id !== currentUserId);
          
          setFollowingPosts(following);
          setSuggestedPosts(suggested);
        } else {
          // If no following data, all posts go to suggested (except user's own posts)
          const suggested = transformedPosts.filter(post => post.user_id !== currentUserId);
          setFollowingPosts([]);
          setSuggestedPosts(suggested);
        }
      } else {
        // If no user logged in, all posts go to suggested
        setFollowingPosts([]);
        setSuggestedPosts(transformedPosts);
      }

    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    fetchPosts();
  }, [mounted, currentUserId, refreshKey]);

  const handlePostUpdate = (postId: string, newTitle: string, newContent: string) => {
    setAllPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, title: newTitle, content: newContent }
          : post
      )
    );
    setFollowingPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, title: newTitle, content: newContent }
          : post
      )
    );
    setSuggestedPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, title: newTitle, content: newContent }
          : post
      )
    );
  };

  const handlePostDelete = (postId: string) => {
    setAllPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    setFollowingPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    setSuggestedPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  const refreshAllPosts = () => {
    console.log('🔄 Refreshing all posts due to comment/like change');
    fetchPosts();
  };

  if (!mounted) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (loading) return <div className="text-center py-8">Loading posts...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

  return (
    <Tabs defaultValue="following" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="following" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Following ({followingPosts.length})
        </TabsTrigger>
        <TabsTrigger value="suggested" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Suggested ({suggestedPosts.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="following" className="space-y-6">
        {followingPosts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-2">No posts from people you follow</p>
              <p className="text-sm">Start following people to see their posts here!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {followingPosts.map(post => (
              <div key={post.id} className="bg-card rounded-lg shadow-sm border border-border p-4 mb-4 hover:shadow-md hover:scale-105 transition duration-200">
                <FeedPost
                  postId={post.id}
                  author={post.author_name}
                  title={post.title || ""}
                  time={formatPostTime(post.created_at)}
                  createdAt={post.created_at}
                  content={post.content || ""}
                  likes={post.likes || 0}
                  comments={post.comments || 0}
                  shares={post.shares || 0}
                  avatar={post.avatar_url}
                  isVerified={false}
                  imageUrl={post.image_url}
                  videoUrl={post.video_url}
                  isJobPost={post.is_job_post}
                  jobMetadata={post.job_metadata}
                  currentUserId={currentUserId || undefined}
                  postUserId={post.user_id}
                  onPostUpdate={handlePostUpdate}
                  onPostDelete={handlePostDelete}
                  onCommentChange={refreshAllPosts}
                />
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="suggested" className="space-y-6">
        {suggestedPosts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-2">No suggested posts</p>
              <p className="text-sm">Check back later for new content!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {suggestedPosts.map(post => (
              <div key={post.id} className="bg-card rounded-lg shadow-sm border border-border p-4 mb-4 hover:shadow-md hover:scale-105 transition duration-200">
                <FeedPost
                  postId={post.id}
                  author={post.author_name}
                  title={post.title || ""}
                  time={formatPostTime(post.created_at)}
                  createdAt={post.created_at}
                  content={post.content || ""}
                  likes={post.likes || 0}
                  comments={post.comments || 0}
                  shares={post.shares || 0}
                  avatar={post.avatar_url}
                  isVerified={false}
                  imageUrl={post.image_url}
                  videoUrl={post.video_url}
                  isJobPost={post.is_job_post}
                  jobMetadata={post.job_metadata}
                  currentUserId={currentUserId || undefined}
                  postUserId={post.user_id}
                  onPostUpdate={handlePostUpdate}
                  onPostDelete={handlePostDelete}
                  onCommentChange={refreshAllPosts}
                />
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
} 
