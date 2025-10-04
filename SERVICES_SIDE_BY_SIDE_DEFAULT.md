# Services View - Side-by-Side Default Layout

**Date**: October 4, 2025

## Changes Made

Updated the Services page to always show both service cards panel and instance details panel side-by-side from the start, each displaying helpful placeholder messages when empty.

### Key Modifications

1. **Always Show Split-Screen Layout**
   - Changed from: Dynamic grid that switches between single column and two columns
   - Changed to: Always `grid-cols-1 lg:grid-cols-2` (side-by-side on desktop, stacked on mobile)

2. **Left Panel - Service Cards with Placeholder**
   - When `activeProfiles.length > 0`: Shows service cards
   - When `activeProfiles.length === 0`: Shows placeholder card with message
   - **Placeholder Card:**
     - Title: "Services"
     - Icon: Service glyph (muted)
     - Message: "No Profile Selected" - "Select a profile above to view services."

3. **Right Panel - Instance Details with Placeholder**
   - When `selectedService` exists: Shows instance details
   - When no service selected: Shows placeholder card with message
   - **Placeholder Card:**
     - Title: "Instance Details"
     - Contextual heading and message based on profile selection

4. **Visual Consistency**
   - Both panels always visible, establishing clear layout from the start
   - Users immediately understand the two-panel structure
   - No layout shift when selecting profiles or services

### UI Layout

**Initial State (No Profile Selected):**
```
┌──────────────────────────────────────────────────────────────┐
│ Services Summary (All profiles)                              │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Profile Selector                                             │
└──────────────────────────────────────────────────────────────┘
┌────────────────────────┬─────────────────────────────────────┐
│    [Service Icon]      │       [Service Icon]                │
│ No Profile Selected    │  No Profile Selected                │
│ Select a profile above │  Select a profile above to view     │
│ to view services.      │  services.                          │
│                        │                                     │
└────────────────────────┴─────────────────────────────────────┘
    Services Panel              Instance Details Panel
```

**After Selecting Profile (No Service Selected):**
```
┌──────────────────────────────────────────────────────────────┐
│ Services Summary + Search + Actions                          │
└──────────────────────────────────────────────────────────────┘
┌────────────────────────┬─────────────────────────────────────┐
│ ┌────────────────────┐ │       [Service Icon]                │
│ │ Payment Service    │ │  No Service Selected                │
│ │ • Description      │ │  Click on a service card on the     │
│ │ • Status badges    │ │  left to view its instance details  │
│ └────────────────────┘ │  and manage deployments.            │
│ ┌────────────────────┐ │                                     │
│ │ Auth Service       │ │                                     │
│ └────────────────────┘ │                                     │
│ ...more services...    │                                     │
└────────────────────────┴─────────────────────────────────────┘
    Services Panel              Instance Details Panel
```

**After Selecting Service:**
```
┌──────────────────────────────────────────────────────────────┐
│ Services Summary + Search + Actions                          │
└──────────────────────────────────────────────────────────────┘
┌────────────────────────┬─────────────────────────────────────┐
│ ┌────────────────────┐ │ Payment Service - Instance Details  │
│ │ Payment Service ✓  │ │ • Description                       │
│ │ [Selected]         │ │ • Status summary                    │
│ └────────────────────┘ │ • Instances (5)                     │
│ ┌────────────────────┐ │   - Instance 1 [Select] [Running]   │
│ │ Auth Service       │ │   - Instance 2 [Select] [Running]   │
│ └────────────────────┘ │   - Instance 3 [Select] [Stopped]   │
│ ...more services...    │ • Actions: Start/Stop selected      │
└────────────────────────┴─────────────────────────────────────┘
    Services Panel              Instance Details Panel
```

### Code Structure

```tsx
{/* Split Screen Layout - Always side-by-side */}
<div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
  
  {/* Left Panel - Service Cards or Placeholder */}
  <div className="space-y-6">
    {activeProfiles.length > 0 ? (
      // Show service cards
      filteredServices.map((service) => (
        <Card key={serviceKey} {...serviceProps} />
      ))
    ) : (
      // Show placeholder when no profile selected
      <Card
        title="Services"
        icon={<ServiceGlyph />}
        className="border-slate-700 bg-slate-900/50"
      >
        <div className="text-center">
          <h3>No Profile Selected</h3>
          <p>Select a profile above to view services.</p>
        </div>
      </Card>
    )}
  </div>
  
  {/* Right Panel - Instance Details or Placeholder */}
  <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
    {selectedService ? (
      // Show instance details
      <Card {...instanceDetailsProps} />
    ) : (
      // Show placeholder with contextual message
      <Card
        title="Instance Details"
        icon={<ServiceGlyph />}
        className="border-slate-700 bg-slate-900/50"
      >
        <div className="text-center">
          <h3>
            {activeProfiles.length === 0 
              ? "No Profile Selected" 
              : "No Service Selected"}
          </h3>
          <p>
            {activeProfiles.length === 0
              ? "Select a profile above to view services."
              : "Click on a service card on the left..."}
          </p>
        </div>
      </Card>
    )}
  </div>
</div>
```

### Placeholder Messages

**Left Panel (Services):**
- Shows only when no profile is selected
- Title: "Services"
- Heading: "No Profile Selected"
- Message: "Select a profile above to view services."
- Styling: Muted colors (slate-700 border, slate-900/50 background)

**Right Panel (Instance Details):**
- Always shows when no service is selected
- Title: "Instance Details"
- Heading: Dynamic based on state
  - No profile: "No Profile Selected"
  - Profile selected: "No Service Selected"
- Message: Dynamic based on state
  - No profile: "Select a profile above to view services."
  - Profile selected: "Click on a service card on the left to view its instance details and manage deployments."
- Styling: Muted colors for consistency

### Benefits

1. **Predictable Layout**: Users immediately see the two-panel structure
2. **No Layout Shift**: Panels don't appear/disappear, maintaining visual stability
3. **Clear Guidance**: Both panels provide contextual messages about what to do next
4. **Professional Appearance**: Consistent with modern dashboard UIs
5. **Better UX**: Users understand the interaction model before taking action
6. **Responsive**: Still stacks vertically on mobile devices

### Responsive Behavior

- **Desktop (≥1024px)**: Two columns side-by-side with `lg:grid-cols-2`
  - Left: 50% width for service cards/placeholder
  - Right: 50% width for instance details/placeholder (sticky)
- **Tablet/Mobile (<1024px)**: Single column with `grid-cols-1`
  - Service cards/placeholder appears first
  - Instance details/placeholder appears below

### User Flow

1. **Initial Load**:
   - See both panels with placeholder messages
   - Clear call-to-action: "Select a profile above to view services"

2. **After Profile Selection**:
   - Left panel populates with service cards
   - Right panel shows "No Service Selected" message
   - Search and action buttons become available

3. **After Service Selection**:
   - Left panel highlights selected service card
   - Right panel shows full instance details
   - Users can interact with instances (select, start, stop)

### Testing Checklist

- [x] Both panels visible on page load
- [x] Left panel shows "Services" placeholder initially
- [x] Right panel shows "Instance Details" placeholder initially
- [x] Layout is split-screen on desktop from the start
- [x] No layout shift when selecting profile
- [x] No layout shift when selecting service
- [x] Service cards replace left placeholder after profile selection
- [x] Instance details replace right placeholder after service selection
- [x] Placeholder messages are contextual and helpful
- [x] Responsive behavior maintained (stacks on mobile)
- [x] All existing functionality works

## Files Modified

- `src/components/services/ServicesView.tsx`:
  - Changed split-screen layout to always use `grid-cols-1 lg:grid-cols-2`
  - Added placeholder card for left panel (Services) when no profile selected
  - Modified conditional rendering to show placeholder instead of hiding panel
  - Both panels now always visible with contextual content
