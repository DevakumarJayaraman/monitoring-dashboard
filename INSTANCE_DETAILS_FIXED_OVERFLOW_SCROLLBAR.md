# Instance Details - Fixed Overflow with Vertical Scrollbar

**Date**: October 4, 2025

## Issue Fixed

Fixed the overflow issue in the instance details card by properly implementing vertical scrolling on the instances container instead of the parent Card component.

### Problem

The previous implementation tried to add `flex flex-col`, `max-h`, and `overflow-y-auto` to the Card component's `className` and `contentClassName`, but the Card component structure doesn't support internal scrolling because:
- The Card wraps content in an `<article>` tag with its own structure
- The `contentClassName` is applied to a nested `<div>` that doesn't control the overall layout
- Flex and max-height on the Card's root don't propagate to create a scrollable content area

This caused instances to overflow without a scrollbar appearing.

### Solution

Moved the scrolling functionality to the instances container where it can be properly controlled:
1. Removed `flex flex-col max-h-[calc(100vh-6rem)]` from Card `className`
2. Removed `overflow-y-auto` from Card `contentClassName`
3. Added `max-h-[calc(100vh-28rem)] overflow-y-auto pr-2` to the instances container

### Code Changes

**Card Component:**
```tsx
// BEFORE (Didn't work):
<Card
  className="border-emerald-400/70 bg-emerald-950/30 shadow-lg shadow-emerald-400/10 flex flex-col max-h-[calc(100vh-6rem)]"
  contentClassName="space-y-4 text-slate-200 overflow-y-auto"
>

// AFTER (Works correctly):
<Card
  className="border-emerald-400/70 bg-emerald-950/30 shadow-lg shadow-emerald-400/10"
  contentClassName="space-y-4 text-slate-200"
>
```

**Instances Container:**
```tsx
// BEFORE (No scrollbar):
<div className="space-y-3">
  {selectedService.instances.map((instance) => (
    // instance content
  ))}
</div>

// AFTER (With scrollbar):
<div className="space-y-3 max-h-[calc(100vh-28rem)] overflow-y-auto pr-2">
  {selectedService.instances.map((instance) => (
    // instance content
  ))}
</div>
```

### Implementation Details

**Container Hierarchy:**
```
<div lg:max-h-[calc(100vh-3rem)]>                    ← Wrapper (constrains max height)
  <Card 
    className="..."                                   ← Card (no special height/flex)
    contentClassName="space-y-4 text-slate-200"      ← Content (no overflow)
  >
    <div space-y-4>                                   ← Content wrapper
      <div>Badges</div>                               ← Always visible
      <div>                                           ← Section wrapper
        <div>Instances header + buttons</div>         ← Always visible
        <div 
          className="space-y-3                        ← Instances container
                     max-h-[calc(100vh-28rem)]        ← Max height
                     overflow-y-auto                  ← Scroll when needed
                     pr-2"                            ← Padding for scrollbar
        >
          {instances}                                 ← Scrollable content
        </div>
      </div>
    </div>
  </Card>
</div>
```

**Height Calculation:**
- `calc(100vh - 28rem)` = viewport height - 448px
- This accounts for:
  - Top margin/padding: ~48px
  - Card header (title + icon + close button): ~80px
  - Card padding: ~48px
  - Badges section: ~40px
  - Instances header + buttons: ~48px
  - Card bottom padding: ~48px
  - Additional spacing: ~136px
- **Total**: ~448px (28rem)

### Visual Result

**Before (Overflow Issue):**
```
┌─────────────────────────────────────────────────┐
│ Payment Service - Instance Details    [Close]  │
├─────────────────────────────────────────────────┤
│ [Dev] [Total 5/5]                               │
│                                                 │
│ Instances (5)              [▶ Start] [■ Stop]  │
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ Instance 1                                  ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ Instance 2                                  ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ Instance 3                                  ││  ← Overflows!
  │ Instance 4                                  │   (No scrollbar)
  │ Instance 5                                  │
```

**After (Fixed with Scrollbar):**
```
┌─────────────────────────────────────────────────┐
│ Payment Service - Instance Details    [Close]  │
├─────────────────────────────────────────────────┤
│ [Dev] [Total 5/5]                               │
│                                                 │
│ Instances (5)              [▶ Start] [■ Stop]  │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓│
│ ┃ ┌─────────────────────────────────────────┐┃║│ ← Scrollbar!
│ ┃ │ Instance 1                              │┃║│
│ ┃ └─────────────────────────────────────────┘┃║│
│ ┃ ┌─────────────────────────────────────────┐┃║│
│ ┃ │ Instance 2                              │┃║│
│ ┃ └─────────────────────────────────────────┘┃║│
│ ┃ ┌─────────────────────────────────────────┐┃║│
│ ┗━│ Instance 3                              │┛║│
└───│ (scroll to see more)                      ║─┘
    └──────────────────────────────────────────────┘
```

### Features

✓ **Vertical Scrollbar**: Appears when instances overflow
✓ **Fixed Height**: Container has max-height to prevent overflow
✓ **Padding for Scrollbar**: `pr-2` adds right padding so content doesn't touch scrollbar
✓ **Smooth Scrolling**: Native browser scrolling behavior
✓ **Full Width Instances**: Each instance spans full available width
✓ **Always Visible Header**: Badges and instance header/buttons remain visible when scrolling
✓ **Responsive**: Works on all screen sizes

### Benefits

1. **No Overflow**: Content stays within card boundaries
2. **Scrollable**: Users can scroll through all instances
3. **Clean UI**: Scrollbar is properly positioned and styled
4. **Better UX**: Headers and action buttons always visible
5. **Proper Height Management**: Uses available viewport space efficiently
6. **Works with Card Component**: Doesn't fight against Card's internal structure

### Testing Checklist

- [x] Instances container has vertical scrollbar when content overflows
- [x] Scrollbar appears on the right side with proper padding
- [x] Instances display at full width
- [x] Badges section always visible (doesn't scroll)
- [x] Instances header and action buttons always visible (doesn't scroll)
- [x] Only instance cards scroll
- [x] No content overflow outside card boundaries
- [x] Works on different viewport heights
- [x] Responsive on all screen sizes
- [x] Smooth scrolling behavior
- [x] Selection and actions still work correctly

### Why Previous Approach Failed

The previous attempt to add `overflow-y-auto` to the Card's `contentClassName` didn't work because:

1. **Card Structure**: The Card component applies `contentClassName` to a nested `<div>` inside the article structure
2. **No Height Constraint**: The content div doesn't have a height constraint to trigger overflow
3. **Flex Layout**: Adding `flex flex-col` to the Card's root `className` doesn't affect the internal layout structure
4. **Max Height Location**: `max-h` on the Card's root doesn't create a scrollable area for the nested content

### Correct Approach

Place overflow control directly on the container that needs to scroll:
- ✓ Apply `max-h` to the instances container
- ✓ Apply `overflow-y-auto` to the instances container
- ✓ Add `pr-2` for scrollbar padding
- ✓ Let the Card component handle its own layout naturally

## Files Modified

- `src/components/services/ServicesView.tsx`:
  - Removed `flex flex-col max-h-[calc(100vh-6rem)]` from Card `className`
  - Removed `overflow-y-auto` from Card `contentClassName`
  - Added `max-h-[calc(100vh-28rem)] overflow-y-auto pr-2` to instances container `className`
  - Instances now scroll properly within the card without overflowing
