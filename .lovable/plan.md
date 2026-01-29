
# Plan: SnapshotView Client Interface, Sidebar & Pixel-Perfect PDF Export

## Overview

This plan covers three key improvements:

1. **Add a max-width container** to the SnapshotView user interface (currently too wide)
2. **Create a professional sidebar** for the client-facing `/snapshot/:shareToken` view with broker contact info, currency/language controls, and export buttons
3. **Rebuild PDF export** to exactly replicate the snapshot view using html2canvas capture instead of jsPDF primitives

---

## Part 1: Max-Width Container for Snapshot

### Problem
The snapshot view stretches across the entire viewport width on large screens, making it hard to read (as shown in the screenshot).

### Solution
Add a centered container with `max-w-[1600px]` to limit the content width on large screens.

### File: `src/components/roi/snapshot/SnapshotContent.tsx`

**Changes:**
- Wrap the entire content in a centered container: `mx-auto max-w-[1600px]`
- This ensures the snapshot is readable on ultrawide monitors while still using full width on smaller screens

---

## Part 2: Snapshot View Sidebar for Client-Facing View

### New Component: `src/components/roi/snapshot/SnapshotViewSidebar.tsx`

Create a sidebar similar to PresentationView that includes:

```
┌─────────────────────────────────────┐
│  [App Logo]                         │
├─────────────────────────────────────┤
│  [Broker Avatar]                    │
│  Broker Name                        │
│  "Investment Advisor"               │
│                                     │
│  [Email] [WhatsApp]                 │
├─────────────────────────────────────┤
│  Quote Info                         │
│  • Project Name                     │
│  • Created Date                     │
│  • View Count                       │
├─────────────────────────────────────┤
│  Reference Currency                 │
│  [AED ▼]                            │
│                                     │
│  Language                           │
│  [EN ▼]                             │
├─────────────────────────────────────┤
│  [Download PDF]                     │
│  [Download PNG]                     │
├─────────────────────────────────────┤
│  "Powered by DBX Prime"             │
└─────────────────────────────────────┘
```

**Props:**
- `brokerProfile`: name, avatar, email, whatsapp
- `quoteInfo`: project name, created date, view count
- `currency` + `setCurrency`
- `language` + `setLanguage`
- `onExportPDF` / `onExportPNG`

---

### Modify: `src/pages/SnapshotView.tsx`

**Changes:**

1. **Fetch broker profile with contact info:**
   ```typescript
   profiles:broker_id (full_name, avatar_url, business_email, whatsapp_number, whatsapp_country_code)
   ```

2. **Add sidebar layout:**
   ```tsx
   <div className="min-h-screen bg-theme-bg flex">
     {/* Sidebar */}
     <SnapshotViewSidebar
       brokerProfile={brokerProfile}
       quoteInfo={{ projectName, createdAt, viewCount }}
       currency={currency}
       setCurrency={setCurrency}
       language={language}
       setLanguage={setLanguage}
       onExportPDF={() => handleExport('pdf')}
       onExportPNG={() => handleExport('png')}
     />
     
     {/* Main Content */}
     <main className="flex-1 overflow-auto">
       <SnapshotContent
         {...props}
         setCurrency={undefined}  // Moved to sidebar
         setLanguage={undefined}  // Moved to sidebar
       />
     </main>
   </div>
   ```

3. **Add ExportModal integration:**
   - Track `exportModalOpen` state
   - Pass calculated data to ExportModal

4. **Fetch additional quote metadata:**
   - `view_count`, `created_at` for display in sidebar

---

## Part 3: Pixel-Perfect PDF Export

### Problem
The current jsPDF approach creates a simplified document that looks different from the live snapshot view because it manually draws elements instead of capturing the actual UI.

### Solution
Use html2canvas to capture the exact snapshot DOM, then embed that image in a PDF.

### New Component: `src/components/roi/export/ExportSnapshotLayout.tsx`

This component mirrors `SnapshotContent` but is optimized for capture:
- Fixed width: 1587px (A3 landscape equivalent)
- No animations or transitions
- No hover effects
- No modals or interactivity
- All conditional sections rendered statically

```tsx
export const ExportSnapshotLayout = ({
  inputs,
  calculations,
  clientInfo,
  mortgageInputs,
  mortgageAnalysis,
  exitScenarios,
  quoteImages,
  currency,
  rate,
  language,
  brokerInfo,
}: ExportSnapshotLayoutProps) => {
  return (
    <div 
      className="w-[1587px] min-h-[1123px] bg-theme-bg p-6"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Broker Header */}
      <ExportBrokerHeader brokerInfo={brokerInfo} language={language} />
      
      {/* Property Hero - Simplified static version */}
      <ExportPropertyHero ... />
      
      {/* Overview Cards */}
      <SnapshotOverviewCards ... />
      
      {/* 2-Column Layout */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* Left: Payment Table */}
        <CompactPaymentTable ... />
        
        {/* Right: Rent + Exits + Post-Handover + Mortgage */}
        <div className="space-y-3">
          {inputs.rentalYieldPercent > 0 && <CompactRentCard ... />}
          {showExits && <CompactAllExitsCard ... />}
          {inputs.hasPostHandoverPlan && <CompactPostHandoverCard ... />}
          {mortgageInputs.enabled && <CompactMortgageCard ... />}
        </div>
      </div>
      
      {/* Wealth Timeline */}
      <WealthProjectionTimeline ... />
      
      {/* Footer */}
      <ExportFooter generatedAt={new Date()} language={language} />
    </div>
  );
};
```

### New Components

| Component | Purpose |
|-----------|---------|
| `ExportSnapshotLayout.tsx` | Main export layout matching live view |
| `ExportBrokerHeader.tsx` | Broker info header for PDF |
| `ExportPropertyHero.tsx` | Static property hero card |
| `ExportFooter.tsx` | Generation date and branding |

---

### Modify: `src/hooks/useExportRenderer.tsx`

**Changes:**

1. **Update to render `ExportSnapshotLayout` instead of `ExportSnapshotDOM`:**
   - Pass all required props including `brokerInfo` and `quoteImages`

2. **Improve capture quality:**
   - Increase render delay for complex layouts
   - Ensure all fonts are loaded
   - Handle CORS for images

---

### Modify: `src/components/roi/ExportModal.tsx`

**Changes:**

1. **Use html2canvas for PDF as well:**
   - Capture the DOM and embed as JPEG in PDF
   - This ensures pixel-perfect match with the live view

2. **Remove the separate jsPDF generator path:**
   - Both PNG and PDF use the same DOM capture approach
   - PDF simply embeds the captured image

---

## Part 4: Ensure All Sections Are Exported

The export layout must include all conditional sections from the live view:

| Section | Condition | Source Component |
|---------|-----------|------------------|
| Property Hero | Always | `PropertyHeroCard` (static version) |
| Overview Cards | Always | `SnapshotOverviewCards` |
| Payment Breakdown | Always | `CompactPaymentTable` |
| Rental Income | `inputs.rentalYieldPercent > 0` | `CompactRentCard` |
| Exit Scenarios | `enabledSections.exitStrategy !== false && exitScenarios.length > 0` | `CompactAllExitsCard` |
| Post-Handover | `inputs.hasPostHandoverPlan` | `CompactPostHandoverCard` |
| Mortgage | `mortgageInputs.enabled` | `CompactMortgageCard` |
| Wealth Timeline | Always | `WealthProjectionTimeline` |

All components receive:
- `currency` and `rate` for dual-currency display
- `language` for EN/ES translations

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/roi/snapshot/SnapshotViewSidebar.tsx` | Client-facing sidebar with broker info |
| `src/components/roi/export/ExportSnapshotLayout.tsx` | Full export-ready layout for PDF/PNG |
| `src/components/roi/export/ExportBrokerHeader.tsx` | Broker header in exports |
| `src/components/roi/export/ExportPropertyHero.tsx` | Static property hero for exports |
| `src/components/roi/export/ExportFooter.tsx` | Footer with generation timestamp |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/roi/snapshot/SnapshotContent.tsx` | Add `max-w-[1600px]` container |
| `src/pages/SnapshotView.tsx` | Add sidebar layout, fetch broker contact info, integrate ExportModal |
| `src/hooks/useExportRenderer.tsx` | Render `ExportSnapshotLayout`, add broker info support |
| `src/components/roi/ExportModal.tsx` | Unify PNG/PDF to both use DOM capture |
| `src/components/roi/snapshot/index.ts` | Export new components |
| `src/components/roi/export/index.ts` | Export new components |

---

## Summary Table

| Issue | Solution |
|-------|----------|
| Snapshot too wide on large screens | Add `max-w-[1600px] mx-auto` container |
| No sidebar in client view | Create `SnapshotViewSidebar` with broker info, contact buttons, currency/language, export |
| PDF looks different from live view | Use html2canvas to capture actual DOM instead of jsPDF primitives |
| Missing broker contact in share view | Fetch broker profile with `business_email`, `whatsapp_number`, `whatsapp_country_code` |
| Currency/language not synced in export | Pass current `currency`, `rate`, `language` to all export components |

---

## Technical Notes

- The sidebar width will be `w-72` (288px), matching PresentationView
- Currency/language selectors move from PropertyHeroCard to sidebar in client view
- The internal configurator view (`/cashflow/:quoteId`) remains unchanged (no sidebar)
- Export components use static Tailwind classes, no framer-motion or transitions
- All translations use the existing `useLanguage` hook and `LanguageContext`
