# Header Component Documentation

A production-ready, responsive header component for Next.js applications with full accessibility support and modern design patterns.

## 🚀 Features

- **Responsive Design**: Mobile-first approach with hamburger menu
- **Sticky Header**: Fixed positioning with backdrop blur effects
- **Accessibility**: Full ARIA support, keyboard navigation, screen reader friendly
- **Dark Theme**: Modern dark design with smooth transitions
- **TypeScript**: Fully typed with comprehensive interfaces
- **Performance**: Optimized with proper event cleanup and focus management

## 📦 Installation

The component is already included in your project. Make sure you have the required dependencies:

```bash
npm install lucide-react
# or
pnpm add lucide-react
```

## 🎯 Usage

### Basic Usage

```tsx
import Header from '@/components/Header';

export default function Layout({ children }) {
  return (
    <div>
      <Header />
      {children}
    </div>
  );
}
```

### With Custom Navigation

```tsx
import Header from '@/components/Header';

const customNav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
];

export default function Layout({ children }) {
  return (
    <div>
      <Header nav={customNav} logoSrc="/custom-logo.png" />
      {children}
    </div>
  );
}
```

## 🔧 Props Interface

```typescript
interface HeaderProps {
  nav?: Array<{ label: string; href: string }>;
  logoSrc?: string;
  isAuthed?: boolean;
  savedCount?: number;
}
```

### Props Description

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `nav` | `Array<{label: string, href: string}>` | `DEFAULT_NAV_ITEMS` | Custom navigation items |
| `logoSrc` | `string` | `'https://trenderai.com/wp-content/uploads/2025/01/logo-new.png'` | Path to logo image |
| `isAuthed` | `boolean` | `false` | Whether user is authenticated |
| `savedCount` | `number` | `0` | Number of saved items for badge display |

### Default Navigation Items

```typescript
const DEFAULT_NAV_ITEMS = [
  { label: 'Explore', href: '/' },
  { label: 'Live', href: '/live' },
  { label: 'Trends', href: '/trends' },
  { label: 'Alerts', href: '/alerts' },
  { label: 'Resources', href: '/resources' },
  { label: 'Blog', href: '/blog' },
];
```

### Saved Feature

When `isAuthed` is `true`, the Header component automatically:

1. **Adds "Saved" Navigation Link**: Inserts "Saved" between "Trends" and "Alerts" in the navigation menu
2. **Shows Bookmark Icon**: Displays a bookmark icon in the header's right section (desktop) or next to hamburger menu (mobile)
3. **Count Badge**: Shows a count badge when `savedCount > 0`
   - Displays actual count for numbers 1-99
   - Shows "99+" for counts over 99
   - Hidden when count is 0

#### Count Badge Styling
- **Position**: `absolute -right-1 -top-1`
- **Background**: Blue-600 (`#2563eb`)
- **Text**: White, extra small font
- **Shape**: Rounded full with minimum width of 18px

## 🎨 Design Features

### Visual Effects

- **Backdrop Blur**: Dynamic blur effect that intensifies on scroll
- **Smooth Transitions**: 300ms ease-in-out transitions for all interactions
- **Hover Effects**: Underline animations for navigation links
- **Focus States**: Blue ring focus indicators for accessibility
- **Logo Size**: 80px × 48px (mobile) / 96px × 56px (desktop) for optimal visibility

### Responsive Breakpoints

- **Mobile**: `< 768px` - Hamburger menu with slide-out panel, optimized logo size
- **Desktop**: `≥ 768px` - Horizontal navigation with action buttons, larger logo

### Color Scheme

- **Background**: `rgba(0, 0, 0, 0.6)` to `rgba(0, 0, 0, 0.8)` on scroll
- **Text**: Gray-300 (`#d1d5db`) to white on hover
- **Accent**: Blue-600 (`#2563eb`) for primary actions
- **Borders**: Gray-800 with 50% opacity

## ♿ Accessibility Features

### ARIA Attributes

- `role="banner"` on header element
- `role="navigation"` on nav elements
- `aria-label` for all interactive elements
- `aria-expanded` for mobile menu button
- `aria-controls` linking button to menu panel

### Keyboard Navigation

- **Tab**: Navigate through all interactive elements
- **Enter/Space**: Activate buttons and links
- **Escape**: Close mobile menu
- **Focus Management**: Returns focus to hamburger button after menu close

### Screen Reader Support

- Descriptive `aria-label` attributes
- Proper heading structure
- Semantic HTML elements
- Hidden decorative elements with `aria-hidden="true"`

## 🔧 Technical Implementation

### State Management

```typescript
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [isScrolled, setIsScrolled] = useState(false);
```

### Event Handlers

- **Scroll Detection**: Updates header background on scroll
- **Body Scroll Lock**: Prevents background scroll when mobile menu is open
- **Outside Click**: Closes mobile menu when clicking outside
- **Escape Key**: Closes mobile menu with keyboard

### Performance Optimizations

- **Event Cleanup**: Proper removal of event listeners
- **Debounced Scroll**: Efficient scroll event handling
- **Conditional Rendering**: Mobile menu only renders when needed
- **Image Optimization**: Next.js Image component with priority loading

## 📱 Mobile Menu Behavior

### Interaction Patterns

1. **Open**: Click hamburger button or press Enter/Space
2. **Close**: 
   - Click hamburger button
   - Click outside menu area
   - Press Escape key
   - Click any navigation link

### Visual States

- **Closed**: Hidden above viewport (`translateY(-100%)`)
- **Open**: Visible with smooth slide-down animation
- **Overlay**: Semi-transparent backdrop with blur effect

### Mobile Optimizations

- **Touch-Friendly**: Larger touch targets (44px minimum)
- **Touch Manipulation**: Optimized for touch interactions
- **Responsive Logo**: Smaller on mobile, larger on desktop
- **Scrollable Menu**: Handles long navigation lists
- **Safe Area Support**: Respects device safe areas

## 🎯 Integration Examples

### Next.js App Router

```tsx
// app/layout.tsx
import Header from '@/components/Header';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
```

### With Authentication and Saved Count

```tsx
// Header with saved feature for authenticated users
<Header 
  isAuthed={true} 
  savedCount={25}
/>
```

### Custom Styling with Saved Feature

```tsx
// Custom header with different styling and saved count
<Header 
  nav={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Settings', href: '/settings' },
  ]}
  logoSrc="/custom-logo.svg"
  isAuthed={true}
  savedCount={150} // Will show "99+"
/>
```

### Conditional Rendering Based on Auth State

```tsx
// Dynamic header based on user authentication
function Layout({ user, savedCount }) {
  return (
    <div>
      <Header 
        isAuthed={!!user}
        savedCount={savedCount || 0}
      />
      <main>{children}</main>
    </div>
  );
}
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Desktop navigation works on all screen sizes
- [ ] Mobile hamburger menu opens and closes properly
- [ ] All links navigate to correct pages
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces elements correctly
- [ ] Scroll effect changes header background
- [ ] Focus indicators are visible
- [ ] Mobile menu prevents body scroll
- [ ] "Saved" link appears only when `isAuthed={true}`
- [ ] "Saved" link is positioned between "Trends" and "Alerts"
- [ ] Bookmark icon appears in header right section (desktop)
- [ ] Bookmark icon appears next to hamburger menu (mobile)
- [ ] Count badge shows correct number (1-99)
- [ ] Count badge shows "99+" for counts over 99
- [ ] Count badge is hidden when `savedCount={0}`
- [ ] Bookmark icon is hidden when `isAuthed={false}`

### Automated Testing

```typescript
// Example test with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/Header';

test('mobile menu toggles on hamburger click', () => {
  render(<Header />);
  
  const hamburgerButton = screen.getByLabelText(/open navigation menu/i);
  fireEvent.click(hamburgerButton);
  
  expect(screen.getByLabelText(/close navigation menu/i)).toBeInTheDocument();
});
```

## 🔄 Vanilla HTML/CSS Alternative

A vanilla HTML/CSS version is provided in `components/Header-vanilla.html` for reference and comparison. This version includes:

- Pure CSS styling without Tailwind
- Vanilla JavaScript for interactions
- Same accessibility features
- Responsive design patterns
- Complete documentation in comments

## 🚀 Performance Considerations

### Bundle Size

- **Component**: ~8KB (minified)
- **Dependencies**: Only `lucide-react` icons
- **Tree Shaking**: Only imports used icons

### Runtime Performance

- **Event Listeners**: Properly cleaned up on unmount
- **State Updates**: Minimal re-renders with proper dependencies
- **DOM Manipulation**: Efficient with useRef hooks
- **Animations**: CSS transitions for smooth performance

## 🐛 Troubleshooting

### Common Issues

1. **Logo not displaying**: Check `logoSrc` path and ensure image exists
2. **Mobile menu not working**: Verify `lucide-react` is installed
3. **Styling conflicts**: Ensure Tailwind CSS is properly configured
4. **Accessibility issues**: Check for proper ARIA attributes

### Debug Mode

Add debug logging by modifying the component:

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

// Add to useEffect hooks
if (DEBUG) {
  console.log('Mobile menu state:', isMobileMenuOpen);
}
```

## 📄 License

This component is part of the TrenderAI project and follows the same licensing terms.

## 🤝 Contributing

When contributing to this component:

1. Maintain accessibility standards
2. Test on multiple devices and screen sizes
3. Ensure TypeScript types are complete
4. Add comprehensive comments for complex logic
5. Update documentation for any new features
