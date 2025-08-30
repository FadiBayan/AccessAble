"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Briefcase, Building, MapPin, Globe, DollarSign, Calendar, Accessibility } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabaseClient";
import { filterContent, hasBadWords } from "@/lib/content-filter"
import { moderateText } from "@/lib/moderation"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { useAccessibility } from "@/components/accessibility-provider"

export default function PostJobPage() {
  const router = useRouter();
  const { settings } = useAccessibility();
  const isDarkMode = settings.highContrast;
  
  const [formData, setFormData] = useState({
    jobTitle: "",
    description: "",
    companyName: "",
    location: "",
    isRemote: false,
    jobType: "",
    applicationLink: "",
    salaryRange: "",
    deadline: "",
  })
  
  const [accessibilityFeatures, setAccessibilityFeatures] = useState({
    screenReaderSupport: false,
    signLanguageSupport: false,
    remoteWork: false,
    flexibleHours: false,
    assistiveTechnology: false,
    accessibleOffice: false,
  })
  
  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAccessibilityChange = (feature: string, enabled: boolean) => {
    setAccessibilityFeatures(prev => ({ ...prev, [feature]: enabled }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)



    // Validate required fields
    if (!formData.jobTitle || !formData.description || !formData.companyName || !formData.jobType || !formData.applicationLink) {
      alert("Please fill in all required fields including Job Type.");
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert("You must be logged in to post a job.")
      setLoading(false)
      return
    }

    // AI moderation
    try {
      const toCheck = [formData.jobTitle, formData.description, formData.companyName]
        .filter(Boolean)
        .join("\n")
      const moderation = await moderateText(toCheck)
      if (!moderation.allowed) {
        alert("Your job post was blocked for harmful or toxic content.")
        setLoading(false)
        return
      }
    } catch (e) {
      console.warn("Moderation failed, falling back to local filter", e)
    }

    // Check for bad words
    if (hasBadWords(formData.jobTitle) || hasBadWords(formData.description) || hasBadWords(formData.companyName)) {
      alert("Your job post contains inappropriate language. Please review and edit your content.")
      setLoading(false)
      return
    }

    // Filter content
    const filteredData = {
      jobTitle: filterContent(formData.jobTitle),
      description: filterContent(formData.description),
      companyName: filterContent(formData.companyName),
    }

    try {
      const { error } = await supabase.from("posts").insert([{
        user_id: user.id,
        title: filteredData.jobTitle,
        content: filteredData.description,
        is_job_post: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        likes: 0,
        comments: 0,
        shares: 0,
        tags: [],
        // Job-specific metadata
        job_metadata: {
          company_name: filteredData.companyName,
          location: formData.location,
          is_remote: formData.isRemote,
          job_type: formData.jobType,
          application_link: formData.applicationLink,
          salary_range: formData.salaryRange,
          deadline: formData.deadline,
          accessibility_features: accessibilityFeatures,
        }
      }])

      if (error) throw error

      alert("Job posted successfully!")
      // Reset form
      setFormData({
        jobTitle: "",
        description: "",
        companyName: "",
        location: "",
        isRemote: false,
        jobType: "",
        applicationLink: "",
        salaryRange: "",
        deadline: "",
      })
      setAccessibilityFeatures({
        screenReaderSupport: false,
        signLanguageSupport: false,
        remoteWork: false,
        flexibleHours: false,
        assistiveTechnology: false,
        accessibleOffice: false,
      })
      
      // Redirect back to jobs page to see the new job
      router.push('/jobs');
    } catch (error) {
      console.error("Error posting job:", error)
      alert("Error posting job. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#1f2937]' : 'bg-background'}`}>
      <Header />
      <main id="main-content" className="container-responsive max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/jobs" className={`inline-flex items-center ${isDarkMode ? 'text-mustard hover:text-yellow-400' : 'text-mustard hover:text-forest-green'} mb-4`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-foreground'}`}>Post a Job</h1>
          <p className={isDarkMode ? 'text-gray-300' : 'text-muted-foreground'}>Share job opportunities that are accessible and inclusive for people with disabilities.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Job Information */}
          <Card className={isDarkMode ? 'bg-[#374151] border-white/10' : ''}>
            <CardHeader>
              <CardTitle className={`flex items-center ${isDarkMode ? 'text-white' : ''}`}>
                <Briefcase className="h-5 w-5 mr-2 text-mustard" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="jobTitle" className={isDarkMode ? 'text-white' : 'text-foreground'}>Job Title *</label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                    placeholder="e.g., Software Engineer"
                    required
                    aria-label="Job title"
                    className={isDarkMode ? 'bg-[#4B5563] border-white/20 text-white placeholder:text-gray-400' : ''}
                  />
                </div>
                <div>
                  <label htmlFor="companyName" className={isDarkMode ? 'text-white' : 'text-foreground'}>Company Name *</label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    placeholder="e.g., TechCorp Inc."
                    required
                    aria-label="Company name"
                    className={isDarkMode ? 'bg-[#4B5563] border-white/20 text-white placeholder:text-gray-400' : ''}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className={isDarkMode ? 'text-white' : 'text-foreground'}>Job Description *</label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={6}
                  required
                  aria-label="Job description"
                  className={isDarkMode ? 'bg-[#4B5563] border-white/20 text-white placeholder:text-gray-400' : ''}
                />
              </div>
            </CardContent>
          </Card>

          {/* Job Details */}
          <Card className={isDarkMode ? 'bg-[#374151] border-white/10' : ''}>
            <CardHeader>
              <CardTitle className={`flex items-center ${isDarkMode ? 'text-white' : ''}`}>
                <Building className="h-5 w-5 mr-2 text-mustard" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" className={isDarkMode ? 'text-white' : 'text-foreground'}>Location</label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g., New York, NY"
                    disabled={formData.isRemote}
                    aria-label="Job location"
                    className={isDarkMode ? 'bg-[#4B5563] border-white/20 text-white placeholder:text-gray-400' : ''}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isRemote"
                    checked={formData.isRemote}
                    onCheckedChange={(checked) => handleInputChange("isRemote", checked)}
                  />
                  <label htmlFor="isRemote" className={isDarkMode ? 'text-white' : 'text-foreground'}>Remote position</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                   <label htmlFor="jobType" className={isDarkMode ? 'text-white' : 'text-foreground'}>Job Type *</label>
                   <select
                     value={formData.jobType}
                     onChange={(e) => setFormData(prev => ({ ...prev, jobType: e.target.value }))}
                     className={`w-full h-10 rounded-md border px-3 py-2 text-sm ${isDarkMode ? 'bg-[#4B5563] border-white/20 text-white' : 'bg-background border-input'}`}
                     required
                   >
                     <option value="">Select job type</option>
                     <option value="Full-time">Full-time</option>
                     <option value="Part-time">Part-time</option>
                     <option value="Contract">Contract</option>
                     <option value="Internship">Internship</option>
                     <option value="Freelance">Freelance</option>
                   </select>
                   {formData.jobType && (
                     <p className={`text-sm mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>✓ Selected: {formData.jobType}</p>
                   )}
                 </div>
                <div>
                  <label htmlFor="salaryRange" className={isDarkMode ? 'text-white' : 'text-foreground'}>Salary Range (Optional)</label>
                  <Input
                    id="salaryRange"
                    value={formData.salaryRange}
                    onChange={(e) => handleInputChange("salaryRange", e.target.value)}
                    placeholder="e.g., $50,000 - $70,000"
                    aria-label="Salary range"
                    className={isDarkMode ? 'bg-[#4B5563] border-white/20 text-white placeholder:text-gray-400' : ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="applicationLink" className={isDarkMode ? 'text-white' : 'text-foreground'}>Application Link *</label>
                  <Input
                    id="applicationLink"
                    value={formData.applicationLink}
                    onChange={(e) => handleInputChange("applicationLink", e.target.value)}
                    placeholder="https://company.com/apply"
                    type="url"
                    required
                    aria-label="Application link"
                    className={isDarkMode ? 'bg-[#4B5563] border-white/20 text-white placeholder:text-gray-400' : ''}
                  />
                </div>
                <div>
                  <label htmlFor="deadline" className={isDarkMode ? 'text-white' : 'text-foreground'}>Application Deadline (Optional)</label>
                  <Input
                    id="deadline"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange("deadline", e.target.value)}
                    type="date"
                    aria-label="Application deadline"
                    className={isDarkMode ? 'bg-[#4B5563] border-white/20 text-white' : ''}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Features */}
          <Card className={isDarkMode ? 'bg-[#374151] border-white/10' : ''}>
            <CardHeader>
              <CardTitle className={`flex items-center ${isDarkMode ? 'text-white' : ''}`}>
                <Accessibility className="h-5 w-5 mr-2 text-mustard" />
                Accessibility Features
              </CardTitle>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-muted-foreground'}`}>Select the accessibility accommodations your company provides</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="screenReaderSupport"
                    checked={accessibilityFeatures.screenReaderSupport}
                    onCheckedChange={(checked) => handleAccessibilityChange("screenReaderSupport", checked)}
                  />
                  <label htmlFor="screenReaderSupport" className={isDarkMode ? 'text-white' : 'text-foreground'}>Screen Reader Support</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="signLanguageSupport"
                    checked={accessibilityFeatures.signLanguageSupport}
                    onCheckedChange={(checked) => handleAccessibilityChange("signLanguageSupport", checked)}
                  />
                  <label htmlFor="signLanguageSupport" className={isDarkMode ? 'text-white' : 'text-foreground'}>Sign Language Support</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="remoteWork"
                    checked={accessibilityFeatures.remoteWork}
                    onCheckedChange={(checked) => handleAccessibilityChange("remoteWork", checked)}
                  />
                  <label htmlFor="remoteWork" className={isDarkMode ? 'text-white' : 'text-foreground'}>Remote Work Options</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="flexibleHours"
                    checked={accessibilityFeatures.flexibleHours}
                    onCheckedChange={(checked) => handleAccessibilityChange("flexibleHours", checked)}
                  />
                  <label htmlFor="flexibleHours" className={isDarkMode ? 'text-white' : 'text-foreground'}>Flexible Hours</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="assistiveTechnology"
                    checked={accessibilityFeatures.assistiveTechnology}
                    onCheckedChange={(checked) => handleAccessibilityChange("assistiveTechnology", checked)}
                  />
                  <label htmlFor="assistiveTechnology" className={isDarkMode ? 'text-white' : 'text-foreground'}>Assistive Technology Provided</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="accessibleOffice"
                    checked={accessibilityFeatures.accessibleOffice}
                    onCheckedChange={(checked) => handleAccessibilityChange("accessibleOffice", checked)}
                  />
                  <label htmlFor="accessibleOffice" className={isDarkMode ? 'text-white' : 'text-foreground'}>Accessible Office Space</label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/jobs">
              <Button variant="outline" type="button" className={isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : ''}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || !formData.jobTitle || !formData.description || !formData.companyName || !formData.jobType || !formData.applicationLink}
              className={isDarkMode ? 'bg-mustard hover:bg-yellow-500 text-white' : 'bg-mustard hover:bg-forest-green text-white'}
            >
              {loading ? "Posting..." : "Post Job"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
} 