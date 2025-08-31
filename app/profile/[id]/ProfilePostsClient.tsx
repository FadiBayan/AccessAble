"use client";
import React from "react";
import { getSupabaseClient } from '@/lib/supabaseClient';
import { FeedPost } from '@/components/feed-post';
import { formatPostTime } from '@/lib/utils';

export default function ProfilePostsClient({ posts, profile, ngo }: { posts: any[]; profile: any; ngo: boolean }) {
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const jobPosts = React.useMemo(() => posts.filter(p => p.is_job_post), [posts]);
  const regularPosts = React.useMemo(() => posts.filter(p => !p.is_job_post), [posts]);
  React.useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    })();
  }, []);

  if (!posts) return null;
  if (posts.length === 0) return <div className="text-gray-500">{ngo ? 'No campaigns or posts yet.' : 'No posts yet.'}</div>;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left sidebar: Jobs slider (moved here) */}
      <div className="hidden lg:block space-y-4">
        {jobPosts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Jobs</h3>
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-2">
                {jobPosts.map((post) => (
                  <div key={post.id} className="min-w-[320px] max-w-[360px] w-[360px] bg-card border border-border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">{formatPostTime(post.created_at)}</div>
                    <div className="font-semibold text-foreground mb-1 truncate">{post.title || 'Job'}</div>
                    <div className="text-sm text-muted-foreground line-clamp-3 mb-3">{post.content || ''}</div>
                    
                    {/* Job Details */}
                    {post.job_metadata && (
                      <div className="mb-3 space-y-1">
                        {post.job_metadata.company_name && (
                          <div className="text-xs text-muted-foreground">Company: {post.job_metadata.company_name}</div>
                        )}
                        {post.job_metadata.location && (
                          <div className="text-xs text-muted-foreground">Location: {post.job_metadata.location}</div>
                        )}
                        {post.job_metadata.job_type && (
                          <div className="text-xs text-muted-foreground">Type: {post.job_metadata.job_type}</div>
                        )}
                      </div>
                    )}
                    
                    {/* Apply Button */}
                    {post.job_metadata?.application_link && (
                      <div className="mb-3">
                        <a
                          href={post.job_metadata.application_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-full bg-mustard hover:bg-forest-green text-white font-medium py-2 px-4 rounded-lg transition-colors"
                          onClick={() => {
                            console.log('Profile Apply button clicked - URL:', post.job_metadata.application_link);
                          }}
                        >
                          Apply Now
                        </a>
                      </div>
                    )}
                    
                    {/* Job Post Link */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <a
                        href={`/posts/${post.id}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        View full post →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main column: posts with horizontal jobs slider */}
      <div className="space-y-8 lg:col-span-2">
        {regularPosts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Posts</h3>
            {regularPosts.map((post) => (
              <FeedPost
                key={post.id}
                postId={post.id}
                author={profile.user_metadata?.displayName || (ngo ? profile.organization_name : `${profile.first_name} ${profile.last_name}`)}
                title={post.title || ''}
                time={formatPostTime(post.created_at)}
                createdAt={post.created_at}
                content={post.content || ''}
                likes={post.likes || 0}
                comments={post.comments || 0}
                shares={post.shares || 0}
                avatar={profile.avatar_url}
                isVerified={false}
                imageUrl={post.image_url}
                videoUrl={post.video_url}
                isJobPost={false}
                postUserId={profile.id}
                currentUserId={currentUserId || undefined}
              />
            ))}
          </div>
        )}

        {/* Jobs removed from bottom; now left sidebar */}
      </div>

      {/* Right sidebar intentionally left empty for now */}
    </div>
  );
} 