# Services View - Conditional Search and Updated Messages

**Date**: October 4, 2025

## Changes Made

Updated the Services page to only show the search bar after selecting a profile summary card, and updated the service card placeholder message to be more specific.

### Key Modifications

1. **Search Bar Now Conditional**
   - Changed from: Always visible
   - Changed to: Only visible when `activeProfiles.length > 0` (after selecting a profile)
   - Search bar appears along with the service cards when a profile is selected

2. **Updated Service Card Placeholder Message**
   - Changed from: "No Services Available" - "Search by service name or select a profile to view services."
   - Changed to: "No Profile Selected" - "Select any profile summary card to view services."
   - More specific instruction pointing to the profile summary cards above

3. **Action Buttons Remain Conditional**
   - Start All, Stop All, and Reset Selection buttons still only appear when profile selected
   - Now grouped with search bar in the same conditional section

### UI Layout

**Initial State (No Profile Selected):**
```
┌──────────────────────────────────────────────────────────────┐
│ Services Summary (Profile cards shown)                       │
│ [Dev 3/8] [QA 2/5] [Prod 5/7] [All 10/20]  ← Click these!  │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Profile Selector: [ ] Dev [ ] QA [ ] Prod [✓] All           │
└──────────────────────────────────────────────────────────────┘

(No search bar visible)

┌────────────────────────┬─────────────────────────────────────┐
│    [Service Icon]      │       [Service Icon]                │
│ No Profile Selected    │  No Service Selected                │
│ Select any profile     │  Select any service to view         │
│ summary card to view   │  instances.                         │
│ services.              │                                     │
└────────────────────────┴─────────────────────────────────────┘
```

**After Selecting Profile Summary Card:**
```
┌──────────────────────────────────────────────────────────────┐
│ Services Summary (Selected profile highlighted)              │
│ [Dev 3/8] [QA 2/5] [Prod 5/7] [All 10/20]                   │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Profile Selector: [✓] Dev [ ] QA [ ] Prod [ ] All           │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Search: [............] [▶ Start All (3)] [■ Stop All (2)]   │
└──────────────────────────────────────────────────────────────┘
┌────────────────────────┬─────────────────────────────────────┐
│ ┌────────────────────┐ │       [Service Icon]                │
│ │ Payment Service    │ │  No Service Selected                │
│ │ • Description      │ │  Select any service to view         │
│ │ • Status badges    │ │  instances.                         │
│ └────────────────────┘ │                                     │
│ ┌────────────────────┐ │                                     │
│ │ Auth Service       │ │                                     │
│ └────────────────────┘ │                                     │
└────────────────────────┴─────────────────────────────────────┘
```

### Code Structure

```tsx
{/* Search Services - Only visible when profile selected */}
{activeProfiles.length > 0 && (
  <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      {/* Search bar */}
      <label className="flex flex-col gap-2 text-sm text-slate-300 sm:w-80">
        <span className="font-medium text-slate-200">Search services</span>
        <input
          type="search"
          placeholder="Search by service name"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </label>
      
      {/* Action buttons - Start All, Stop All, Reset Selection */}
      <div className="flex items-center gap-2">
        {/* ... action buttons ... */}
      </div>
    </div>
  </div>
)}

{/* Split Screen Layout */}
<div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
  {/* Left Panel - Services */}
  <div className="space-y-6">
    {activeProfiles.length > 0 ? (
      // Service cards
    ) : (
      <Card>
        <h3>No Profile Selected</h3>
        <p>Select any profile summary card to view services.</p>
      </Card>
    )}
  </div>
  
  {/* Right Panel - Instance Details */}
  <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
    {selectedService ? (
      // Instance details
    ) : (
      <Card>
        <h3>No Service Selected</h3>
        <p>Select any service to view instances.</p>
      </Card>
    )}
  </div>
</div>
```

### Updated Messages

**Left Panel - Service Card Placeholder:**
- **Heading:** "No Profile Selected"
- **Message:** "Select any profile summary card to view services."
- **Purpose:** Explicitly directs users to the profile summary cards at the top of the page
- **Clarity:** Uses "profile summary card" to be more specific than just "profile"

**Right Panel - Instance Details Placeholder:**
- **Heading:** "No Service Selected"
- **Message:** "Select any service to view instances."
- **No change:** Message remains simple and clear

### User Flow

1. **Page Load**:
   - See Services Summary cards (Dev, QA, Prod, All) at the top
   - See Profile Selector with checkboxes
   - See two placeholder cards (Services and Instance Details)
   - Placeholder message: "Select any profile summary card to view services"

2. **Click Profile Summary Card** (e.g., click "Dev 3/8"):
   - Profile automatically selected in Profile Selector
   - Search bar appears
   - Action buttons appear (Start All, Stop All)
   - Service cards populate left panel
   - Right panel still shows "No Service Selected" placeholder

3. **Search or Browse Services**:
   - Use search bar to filter services
   - Or browse through service cards

4. **Click Service Card**:
   - Service card highlights with emerald border
   - Right panel shows instance details
   - Can select instances and perform actions

### Benefits

1. **Cleaner Initial View**: Less UI clutter when no profile selected
2. **Progressive Disclosure**: Search appears when it becomes useful
3. **Explicit Guidance**: "Profile summary card" is more specific than "profile"
4. **Visual Hierarchy**: Draws attention to profile summary cards first
5. **Focused Workflow**: Users follow a clear path: profile → search/browse → service → instances
6. **Reduced Cognitive Load**: Only shows relevant controls at each step

### Element Visibility Matrix

| Element | No Profile | Profile Selected | Service Selected |
|---------|-----------|------------------|------------------|
| Services Summary | ✓ | ✓ | ✓ |
| Profile Selector | ✓ | ✓ | ✓ |
| Search Bar | ✗ | ✓ | ✓ |
| Action Buttons | ✗ | ✓ | ✓ |
| Service Cards | ✗ (placeholder) | ✓ | ✓ |
| Instance Details | ✗ (placeholder) | ✗ (placeholder) | ✓ |

### Testing Checklist

- [x] Search bar hidden when no profile selected
- [x] Search bar appears after clicking profile summary card
- [x] Action buttons appear along with search bar
- [x] Service card placeholder shows "No Profile Selected"
- [x] Service card message mentions "profile summary card"
- [x] Instance card placeholder shows "No Service Selected"
- [x] Instance card message remains simple: "Select any service to view instances"
- [x] Clicking profile summary card selects profile and shows search
- [x] All existing functionality works after profile selection
- [x] Layout remains consistent and stable

### Message Comparison

**Before:**
- Left Panel: "No Services Available" - "Search by service name or select a profile to view services."
- Right Panel: "No Service Selected" - "Select any service to view instances."

**After:**
- Left Panel: "No Profile Selected" - "Select any profile summary card to view services."
- Right Panel: "No Service Selected" - "Select any service to view instances." (unchanged)

**Improvements:**
- ✓ More accurate heading ("No Profile Selected" instead of "No Services Available")
- ✓ More specific instruction (mentions "profile summary card")
- ✓ Doesn't mention search when it's not visible
- ✓ Guides users to the correct UI element to click

## Files Modified

- `src/components/services/ServicesView.tsx`:
  - Made search bar conditional on `activeProfiles.length > 0`
  - Updated service card placeholder heading to "No Profile Selected"
  - Updated service card placeholder message to "Select any profile summary card to view services."
  - Search and action buttons now in same conditional block
