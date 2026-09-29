import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap,
  Users,
  Search,
  Download,
  RefreshCw,
  Mail,
  MoreVertical,
  Trash2,
  Archive,
  MessageCircle,
  LogOut,
  FileText,
  History,
  Eye,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import {
  fetchWaitlistLeads,
  fetchWaitlistMetrics,
  updateLeadStatus,
  saveLeadNotes,
  fetchLeadActivities,
  deleteLead,
  exportLeadsToCsv,
} from "@/lib/waitlistService";
import type {
  WaitlistLead,
  WaitlistActivity,
  WaitlistMetrics,
  WaitlistStatus,
} from "@/types/waitlist";

const STATUS_CONFIG: Record<
  WaitlistStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  new: {
    label: "New",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    border: "border-blue-200 dark:border-blue-800",
  },
  contacted: {
    label: "Contacted",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800",
  },
  interested: {
    label: "Interested",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/50",
    border: "border-purple-200 dark:border-purple-800",
  },
  converted: {
    label: "Converted",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  not_interested: {
    label: "Not Interested",
    color: "text-zinc-700 dark:text-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    border: "border-zinc-200 dark:border-zinc-700",
  },
  archived: {
    label: "Archived",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-900",
    border: "border-slate-200 dark:border-slate-800",
  },
};

const ALL_ROLES = [
  "School Owner / Proprietor",
  "Principal",
  "School Administrator",
  "Teacher",
  "Education Professional",
  "Parent",
  "Student",
  "Other",
];

export default function AdminWaitlistDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Leads & Metrics state
  const [leads, setLeads] = useState<WaitlistLead[]>([]);
  const [metrics, setMetrics] = useState<WaitlistMetrics>({
    total: 0,
    new: 0,
    contacted: 0,
    interested: 0,
    converted: 0,
    not_interested: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Lead details drawer state
  const [selectedLead, setSelectedLead] = useState<WaitlistLead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [activities, setActivities] = useState<WaitlistActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Delete modal state
  const [leadToDelete, setLeadToDelete] = useState<WaitlistLead | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/admin/login", { replace: true, state: { from: { pathname: "/admin" } } });
      } else {
        setUser(session.user);
      }
      setAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/admin/login", { replace: true });
      } else {
        setUser(session.user);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Load metrics & leads
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [fetchedMetrics, leadsData] = await Promise.all([
        fetchWaitlistMetrics(),
        fetchWaitlistLeads({
          searchTerm,
          status: (statusFilter as any) || "all",
          role: roleFilter !== "all" ? roleFilter : undefined,
          source: sourceFilter !== "all" ? sourceFilter : undefined,
          page,
          pageSize,
        }),
      ]);

      setMetrics(fetchedMetrics);
      setLeads(leadsData.leads);
      setTotalPages(leadsData.totalPages);
      setTotalCount(leadsData.totalCount);
    } catch (err) {
      console.error("Failed to load waitlist data:", err);
      toast.error("Failed to refresh leads data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, statusFilter, roleFilter, sourceFilter, page, pageSize]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user, loadData]);

  // Load activities when a lead is opened
  const openLeadDrawer = async (lead: WaitlistLead) => {
    setSelectedLead(lead);
    setNotesDraft(lead.notes || "");
    setDrawerOpen(true);
    setActivitiesLoading(true);

    try {
      const acts = await fetchLeadActivities(lead.id);
      setActivities(acts);
    } catch (err) {
      console.error("Error loading activities:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Handle status update
  const handleStatusChange = async (leadId: string, newStatus: WaitlistStatus) => {
    try {
      const oldStatus = selectedLead?.status;
      await updateLeadStatus(leadId, newStatus, oldStatus, user?.email);

      // Update in local state
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }

      toast.success(`Status updated to ${STATUS_CONFIG[newStatus].label}`);

      // Refresh metrics & activities
      fetchWaitlistMetrics().then(setMetrics);
      if (selectedLead) {
        fetchLeadActivities(leadId).then(setActivities);
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Failed to update status.");
    }
  };

  // Handle saving notes
  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      await saveLeadNotes(selectedLead.id, notesDraft, user?.email);
      setSelectedLead((prev) => (prev ? { ...prev, notes: notesDraft } : null));
      setLeads((prev) =>
        prev.map((l) => (l.id === selectedLead.id ? { ...l, notes: notesDraft } : l))
      );
      toast.success("Note saved successfully.");
      fetchLeadActivities(selectedLead.id).then(setActivities);
    } catch (err) {
      console.error("Failed to save note:", err);
      toast.error("Failed to save note.");
    } finally {
      setSavingNotes(false);
    }
  };

  // Handle Delete
  const confirmDelete = async () => {
    if (!leadToDelete) return;
    setDeleting(true);
    try {
      await deleteLead(leadToDelete.id);
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
      if (selectedLead?.id === leadToDelete.id) {
        setDrawerOpen(false);
        setSelectedLead(null);
      }
      toast.success("Lead permanently removed.");
      fetchWaitlistMetrics().then(setMetrics);
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete lead.");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  // Handle Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  // Handle CSV Export
  const handleExportCsv = () => {
    exportLeadsToCsv(leads, `legacyskool_leads_${statusFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("CSV export generated and downloaded.");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Admin Dashboard — Legacyskool Waitlist & Lead Management"
        description="Manage leads, update statuses, track activities and export waitlist records."
        path="/admin"
      />

      {/* Top Navigation */}
      <header className="border-b border-border/70 bg-card/80 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid place-items-center size-9 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <GraduationCap className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base tracking-tight leading-none">
                Legacyskool
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                Lead Management
              </span>
            </div>
          </Link>
          <Badge variant="outline" className="hidden sm:inline-flex text-[11px] bg-primary/5 text-primary border-primary/20">
            Admin Portal
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold">{user?.email}</div>
            <div className="text-[10px] text-muted-foreground">Authorized Administrator</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            title="Sign out"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Waitlist & Lead Management
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Track school registrations, manage pipeline statuses, and engage stakeholders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={refreshing}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={leads.length === 0}
              className="gap-1.5 text-xs"
            >
              <Download className="size-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Dynamic Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
            className={`p-4 border transition-all cursor-pointer hover:border-primary/50 ${
              statusFilter === "all" ? "border-primary ring-2 ring-primary/10 bg-primary/5" : "bg-card"
            }`}
          >
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Waitlist
            </div>
            <div className="font-display text-2xl sm:text-3xl font-bold mt-1 text-foreground">
              {metrics.total.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">All registered leads</div>
          </Card>

          <Card
            onClick={() => {
              setStatusFilter("new");
              setPage(1);
            }}
            className={`p-4 border transition-all cursor-pointer hover:border-blue-400 ${
              statusFilter === "new" ? "border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/50 dark:bg-blue-950/20" : "bg-card"
            }`}
          >
            <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              New Leads
            </div>
            <div className="font-display text-2xl sm:text-3xl font-bold mt-1 text-foreground">
              {metrics.new.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">Awaiting initial review</div>
          </Card>

          <Card
            onClick={() => {
              setStatusFilter("contacted");
              setPage(1);
            }}
            className={`p-4 border transition-all cursor-pointer hover:border-amber-400 ${
              statusFilter === "contacted" ? "border-amber-500 ring-2 ring-amber-500/10 bg-amber-50/50 dark:bg-amber-950/20" : "bg-card"
            }`}
          >
            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Contacted
            </div>
            <div className="font-display text-2xl sm:text-3xl font-bold mt-1 text-foreground">
              {metrics.contacted.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">Outreach initiated</div>
          </Card>

          <Card
            onClick={() => {
              setStatusFilter("interested");
              setPage(1);
            }}
            className={`p-4 border transition-all cursor-pointer hover:border-purple-400 ${
              statusFilter === "interested" ? "border-purple-500 ring-2 ring-purple-500/10 bg-purple-50/50 dark:bg-purple-950/20" : "bg-card"
            }`}
          >
            <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Interested
            </div>
            <div className="font-display text-2xl sm:text-3xl font-bold mt-1 text-foreground">
              {metrics.interested.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">Demo/pilot requested</div>
          </Card>

          <Card
            onClick={() => {
              setStatusFilter("converted");
              setPage(1);
            }}
            className={`p-4 border transition-all cursor-pointer hover:border-emerald-400 ${
              statusFilter === "converted" ? "border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/50 dark:bg-emerald-950/20" : "bg-card"
            }`}
          >
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Converted
            </div>
            <div className="font-display text-2xl sm:text-3xl font-bold mt-1 text-foreground">
              {metrics.converted.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">Onboarded / active</div>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="p-4 border-border bg-card shadow-sm space-y-3">
          <div className="grid sm:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, school, city…"
                className="pl-9 text-xs sm:text-sm bg-background"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Status Selector */}
            <div className="sm:col-span-3">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="text-xs bg-background">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses ({metrics.total})</SelectItem>
                  <SelectItem value="new">New ({metrics.new})</SelectItem>
                  <SelectItem value="contacted">Contacted ({metrics.contacted})</SelectItem>
                  <SelectItem value="interested">Interested ({metrics.interested})</SelectItem>
                  <SelectItem value="converted">Converted ({metrics.converted})</SelectItem>
                  <SelectItem value="not_interested">Not Interested ({metrics.not_interested})</SelectItem>
                  <SelectItem value="archived">Archived ({metrics.archived})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role Selector */}
            <div className="sm:col-span-2">
              <Select
                value={roleFilter}
                onValueChange={(val) => {
                  setRoleFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="text-xs bg-background">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source Selector */}
            <div className="sm:col-span-2">
              <Select
                value={sourceFilter}
                onValueChange={(val) => {
                  setSourceFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="text-xs bg-background">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Leads Table */}
        <Card className="border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Role & School</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <Loader2 className="size-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading waitlist leads…
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <div className="size-12 rounded-full bg-muted grid place-items-center mx-auto mb-3">
                        <Users className="size-5 text-muted-foreground" />
                      </div>
                      <div className="font-semibold text-foreground">No leads found</div>
                      <p className="text-xs mt-1">Try adjusting your filters or search terms.</p>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => openLeadDrawer(lead)}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        {/* Name */}
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{lead.full_name}</span>
                            {lead.notes && (
                              <span title="Has admin notes" className="text-primary text-[10px]">
                                📝
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-0.5">
                            <a
                              href={`mailto:${lead.email}`}
                              className="hover:text-primary hover:underline flex items-center gap-1"
                            >
                              <Mail className="size-3 shrink-0" /> {lead.email}
                            </a>
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-muted-foreground hover:text-[#25D366] flex items-center gap-1"
                            >
                              <MessageCircle className="size-3 shrink-0" /> {lead.phone}
                            </a>
                          </div>
                        </td>

                        {/* Role & School */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-foreground">{lead.role}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {lead.school_name || "—"}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {lead.city}, {lead.state}
                          <div className="text-[10px] opacity-70">{lead.country}</div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={lead.status}
                            onValueChange={(val) => handleStatusChange(lead.id, val as WaitlistStatus)}
                          >
                            <SelectTrigger
                              className={`h-7 px-2 text-[11px] font-semibold rounded-full border ${statusCfg.border} ${statusCfg.bg} ${statusCfg.color} w-28`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_CONFIG).map(([stKey, stVal]) => (
                                <SelectItem key={stKey} value={stKey} className="text-xs">
                                  {stVal.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Source */}
                        <td className="py-3.5 px-4 text-xs">
                          <Badge variant="secondary" className="capitalize text-[10px] font-normal">
                            {lead.source || "website"}
                          </Badge>
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => openLeadDrawer(lead)}
                            >
                              <Eye className="size-3.5 mr-1" /> View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setLeadToDelete(lead);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{leads.length}</span> of{" "}
              <span className="font-semibold text-foreground">{totalCount}</span> total leads
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-3.5" /> Prev
              </Button>

              <span className="px-2 font-medium text-foreground">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </main>

      {/* LEAD DETAIL SLIDEOUT DRAWER */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6 space-y-6">
          {selectedLead && (
            <>
              <SheetHeader className="text-left pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      STATUS_CONFIG[selectedLead.status]?.bg
                    } ${STATUS_CONFIG[selectedLead.status]?.color} ${
                      STATUS_CONFIG[selectedLead.status]?.border
                    }`}
                  >
                    {STATUS_CONFIG[selectedLead.status]?.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Joined {new Date(selectedLead.created_at).toLocaleDateString()}
                  </span>
                </div>
                <SheetTitle className="text-xl font-bold mt-2 text-foreground">
                  {selectedLead.full_name}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {selectedLead.role} {selectedLead.school_name && `• ${selectedLead.school_name}`}
                </SheetDescription>
              </SheetHeader>

              {/* Status Updater */}
              <div className="space-y-2 p-4 rounded-xl bg-muted/40 border border-border">
                <Label className="text-xs font-semibold">Lead Lifecycle Status</Label>
                <Select
                  value={selectedLead.status}
                  onValueChange={(val) => handleStatusChange(selectedLead.id, val as WaitlistStatus)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full text-xs gap-1.5 bg-card"
                >
                  <a href={`mailto:${selectedLead.email}`}>
                    <Mail className="size-3.5 text-primary" /> Send Email
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full text-xs gap-1.5 bg-card"
                >
                  <a
                    href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-3.5 text-[#25D366]" /> WhatsApp
                  </a>
                </Button>
              </div>

              {/* Details Grid */}
              <div className="space-y-4 text-xs">
                <div className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                  Contact & School Information
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-border bg-card">
                  <div>
                    <div className="text-muted-foreground text-[11px]">Email</div>
                    <div className="font-medium mt-0.5 break-all">{selectedLead.email}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[11px]">Phone</div>
                    <div className="font-medium mt-0.5">{selectedLead.phone}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[11px]">School</div>
                    <div className="font-medium mt-0.5">{selectedLead.school_name || "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[11px]">Location</div>
                    <div className="font-medium mt-0.5">
                      {selectedLead.city}, {selectedLead.state}, {selectedLead.country}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[11px]">Attribution Source</div>
                    <div className="font-medium mt-0.5 capitalize">{selectedLead.source || "Website"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[11px]">Last Updated</div>
                    <div className="font-medium mt-0.5">
                      {new Date(selectedLead.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Selected Interests */}
                <div className="space-y-1.5">
                  <div className="text-muted-foreground text-[11px] font-semibold">Areas of Interest</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(selectedLead.interests) && selectedLead.interests.length > 0 ? (
                      selectedLead.interests.map((interest: string) => (
                        <Badge key={interest} variant="secondary" className="text-[11px] font-normal">
                          {interest}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-xs">No specific interests selected</span>
                    )}
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notes" className="text-xs font-semibold">
                      Admin Notes & Conversation History
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Internal only</span>
                  </div>
                  <Textarea
                    id="notes"
                    placeholder="Add follow-up notes, call summaries, or pilot requirements…"
                    rows={4}
                    className="text-xs bg-background"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="text-xs gap-1.5"
                  >
                    {savingNotes ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
                    Save Notes
                  </Button>
                </div>

                {/* Activity Log / Audit Trail */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px] flex items-center gap-1.5">
                    <History className="size-3.5" /> Activity History
                  </div>

                  {activitiesLoading ? (
                    <div className="py-4 text-center text-muted-foreground text-xs">
                      <Loader2 className="size-4 animate-spin mx-auto mb-1" /> Loading timeline…
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="p-3 rounded-lg bg-muted/30 text-center text-muted-foreground text-xs">
                      No activity logs recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {activities.map((act) => (
                        <div
                          key={act.id}
                          className="p-2.5 rounded-lg border border-border/70 bg-card/60 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                            <span className="font-semibold text-foreground uppercase tracking-wider">
                              {act.action.replace("_", " ")}
                            </span>
                            <span>{new Date(act.created_at).toLocaleString()}</span>
                          </div>
                          {act.details && (
                            <div className="text-muted-foreground">
                              {act.details.from && act.details.to ? (
                                <span>
                                  Status: <strong className="text-foreground">{act.details.from}</strong> →{" "}
                                  <strong className="text-foreground">{act.details.to}</strong>
                                </span>
                              ) : act.details.note_snippet ? (
                                <span>Note: "{act.details.note_snippet}…"</span>
                              ) : (
                                <span>{JSON.stringify(act.details)}</span>
                              )}
                            </div>
                          )}
                          {act.actor_email && (
                            <div className="text-[10px] text-muted-foreground">
                              By: {act.actor_email}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-muted-foreground gap-1.5"
                    onClick={() => handleStatusChange(selectedLead.id, "archived")}
                  >
                    <Archive className="size-3.5" /> Archive Lead
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:bg-destructive/10 gap-1.5"
                    onClick={() => {
                      setLeadToDelete(selectedLead);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="size-3.5" /> Delete Lead
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" /> Permanently Delete Lead?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{leadToDelete?.full_name}</strong> ({leadToDelete?.email})?
              This action cannot be undone and will remove all associated notes and activity records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
