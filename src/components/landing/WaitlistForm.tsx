import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Share2,
  Copy,
  MessageCircle,
  Twitter,
  Linkedin,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { submitWaitlistLead, normalizeEmail } from "@/lib/waitlistService";
import type { WaitlistRole, WaitlistInterest } from "@/types/waitlist";
import { toast } from "sonner";

const ROLE_OPTIONS: WaitlistRole[] = [
  "School Owner / Proprietor",
  "Principal",
  "School Administrator",
  "Teacher",
  "Education Professional",
  "Parent",
  "Student",
  "Other",
];

const SCHOOL_ROLES: string[] = [
  "School Owner / Proprietor",
  "Principal",
  "School Administrator",
  "Teacher",
];

const INTEREST_OPTIONS: WaitlistInterest[] = [
  "School management",
  "Digital examinations",
  "Results",
  "Attendance",
  "Parent communication",
  "AI tools",
  "Other",
];

const POPULAR_COUNTRIES = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "Rwanda",
  "South Africa",
  "Uganda",
  "Tanzania",
  "United Kingdom",
  "United States",
  "Other",
];

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  schoolName: string;
  city: string;
  state: string;
  country: string;
  interests: string[];
  honeypot: string; // Anti-spam trap
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  schoolName?: string;
  city?: string;
  state?: string;
  country?: string;
}

export default function WaitlistForm({
  id = "waitlist-form",
  className = "",
}: {
  id?: string;
  className?: string;
}) {
  const [searchParams] = useSearchParams();
  const [source, setSource] = useState("website");

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    role: "",
    schoolName: "",
    city: "",
    state: "",
    country: "Nigeria",
    interests: ["School management", "Digital examinations"],
    honeypot: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Extract source from query params (e.g. ?source=tiktok) or referrer
  useEffect(() => {
    const srcParam = searchParams.get("source") || searchParams.get("utm_source") || searchParams.get("ref");
    if (srcParam) {
      setSource(srcParam.toLowerCase());
    } else if (document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.hostname.includes("tiktok")) setSource("tiktok");
        else if (refUrl.hostname.includes("instagram")) setSource("instagram");
        else if (refUrl.hostname.includes("facebook")) setSource("facebook");
        else if (refUrl.hostname.includes("linkedin")) setSource("linkedin");
        else if (refUrl.hostname.includes("twitter") || refUrl.hostname.includes("x.com")) setSource("x");
        else if (refUrl.hostname.includes("whatsapp")) setSource("whatsapp");
        else setSource("referral");
      } catch {
        setSource("direct");
      }
    }
  }, [searchParams]);

  const isSchoolRole = form.role && SCHOOL_ROLES.includes(form.role);

  const toggleInterest = (interest: string) => {
    setForm((prev) => {
      const exists = prev.interests.includes(interest);
      const newInterests = exists
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: newInterests };
    });
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Please enter your full name.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!emailRegex.test(form.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone or WhatsApp number is required.";
    } else if (form.phone.trim().length < 7) {
      newErrors.phone = "Please enter a complete phone number.";
    }

    if (!form.role) {
      newErrors.role = "Please select your role.";
    }

    if (isSchoolRole && !form.schoolName.trim()) {
      newErrors.schoolName = "School name is required for your role.";
    }

    if (!form.city.trim()) {
      newErrors.city = "City is required.";
    }

    if (!form.state.trim()) {
      newErrors.state = "State or Province is required.";
    }

    if (!form.country.trim()) {
      newErrors.country = "Country is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setAlreadyRegistered(false);

    // Honeypot anti-spam check
    if (form.honeypot) {
      console.warn("Spam bot submission caught by honeypot.");
      setSubmitted(true);
      return;
    }

    if (!validate()) {
      toast.error("Please fill in all required fields accurately.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await submitWaitlistLead({
        full_name: form.fullName,
        email: normalizeEmail(form.email),
        phone: form.phone,
        role: form.role,
        school_name: isSchoolRole ? form.schoolName : undefined,
        city: form.city,
        state: form.state,
        country: form.country,
        interests: form.interests,
        source: source,
      });

      if (res.duplicate) {
        setAlreadyRegistered(true);
        setSubmitted(true);
        toast.info("You're already on the waitlist.");
      } else if (res.success) {
        setSubmitted(true);
        toast.success("Welcome aboard! You're on the list.");
      } else {
        setErrorMessage(res.error || "Something went wrong. Please try again.");
        toast.error(res.error || "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      setErrorMessage("Something went wrong. Please check your connection and try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const shareUrl = window.location.origin;
  const shareText = "I just joined the waitlist for Legacyskool — the modern operating system for African schools (CBT exams, attendance, digital results & AI tools). Join early access here:";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  if (submitted) {
    return (
      <Card
        id={id}
        className={`p-6 sm:p-10 border border-border/80 bg-card/95 backdrop-blur shadow-2xl rounded-2xl max-w-xl mx-auto ${className}`}
      >
        <div className="text-center">
          <div className="size-16 sm:size-20 rounded-full bg-success/15 text-success grid place-items-center mx-auto mb-6 ring-8 ring-success/5 animate-in zoom-in-50 duration-300">
            <CheckCircle2 className="size-8 sm:size-10" />
          </div>

          {alreadyRegistered ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="size-3.5" /> Early Access Member
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                You're already on the waitlist.
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed max-w-md mx-auto">
                We have your details on file. You'll be among the very first to receive access when cohort onboarding starts.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="size-3.5" /> Spot Reserved
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                You're on the list.
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed max-w-md mx-auto">
                Thanks for your interest in <span className="font-semibold text-foreground">Legacyskool</span>. We've received your details and will keep you updated as we get closer to launch.
              </p>
            </>
          )}

          {/* What happens next */}
          <div className="mt-8 rounded-xl border border-border/60 bg-muted/30 p-5 text-left space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What happens next:
            </div>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <div className="size-5 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-medium text-foreground">Priority queue:</span> Your spot is secured for the next pilot cohort.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="size-5 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-medium text-foreground">Early demo invite:</span> You'll receive a private walkthrough before public rollout.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="size-5 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <span className="font-medium text-foreground">Pilot onboarding:</span> Hands-on migration support and pilot school rates.
                </div>
              </div>
            </div>
          </div>

          {/* Share with peers */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-center gap-1.5">
              <Share2 className="size-3.5" /> Invite a colleague or fellow educator
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs bg-card hover:bg-muted"
                onClick={shareWhatsApp}
              >
                <MessageCircle className="size-3.5 text-[#25D366]" /> WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs bg-card hover:bg-muted"
                onClick={shareTwitter}
              >
                <Twitter className="size-3.5 text-[#1DA1F2]" /> Post on X
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs bg-card hover:bg-muted"
                onClick={shareLinkedIn}
              >
                <Linkedin className="size-3.5 text-[#0A66C2]" /> LinkedIn
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs bg-card hover:bg-muted"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSubmitted(false);
                setAlreadyRegistered(false);
                setForm({
                  fullName: "",
                  email: "",
                  phone: "",
                  role: "",
                  schoolName: "",
                  city: "",
                  state: "",
                  country: "Nigeria",
                  interests: ["School management", "Digital examinations"],
                  honeypot: "",
                });
              }}
            >
              Submit another response
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      id={id}
      className={`p-6 sm:p-8 lg:p-10 border border-border/80 bg-card/95 backdrop-blur shadow-2xl rounded-2xl max-w-2xl mx-auto ${className}`}
    >
      <div className="mb-6 sm:mb-8 text-left">
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-3">
          <Sparkles className="size-3.5" /> Early Access & Pilot Registration
        </div>
        <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Join the Legacyskool Waitlist
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Reserve early access for your school. Be first in line when we launch and get hands-on onboarding support.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 text-left">
        {/* Anti-spam honeypot - hidden from real users */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website_url">Do not fill this</label>
          <input
            id="website_url"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.honeypot}
            onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
          />
        </div>

        {/* Full Name & Email */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-semibold">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="fullName"
                placeholder="e.g. Dr. Adaobi Nwosu"
                className={`pl-9 ${errors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                value={form.fullName}
                onChange={(e) => {
                  setForm({ ...form, fullName: e.target.value });
                  if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                }}
              />
            </div>
            {errors.fullName && <p className="text-[11px] text-destructive">{errors.fullName}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="adaobi@school.edu.ng"
                className={`pl-9 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
              />
            </div>
            {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
          </div>
        </div>

        {/* Phone & Role */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold">
              Phone / WhatsApp <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Phone className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+234 803 123 4567"
                className={`pl-9 ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                }}
              />
            </div>
            {errors.phone && <p className="text-[11px] text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role" className="text-xs font-semibold">
              Your Role <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.role}
              onValueChange={(val) => {
                setForm({ ...form, role: val });
                if (errors.role) setErrors({ ...errors, role: undefined });
              }}
            >
              <SelectTrigger
                id="role"
                className={errors.role ? "border-destructive focus:ring-destructive" : ""}
              >
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-[11px] text-destructive">{errors.role}</p>}
          </div>
        </div>

        {/* School Name (Conditional based on role) */}
        {isSchoolRole && (
          <div className="space-y-1.5 animate-in fade-in-50 duration-200">
            <Label htmlFor="schoolName" className="text-xs font-semibold">
              School Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Building2 className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="schoolName"
                placeholder="e.g. Greenfield International College"
                className={`pl-9 ${errors.schoolName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                value={form.schoolName}
                onChange={(e) => {
                  setForm({ ...form, schoolName: e.target.value });
                  if (errors.schoolName) setErrors({ ...errors, schoolName: undefined });
                }}
              />
            </div>
            {errors.schoolName && <p className="text-[11px] text-destructive">{errors.schoolName}</p>}
          </div>
        )}

        {/* Location: City, State, Country */}
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs font-semibold">
              City <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <MapPin className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="city"
                placeholder="e.g. Ikeja / Abuja"
                className={`pl-9 ${errors.city ? "border-destructive focus-visible:ring-destructive" : ""}`}
                value={form.city}
                onChange={(e) => {
                  setForm({ ...form, city: e.target.value });
                  if (errors.city) setErrors({ ...errors, city: undefined });
                }}
              />
            </div>
            {errors.city && <p className="text-[11px] text-destructive">{errors.city}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="state" className="text-xs font-semibold">
              State / Province <span className="text-destructive">*</span>
            </Label>
            <Input
              id="state"
              placeholder="e.g. Lagos"
              className={errors.state ? "border-destructive focus-visible:ring-destructive" : ""}
              value={form.state}
              onChange={(e) => {
                setForm({ ...form, state: e.target.value });
                if (errors.state) setErrors({ ...errors, state: undefined });
              }}
            />
            {errors.state && <p className="text-[11px] text-destructive">{errors.state}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="country" className="text-xs font-semibold">
              Country <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.country}
              onValueChange={(val) => {
                setForm({ ...form, country: val });
                if (errors.country) setErrors({ ...errors, country: undefined });
              }}
            >
              <SelectTrigger
                id="country"
                className={errors.country ? "border-destructive focus:ring-destructive" : ""}
              >
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && <p className="text-[11px] text-destructive">{errors.country}</p>}
          </div>
        </div>

        {/* Interests Pills */}
        <div className="space-y-2 pt-1">
          <Label className="text-xs font-semibold">
            What are you most interested in? <span className="text-muted-foreground font-normal">(Select all that apply)</span>
          </Label>
          <div className="flex flex-wrap gap-2 pt-1">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = form.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary font-medium shadow-sm"
                      : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {selected && <Check className="size-3" />}
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-3">
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full text-base font-semibold py-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Saving your spot…
              </>
            ) : (
              <>
                Join the Waitlist <ArrowRight className="size-5" />
              </>
            )}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground mt-3">
            🔒 We respect your privacy. No spam. You can unsubscribe or request removal at any time.
          </p>
        </div>
      </form>
    </Card>
  );
}
