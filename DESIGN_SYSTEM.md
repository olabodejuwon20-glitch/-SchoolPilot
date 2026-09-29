# Legacyskool Master UI/UX & Design System Specification

## 1. Executive Summary & Design Philosophy
Legacyskool is a multi-tenant, role-based school management platform (supporting **Admins**, **Teachers**, **Students**, and **Parents**). The frontend architecture is built on **React 18**, **Vite**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui** primitives.

The overarching design objective is to maintain a crisp, enterprise-grade, accessible, and **white-labelable** interface that scales across varied screen densities, devices, and role contexts.

---

## 2. Color Architecture & Semantic Token System

### 2.1 CSS Variables & Token Mapping
All colors in the system are defined as HSL values inside `src/index.css` and mapped to Tailwind semantic utility classes in `tailwind.config.ts`.

#### System Tokens
| Semantic Class | Light Mode HSL (`:root`) | Dark Mode HSL (`.dark`) | Intent / Usage |
| :--- | :--- | :--- | :--- |
| `bg-background` / `text-foreground` | `220 20% 98%` / `222 47% 11%` | `222 47% 7%` / `210 40% 98%` | Global application canvas and primary body text |
| `bg-card` / `text-card-foreground` | `0 0% 100%` / `222 47% 11%` | `222 47% 10%` / `210 40% 98%` | Cards, panels, elevated surface containers |
| `bg-popover` / `text-popover-foreground` | `0 0% 100%` / `222 47% 11%` | `222 47% 10%` / `210 40% 98%` | Dropdowns, tooltips, popovers, select menus |
| `bg-primary` / `text-primary-foreground` | `221 83% 53%` / `210 40% 98%` | `221 83% 60%` / `222 47% 7%` | Primary brand actions, active states, key CTAs |
| `bg-primary-soft` | `221 83% 96%` | `221 50% 18%` | Soft highlighted backgrounds, selected list rows |
| `bg-secondary` / `text-secondary-foreground` | `220 14% 96%` / `222 47% 11%` | `217 33% 17%` / `210 40% 98%` | Secondary buttons, subtle badges, container fills |
| `bg-muted` / `text-muted-foreground` | `220 14% 96%` / `220 9% 46%` | `217 33% 15%` / `215 20% 65%` | Inactive elements, secondary text labels, placeholders |
| `bg-accent` / `text-accent-foreground` | `221 83% 96%` / `221 83% 53%` | `221 50% 18%` / `221 83% 75%` | Hover states, active list selections |
| `bg-success` / `text-success-foreground` | `142 71% 45%` / `0 0% 100%` | `142 71% 45%` / `0 0% 100%` | Positive statuses, paid invoices, passing grades |
| `bg-warning` / `text-warning-foreground` | `38 92% 50%` / `0 0% 100%` | `38 92% 55%` / `222 47% 7%` | Cautionary states, pending payments, risk warnings |
| `bg-destructive` / `text-destructive-foreground` | `0 84% 60%` / `0 0% 100%` | `0 72% 55%` / `0 0% 100%` | Danger states, destructive actions, errors |
| `bg-info` / `text-info-foreground` | `199 89% 48%` / `0 0% 100%` | `199 89% 55%` / `222 47% 7%` | Informational callouts, system tips |
| `border-border` / `border-input` | `220 13% 91%` | `217 33% 18%` | Component borders, table dividers, input boundaries |
| `ring-ring` | `221 83% 53%` | `221 83% 60%` | Focus rings, accessibility focus indicators |

#### Role Accent Tokens
| Semantic Class | HSL | Application Scope |
| :--- | :--- | :--- |
| `bg-admin` / `text-admin` | `221 83% 53%` | School Admin portal headers, accents, and badges |
| `bg-teacher` / `text-teacher` | `142 71% 38%` | Teacher portal headers, accents, and badges |
| `bg-student` / `text-student` | `262 83% 58%` | Student portal headers, accents, and badges |
| `bg-parent` / `text-parent` | `0 72% 51%` | Parent portal headers, accents, and badges |

#### Sidebar Tokens
| Semantic Class | Light Mode HSL | Dark Mode HSL |
| :--- | :--- | :--- |
| `bg-sidebar` / `text-sidebar-foreground` | `0 0% 100%` / `222 47% 20%` | `222 47% 9%` / `210 40% 90%` |
| `bg-sidebar-primary` | `221 83% 53%` | `221 83% 60%` |
| `bg-sidebar-accent` / `text-sidebar-accent-foreground` | `221 83% 96%` / `221 83% 53%` | `221 50% 18%` / `221 83% 75%` |
| `border-sidebar-border` | `220 13% 91%` | `217 33% 18%` |

---

### 2.2 White-Labeling Strict Constraint Rule
> [!CAUTION]
> **STRICT RULE: ABSOLUTELY NO HARDCODED COLOR CLASSES OR HEX CODES**
>
> NEVER use hardcoded color utilities (e.g., `bg-blue-500`, `text-slate-900`, `border-gray-200`, `#2563eb`) in feature components or layouts.
>
> **ALWAYS** use semantic tokens (`bg-primary`, `bg-card`, `text-muted-foreground`, `border-border`).
>
> *Why?* Hardcoded colors break theme toggling (Dark/Light mode) and prevent dynamic tenant branding (white-labeling for custom school themes).

---

## 3. Typography & Icon System

### 3.1 Font Families
Configured in `tailwind.config.ts`:
- **Body & Code (`font-sans`)**: `Inter`, system UI fallback.
- **Display & Headings (`font-display`)**: `"Plus Jakarta Sans"`, `Inter` fallback.

```tsx
// Heading Example
<h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
  Dashboard Overview
</h1>

// Body Example
<p className="font-sans text-sm text-muted-foreground">
  Manage class enrollment and active sessions.
</p>
```

### 3.2 Typographic Hierarchy
| Role | Class Configuration | Typical Usage |
| :--- | :--- | :--- |
| **Page Title** | `font-display text-2xl font-bold tracking-tight` | Header of a page or hub |
| **Section Heading** | `font-display text-lg font-semibold` | Card headers, modal titles, section dividers |
| **Card Title** | `font-sans text-base font-medium` | Item names, stat titles |
| **Body Text** | `font-sans text-sm text-foreground` | General paragraph text, form input text |
| **Muted Caption** | `font-sans text-xs text-muted-foreground` | Timestamps, metadata, help text |
| **Badge / Pill** | `font-sans text-[11px] font-medium tracking-wide` | Status badges, category pills |

---

### 3.3 Icon System
- **Icon Library**: `lucide-react` **exclusively**.
- **Constraint**: Do not import or inline raw SVG strings, FontAwesome, or other icon libraries.
- **Sizing Standardization**:
  - Small / Inline: `size-3.5` or `size-4` (`w-3.5 h-3.5` / `w-4 h-4`)
  - Medium / Navigation: `size-4` or `size-5`
  - Hero / Empty State: `size-8` or `size-12`

```tsx
import { GraduationCap, Users, Calendar } from "lucide-react";

<Button variant="outline" size="sm">
  <Calendar className="size-4 mr-2" />
  View Schedule
</Button>
```

---

## 4. Portal Layout Architecture & Navigation Rules

### 4.1 Shell Structure
The application shell ([src/layouts/AppLayout.tsx](file:///C:/Users/USER/.gemini/antigravity/scratch/lovable-migration/src/src/layouts/AppLayout.tsx)) consists of:
1. **Collapsible Sidebar (`aside`)**:
   - Fixed on desktop, sliding drawer on mobile (`z-40`).
   - Width: `w-[260px]` expanded, `w-[76px]` collapsed.
   - Styled with `bg-sidebar`, `border-sidebar-border`.
2. **Main Content Container**:
   - Header with Tenant Badge, Role Selector, Notifications, and User Profile menu.
   - Main viewport with `flex-1 bg-background p-4 md:p-6 lg:p-8`.

---

### 4.2 Sidebar Hub Organization & Limit Rule
To prevent navigation overload across complex school roles, sidebar links are dynamically grouped into **Hub Sections** (`Overview`, `People`, `Admission`, `Academics`, `Library`, `Assessments`, `Copilot`, `Communication`, `Finance`, `Operations`, `Reports`, `System`).

> [!IMPORTANT]
> **NAVIGATION HARD LIMIT RULE: MAXIMUM 8 ACTIVE SIDEBAR HUBS PER ROLE VIEW**
>
> 1. No role view may display more than **8 top-level sidebar hubs/groups** simultaneously.
> 2. Secondary/nested pages must be accessed via **Horizontal Tab Bars** (`Tabs` / `TabsList`) inside the parent hub page.
> 3. Sub-admin permissions filter the visible hubs dynamically (`useAdminPermissions`).

---

### 4.3 Horizontal Scrolling Tabs Pattern
When a hub contains multiple views (e.g., *Settings*, *Exams*, *TradExams*), use horizontal tabs with custom scrollbars:

```tsx
<Tabs defaultValue="overview" className="w-full">
  <div className="overflow-x-auto scrollbar-thin pb-2">
    <TabsList className="inline-flex w-max space-x-1 bg-muted p-1 rounded-lg">
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="grading">Grading Weights</TabsTrigger>
      <TabsTrigger value="approvals">Approvals</TabsTrigger>
    </TabsList>
  </div>
  <TabsContent value="overview">...</TabsContent>
</Tabs>
```

---

## 5. Component Primitives (shadcn/ui Strict Compliance)

### 5.1 Standard Primitives Location
All interactive UI primitives reside in `src/components/ui/`.

Key Primitives:
- **Actions**: `Button`, `DropdownMenu`
- **Data Display**: `Card`, `Badge`, `Avatar`, `Table`, `Accordion`, `Carousel`
- **Forms & Inputs**: `Input`, `PasswordInput`, `Select`, `Checkbox`, `Switch`, `Slider`, `Textarea`
- **Overlays**: `Dialog`, `AlertDialog`, `Sheet`, `Popover`, `Tooltip`
- **Feedback**: `Sonner` (toasts), `Progress`, `Skeleton`

---

### 5.2 Primitive Constraint Rule
> [!WARNING]
> **NEVER BUILD CUSTOM INTERACTIVE PRIMITIVES FROM SCRATCH**
>
> Always import and extend primitives from `@/components/ui/*`.
>
> - **Buttons**: Use `<Button variant="..." size="...">`. Do not create `<button className="px-4 py-2 bg-blue-500...">`.
> - **Modals / Confirmations**: Use `<Dialog>` or `<AlertDialog>`. Do not build fixed `<div>` overlays manually.
> - **Form Controls**: Use `<Input>`, `<Select>`, `<Checkbox>`, or `<Switch>`.

---

## 6. Feedback States, Async Operations & Notifications

### 6.1 Toast Notifications
- Always use `sonner` via `toast`:
  - `toast.success("School profile updated")`
  - `toast.error("Failed to save changes")`
  - `toast.info("Processing export...")`
- Avoid `window.alert()` or legacy toast components.

### 6.2 Loading & Async States
> [!NOTE]
> **SKELETON LOADERS OVER FULL-PAGE SPINNERS**
>
> When data is fetching:
> 1. Use `<Skeleton className="h-12 w-full rounded-md" />` within the target container to match content geometry.
> 2. Avoid full-screen blocking spinners except during critical auth initializations.
> 3. Button pending states must show inline spinner (`<Loader2 className="size-4 animate-spin mr-2" />`) and set `disabled={busy}`.

```tsx
// Button Loading Pattern
<Button disabled={loading} type="submit">
  {loading && <Loader2 className="size-4 animate-spin mr-2" />}
  Save Changes
</Button>

// Data Loading Skeleton Pattern
{loading ? (
  <div className="space-y-3">
    <Skeleton className="h-6 w-1/3" />
    <Skeleton className="h-24 w-full" />
  </div>
) : (
  <Content />
)}
```

---

## 7. CBT Appliance & Domain-Specific UI Patterns

The Computer-Based Testing (CBT) Appliance ([src/pages/student/ExamInterface.tsx](file:///C:/Users/USER/.gemini/antigravity/scratch/lovable-migration/src/src/pages/student/ExamInterface.tsx)) enforces strict usability and security requirements:

### 7.1 CBT Interface Architecture
1. **Full-Screen Distraction-Free Shell**:
   - Navigation sidebar is hidden during an active exam attempt.
   - Header displays Exam Title, `<TimerRing />`, Proctoring Indicator, and Submit button.
2. **Question Canvas & Navigation Grid**:
   - Left/Top Question Display with formatted math syntax (`<MathText />`).
   - Right/Bottom Question Quick-Jump Palette showing:
     - **Unanswered**: `bg-muted text-muted-foreground`
     - **Answered**: `bg-primary text-primary-foreground`
     - **Marked for Review**: `bg-warning text-warning-foreground`
3. **Timer & Time Warnings**:
   - `<TimerRing />` visual progress ring.
   - Color transitions to `text-destructive` when remaining time is < 5 minutes.
4. **Security & Proctoring**:
   - Fullscreen enforcement modal on tab/window blur.
   - Incident counter with auto-submit upon exceeding violation limit.

---

## 8. Summary Checklist for Code Reviews

- [ ] Are all color utilities using semantic tokens (`bg-card`, `text-foreground`, `border-border`) instead of hardcoded colors (`bg-blue-500`, `#fff`)?
- [ ] Are font families set to `font-sans` for body and `font-display` for headers?
- [ ] Are all icons imported exclusively from `lucide-react`?
- [ ] Does the sidebar limit active top-level hubs to a maximum of 8?
- [ ] Are horizontal tab bars scrollable with `.scrollbar-thin`?
- [ ] Are interactive components using `@/components/ui/*` primitives?
- [ ] Is feedback handled via `sonner` toasts and layout `<Skeleton />` loaders?
