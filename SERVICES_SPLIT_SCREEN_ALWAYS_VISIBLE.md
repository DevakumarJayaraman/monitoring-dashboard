# Services Split Screen - Always Visible Update

**Date**: October 4, 2025

## Changes Made

Updated the Services page to always show both the left and right panels in a split-screen layout, with helpful placeholder messages when no service is selected.

### Key Modifications

1. **Always Show Split Screen Layout**
   - Changed from conditional `lg:grid-cols-2` (only when service selected) to always showing `grid-cols-1 lg:grid-cols-2`
   - Both panels are now visible at all times on desktop screens (>1024px)
   - Mobile view still stacks vertically with `grid-cols-1`

2. **Services Panel Always on Left**
   - Service cards are permanently positioned in the left column
   - Maintains consistent visual hierarchy and user flow

3. **Added Placeholder Message**
   - When no service is selected, the right panel shows:
     - "Instance Details" card with muted styling
     - Service icon in a subtle background circle
     - "No Service Selected" heading
     - Contextual message based on profile selection:
       - If "All" profile: "Select a profile from above, then click on a service card to view its instance details."
       - If specific profile(s) selected: "Click on a service card on the left to view its instance details and manage deployments."

4. **Removed "Click to view details" Link**
   - Removed the "Click to view details →" text from service card footers
   - Service cards remain clickable but with cleaner footer showing only instance counts
   - Visual feedback (emerald border/glow) still indicates selected service

### UI/UX Improvements

**Before:**
- Split screen only appeared when a service was clicked
- Right panel was empty/hidden when no selection
- Footer had "Click to view details →" text

**After:**
- Split screen always visible, establishing clear layout expectations
- Right panel shows helpful guidance when empty
- Cleaner service card footers
- Better use of screen real estate
- Users immediately understand the interaction pattern

### Code Structure

```tsx
<div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
  {/* Left Panel - Service Cards (always visible) */}
  <div className="space-y-6">
    {filteredServices.map((service) => (
      <Card {...service} footer={
        // Only shows instance counts, no "click to view" text
      } />
    ))}
  </div>
  
  {/* Right Panel - Instance Details or Placeholder (always visible) */}
  <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
    {selectedService ? (
      <Card /* Instance details with actions */ />
    ) : (
      <Card /* Placeholder with helpful message */ />
    )}
  </div>
</div>
```

### Styling Details

**Placeholder Card:**
- Border: `border-slate-700` (muted)
- Background: `bg-slate-900/50` (subtle)
- Icon color: `text-slate-400` (desaturated)
- Centered content with icon, heading, and description
- Responsive padding: `py-12`

**Service Card Footer:**
- Shows: `{totalInstances} instance(s) · {running} running`
- Removed: "Click to view details →" link
- Maintains: Status indicators and profile badges

### Responsive Behavior

- **Desktop (≥1024px)**: Side-by-side split with `grid-cols-2`
  - Left panel: Service cards with full details
  - Right panel: Sticky positioning (`lg:sticky lg:top-6`)
- **Tablet/Mobile (<1024px)**: Stacked layout with `grid-cols-1`
  - Service cards appear first
  - Instance details/placeholder appears below

### Benefits

1. **Clearer Layout**: Users immediately see the two-panel structure
2. **Better Guidance**: Placeholder message helps users understand interaction flow
3. **Consistent Experience**: No layout shift when selecting/deselecting services
4. **Cleaner Design**: Removed redundant "Click to view details" text
5. **Professional Look**: Always-visible split screen mimics modern dashboard UIs

### Testing Checklist

- [x] Split screen layout visible on page load
- [x] Placeholder message shown when no service selected
- [x] Service cards on left, details/placeholder on right
- [x] "Click to view details" text removed from footers
- [x] Service selection still works (click to view, click again to deselect)
- [x] Responsive behavior maintained (stacks on mobile)
- [x] Contextual placeholder message based on profile selection
- [x] All existing functionality preserved (instance selection, start/stop actions)

## Files Modified

- `src/components/services/ServicesView.tsx`: Updated split-screen layout, added placeholder state, removed footer text
