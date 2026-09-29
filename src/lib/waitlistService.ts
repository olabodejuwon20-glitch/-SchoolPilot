import { supabase } from "@/integrations/supabase/client";
import type {
  WaitlistLead,
  WaitlistActivity,
  WaitlistMetrics,
  SubmitWaitlistPayload,
  SubmitWaitlistResponse,
  WaitlistStatus,
} from "@/types/waitlist";

/**
 * Normalizes email address to lowercase and trimmed string
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Submits a new lead to the waitlist.
 * Handles duplicate checking and fallback if the RPC is not deployed.
 */
export async function submitWaitlistLead(
  payload: SubmitWaitlistPayload
): Promise<SubmitWaitlistResponse> {
  const normalizedEmail = normalizeEmail(payload.email);
  const normalizedPayload = {
    ...payload,
    full_name: payload.full_name.trim(),
    email: normalizedEmail,
    phone: payload.phone.trim(),
    city: payload.city.trim(),
    state: payload.state.trim(),
    country: payload.country.trim(),
    school_name: payload.school_name?.trim() || null,
    source: payload.source?.trim() || "website",
    interests: payload.interests || [],
  };

  try {
    // Attempt RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "submit_waitlist_lead" as any,
      {
        _full_name: normalizedPayload.full_name,
        _email: normalizedPayload.email,
        _phone: normalizedPayload.phone,
        _role: normalizedPayload.role,
        _school_name: normalizedPayload.school_name,
        _city: normalizedPayload.city,
        _state: normalizedPayload.state,
        _country: normalizedPayload.country,
        _interests: normalizedPayload.interests,
        _source: normalizedPayload.source,
      }
    );

    if (!rpcError && rpcData) {
      return rpcData as SubmitWaitlistResponse;
    }

    // Direct table fallback if RPC is unavailable
    // 1. Check duplicate
    const { data: existingLead } = await (supabase
      .from("waitlist" as any)
      .select("id")
      .ilike("email", normalizedPayload.email)
      .maybeSingle() as any);

    if (existingLead) {
      return {
        success: false,
        duplicate: true,
        message: "You're already on the waitlist.",
      };
    }

    // 2. Insert into waitlist
    const { data: inserted, error: insertError } = await (supabase
      .from("waitlist" as any)
      .insert({
        full_name: normalizedPayload.full_name,
        email: normalizedPayload.email,
        phone: normalizedPayload.phone,
        role: normalizedPayload.role,
        school_name: normalizedPayload.school_name,
        city: normalizedPayload.city,
        state: normalizedPayload.state,
        country: normalizedPayload.country,
        interests: normalizedPayload.interests,
        source: normalizedPayload.source,
        status: "new",
      })
      .select("id")
      .single() as any);

    if (insertError) {
      if (insertError.code === "23505" || insertError.message?.toLowerCase().includes("unique")) {
        return {
          success: false,
          duplicate: true,
          message: "You're already on the waitlist.",
        };
      }
      return {
        success: false,
        duplicate: false,
        error: "Something went wrong. Please try again.",
      };
    }

    // 3. Log initial activity
    if (inserted?.id) {
      await (supabase.from("waitlist_activities" as any).insert({
        waitlist_id: inserted.id,
        action: "joined",
        details: { source: normalizedPayload.source },
      }) as any);
    }

    return {
      success: true,
      duplicate: false,
      id: inserted?.id,
      message: "You're on the list.",
    };
  } catch (err: any) {
    return {
      success: false,
      duplicate: false,
      error: err?.message || "Something went wrong. Please try again.",
    };
  }
}

export interface FetchWaitlistFilters {
  searchTerm?: string;
  status?: WaitlistStatus | "all";
  role?: string;
  source?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "created_at" | "full_name" | "status";
  sortOrder?: "asc" | "desc";
}

/**
 * Fetches leads from the waitlist table with search, filters, pagination, and sorting
 */
export async function fetchWaitlistLeads(filters: FetchWaitlistFilters = {}) {
  const {
    searchTerm = "",
    status = "all",
    role,
    source,
    page = 1,
    pageSize = 20,
    sortBy = "created_at",
    sortOrder = "desc",
  } = filters;

  try {
    let query = supabase.from("waitlist" as any).select("*", { count: "exact" });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    if (source && source !== "all") {
      query = query.eq("source", source);
    }

    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim();
      query = query.or(
        `full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,school_name.ilike.%${term}%,city.ilike.%${term}%`
      );
    }

    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      leads: (data || []) as WaitlistLead[],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize) || 1,
    };
  } catch (err) {
    console.error("Error fetching waitlist leads:", err);
    throw err;
  }
}

/**
 * Fetches metrics for the summary cards
 */
export async function fetchWaitlistMetrics(): Promise<WaitlistMetrics> {
  try {
    const { data: rpcMetrics, error: rpcError } = await supabase.rpc("get_waitlist_metrics" as any);
    if (!rpcError && rpcMetrics) {
      return rpcMetrics as WaitlistMetrics;
    }

    const { data: allRows, error } = await (supabase
      .from("waitlist" as any)
      .select("status") as any);

    if (error || !allRows) {
      return {
        total: 0,
        new: 0,
        contacted: 0,
        interested: 0,
        converted: 0,
        not_interested: 0,
        archived: 0,
      };
    }

    const metrics: WaitlistMetrics = {
      total: allRows.length,
      new: 0,
      contacted: 0,
      interested: 0,
      converted: 0,
      not_interested: 0,
      archived: 0,
    };

    allRows.forEach((r: { status: WaitlistStatus }) => {
      if (r.status in metrics) {
        metrics[r.status as keyof WaitlistMetrics]++;
      }
    });

    return metrics;
  } catch (err) {
    console.error("Error fetching metrics:", err);
    return {
      total: 0,
      new: 0,
      contacted: 0,
      interested: 0,
      converted: 0,
      not_interested: 0,
      archived: 0,
    };
  }
}

/**
 * Updates lead status and logs activity
 */
export async function updateLeadStatus(
  leadId: string,
  newStatus: WaitlistStatus,
  oldStatus?: WaitlistStatus,
  actorEmail?: string
) {
  const { data, error } = await (supabase
    .from("waitlist" as any)
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .select()
    .single() as any);

  if (error) throw error;

  await (supabase.from("waitlist_activities" as any).insert({
    waitlist_id: leadId,
    action: "status_change",
    details: {
      from: oldStatus || "unknown",
      to: newStatus,
    },
    actor_email: actorEmail || null,
  }) as any);

  return data as WaitlistLead;
}

/**
 * Saves/updates admin notes for a lead and logs activity
 */
export async function saveLeadNotes(
  leadId: string,
  notes: string,
  actorEmail?: string
) {
  const { data, error } = await (supabase
    .from("waitlist" as any)
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .select()
    .single() as any);

  if (error) throw error;

  await (supabase.from("waitlist_activities" as any).insert({
    waitlist_id: leadId,
    action: "note_added",
    details: { note_snippet: notes.slice(0, 100) },
    actor_email: actorEmail || null,
  }) as any);

  return data as WaitlistLead;
}

/**
 * Fetches activity history for a specific lead
 */
export async function fetchLeadActivities(leadId: string): Promise<WaitlistActivity[]> {
  const { data, error } = await (supabase
    .from("waitlist_activities" as any)
    .select("*")
    .eq("waitlist_id", leadId)
    .order("created_at", { ascending: false }) as any);

  if (error) {
    console.error("Error fetching lead activities:", error);
    return [];
  }

  return (data || []) as WaitlistActivity[];
}

/**
 * Deletes a lead and its activities
 */
export async function deleteLead(leadId: string) {
  const { error } = await (supabase
    .from("waitlist" as any)
    .delete()
    .eq("id", leadId) as any);

  if (error) throw error;
  return true;
}

/**
 * Archives a lead
 */
export async function archiveLead(leadId: string, actorEmail?: string) {
  return updateLeadStatus(leadId, "archived", undefined, actorEmail);
}

/**
 * Exports leads to CSV format and initiates download in browser
 */
export function exportLeadsToCsv(leads: WaitlistLead[], filename = "legacyskool_waitlist_leads.csv") {
  if (!leads || leads.length === 0) return;

  const headers = [
    "ID",
    "Full Name",
    "Email",
    "Phone",
    "Role",
    "School Name",
    "City",
    "State",
    "Country",
    "Interests",
    "Status",
    "Source",
    "Notes",
    "Joined Date",
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = typeof val === "object" ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = leads.map((l) => [
    escapeCsv(l.id),
    escapeCsv(l.full_name),
    escapeCsv(l.email),
    escapeCsv(l.phone),
    escapeCsv(l.role),
    escapeCsv(l.school_name || ""),
    escapeCsv(l.city),
    escapeCsv(l.state),
    escapeCsv(l.country),
    escapeCsv(Array.isArray(l.interests) ? l.interests.join(", ") : l.interests || ""),
    escapeCsv(l.status),
    escapeCsv(l.source || ""),
    escapeCsv(l.notes || ""),
    escapeCsv(new Date(l.created_at).toLocaleString()),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
