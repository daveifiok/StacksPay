# StacksPay Dashboard Components

A comprehensive, Stripe-inspired merchant dashboard built with TypeScript, Next.js, and modern UI components. Designed for the hackathon with elegance, modularity, and functionality in mind.

## 🏗️ Architecture

### Layout Structure

- **DashboardLayout.tsx** - Main layout wrapper with responsive sidebar and navbar
- **navigation/** - All navigation components (Sidebar, Navbar, MobileMenu)
- **overview/** - Dashboard home page components
- **[feature]/** - Feature-specific page components

### Key Features

- 📱 **Fully Responsive** - Mobile-first design with collapsible sidebar
- 🎨 **Elegant UI** - Stripe-inspired design with smooth animations
- 📊 **Data Visualization** - Recharts integration for all charts
- 🔒 **Type Safety** - Full TypeScript coverage
- ⚡ **Performance** - Optimized with Framer Motion animations
- 🌙 **Dark Mode** - Complete dark/light theme support

## 📁 Component Structure

```
components/dashboard/
├── DashboardLayout.tsx          # Main layout wrapper
├── README.md                    # Documentation
├── index.ts                     # Export file
├── navigation/
│   ├── Sidebar.tsx             # Main navigation sidebar
│   ├── Navbar.tsx              # Top navigation bar
│   └── MobileMenu.tsx          # Mobile hamburger menu
├── overview/
│   ├── DashboardOverview.tsx   # Home dashboard page
│   ├── MetricCard.tsx          # Reusable metric cards
│   ├── QuickActions.tsx        # Action buttons
│   ├── RecentPayments.tsx      # Recent transactions table
│   └── PaymentChart.tsx        # Revenue chart (Recharts)
├── payments/
│   └── PaymentsPage.tsx        # Payment management
├── analytics/
│   └── AnalyticsPage.tsx       # Analytics & reporting
├── customers/
│   └── CustomersPage.tsx       # Customer management
├── api/
│   └── ApiKeysPage.tsx         # API key management
├── webhooks/
│   └── WebhooksPage.tsx        # Webhook management
└── settings/
    └── SettingsPage.tsx        # Account settings
```

## 🎯 Key Components

### DashboardLayout

The main layout component that wraps all dashboard pages:

- Responsive sidebar with collapse functionality
- Top navigation bar with user profile
- Mobile-optimized with hamburger menu
- Route-based active states

### Navigation Components

- **Sidebar**: Full-featured navigation with icons, labels, and badges
- **Navbar**: Top bar with breadcrumbs, search, and user menu
- **MobileMenu**: Slide-out menu for mobile devices

### Feature Pages

- **Overview**: Metrics, charts, quick actions, recent transactions
- **Payments**: Transaction management with filters and exports
- **Analytics**: Revenue analytics with Recharts visualizations
- **Customers**: Customer relationship management
- **API Keys**: API access management with permissions
- **Webhooks**: Webhook endpoint management and event logs
- **Settings**: Account and business profile settings

## 📊 Chart Integration

All charts use **Recharts** for consistent, performant visualizations:

- Revenue trend charts (AreaChart)
- Payment method distribution (PieChart)
- Transaction volume (BarChart)
- Success rate metrics (LineChart)

## 🎨 Design System

### Colors & Theming

- Primary: Orange/Amber gradient (#f97316 → #fbbf24)
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Error: Red (#ef4444)
- Neutral: Gray scale with dark mode support

### Components Used

- **shadcn/ui** - Core UI components
- **Framer Motion** - Smooth animations
- **Lucide Icons** - Consistent iconography
- **Recharts** - Data visualization

## 🚀 Usage

### Basic Layout

```tsx
import { DashboardLayout } from '@/components/dashboard';

export default function Page() {
  return <DashboardLayout>{/* Your page content */}</DashboardLayout>;
}
```

### Individual Components

```tsx
import { PaymentsPage, AnalyticsPage, CustomersPage } from '@/components/dashboard';
```

## ⚡ Performance Features

- **Lazy Loading**: Components load on demand
- **Memoization**: Expensive calculations cached
- **Virtual Scrolling**: Large data tables optimized
- **Animation Optimization**: GPU-accelerated transforms
- **Bundle Splitting**: Feature-based code splitting

## 🔧 Customization

### Theme Customization

All components respect the global theme configuration in `tailwind.config.ts`:

- Custom colors via CSS variables
- Dark mode toggle support
- Responsive breakpoints

### Component Extension

Components are built with extensibility in mind:

- Props interfaces for customization
- Slot-based composition patterns
- CSS class override support

## 📱 Responsive Design

### Breakpoints

- **Mobile**: < 768px (collapsed sidebar, mobile menu)
- **Tablet**: 768px - 1024px (collapsible sidebar)
- **Desktop**: > 1024px (full sidebar, optimal layout)

### Mobile Optimizations

- Touch-friendly buttons and inputs
- Swipe gestures for navigation
- Optimized table layouts
- Collapsible sections

## 🎯 Hackathon Features

Built specifically for hackathon success:

- **Complete Feature Set**: All essential merchant tools
- **Professional Polish**: Production-ready UI/UX
- **Demo-Ready**: Sample data and interactions
- **Extensible**: Easy to add new features
- **Performant**: Optimized for smooth demos

## 🔮 Future Enhancements

- Real-time data updates via WebSockets
- Advanced filtering and search
- Export functionality for all data
- Mobile app companion
- Multi-tenant support
- Advanced analytics and insights

---

Built with ❤️ for the StacksPay hackathon. Designed to impress judges and users alike!
