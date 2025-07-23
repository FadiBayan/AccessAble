"use client";
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { FeedPost } from "@/components/feed-post";

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
}

export default function PostsList() {
  const [posts, setPosts] = useState<TransformedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCurrentUser() {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    }
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const supabase = getSupabaseClient();
        // First fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        // Then fetch profiles for all users
        const userIds = Array.from(new Set(postsData?.map(post => post.user_id) || []));
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Create a map of user profiles
        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        // Transform the data to include author information
        const transformedPosts: TransformedPost[] = postsData?.map((post: any) => {
          const profile = profilesMap.get(post.user_id);
          return {
            id: post.id,
            user_id: post.user_id,
            title: post.title,
            content: post.content,
            tags: post.tags,
            likes: post.likes,
            comments: post.comments,
            shares: post.shares,
            created_at: post.created_at,
            updated_at: post.updated_at,
            author_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Anonymous',
            avatar_url: profile?.avatar_url || undefined,
            image_url: post.image_url || undefined,
            video_url: post.video_url || undefined,
            is_job_post: post.is_job_post || false,
          };
        }) || [];

        setPosts(transformedPosts);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  if (loading) return <div className="text-center py-8">Loading posts...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No posts yet. Be the first to share something!
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 hover:shadow-md hover:scale-105 transition duration-200">
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
                currentUserId={currentUserId || undefined}
                postUserId={post.user_id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
