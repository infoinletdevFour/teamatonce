# Landing Page Components - Usage Guide

## Overview
Both the Hero Slider and Timeline/How It Works sections have been extracted from the LandingPage.tsx into reusable components.

## Files Created

### Hero Slider Components

#### 1. **HeroSlider.tsx**
Main hero section component with auto-playing carousel featuring 4 slides.

**Features:**
- Auto-play functionality (5-second interval by default)
- Navigation controls (prev/next buttons)
- Dot indicators for slide position
- Play/pause toggle
- Smooth animations with Framer Motion
- Responsive design
- Animated background gradient orbs

#### 2. **mockups/** (Directory)
Visual mockup components for the hero slider:

- **SearchMockup.tsx** - AI developer search visual
- **DashboardMockup.tsx** - Project management dashboard visual
- **PaymentMockup.tsx** - Milestone payment visual
- **GlobalMockup.tsx** - Global team collaboration visual
- **index.ts** - Mockup exports

#### 3. **landing-data.ts** (in /src/lib)
Data configuration file containing:
- `heroSlides` array with all 4 slides
- Mock data (developers, dashboard columns, milestones, locations)
- TypeScript interfaces
- Gradient class configurations

### How It Works Section Components

#### 4. **HowItWorksSection.tsx**
Main section component that renders the complete "How It Works" timeline section.

#### 5. **TimelineStep.tsx**
Reusable component for individual timeline steps with:
- Alternating left/right layout
- Center circle animations
- Hover effects
- All framer-motion scroll animations

#### 6. **timeline-data.tsx** (in /src/lib)
Data file containing:
- `timelineSteps` array with all 5 steps
- All mockup JSX components
- TypeScript interfaces

## Usage

### Using the Hero Slider

```tsx
// Import the component
import { HeroSlider } from '@/components/landing';

// Use in your landing page
function LandingPage() {
  return (
    <div>
      <HeroSlider autoPlayInterval={5000} />
      {/* Rest of your page */}
    </div>
  );
}
```

**Replace in LandingPage.tsx:**
```tsx
// Replace lines 573-736 (the old hero slider section) with:
<HeroSlider />
```

### Using the How It Works Section

```tsx
// Import the component
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';

// Replace lines 738-828 (the old timeline section) with:
<HowItWorksSection />
```

### Using Individual Mockups

```tsx
import { SearchMockup, DashboardMockup, PaymentMockup, GlobalMockup } from '@/components/landing/mockups';

// Use individually
<SearchMockup />
<DashboardMockup />
<PaymentMockup />
<GlobalMockup />
```

## Features Preserved

### Hero Slider
✅ **Auto-play functionality** - 5-second interval with pause/play control
✅ **Navigation controls** - Previous, next, and dot indicators
✅ **Smooth animations** - Framer Motion slide transitions
✅ **Responsive design** - Mobile, tablet, and desktop layouts
✅ **Visual mockups** - All 4 interactive mockups with animations
✅ **Background animations** - Rotating gradient orbs
✅ **All hover effects** - Scale and shadow transformations

### How It Works Section
✅ **Alternating left/right layout** - Steps alternate between left and right sides
✅ **Center timeline line** - Vertical gradient line in the center
✅ **All animations** - Scroll animations, hover effects, and transitions
✅ **Responsive design** - Mobile, tablet, and desktop layouts
✅ **Visual mockups** - All 5 interactive mockups with animations
✅ **Center circle animations** - Scale and rotate on hover

## Component Props & Interfaces

### HeroSlider Props
```typescript
interface HeroSliderProps {
  autoPlayInterval?: number; // Auto-play interval in milliseconds (default: 5000)
}
```

### HeroSlide Interface
```typescript
interface HeroSlide {
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  visual: 'search' | 'dashboard' | 'payment' | 'global';
  stats: string[];
}
```

### Data Interfaces
```typescript
interface Developer {
  name: string;
  role: string;
  rate: string;
}

interface DashboardColumn {
  status: string;
  color: 'blue' | 'purple' | 'green';
  tasks: string[];
}

interface Milestone {
  milestone: string;
  amount: string;
  status: string;
  color: 'green' | 'blue' | 'gray';
}

interface Location {
  name: string;
  time: string;
  flag: string;
  color: 'red' | 'blue' | 'purple' | 'green';
}
```

### TimelineStep Props
```typescript
interface TimelineStepProps {
  number: string;        // Step number (e.g., "01", "02")
  title: string;         // Step title
  description: string;   // Step description
  icon: LucideIcon;      // Lucide React icon component
  color: string;         // Tailwind gradient classes
  mockup: React.ReactNode; // Visual mockup JSX
  index: number;         // Step index for animations
}
```

## Customization

### Adding/Modifying Hero Slides

Edit `/src/lib/landing-data.ts`:

```typescript
export const heroSlides: HeroSlide[] = [
  {
    title: "Your Custom Title",
    subtitle: "Your Subtitle",
    description: "Your description...",
    gradient: "from-blue-600 via-cyan-500 to-teal-400",
    visual: "search", // or "dashboard", "payment", "global"
    stats: ["Stat 1", "Stat 2", "Stat 3"]
  },
  // ... more slides
];
```

### Creating Custom Mockup Components

1. Create a new mockup in `/src/components/landing/mockups/`
2. Export it from `mockups/index.ts`
3. Update `renderVisual` in `HeroSlider.tsx`:

```typescript
const renderVisual = (type: string) => {
  switch (type) {
    case 'search': return <SearchMockup />;
    case 'dashboard': return <DashboardMockup />;
    case 'payment': return <PaymentMockup />;
    case 'global': return <GlobalMockup />;
    case 'your-new-type': return <YourNewMockup />; // Add this
    default: return null;
  }
};
```

### Customizing Auto-Play

```tsx
// Change interval to 3 seconds
<HeroSlider autoPlayInterval={3000} />

// Disable auto-play by default (modify HeroSlider.tsx)
const [isAutoPlay, setIsAutoPlay] = useState(false);
```

### Modifying Animations

Edit `/src/components/landing/HeroSlider.tsx`:

```typescript
// Change slide transition speed
transition={{ duration: 0.5 }} // Adjust duration

// Modify background orb animations
animate={{
  scale: [1, 1.2, 1],
  rotate: [0, 90, 0],
}}
transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
```

### Adding Timeline Steps

Edit `/src/lib/timeline-data.tsx`:

```tsx
{
  number: "06",
  title: "New Step",
  description: "Description of the new step",
  icon: YourIcon,
  color: "from-blue-500 to-purple-500",
  mockup: (
    <div>Your mockup JSX here</div>
  )
}
```

### Changing Colors

Update gradient classes in `landing-data.ts`:
- `"from-blue-600 via-cyan-500 to-teal-400"`
- `"from-purple-600 via-pink-500 to-rose-400"`
- etc.

## File Structure
```
frontend/
├── src/
│   ├── components/
│   │   └── landing/
│   │       ├── HeroSlider.tsx           # Hero slider component
│   │       ├── mockups/
│   │       │   ├── SearchMockup.tsx     # Search visual
│   │       │   ├── DashboardMockup.tsx  # Dashboard visual
│   │       │   ├── PaymentMockup.tsx    # Payment visual
│   │       │   ├── GlobalMockup.tsx     # Global team visual
│   │       │   └── index.ts             # Mockup exports
│   │       ├── HowItWorksSection.tsx    # Timeline section
│   │       ├── TimelineStep.tsx         # Timeline step component
│   │       ├── index.ts                 # Main exports
│   │       └── README.md                # This file
│   └── lib/
│       ├── landing-data.ts              # Hero slider data
│       └── timeline-data.tsx            # Timeline steps data
```

## Dependencies
- `framer-motion` - Smooth animations and transitions
- `lucide-react` - Icon library
- `react` (18+) - Core library
- `typescript` - Type safety
- Tailwind CSS - Utility-first styling

## Data Configuration

All data is centralized in `/src/lib/landing-data.ts`:

```typescript
// Import data
import {
  heroSlides,
  mockDevelopers,
  mockDashboardColumns,
  mockMilestones,
  mockLocations,
  gradientClasses
} from '@/lib/landing-data';

// Use in your components
heroSlides.map((slide) => ...);
```

## Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations
- Components use proper React hooks and memoization
- Animations respect `prefers-reduced-motion` settings
- Lazy loading compatible
- Server-side rendering (SSR) compatible
- Optimized for Core Web Vitals

## Accessibility
- Semantic HTML structure
- ARIA labels for navigation controls
- Keyboard navigation support
- Screen reader friendly
- Focus management
