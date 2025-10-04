# Services View - Split Screen Update

## Changes Made

### ✅ New Split-Screen Layout

The Services page now features a **side-by-side split-screen layout**:

- **Left Side**: Service cards (clickable)
- **Right Side**: Instance details panel (appears when a service is selected)

### Key Features

1. **Click to View Details**
   - Click any service card to view its instances on the right side
   - The selected service card is highlighted with emerald border and glow effect
   - Click again to deselect and hide the details panel

2. **Responsive Layout**
   - On large screens (lg+): Side-by-side 2-column layout
   - On smaller screens: Stacked layout
   - Right panel is sticky on large screens (stays visible while scrolling)

3. **Instance Management**
   - Select/deselect individual instances in the right panel
   - Start/Stop selected instances with action buttons
   - Checkbox-style interaction with visual feedback

4. **Visual Improvements**
   - Selected service card: Emerald glow with ring effect
   - Right panel: Sticky positioning for better UX
   - Smooth transitions and hover effects
   - Scrollable instance list with max-height constraint

### UI Changes

#### Service Cards (Left)
- Added `onClick` handler to select service
- Changed "Expand/Collapse" button to "View Details/Selected"
- Footer now shows total instances and running count
- Added "Click to view details →" hint when not selected

#### Instance Details Panel (Right)
- Shows only when a service is selected
- Displays service name, summary, and profile badges
- Lists all instances with select/deselect functionality
- Action buttons for start/stop operations
- Close button to hide the panel
- Scrollable list with visual indicators

### Code Changes

1. **State Management**
   - Removed `expandedServices` state (no longer needed)
   - Added `selectedServiceKey` to track the currently selected service
   - Simplified `toggleServiceExpanded` to just toggle selection

2. **Layout Structure**
   ```tsx
   <div className="grid grid-cols-1 lg:grid-cols-2">
     <div>Service Cards</div>
     {selectedService && <div>Instance Details</div>}
   </div>
   ```

3. **Styling**
   - Service cards are now clickable with cursor-pointer
   - Selected card gets emerald border with shadow and ring
   - Right panel is sticky with `lg:sticky lg:top-6`

### User Experience

**Before**: 
- Click "Expand" to show instances inline
- All instances shown in a grid below the service card
- Had to scroll past all instances to see next service

**After**:
- Click anywhere on the service card to view details
- Instances appear in a dedicated right-side panel
- Can quickly switch between services without scrolling
- Better use of screen space on large monitors

### Responsive Behavior

- **Desktop (>1024px)**: 2-column split layout
- **Tablet/Mobile**: Single column, details below
- **Right panel**: Scrollable with max height to prevent overflow

---

## Testing

To test the new split-screen layout:

1. Navigate to the Services tab
2. Click on any service card
3. See the instance details appear on the right
4. Select instances and try Start/Stop actions
5. Click another service to switch views
6. Click "Close" or the same service to hide details

---

**Status**: ✅ Split-screen layout implemented successfully!
