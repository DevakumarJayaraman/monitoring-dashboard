# Services View - Search Always Visible with Updated Messages

**Date**: October 4, 2025

## Changes Made

Updated the Services page to always show the search bar by default and updated placeholder messages to be more concise and action-oriented.

### Key Modifications

1. **Search Bar Always Visible**
   - Changed from: Search bar only visible when `activeProfiles.length > 0`
   - Changed to: Search bar always visible regardless of profile selection
   - Action buttons (Start All, Stop All, Reset Selection) still conditional on profile selection

2. **Updated Left Panel Placeholder Message**
   - Heading: "No Services Available"
   - Message: "Search by service name or select a profile to view services."
   - Encourages both search and profile selection as options

3. **Updated Right Panel Placeholder Message**
   - Heading: "No Service Selected"
   - Message: "Select any service to view instances."
   - Simplified and more direct call-to-action

4. **Conditional Action Buttons**
   - Start All, Stop All, and Reset Selection buttons only appear when a profile is selected
   - Search bar remains visible at all times

### UI Layout

**Initial State (No Profile Selected):**
```
┌──────────────────────────────────────────────────────────────┐
│ Services Summary (All profiles)                              │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Profile Selector                                             │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Search services: [Search by service name...............]     │
└──────────────────────────────────────────────────────────────┘
┌────────────────────────┬─────────────────────────────────────┐
│    [Service Icon]      │       [Service Icon]                │
│ No Services Available  │  No Service Selected                │
│ Search by service name │  Select any service to view         │
│ or select a profile to │  instances.                         │
│ view services.         │                                     │
└────────────────────────┴─────────────────────────────────────┘
    Services Panel              Instance Details Panel
```

**After Selecting Profile (No Service Selected):**
```
┌──────────────────────────────────────────────────────────────┐
│ Services Summary (Selected profile highlighted)              │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Profile Selector                                             │
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

**After Selecting Service:**
```
┌──────────────────────────────────────────────────────────────┐
│ Services Summary + Search + Action Buttons                   │
└──────────────────────────────────────────────────────────────┘
┌────────────────────────┬─────────────────────────────────────┐
│ ┌────────────────────┐ │ Payment Service - Instance Details  │
│ │ Payment Service ✓  │ │ • Instances list with actions       │
│ └────────────────────┘ │                                     │
└────────────────────────┴─────────────────────────────────────┘
```

### Code Structure

```tsx
{/* Search Services - Always visible */}
<div className="space-y-4">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    {/* Search bar - always visible */}
    <label className="flex flex-col gap-2 text-sm text-slate-300 sm:w-80">
      <span className="font-medium text-slate-200">Search services</span>
      <input
        type="search"
        placeholder="Search by service name"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
      />
    </label>
    
    {/* Action buttons - only when profile selected */}
    {activeProfiles.length > 0 && (
      <div className="flex items-center gap-2">
        {/* Start All, Stop All, Reset Selection buttons */}
      </div>
    )}
  </div>
</div>

{/* Split Screen Layout */}
<div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
  {/* Left Panel - Services */}
  <div className="space-y-6">
    {activeProfiles.length > 0 ? (
      // Service cards
    ) : (
      <Card /* Placeholder */>
        <h3>No Services Available</h3>
        <p>Search by service name or select a profile to view services.</p>
      </Card>
    )}
  </div>
  
  {/* Right Panel - Instance Details */}
  <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
    {selectedService ? (
      // Instance details
    ) : (
      <Card /* Placeholder */>
        <h3>No Service Selected</h3>
        <p>Select any service to view instances.</p>
      </Card>
    )}
  </div>
</div>
```

### Placeholder Messages

**Left Panel - Services Placeholder:**
- **Heading:** "No Services Available"
- **Message:** "Search by service name or select a profile to view services."
- **Purpose:** Guides users to either search or select a profile
- **Tone:** Helpful and action-oriented

**Right Panel - Instance Details Placeholder:**
- **Heading:** "No Service Selected"
- **Message:** "Select any service to view instances."
- **Purpose:** Simple, direct instruction
- **Tone:** Concise and clear

### Benefits

1. **Search Always Available**: Users can search for services at any time
2. **Clearer Guidance**: Messages explicitly tell users what actions they can take
3. **Dual Path Discovery**: Users can either search or browse via profiles
4. **Simplified Messages**: Shorter, more direct text is easier to scan
5. **Progressive Actions**: Advanced actions (Start/Stop All) appear only when relevant
6. **Consistent Experience**: Search bar presence doesn't change, reducing layout shifts

### User Flow Options

**Option 1 - Profile First:**
1. Select a profile from Profile Selector
2. See filtered service cards in left panel
3. Click a service card
4. View instance details in right panel

**Option 2 - Search First:**
1. Type service name in search bar
2. See matching services (if profile selected) or message to select profile
3. Select profile to see search results
4. Click a service card
5. View instance details in right panel

**Option 3 - Direct Search (when profile selected):**
1. Profile already selected
2. Type in search bar to filter services
3. Click matching service
4. View instance details

### Element Visibility Matrix

| Element | No Profile | Profile Selected | Service Selected |
|---------|-----------|------------------|------------------|
| Services Summary | ✓ | ✓ | ✓ |
| Profile Selector | ✓ | ✓ | ✓ |
| Search Bar | ✓ | ✓ | ✓ |
| Action Buttons | ✗ | ✓ | ✓ |
| Service Cards | ✗ (placeholder) | ✓ | ✓ |
| Instance Details | ✗ (placeholder) | ✗ (placeholder) | ✓ |

### Responsive Behavior

- **Desktop (≥1024px)**: 
  - Search bar and action buttons in same row
  - Two-column layout for services and instances
- **Tablet/Mobile (<1024px)**: 
  - Search and action buttons stack vertically
  - Service cards and instance details stack vertically

### Testing Checklist

- [x] Search bar visible on page load (no profile selected)
- [x] Search bar remains visible after profile selection
- [x] Action buttons hidden when no profile selected
- [x] Action buttons appear after profile selection
- [x] Left placeholder shows "No Services Available" message
- [x] Left placeholder message mentions both search and profile selection
- [x] Right placeholder shows "No Service Selected" message
- [x] Right placeholder message is concise and action-oriented
- [x] Search functionality works regardless of profile selection state
- [x] Layout is consistent and doesn't shift when selecting profiles
- [x] All existing functionality preserved

### Message Comparison

**Before:**
- Left: "No Profile Selected" - "Select a profile above to view services."
- Right: "No Profile Selected" / "No Service Selected" - Long contextual message

**After:**
- Left: "No Services Available" - "Search by service name or select a profile to view services."
- Right: "No Service Selected" - "Select any service to view instances."

**Improvements:**
- ✓ More concise and scannable
- ✓ Emphasizes multiple paths to discovery (search OR profile)
- ✓ Uses active voice ("Search", "Select")
- ✓ Simpler language, easier to understand
- ✓ Right panel message consistent regardless of profile state

## Files Modified

- `src/components/services/ServicesView.tsx`:
  - Removed conditional wrapper from search bar (now always visible)
  - Made action buttons conditional on `activeProfiles.length > 0`
  - Updated left panel placeholder heading to "No Services Available"
  - Updated left panel placeholder message to mention search and profile options
  - Updated right panel placeholder heading to always be "No Service Selected"
  - Updated right panel placeholder message to "Select any service to view instances."
  - Simplified conditional logic for placeholder messages
