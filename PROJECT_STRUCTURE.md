# SmartGrade Project Structure

**Complete directory structure and file organization for the SmartGrade application**

## 📁 Root Directory

```
smartgrade-vue/
├── .env                           # Environment variables (git-ignored)
├── .env.example                   # Environment template
├── .github/
│   └── copilot-instructions.md   # AI assistant development guidelines
├── .vscode/                       # VSCode settings (optional)
├── docs/                          # Project documentation
├── public/                        # Static public assets
├── src/                           # Application source code
├── .gitignore                     # Git ignore rules
├── eslint.config.js              # ESLint configuration
├── index.html                     # HTML entry point
├── package.json                   # NPM dependencies and scripts
├── PROJECT_STRUCTURE.md          # This file
├── README.md                      # Main project documentation
├── MISSING_IMPLEMENTATIONS.md    # Tracking incomplete features
├── step-one-process.md           # Initial development guidelines
├── step-one-policy-adjustments.md # DepEd-specific rules
├── smartgrade_db_upgrade_supabase.sql # Database schema
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript base config
├── tsconfig.app.json             # TypeScript app config
├── tsconfig.node.json            # TypeScript node config
└── vite.config.mts               # Vite build configuration
```

## 📂 Source Directory (`/src`)

### Main Entry Files

```
src/
├── App.vue                 # Root Vue component
├── main.ts                 # Application entry point
├── auto-imports.d.ts      # Auto-generated imports (Vite)
├── components.d.ts        # Auto-generated component types
└── typed-router.d.ts      # Auto-generated router types
```

### Assets (`/src/assets`)

```
src/assets/
└── (images, fonts, static resources)
```

### Components (`/src/components`)

```
src/components/
├── README.md                          # Components documentation
├── AppFooter.vue                      # Global footer component
├── HelloWorld.vue                     # Demo component (can be removed)
├── CertificateTemplate.vue           # Certificate document template
├── layout/                            # Layout-specific components
│   ├── AppHeader.vue                 # Application header with user info
│   └── NavigationDrawer.vue          # Side navigation drawer
└── documents/                         # Document templates
    ├── SF9Template.vue               # School Form 9 template
    └── SF10Template.vue              # School Form 10 template
```

### Layouts (`/src/layouts`)

```
src/layouts/
├── README.md              # Layouts documentation
├── default.vue           # Public/unauthenticated layout
├── admin.vue             # Admin dashboard layout
├── teacher.vue           # Teacher dashboard layout
└── student.vue           # Student dashboard layout
```

### Pages (`/src/pages`)

File-based routing structure:

```
src/pages/
├── README.md                                  # Pages documentation
├── index.vue                                 # Home/landing page
├── login.vue                                 # Login page
├── verify.vue                                # Certificate verification (search)
├── test-supabase.vue                        # Supabase connection test
├── verify/
│   └── [id].vue                             # Certificate verification detail
├── admin/                                    # Admin section
│   ├── index.vue                            # Admin dashboard
│   ├── teachers.vue                         # Teacher management
│   ├── audit-logs.vue                       # System audit logs
│   └── unlock-requests.vue                  # Grade unlock requests
├── teacher/                                  # Teacher section
│   ├── index.vue                            # Teacher dashboard
│   ├── classes.vue                          # Class list
│   ├── classes/
│   │   ├── [id].vue                        # Class detail
│   │   └── [id]/
│   │       └── grades.vue                  # Grade entry interface
│   ├── certificates/
│   │   ├── index.vue                       # Certificate generation
│   │   └── [studentId]/
│   │       └── [schoolYearId].vue         # Student certificate detail
│   └── documents/
│       ├── sf9/
│       │   └── [studentId]/
│       │       └── [schoolYearId].vue     # SF9 generation
│       └── sf10/
│           └── [studentId].vue            # SF10 generation
└── student/                                  # Student section
    ├── index.vue                            # Student dashboard
    ├── grades.vue                           # View grades
    ├── documents.vue                        # View documents (SF9/SF10)
    └── certificates.vue                     # View certificates
```

### Plugins (`/src/plugins`)

```
src/plugins/
├── README.md         # Plugins documentation
├── index.ts          # Plugin aggregator
└── vuetify.ts        # Vuetify configuration
```

### Router (`/src/router`)

```
src/router/
└── index.ts          # Router configuration and guards
```

### Services (`/src/services`)

```
src/services/
└── supabase.ts       # Supabase client initialization
```

### Stores (`/src/stores`)

```
src/stores/
├── README.md         # Stores documentation
├── index.ts          # Store exports
├── app.ts            # Global app state
└── auth.ts           # Authentication state
```

### Styles (`/src/styles`)

```
src/styles/
├── README.md         # Styles documentation
├── main.css          # Global Tailwind styles
└── settings.scss     # Vuetify SASS variables
```

### Types (`/src/types`)

```
src/types/
├── auth.ts           # Authentication types
├── router.ts         # Router types
└── (other type definitions)
```

### Composables (`/src/composables`)

```
src/composables/
├── useAuth.ts            # Authentication logic
├── useProfile.ts         # User profile management
├── useTeacher.ts         # Teacher-specific operations
├── useStudent.ts         # Student-specific operations
├── useGrades.ts          # Grade management
├── useCertificates.ts    # Certificate generation
└── useDocuments.ts       # Document (SF9/SF10) generation
```

## 🔄 Auto-Generated Files

These files are automatically generated and should not be manually edited:

- `src/auto-imports.d.ts` - Generated by unplugin-auto-import
- `src/components.d.ts` - Generated by unplugin-vue-components
- `src/typed-router.d.ts` - Generated by unplugin-vue-router
- `node_modules/` - NPM dependencies
- `dist/` - Production build output

## 📦 Key Dependencies

### Production Dependencies

- **Vue 3** - Progressive JavaScript framework
- **Vue Router** - Official routing library
- **Pinia** - State management
- **Vuetify 3** - Material Design component framework
- **@supabase/supabase-js** - Supabase client
- **@mdi/font** - Material Design Icons
- **html2pdf.js** - PDF generation
- **qrcode** - QR code generation

### Development Dependencies

- **TypeScript** - Type safety
- **Vite** - Build tool
- **ESLint** - Code linting
- **Tailwind CSS** - Utility-first CSS
- **unplugin-auto-import** - Auto-import APIs
- **unplugin-vue-components** - Auto-import components
- **unplugin-vue-router** - File-based routing

## 🎯 Routing Patterns

### Public Routes (No Auth Required)

- `/` - Home/landing page
- `/login` - Login page
- `/verify` - Certificate verification search
- `/verify/:id` - Certificate verification detail

### Protected Routes (Auth Required)

#### Admin Routes (`/admin/*`)

- `/admin` - Admin dashboard
- `/admin/teachers` - Teacher management
- `/admin/audit-logs` - System audit logs
- `/admin/unlock-requests` - Grade unlock requests

#### Teacher Routes (`/teacher/*`)

- `/teacher` - Teacher dashboard
- `/teacher/classes` - Class list
- `/teacher/classes/:id` - Class detail
- `/teacher/classes/:id/grades` - Grade entry
- `/teacher/certificates` - Certificate generation
- `/teacher/certificates/:studentId/:schoolYearId` - Student certificate
- `/teacher/documents/sf9/:studentId/:schoolYearId` - SF9 generation
- `/teacher/documents/sf10/:studentId` - SF10 generation

#### Student Routes (`/student/*`)

- `/student` - Student dashboard
- `/student/grades` - View grades
- `/student/documents` - View documents
- `/student/certificates` - View certificates

## 🔐 Role-Based Access

Each layout enforces role-based access:

- **default.vue** - Public access (no auth required)
- **admin.vue** - Admin role only
- **teacher.vue** - Teacher role only
- **student.vue** - Student role only

## 📊 State Management

### Global Stores

- **app** - Application-wide state (drawer, theme, etc.)
- **auth** - Authentication state (user, session, profile, role)

### Composable Logic

- Authentication and user management
- Grade computation and finalization
- Document generation (SF9, SF10, Certificates)
- Teacher operations (classes, students, enrollments)
- Student operations (grades, documents, certificates)

## 🎨 Styling Strategy

- **Vuetify 3** - Primary component library (Material Design)
- **Tailwind CSS** - Utility classes for custom styling
- **SCSS** - Vuetify theme customization (`settings.scss`)
- **Global CSS** - Base styles in `main.css`

## 📝 Naming Conventions

### Files

- **Components**: PascalCase (`AppHeader.vue`, `NavigationDrawer.vue`)
- **Pages**: kebab-case (`index.vue`, `audit-logs.vue`)
- **Composables**: camelCase with 'use' prefix (`useAuth.ts`, `useGrades.ts`)
- **Types**: camelCase (`auth.ts`, `router.ts`)
- **Stores**: camelCase (`auth.ts`, `app.ts`)

### Code

- **Variables/Functions**: camelCase (`fetchGrades`, `studentData`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `GradeRecord`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_GRADE`, `DEFAULT_SECTION`)
- **Components**: PascalCase in templates (`<AppHeader />`, `<NavigationDrawer />`)

## 🔧 Configuration Files

### TypeScript (`tsconfig.*.json`)

- **tsconfig.json** - Base configuration
- **tsconfig.app.json** - Application code config
- **tsconfig.node.json** - Build tool config

### Build (`vite.config.mts`)

- Vite configuration
- Plugin setup (auto-import, vue-router, components)
- Path aliases (`@/*` → `src/*`)
- Build optimizations

### Linting (`eslint.config.js`)

- ESLint rules
- Vue/TypeScript specific rules
- Code style enforcement

### Styling (`tailwind.config.ts`)

- Tailwind configuration
- Custom theme extensions
- Vuetify integration

## 📚 Documentation Files

- **README.md** - Main project documentation
- **PROJECT_STRUCTURE.md** - This file (structure overview)
- **MISSING_IMPLEMENTATIONS.md** - Incomplete features tracker
- **step-one-process.md** - Development guidelines
- **step-one-policy-adjustments.md** - DepEd-specific rules
- **docs/phase-\*.md** - Phase-specific documentation
- **Component READMEs** - Per-directory documentation

## 🗄️ Database Schema

Database schema defined in `smartgrade_db_upgrade_supabase.sql`:

### Core Tables

- **profiles** - User profiles (admin, teacher, student)
- **students** - Student records
- **teachers** - Teacher records (linked to profiles)
- **school_years** - Academic years
- **subjects** - Subject definitions
- **class_assignments** - Teacher class assignments
- **class_enrollments** - Student enrollments in classes
- **grading_periods** - Grading period definitions
- **grades** - Individual grade records
- **grade_finalization** - Grade lock status
- **certificates** - Generated certificates
- **sf9_records** - SF9 document records
- **sf10_records** - SF10 document records
- **audit_logs** - System audit trail

### Metadata Tables

- **document_metadata** - Document customization data
- **honors_awards** - Honors computation results
- **unlock_requests** - Grade unlock requests

## 🚀 Development Workflow

1. **Install dependencies**: `npm install`
2. **Start dev server**: `npm run dev`
3. **Type check**: `npm run type-check`
4. **Lint code**: `npm run lint`
5. **Build for production**: `npm run build`
6. **Preview build**: `npm run preview`

## 📦 Build Output

Production build creates:

```
dist/
├── index.html           # Entry HTML
├── assets/              # Bundled CSS, JS, images
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── (other assets)
└── (other static files)
```

## 🔍 Key Features Location

| Feature                | Location                                           |
| ---------------------- | -------------------------------------------------- |
| Authentication         | `src/composables/useAuth.ts`, `src/stores/auth.ts` |
| Role Guards            | `src/router/index.ts`                              |
| Grade Entry            | `src/pages/teacher/classes/[id]/grades.vue`        |
| Grade Computation      | `src/composables/useGrades.ts`                     |
| Certificate Generation | `src/composables/useCertificates.ts`               |
| SF9 Template           | `src/components/documents/SF9Template.vue`         |
| SF10 Template          | `src/components/documents/SF10Template.vue`        |
| User Management        | `src/pages/admin/teachers.vue`                     |
| Audit Logging          | `src/pages/admin/audit-logs.vue`                   |
| Public Verification    | `src/pages/verify/[id].vue`                        |
