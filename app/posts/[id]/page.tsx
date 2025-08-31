"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Header } from "@/components/header";
import { FeedPost } from "@/components/feed-post";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes: number;
  comments: number;
  shares: number;
  image_url?: string;
  video_url?: string;
  is_job_post: boolean;
  author_name: string;
  avatar_url?: string;
  job_metadata?: {
    company_name?: string;
    location?: string;
    is_remote?: boolean;
    job_type?: string;
    salary_range?: string;
    deadline?: string;
    application_link?: string;
    accessibility_features?: any;
  };
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
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
    async function fetchPost() {
      if (!postId) return;
      
      try {
        setLoading(true);
        const supabase = getSupabaseClient();
        
        // Fetch the post with job metadata
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*, job_metadata')
          .eq('id', postId)
          .single();

        if (postError) {
          setError("Post not found");
          setLoading(false);
          return;
        }

        // Fetch the author's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url, organization_name, account_type')
          .eq('id', postData.user_id)
          .single();

        if (profileError) {
          setError("Error loading post author");
          setLoading(false);
          return;
        }

        // Fetch comment count
        const { count: commentCount, error: commentError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        // Fetch like count
        const { count: likeCount, error: likeError } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        // Determine author name
        let authorName = 'Anonymous';
        if (profileData) {
          if (profileData.account_type === 'NGO' || profileData.account_type === 'NGO / Organization') {
            authorName = profileData.organization_name || 'Organization';
          } else {
            authorName = `${profileData.first_name} ${profileData.last_name}`.trim();
          }
        }

        const transformedPost: Post = {
          id: postData.id,
          user_id: postData.user_id,
          title: postData.title,
          content: postData.content,
          created_at: postData.created_at,
          updated_at: postData.updated_at,
          likes: likeCount || 0,
          comments: commentCount || 0,
          shares: postData.shares || 0,
          image_url: postData.image_url,
          video_url: postData.video_url,
          is_job_post: postData.is_job_post || false,
          author_name: authorName,
          avatar_url: profileData?.avatar_url,
          job_metadata: postData.job_metadata,
        };

        setPost(transformedPost);
      } catch (err) {
        setError("Error loading post");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground py-12">Loading post...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-destructive py-12">
            {error || "Post not found"}
          </div>
          <div className="text-center">
            <Link href="/dashboard">
              <Button variant="outline">Back to Feed</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex items-center space-x-2 text-foreground hover:bg-accent">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Feed</span>
            </Button>
          </Link>
        </div>

        {/* Job Details Section - Only show for job posts */}
        {post.is_job_post && post.job_metadata && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-foreground">{post.title}</h1>
              <div className="text-sm text-muted-foreground">
                Posted by {post.author_name}
              </div>
            </div>
            
            {/* Job Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {post.job_metadata.company_name && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium text-foreground">{post.job_metadata.company_name}</span>
                </div>
              )}
              
              {post.job_metadata.location && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium text-foreground">{post.job_metadata.location}</span>
                  {post.job_metadata.is_remote && (
                    <span className="text-xs bg-mustard/20 text-mustard px-2 py-1 rounded-full">Remote</span>
                  )}
                </div>
              )}
              
              {post.job_metadata.job_type && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Job Type:</span>
                  <span className="font-medium text-foreground">{post.job_metadata.job_type}</span>
                </div>
              )}
              
              {post.job_metadata.salary_range && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Salary:</span>
                  <span className="font-medium text-foreground">{post.job_metadata.salary_range}</span>
                </div>
              )}
              
              {post.job_metadata.deadline && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Deadline:</span>
                  <span className="font-medium text-foreground">{post.job_metadata.deadline}</span>
                </div>
              )}
            </div>
            
            {/* Job Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Job Description</h3>
              <div className="text-foreground leading-relaxed">{post.content}</div>
            </div>
            
            {/* Accessibility Features */}
            {post.job_metadata.accessibility_features && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Accessibility Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {post.job_metadata.accessibility_features.remoteWork && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>Remote work options</span>
                    </div>
                  )}
                  {post.job_metadata.accessibility_features.flexibleHours && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>Flexible hours</span>
                    </div>
                  )}
                  {post.job_metadata.accessibility_features.accessibleOffice && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>Accessible office space</span>
                    </div>
                  )}
                  {post.job_metadata.accessibility_features.assistiveTechnology && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>Assistive technology provided</span>
                    </div>
                  )}
                  {post.job_metadata.accessibility_features.screenReaderSupport && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>Screen reader support</span>
                    </div>
                  )}
                  {post.job_metadata.accessibility_features.signLanguageSupport && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>Sign language support</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Apply Button */}
            {post.job_metadata.application_link && (
              <div className="flex justify-center">
                <a
                  href={post.job_metadata.application_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-mustard hover:bg-yellow-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  Apply for this position →
                </a>
              </div>
            )}
          </div>
        )}
        

      </div>
    </div>
  );
} 