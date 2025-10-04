# Services View - Default State Update

**Date**: October 4, 2025

## Changes Made

Updated the Services page to start with no profile selected by default, showing only a helpful message card until the user selects a profile.

### Key Modifications

1. **Default Profile State Changed**
   - Changed from: `useState<ServiceProfileKey[]>(["all"])` (showing all services by default)
   - Changed to: `useState<ServiceProfileKey[]>([])` (no profile selected by default)

2. **Conditional Service Cards Display**
   - Service cards (left panel) only render when `activeProfiles.length > 0`
   - When no profile selected, left panel is hidden completely

3. **Conditional Search & Actions Display**
   - Search bar and Start/Stop All buttons only show when `activeProfiles.length > 0`
   - Keeps the UI clean and focused when no profile is selected

4. **Dynamic Grid Layout**
   - When no profile selected: `grid-cols-1` (single column, full width)
   - When profile selected: `grid-cols-1 lg:grid-cols-2` (split-screen on desktop)

5. **Updated Placeholder Messages**
   - Heading changes based on state:
     - No profile: "No Profile Selected"
     - Profile selected but no service: "No Service Selected"
   - Message changes based on state:
     - No profile: "Select a profile above to view services."
     - Profile selected: "Click on a service card on the left to view its instance details and manage deployments."

### UI Flow

**Initial State (No Profile Selected):**
```
┌─────────────────────────────────────┐
│ Services Summary (All profiles)     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Profile Selector                    │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│         [Service Icon]              │
│    No Profile Selected              │
│ Select a profile above to view      │
│         services.                   │
└─────────────────────────────────────┘
```

**After Selecting Profile:**
```
┌─────────────────────────────────────┐
│ Services Summary (Selected profile) │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Profile Selector + Search           │
└─────────────────────────────────────┘
┌──────────────┬──────────────────────┐
│ Service      │    [Service Icon]    │
│ Cards        │  No Service Selected │
│ (Left)       │ Click on a service.. │
└──────────────┴──────────────────────┘
```

**After Selecting Service:**
```
┌─────────────────────────────────────┐
│ Services Summary                    │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Profile Selector + Search + Actions │
└─────────────────────────────────────┘
┌──────────────┬──────────────────────┐
│ Service      │ Instance Details     │
│ Cards        │ (with actions)       │
│ (Left)       │ (Right)              │
└──────────────┴──────────────────────┘
```

### Code Structure

```tsx
export function ServicesView(): JSX.Element {
  // Default to empty array (no profile selected)
  const [activeProfiles, setActiveProfiles] = useState<ServiceProfileKey[]>([]);
  
  return (
    <div className="space-y-6">
      <ServicesSummary {...} />
      <ProfileSelector {...} />
      
      {/* Only show search/actions when profile is selected */}
      {activeProfiles.length > 0 && (
        <div className="space-y-4">
          <SearchBar />
          <ActionButtons />
        </div>
      )}
      
      {/* Dynamic grid: full width when no profile, split when profile selected */}
      <div className={`grid gap-6 ${
        activeProfiles.length === 0 
          ? 'grid-cols-1' 
          : 'grid-cols-1 lg:grid-cols-2'
      }`}>
        {/* Only show service cards when profile is selected */}
        {activeProfiles.length > 0 && (
          <div className="space-y-6">
            {/* Service cards */}
          </div>
        )}
        
        {/* Always show right panel with contextual message */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {selectedService ? (
            <Card /* Instance details */ />
          ) : (
            <Card /* Placeholder with message */ />
          )}
        </div>
      </div>
    </div>
  );
}
```

### Benefits

1. **Cleaner Initial Experience**: Users see a clear call-to-action instead of being overwhelmed with data
2. **Guided Workflow**: The UI explicitly guides users through the selection process
3. **Progressive Disclosure**: Features (search, actions) appear only when relevant
4. **Better Performance**: Don't render service cards until needed
5. **Contextual Messaging**: Messages adapt based on user's current state in the workflow

### User Journey

1. **Page Load**: User sees summary cards and profile selector with prominent placeholder message
2. **Select Profile**: Search bar, action buttons, and service cards appear
3. **Select Service**: Instance details replace placeholder message in right panel
4. **Interact**: User can select instances, start/stop services, etc.

### Testing Checklist

- [x] Page loads with no profile selected by default
- [x] Placeholder shows "No Profile Selected" message
- [x] Service cards hidden initially
- [x] Search bar and action buttons hidden initially
- [x] Layout is single column when no profile selected
- [x] Selecting a profile shows service cards and search/actions
- [x] Layout becomes split-screen after profile selection
- [x] Placeholder message updates to "No Service Selected"
- [x] Clicking service shows instance details
- [x] All existing functionality works after profile selection

## Files Modified

- `src/components/services/ServicesView.tsx`: 
  - Changed default `activeProfiles` state from `["all"]` to `[]`
  - Added conditional rendering for service cards (`{activeProfiles.length > 0 && ...}`)
  - Added conditional rendering for search/actions section
  - Made grid layout dynamic based on profile selection
  - Updated placeholder messages to be contextual
