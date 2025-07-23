"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabaseClient";
const supabase = getSupabaseClient();
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Briefcase, MapPin, Building, Globe, DollarSign, Calendar, Plus } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"

interface JobPost {
  id: string
  title: string
  content: string
  created_at: string
  author_name: string
  avatar_url?: string
  job_metadata?: {
    company_name: string
    location: string
    is_remote: boolean
    job_type: string
    salary_range?: string
    deadline?: string
    application_link?: string
    accessibility_features?: any
  }
}

export default function JobsPage() {
  const [jobPosts, setJobPosts] = useState<JobPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobPosts()
  }, [])

  const fetchJobPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('is_job_post', true)
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      // Fetch profiles for all users
      const userIds = Array.from(new Set(postsData?.map(post => post.user_id) || []))
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds)

      if (profilesError) throw profilesError

      // Create a map of user profiles
      const profilesMap = new Map()
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile)
      })

      // Transform the data
      const transformedJobPosts: JobPost[] = postsData?.map((post: any) => {
        const profile = profilesMap.get(post.user_id)
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          created_at: post.created_at,
          author_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Anonymous',
          avatar_url: profile?.avatar_url,
          job_metadata: post.job_metadata || {}
        }
      }) || []

      setJobPosts(transformedJobPosts)
    } catch (error) {
      console.error('Error fetching job posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-8">Loading jobs...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main id="main-content" className="container-responsive max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-charcoal mb-2">Jobs</h1>
            <p className="text-gray-600">Find accessible job opportunities</p>
          </div>
          <Link href="/jobs/post" className="mt-4 sm:mt-0">
            <Button className="bg-mustard hover:bg-forest-green text-white">
              <Plus className="h-4 w-4 mr-2" />
              Post a Job
            </Button>
          </Link>
        </div>

        {/* Job Posts */}
        <div className="space-y-6">
          {jobPosts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No jobs posted yet</h3>
                <p className="text-gray-500 mb-4">Be the first to share an accessible job opportunity!</p>
                <Link href="/jobs/post">
                  <Button className="bg-mustard hover:bg-forest-green text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Post the First Job
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            jobPosts.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 ring-2 ring-mustard flex-shrink-0">
                        <AvatarImage src={job.avatar_url} alt={job.author_name} />
                        <AvatarFallback className="bg-gradient-to-br from-mustard to-forest-green text-white">
                          {job.author_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-charcoal truncate">{job.title}</h3>
                          <Badge className="bg-green-100 text-green-800">Job</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{job.author_name} • {formatTimeAgo(job.created_at)}</p>
                        {job.job_metadata?.company_name && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <Building className="h-3 w-3 mr-1" />
                            {job.job_metadata.company_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.content}</p>
                    
                    {/* Job Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {job.job_metadata?.location && !job.job_metadata?.is_remote && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {job.job_metadata.location}
                        </div>
                      )}
                      {job.job_metadata?.is_remote && (
                        <div className="flex items-center text-gray-600">
                          <Globe className="h-4 w-4 mr-2" />
                          Remote
                        </div>
                      )}
                      {job.job_metadata?.job_type && (
                        <div className="flex items-center text-gray-600">
                          <Briefcase className="h-4 w-4 mr-2" />
                          {job.job_metadata.job_type}
                        </div>
                      )}
                      {job.job_metadata?.salary_range && (
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          {job.job_metadata.salary_range}
                        </div>
                      )}
                    </div>

                    {/* Accessibility Features */}
                    {job.job_metadata?.accessibility_features && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Accessibility Features:</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(job.job_metadata.accessibility_features).map(([feature, enabled]) => {
                            if (enabled) {
                              const featureLabels: { [key: string]: string } = {
                                screenReaderSupport: 'Screen Reader Support',
                                signLanguageSupport: 'Sign Language Support',
                                remoteWork: 'Remote Work',
                                flexibleHours: 'Flexible Hours',
                                assistiveTechnology: 'Assistive Technology',
                                accessibleOffice: 'Accessible Office'
                              }
                              return (
                                <Badge key={feature} variant="secondary" className="bg-mustard/10 text-mustard">
                                  {featureLabels[feature] || feature}
                                </Badge>
                              )
                            }
                            return null
                          })}
                        </div>
                      </div>
                    )}

                    {/* Application Link */}
                    {job.job_metadata?.application_link && (
                      <div className="mt-4">
                        <a
                          href={job.job_metadata.application_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-mustard hover:text-forest-green font-medium"
                        >
                          Apply for this position →
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
} 