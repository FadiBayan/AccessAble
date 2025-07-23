"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Shield, Accessibility, Volume2, VolumeX, Type, Contrast, MousePointer } from "lucide-react"
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Textarea } from "@/components/ui/textarea";
import { useAccessibility } from "@/components/accessibility-provider";

export function AuthPage() {
  const [hydrated, setHydrated] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    accessibilityNeeds: [] as string[],
    accountType: "Individual",
    organizationName: "",
    organizationWebsite: "",
    headquartersLocation: "",
    missionStatement: "",
    accessibilityFeatures: [] as string[],
  })
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const { settings, updateSettings } = useAccessibility();
  const highContrast = settings.highContrast;

  const router = useRouter();

  useEffect(() => { setHydrated(true); }, []);
  if (!hydrated) return null;

  const accessibilityOptions = [
    { id: "visual", label: "Visual Impairment", icon: Eye },
    { id: "hearing", label: "Hearing Impairment", icon: Volume2 },
    { id: "mobility", label: "Mobility Impairment", icon: MousePointer },
    { id: "cognitive", label: "Cognitive Disability", icon: Type },
    { id: "other", label: "Other", icon: Accessibility },
  ]

  const handleAccessibilityToggle = (optionId: string) => {
    setFormData((prev) => ({
      ...prev,
      accessibilityNeeds: prev.accessibilityNeeds.includes(optionId)
        ? prev.accessibilityNeeds.filter((id) => id !== optionId)
        : [...prev.accessibilityNeeds, optionId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp) {
      // Sign up
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            account_type: formData.accountType,
            organization_name: formData.accountType === "Company" || formData.accountType === "NGO" ? formData.organizationName : null,
            organization_website: formData.accountType === "Company" || formData.accountType === "NGO" ? formData.organizationWebsite : null,
            headquarters_location: formData.accountType === "Company" || formData.accountType === "NGO" ? formData.headquartersLocation : null,
            mission_statement: formData.accountType === "Company" || formData.accountType === "NGO" ? formData.missionStatement : null,
            accessibility_needs: formData.accessibilityNeeds ? formData.accessibilityNeeds.join(',') : null,
            accessibility_features: formData.accountType === "Company" || formData.accountType === "NGO" ? formData.accessibilityFeatures.join(',') : null,
          }
        }
      });
      if (error) {
        alert(error.message);
        return;
      }
      if (data.user) {
        console.log('User created successfully:', data.user.id);
        
        // Profile will be created automatically by the database trigger
        // No need to manually create it here
        
        alert('Account created successfully! Check your email for a confirmation link.');
      }
    } else {
      // Sign in
      console.log('Attempting to sign in with email:', formData.email);
      
      const supabase = getSupabaseClient();
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      console.log('Sign in response:', { signInData, error });
      
      if (error) {
        console.error('Sign in error:', error);
        alert(error.message);
        return;
      }
      
      if (!signInData.user) {
        console.error('No user returned from sign in');
        alert('Sign in failed. Please try again.');
        return;
      }
      
      console.log('User signed in successfully:', signInData.user.id);
      
      // Try to fetch the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single();
        
      console.log('Profile fetch response:', { profile, profileError });
      
      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Don't block sign in if profile fetch fails, just log it
        console.log('Profile not found, but continuing with sign in');
      } else {
        console.log('Profile found:', profile);
      }
      
      // Redirect to dashboard regardless of profile status
      console.log('Redirecting to dashboard...');
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Accessibility Toolbar */}
      <div className="fixed top-4 right-4 z-50 flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateSettings({ highContrast: !highContrast })}
          aria-label="Toggle high contrast mode"
        >
          <Contrast className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLargeText(!largeText)}
          aria-label="Toggle large text"
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAudioEnabled(!audioEnabled)}
          aria-label="Toggle audio assistance"
        >
          {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      <div className="w-full max-w-md mx-auto px-4">
        <Card className="shadow-2xl border bg-card">
          <CardContent className="p-8">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-mustard to-forest-green rounded-full flex items-center justify-center">
                  <Accessibility className="h-6 w-6 text-white" />
                </div>
                <h1 className={`text-3xl font-bold bg-gradient-to-r from-mustard to-forest-green bg-clip-text text-transparent ${largeText ? "text-4xl" : ""}`}>AccessAble</h1>
              </div>
              <h2 className={`text-2xl font-bold mb-2 text-foreground ${largeText ? "text-3xl" : ""}`}>{isSignUp ? "Create Account" : "Welcome Back"}</h2>
              <p className={`text-sm text-muted-foreground ${largeText ? "text-base" : ""}`}>{isSignUp ? "Join our inclusive professional community" : "Sign in to your account"}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="accountType">Account Type</label>
                    <select
                      id="accountType"
                      value={formData.accountType}
                      onChange={e => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="Individual">Individual</option>
                      <option value="Company">Company / Employer</option>
                      <option value="NGO">NGO / Organization</option>
                    </select>
                  </div>
                  {(formData.accountType === "Company" || formData.accountType === "NGO") && (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="organizationName">Organization Name</label>
                        <Input
                          id="organizationName"
                          value={formData.organizationName}
                          onChange={e => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="organizationWebsite">Website</label>
                        <Input
                          id="organizationWebsite"
                          value={formData.organizationWebsite}
                          onChange={e => setFormData(prev => ({ ...prev, organizationWebsite: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="headquartersLocation">Headquarters Location</label>
                        <Input
                          id="headquartersLocation"
                          value={formData.headquartersLocation}
                          onChange={e => setFormData(prev => ({ ...prev, headquartersLocation: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="missionStatement">Mission Statement</label>
                        <Textarea
                          id="missionStatement"
                          value={formData.missionStatement}
                          onChange={e => setFormData(prev => ({ ...prev, missionStatement: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div className="space-y-2">
                        <label>Accessibility Features</label>
                        <div className="flex flex-wrap gap-2">
                          {["Screen Reader Support", "Sign Language Support", "Assistive Technology Provided", "Remote Work Options", "Flexible Hours", "Accessible Office Space"].map(feature => (
                            <label key={feature} className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={formData.accessibilityFeatures.includes(feature)}
                                onChange={e => {
                                  setFormData(prev => ({
                                    ...prev,
                                    accessibilityFeatures: e.target.checked
                                      ? [...prev.accessibilityFeatures, feature]
                                      : prev.accessibilityFeatures.filter(f => f !== feature)
                                  }))
                                }}
                              />
                              {feature}
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Always show sign-in/sign-up fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="firstName"
                        className={`${highContrast ? "text-white" : "text-charcoal"} ${largeText ? "text-lg" : ""}`}
                      >
                        First Name *
                      </label>
                      <Input
                        id="firstName"
                        type="text"
                        required={isSignUp}
                        value={formData.firstName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                        className={`${
                          highContrast ? "bg-gray-800 border-gray-600 text-white" : "border-gray-300 focus:border-mustard"
                        } ${largeText ? "text-lg p-4" : ""}`}
                        disabled={!isSignUp}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="lastName"
                        className={`${highContrast ? "text-white" : "text-charcoal"} ${largeText ? "text-lg" : ""}`}
                      >
                        Last Name *
                      </label>
                      <Input
                        id="lastName"
                        type="text"
                        required={isSignUp}
                        value={formData.lastName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                        className={`${
                          highContrast ? "bg-gray-800 border-gray-600 text-white" : "border-gray-300 focus:border-mustard"
                        } ${largeText ? "text-lg p-4" : ""}`}
                        disabled={!isSignUp}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className={`${highContrast ? "text-white" : "text-charcoal"} ${largeText ? "text-lg" : ""}`}
                    >
                      Confirm Password *
                    </label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`${
                        highContrast ? "bg-gray-800 border-gray-600 text-white" : "border-gray-300 focus:border-mustard"
                      } ${largeText ? "text-lg p-4" : ""}`}
                    />
                  </div>

                  {/* Accessibility Needs Section */}
                  <div className="space-y-4">
                    <label className={`${highContrast ? "text-white" : "text-charcoal"} ${largeText ? "text-lg" : ""}`}>
                      Accessibility Needs (Optional)
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {accessibilityOptions.map((option) => (
                        <div
                          key={option.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            (formData.accessibilityNeeds || []).includes(option.id)
                              ? highContrast
                                ? "bg-mustard/20 border-mustard"
                                : "bg-mustard/10 border-mustard"
                              : highContrast
                                ? "bg-gray-800 border-gray-600 hover:bg-gray-700"
                                : "bg-cream border-gray-200 hover:bg-mustard/5"
                          }`}
                        >
                          <Checkbox
                            checked={(formData.accessibilityNeeds || []).includes(option.id)}
                            onCheckedChange={() => handleAccessibilityToggle(option.id)}
                            aria-label={`Select ${option.label}`}
                          />
                          <option.icon
                            className={`
                              h-5 w-5 ${
                                (formData.accessibilityNeeds || []).includes(option.id)
                                  ? "text-mustard"
                                  : highContrast
                                    ? "text-gray-400"
                                    : "text-gray-500"
                              }
                            `}
                          />
                          <span
                            className={`${highContrast ? "text-white" : "text-charcoal"} ${largeText ? "text-lg" : ""}`}
                          >
                            {option.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, agreeToTerms: checked as boolean }))
                      }
                      className="mt-1"
                      required
                    />
                    <label
                      htmlFor="terms"
                      className={`text-sm leading-relaxed cursor-pointer ${
                        highContrast ? "text-gray-300" : "text-gray-600"
                      } ${largeText ? "text-base" : ""}`}
                    >
                      I agree to the{" "}
                      <a href="#" className="text-indigo hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-indigo hover:underline">
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label htmlFor="email">Email Address *</label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      className={`${highContrast ? "bg-gray-800 border-gray-600 text-white" : "border-gray-300 focus:border-mustard"} ${largeText ? "text-lg p-4" : ""}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password">Password *</label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                        className={`pr-12 ${highContrast ? "bg-gray-800 border-gray-600 text-white" : "border-gray-300 focus:border-mustard"} ${largeText ? "text-lg p-4" : ""}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className={`w-full bg-gradient-to-r from-mustard to-forest-green hover:from-mustard/90 hover:to-forest-green/90 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] ${largeText ? "text-lg py-6" : "py-3"}`}
                  >
                    Sign In
                  </Button>
                  <div className="text-center">
                    <a href="#" className={`text-sm text-indigo hover:underline ${largeText ? "text-base" : ""}`}>
                      Forgot your password?
                    </a>
                  </div>
                </>
              )}
            </form>

            <div className="mt-8 text-center">
              <p
                className={`text-sm ${
                  highContrast ? "text-gray-300" : "text-gray-600"
                } ${largeText ? "text-base" : ""}`}
              >
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
              </p>
              <Button
                variant="ghost"
                onClick={() => setIsSignUp(!isSignUp)}
                className={`mt-2 text-mustard hover:text-forest-green font-medium ${largeText ? "text-lg" : ""}`}
              >
                {isSignUp ? "Sign In" : "Create Account"}
              </Button>
            </div>

            {/* Accessibility Statement */}
            <div
              className={`mt-6 p-4 rounded-lg bg-card border`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-4 w-4 text-mustard" />
                <span className={`text-sm font-medium text-foreground ${largeText ? "text-base" : ""}`}>Accessibility Commitment</span>
              </div>
              <p className={`text-xs text-muted-foreground ${largeText ? "text-sm" : ""}`}>AccessAble is committed to providing an accessible experience for all users. If you encounter any accessibility barriers, please contact our support team.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
