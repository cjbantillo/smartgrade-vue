# Phase 1: Routing and Layout Architecture

## Overview

This document describes the frontend architecture for SmartGrade's role-based routing and layout system.

## Architecture Principles

### 1. **Role-Based Separation**

Three distinct user roles with isolated navigation and views:

- **Admin**: Full system access, user management, configuration
- **Teacher**: Class management, grade entry, document generation
- **Student**: Read-only access to personal academic records

### 2. **Automatic Routing**

Using `unplugin-vue-router` for file-system based routing:

- Pages in `src/pages/` automatically become routes
- Route metadata defined using `<route>` blocks in .vue files
- Layouts automatically applied via `vite-plugin-vue-layouts-next`

### 3. **Layout System**

Four layouts in `src/layouts/`:

- `default.vue` - Public pages (landing, login)
- `admin.vue` - Administrative interface
- `teacher.vue` - Teacher dashboard and tools
- `student.vue` - Student portal

## File Structure

```
src/
├── types/
│   └── router.ts              # Route metadata type definitions
├── router/
│   └── index.ts              # Router configuration with guards
├── layouts/
│   ├── default.vue           # Public layout
│   ├── admin.vue             # Admin layout
│   ├── teacher.vue           # Teacher layout
│   └── student.vue           # Student layout
├── components/
│   └── layout/
│       ├── AppHeader.vue     # Shared header component
│       ├── NavigationDrawer.vue  # Shared navigation sidebar
│       └── AppFooter.vue     # Shared footer component
└── pages/
    ├── index.vue             # Landing page (default layout)
    ├── admin/
    │   └── index.vue         # Admin dashboard
    ├── teacher/
    │   └── index.vue         # Teacher dashboard
    └── student/
        └── index.vue         # Student dashboard
```

## Route Guards (Placeholder)

### Current Implementation (Phase 1)

Route guards are **placeholder only** - they validate structure but don't enforce real authentication:

```typescript
// Infers role from URL path for development
function getCurrentUserRole(to: RouteLocationNormalized): UserRole | null {
  const path = to.path.toLowerCase();

  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/teacher")) return "teacher";
  if (path.startsWith("/student")) return "student";

  return null;
}
```

### Future Implementation (Phase 2+)

Will check Supabase authentication:

```typescript
// Phase 2: Real authentication
async function getCurrentUserRole(): Promise<UserRole | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  return profile?.role ?? null;
}
```

## Route Metadata

Using TypeScript for type-safe route configuration:

```typescript
export interface RouteMeta {
  layout?: "default" | "admin" | "teacher" | "student";
  requiresRole?: UserRole | UserRole[];
  requiresAuth?: boolean;
  title?: string;
  icon?: string;
  showInNav?: boolean;
  navOrder?: number;
}
```

### Usage in Pages

```vue
<route lang="yaml">
meta:
  layout: admin
  requiresRole: admin
  title: User Management
  icon: mdi-account-group
</route>
```

## Shared Components

### AppHeader.vue

Consistent app bar across all layouts:

- Accepts title, icon, color props
- Placeholder for notifications and user profile
- Emits toggle-drawer event for mobile responsiveness

### NavigationDrawer.vue

Reusable navigation sidebar:

- Accepts navigation items array
- Consistent header with role-specific icon
- Built-in logout handler (placeholder)

### AppFooter.vue

Shared footer with copyright and school information

## Layout Components

All three role-based layouts follow the same structure:

```vue
<template>
  <v-app>
    <NavigationDrawer
      :header-title="title"
      :header-icon="icon"
      :items="navigationItems"
      @logout="handleLogout"
    />

    <AppHeader :title="title" :icon="icon" />

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>

    <AppFooter />
  </v-app>
</template>
```

### Navigation Items

Each layout defines role-specific navigation:

**Admin Navigation:**

- Dashboard
- User Management
- School Years
- Sections & Classes
- Settings

**Teacher Navigation:**

- Dashboard
- My Classes
- Grades
- Certificates
- Documents (SF9/SF10)

**Student Navigation:**

- Dashboard
- My Grades
- Honors & Awards
- Report Cards

## Development Guidelines

### Adding New Routes

1. **Create page file:**

   ```
   src/pages/admin/new-feature.vue
   ```

2. **Define route metadata:**

   ```vue
   <route lang="yaml">
   meta:
     layout: admin
     requiresRole: admin
     title: New Feature
   </route>
   ```

3. **Add to navigation:**
   Update the layout's `navigationItems` array:
   ```typescript
   {
     title: 'New Feature',
     icon: 'mdi-feature-icon',
     to: '/admin/new-feature',
     value: 'new-feature',
   }
   ```

### Layout Selection Rules

- Public pages (landing, login) → `default.vue`
- `/admin/*` → `admin.vue` layout
- `/teacher/*` → `teacher.vue` layout
- `/student/*` → `student.vue` layout

### Route Guard Behavior

**Phase 1 (Current):**

- Logs warnings for unauthorized access
- Allows navigation for development
- No actual authentication required

**Phase 2+ (Future):**

- Will redirect to login if not authenticated
- Will check Supabase session
- Will validate role from `profiles` table
- Will redirect to 403 page for insufficient permissions

## Best Practices

1. **No Business Logic in Layouts**

   - Layouts only handle UI structure
   - Business logic belongs in pages/composables/services

2. **Consistent Navigation**

   - All role layouts use shared components
   - Navigation items follow same structure
   - Icons from Material Design Icons

3. **Type Safety**

   - All route metadata is typed
   - Navigation items use defined interfaces
   - No magic strings

4. **Lazy Loading**

   - Routes automatically code-split by page
   - Layouts loaded on-demand
   - Optimized bundle size

5. **Role Separation**
   - No shared routes between roles
   - Each role has isolated page directory
   - Clear permission boundaries

## What's NOT Included (By Design)

❌ **Supabase Integration** - Added in Phase 2  
❌ **Authentication Logic** - Added in Phase 2  
❌ **Real User Sessions** - Added in Phase 2  
❌ **Grade Business Rules** - Added in later phases  
❌ **Database Queries** - Added in later phases

## Next Steps (Phase 2)

1. Add Supabase authentication
2. Implement real session management
3. Connect to `profiles` table for role validation
4. Add login/logout functionality
5. Implement protected route redirects
6. Add session persistence

## Testing Navigation

During development, you can test all layouts by navigating to:

- `/` - Landing page (default layout)
- `/admin` - Admin dashboard
- `/teacher` - Teacher dashboard
- `/student` - Student dashboard

All layouts are functional and navigable without authentication in Phase 1.
