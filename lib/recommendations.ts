import { createClient } from '@supabase/supabase-js'
import { embedTexts, cosineSimilarity } from './hfEmbeddings'

type SupabaseClient = ReturnType<typeof createClient>

type UserProfile = {
  id: string
  skills: string | string[] | null
}

function skillsToText(skills: string | string[] | null | undefined): string {
  if (Array.isArray(skills)) return skills.filter(Boolean).join(' ')
  if (typeof skills === 'string') return skills
  return ''
}

type JobRow = {
  id: string
  title?: string | null
  description?: string | null
  content?: string | null
  job_metadata?: any
}

export async function fetchProfilesAndJobs(supabase: SupabaseClient): Promise<{ profiles: UserProfile[]; jobs: JobRow[]; usedPostsFallback: boolean }>{
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, skills')

  if (profilesError) throw profilesError

  // Use posts table where is_job_post = true (primary source)
  let usedPostsFallback = false
  let jobs: JobRow[] = []

  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select('id, title, content, job_metadata')
    .eq('is_job_post', true)
    .limit(1000)
  
  if (!postsError && Array.isArray(postsData)) {
    jobs = (postsData || []).map((p: any) => ({ id: p.id, title: p.title, content: p.content, job_metadata: p.job_metadata }))
    usedPostsFallback = true
  } else {
    // Fallback to jobs table if posts table fails
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, description')
      .limit(1000)
    
    if (!jobsError && Array.isArray(jobsData)) {
      jobs = jobsData
      usedPostsFallback = false
    } else {
      throw new Error('No job data available')
    }
  }

  return { profiles: (profiles || []) as UserProfile[], jobs, usedPostsFallback }
}

export async function computeRecommendationsForAllUsers(supabase: SupabaseClient, topN: number = 5) {
  const { profiles, jobs, usedPostsFallback } = await fetchProfilesAndJobs(supabase)

  const profileIds = profiles.map((p) => p.id)
  const profileTexts = profiles.map((p) => skillsToText(p.skills))
  const jobIds = jobs.map((j) => j.id)
  const jobTexts = jobs.map((j) => j.description || j.content || j.title || '')

  // Embed all texts in two batches
  const [profileEmbeddings, jobEmbeddings] = await Promise.all([
    embedTexts(profileTexts),
    embedTexts(jobTexts),
  ])

  const results: Record<string, { jobId: string; score: number }[]> = {}

  for (let pIdx = 0; pIdx < profileEmbeddings.length; pIdx++) {
    const pVec = profileEmbeddings[pIdx]
    const scores: { jobId: string; score: number }[] = []
    for (let jIdx = 0; jIdx < jobEmbeddings.length; jIdx++) {
      const jVec = jobEmbeddings[jIdx]
      const score = cosineSimilarity(pVec, jVec)
      scores.push({ jobId: jobIds[jIdx], score })
    }
    scores.sort((a, b) => b.score - a.score)
    results[profileIds[pIdx]] = scores.slice(0, topN)
  }

  return { results, usedPostsFallback }
}

export async function computeRecommendationsForUser(supabase: SupabaseClient, userId: string, topN: number = 5) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, skills')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) throw profileError
  if (!profile) return { results: [], usedPostsFallback: false }

  // Use posts table where is_job_post = true (primary source)
  let usedPostsFallback = false
  let jobs: JobRow[] = []
  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select('id, title, content, job_metadata')
    .eq('is_job_post', true)
    .limit(1000)
  
  if (!postsError && Array.isArray(postsData)) {
    jobs = (postsData || []).map((p: any) => ({ id: p.id, title: p.title, content: p.content, job_metadata: p.job_metadata }))
    usedPostsFallback = true
  } else {
    // Fallback to jobs table if posts table fails
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, description')
      .limit(1000)
    
    if (!jobsError && Array.isArray(jobsData)) {
      jobs = jobsData
      usedPostsFallback = false
    } else {
      return { results: [], usedPostsFallback: false }
    }
  }

  if (jobs.length === 0) return { results: [], usedPostsFallback }

  try {
    const [profileVecArr, jobEmbeddings] = await Promise.all([
      embedTexts([skillsToText(profile.skills)]),
      embedTexts(jobs.map((j) => j.description || j.content || j.title || '')),
    ])
    const profileVec = profileVecArr[0]

    const scored = jobs.map((j, idx) => ({
      job: j,
      score: cosineSimilarity(profileVec, jobEmbeddings[idx]),
    }))

    scored.sort((a, b) => b.score - a.score)
    return { results: scored.slice(0, topN), usedPostsFallback }
  } catch (err) {
    // Fallback: simple keyword matching on skills vs job text when embeddings fail
    const skills = skillsToText(profile.skills).toLowerCase()
      .split(/[\s,;]+/)
      .filter(Boolean)
    const scored = jobs.map((j) => {
      const text = (
        (j.description || '') + ' ' +
        (j.content || '') + ' ' +
        (j.title || '')
      ).toLowerCase()
      const score = skills.reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0)
      return { job: j, score }
    })
    scored.sort((a, b) => b.score - a.score)
    return { results: scored.slice(0, topN), usedPostsFallback }
  }
}