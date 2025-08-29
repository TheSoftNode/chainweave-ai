# Dashboard Components Organization

This directory contains all dashboard-related components organized into logical folders for better maintainability and scalability.

## Directory Structure

```
dashboard/
├── layout/           # Layout and navigation components
├── overview/         # Dashboard home/overview components
├── creation/         # NFT creation and generation components
├── collection/       # Collection management components
├── analytics/        # Analytics and statistics components
├── activity/         # Activity feeds and notifications
├── wallet/           # Wallet-related components
├── settings/         # Settings and configuration components
└── index.ts          # Main export file for all components
```

## Components by Category

### Layout (`/layout/`)

- `dashboard-header.tsx` - Top navigation bar for dashboard
- `dashboard-layout.tsx` - Main layout wrapper with sidebar and header
- `dashboard-sidebar.tsx` - Collapsible sidebar navigation

### Overview (`/overview/`)

- `stats-cards.tsx` - Dashboard statistics cards
- `quick-actions.tsx` - Quick action buttons and shortcuts
- `recent-activity.tsx` - Recent activity feed for dashboard home

### Creation (`/creation/`)

- `create-nft-form.tsx` - Manual NFT creation form
- `ai-generator-form.tsx` - AI-powered NFT generation form
- `nft-preview.tsx` - NFT preview component
- `generated-gallery.tsx` - Gallery of AI-generated NFTs

### Collection (`/collection/`)

- `collection-filters.tsx` - Filtering controls for collections
- `collection-grid.tsx` - Grid layout for collection items
- `collection-stats.tsx` - Collection statistics and metrics
- `nft-gallery.tsx` - NFT gallery component

### Analytics (`/analytics/`)

- `analytics-overview.tsx` - Main analytics dashboard

### Activity (`/activity/`)

- `activity-feed.tsx` - User activity feed
- `notifications-dropdown.tsx` - Notifications dropdown component

### Wallet (`/wallet/`)

- `wallet-dashboard.tsx` - Main wallet dashboard component

### Settings (`/settings/`)

- `settings-panel.tsx` - User settings and preferences panel

## Usage

### Importing Components

You can import components in several ways:

#### 1. From the main dashboard index (Recommended)

```typescript
import {
  DashboardLayout,
  StatsCards,
  CreateNFTForm,
} from "@/components/dashboard";
```

#### 2. From specific category folders

```typescript
import { DashboardLayout } from "@/components/dashboard/layout";
import { StatsCards } from "@/components/dashboard/overview";
import { CreateNFTForm } from "@/components/dashboard/creation";
```

#### 3. Direct file imports (if needed)

```typescript
import { DashboardLayout } from "@/components/dashboard/layout/dashboard-layout";
```

### Adding New Components

1. **Determine the correct category** for your component
2. **Create the component** in the appropriate folder
3. **Export it** from the folder's `index.ts` file
4. **Update imports** in files that will use the component

### Folder Guidelines

- **Layout**: Components that structure the dashboard layout
- **Overview**: Components for the main dashboard landing page
- **Creation**: Components related to creating or generating NFTs
- **Collection**: Components for managing and displaying collections
- **Analytics**: Components for data visualization and analytics
- **Activity**: Components for activity feeds, notifications, and real-time updates
- **Wallet**: Components related to wallet functionality and management
- **Settings**: Components for user preferences and configuration

## Benefits of This Organization

1. **Better Code Organization**: Related components are grouped together
2. **Easier Navigation**: Developers can quickly find components by functionality
3. **Improved Maintainability**: Changes to related features are localized
4. **Scalability**: Easy to add new components to existing categories
5. **Clean Imports**: Single import statement for multiple related components
6. **Team Collaboration**: Clear structure makes it easier for team members to contribute

## Migration Notes

All existing imports have been updated to use the new structure. The main changes:

- Individual component imports → Grouped imports from `@/components/dashboard`
- Old flat structure → New categorized folder structure
- Added index files for cleaner imports
- Maintained backward compatibility through re-exports
