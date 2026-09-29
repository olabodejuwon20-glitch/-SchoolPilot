export type WaitlistRole =
  | "School Owner / Proprietor"
  | "Principal"
  | "School Administrator"
  | "Teacher"
  | "Parent"
  | "Student"
  | "Education Professional"
  | "Other";

export type WaitlistInterest =
  | "School management"
  | "Digital examinations"
  | "Results"
  | "Attendance"
  | "Parent communication"
  | "AI tools"
  | "Other";

export type WaitlistStatus =
  | "new"
  | "contacted"
  | "interested"
  | "converted"
  | "not_interested"
  | "archived";

export interface WaitlistLead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: WaitlistRole | string;
  school_name: string | null;
  city: string;
  state: string;
  country: string;
  interests: WaitlistInterest[] | string[];
  status: WaitlistStatus;
  notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaitlistActivity {
  id: string;
  waitlist_id: string;
  action: "joined" | "status_change" | "note_added" | "archived" | "restored" | "deleted" | string;
  details: Record<string, any> | null;
  actor_email: string | null;
  created_at: string;
}

export interface WaitlistMetrics {
  total: number;
  new: number;
  contacted: number;
  interested: number;
  converted: number;
  not_interested: number;
  archived: number;
}

export interface SubmitWaitlistPayload {
  full_name: string;
  email: string;
  phone: string;
  role: WaitlistRole | string;
  school_name?: string;
  city: string;
  state: string;
  country: string;
  interests: string[];
  source?: string;
}

export interface SubmitWaitlistResponse {
  success: boolean;
  duplicate: boolean;
  message?: string;
  error?: string;
  id?: string;
}
