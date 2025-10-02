# SISU Soccer Academy Transportation System Design Guidelines

## Design Approach
**Selected Approach:** Reference-Based Design inspired by transportation/logistics applications like Uber, Lyft driver apps, and school management systems like ClassDojo for parent engagement, with SISU Soccer Academy branding.

**Key Design Principles:**
- Safety-first visual hierarchy emphasizing child information
- Clear time-sensitive information display
- Mobile-first responsive design for parent and driver use
- Real-time status indicators with high contrast
- SISU brand identity with teal color scheme

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Brand Primary: 186 37% 44% (SISU teal for trust/professionalism)
- Success Green: 142 76% 36% (available seats, confirmed bookings)
- Warning Orange: 38 92% 50% (limited capacity, alerts)
- Danger Red: 0 84% 60% (full capacity, cancellations)

**Brand Identity:**
- SISU Logo: Displayed in header with teal and gray color scheme
- Typography: Modern, clean sans-serif (Inter) aligned with SISU's professional identity

**Dark Mode:**
- Background: 222 84% 5%
- Surface: 217 33% 17%
- Text Primary: 210 40% 98%
- Primary (SISU Teal): 186 37% 44% (consistent across light and dark modes)

### B. Typography
**Font Families:** Inter (primary), JetBrains Mono (time displays, capacity counters)
- Headings: 600-700 weight
- Body: 400-500 weight
- Time/Numbers: 500-600 weight, tabular numbers

### C. Layout System
**Tailwind Spacing:** Primary units of 2, 4, and 8 (p-2, m-4, h-8, gap-4)
- Card padding: p-4 or p-6 for content cards
- Section spacing: mb-8 between major sections
- Button/form spacing: gap-2 for tight groups, gap-4 for sections

### D. Component Library

**Core Components:**
- Route cards with stop timeline visualization
- Time slot picker with availability indicators
- Driver status toggle with location activation
- Real-time capacity meters (14/14 filled circles)
- Booking confirmation cards with QR codes
- Interactive map component for van tracking

**Navigation:**
- Bottom tab navigation for mobile (Parents/Drivers)
- Sidebar navigation for admin dashboard
- Quick action floating buttons for same-day cancellations

**Forms:**
- Multi-step booking wizard
- Date range picker for monthly scheduling
- Stop selection with visual route map
- Emergency contact quick-access buttons

**Data Displays:**
- Daily manifests with student photos and stop sequences
- Capacity overview with traffic light color system
- Booking history with status badges
- Route timeline with estimated arrival times

**Status Indicators:**
- Live tracking dots (pulsing animation when active)
- Seat availability progress bars
- Route status badges (Not Started, In Progress, Completed)
- Alert notification badges with count indicators

### E. Mobile Optimization
- Large touch targets (min 44px)
- Swipe gestures for calendar navigation
- Pull-to-refresh for real-time updates
- Offline mode indicators for poor connectivity areas

### F. Real-Time Features
- WebSocket connection indicators
- Live capacity updates with smooth number transitions
- GPS tracking activation with clear privacy messaging
- Push notification styling consistent with app theme

## Images
No large hero images needed. Focus on:
- Small student profile photos (circular, 32px-40px)
- Van icons and route illustrations
- Map integration for live tracking
- Simple iconography for stops and time slots

The design emphasizes functionality and safety over decorative elements, with clear information hierarchy and mobile-first interactions suitable for busy parents and drivers.