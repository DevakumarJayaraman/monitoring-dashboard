# Instance Details - Full Width with Parent Scrollbar

**Date**: October 4, 2025

## Changes Made

Updated the instance details card to display instances at full width (no grid layout) and moved the scrollbar from the instances container to the parent Card component.

### Key Modifications

1. **Instances Now Full Width**
   - Changed from: `grid grid-cols-1 xl:grid-cols-2 gap-3` (2-column grid on large screens)
   - Changed to: `space-y-3` (single column, full width)
   - Each instance card now spans the full width of the parent card

2. **Scrollbar on Parent Card**
   - Removed scrollbar from instances container
   - Added `overflow-y-auto` to Card's `contentClassName`
   - Added `max-h-[calc(100vh-6rem)]` to Card `className`
   - The entire card content now scrolls, not just the instances section

3. **Better Card Height Management**
   - Card wrapper: `lg:max-h-[calc(100vh-3rem)]`
   - Card itself: `flex flex-col max-h-[calc(100vh-6rem)]`
   - Content area: `overflow-y-auto` enables scrolling

### Visual Layout

**Before (2-Column Grid with Scrollbar on Instances):**
```
┌─────────────────────────────────────────────────┐
│ Payment Service - Instance Details    [Close]  │
├─────────────────────────────────────────────────┤
│ [Dev] [Total 5/5]                               │
│                                                 │
│ Instances (5)              [▶ Start] [■ Stop]  │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓│
│ ┃ ┌──────────────┬──────────────┐            ┃│
│ ┃ │ Instance 1   │ Instance 2   │          ║ ┃│ ← Scrollbar here
│ ┃ ├──────────────┼──────────────┤          ║ ┃│
│ ┃ │ Instance 3   │ Instance 4   │          ║ ┃│
│ ┃ └──────────────┴──────────────┘            ┃│
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛│
└─────────────────────────────────────────────────┘
```

**After (Full Width with Scrollbar on Parent Card):**
```
┌─────────────────────────────────────────────────┐
│ Payment Service - Instance Details    [Close]  │
├─────────────────────────────────────────────────┤║ ← Scrollbar here
│ [Dev] [Total 5/5]                              ║│
│                                                ║│
│ Instances (5)              [▶ Start] [■ Stop] ║│
│                                                ║│
│ ┌─────────────────────────────────────────────┐║│
│ │ Instance 1 - Full Width                     │║│
│ └─────────────────────────────────────────────┘║│
│ ┌─────────────────────────────────────────────┐║│
│ │ Instance 2 - Full Width                     │║│
│ └─────────────────────────────────────────────┘║│
│ ┌─────────────────────────────────────────────┐║│
│ │ Instance 3 - Full Width                     │║│
│ └─────────────────────────────────────────────┘║│
└─────────────────────────────────────────────────┘
```

### Code Changes

**Parent Container:**
```tsx
// BEFORE:
<div className="space-y-6 lg:sticky lg:top-6 lg:self-start">

// AFTER:
<div className="space-y-6 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)]">
```

**Card Component:**
```tsx
// BEFORE:
<Card
  title={`${selectedService.name} - Instance Details`}
  className="border-emerald-400/70 bg-emerald-950/30 shadow-lg shadow-emerald-400/10"
  contentClassName="space-y-6 text-slate-200"
>

// AFTER:
<Card
  title={`${selectedService.name} - Instance Details`}
  className="border-emerald-400/70 bg-emerald-950/30 shadow-lg shadow-emerald-400/10 flex flex-col max-h-[calc(100vh-6rem)]"
  contentClassName="space-y-4 text-slate-200 overflow-y-auto"
>
```

**Instances Container:**
```tsx
// BEFORE: Grid layout with scrollbar
<div className="grid grid-cols-1 xl:grid-cols-2 gap-3 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
  {selectedService.instances.map((instance) => (
    // instance content
  ))}
</div>

// AFTER: Full width without scrollbar
<div className="space-y-3">
  {selectedService.instances.map((instance) => (
    // instance content - now full width
  ))}
</div>
```

### Height and Scroll Configuration

**Container Hierarchy:**
```
<div lg:max-h-[calc(100vh-3rem)]>              ← Wrapper with max height
  <Card 
    className="flex flex-col max-h-[calc(100vh-6rem)]"  ← Card with flex + max height
    contentClassName="overflow-y-auto"          ← Content with scroll
  >
    <div space-y-3>                             ← Instances (no scroll)
      <Instance /> (full width)
      <Instance /> (full width)
      ...
    </div>
  </Card>
</div>
```

**Height Calculations:**
- Wrapper: `calc(100vh - 3rem)` = viewport height - 48px (top margin/padding)
- Card: `calc(100vh - 6rem)` = viewport height - 96px (additional space for card chrome)
- Content: Scrolls when content exceeds card height

### Benefits

1. **Unified Scrolling**: Entire card content scrolls together (badges, buttons, instances)
2. **Full Width Instances**: Each instance uses available horizontal space
3. **Better Readability**: Wider instance cards are easier to read
4. **Cleaner Layout**: Single column is simpler and more consistent
5. **Flexible Height**: Card adapts to viewport height
6. **Better Mobile Experience**: Full width works better on narrow screens
7. **Consistent Scrollbar Position**: Scrollbar at card edge, not nested inside

### Responsive Behavior

- **Mobile/Tablet**: Full width instances (same as before)
- **Desktop**: Full width instances (changed from 2-column grid)
- **All Screens**: Scrollbar on parent card enables smooth scrolling of all content

### What Changed

**Layout:**
- ❌ Removed: 2-column grid on large screens (`xl:grid-cols-2`)
- ✓ Now: Single column full width (`space-y-3`)

**Scrolling:**
- ❌ Removed: Scrollbar on instances container (`overflow-y-auto pr-2` on instances div)
- ✓ Now: Scrollbar on Card content (`overflow-y-auto` on `contentClassName`)

**Height:**
- ❌ Removed: Fixed max height on instances (`max-h-[calc(100vh-20rem)]`)
- ✓ Now: Dynamic height on Card (`max-h-[calc(100vh-6rem)]`) with wrapper constraint

**Spacing:**
- Changed: `space-y-6` → `space-y-4` (more compact)

### What Was Preserved

- ✓ Instance card styling and content
- ✓ Selection functionality (checkbox behavior)
- ✓ Action buttons (Start/Stop/Clear)
- ✓ Hover and selected states
- ✓ Status badges and indicators
- ✓ Logs and Metrics links
- ✓ Keyboard accessibility
- ✓ Sticky positioning on desktop

### Visual Comparison

**Instance Card Width:**
- **Before**: ~50% width (2 columns) on XL screens (≥1280px)
- **After**: 100% width on all screens

**Visible Instances:**
- **Before**: ~10-12 instances (2 columns × 5-6 rows)
- **After**: ~8-10 instances (single column with better height utilization)

**Scrolling:**
- **Before**: Only instances section scrolled (nested scrollbar)
- **After**: Entire card content scrolls (unified experience)

### Testing Checklist

- [x] Instances display at full width
- [x] No grid layout on any screen size
- [x] Scrollbar appears on parent card when content overflows
- [x] Scrollbar NOT on instances container
- [x] Badges and buttons scroll with content
- [x] Card respects viewport height limits
- [x] Sticky positioning still works on desktop
- [x] Selection functionality works
- [x] All buttons and links functional
- [x] No horizontal overflow
- [x] Smooth scrolling behavior
- [x] Works on all screen sizes

### User Experience

**Before:**
- Instances in 2-column grid on large screens
- Nested scrollbar only for instances section
- Limited instance card width

**After:**
- Instances in single column, full width
- Parent card scrolls all content together
- Better use of available horizontal space
- More cohesive scrolling experience

## Files Modified

- `src/components/services/ServicesView.tsx`:
  - Updated parent container: Added `lg:max-h-[calc(100vh-3rem)]`
  - Updated Card `className`: Added `flex flex-col max-h-[calc(100vh-6rem)]`
  - Updated Card `contentClassName`: Changed to `space-y-4 text-slate-200 overflow-y-auto`
  - Updated instances container: Changed from `grid grid-cols-1 xl:grid-cols-2 gap-3 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2` to `space-y-3`
  - Removed grid layout, scrollbar, and padding from instances container
  - Instances now display full width in single column with parent-level scrolling
