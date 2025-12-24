# SmartGrade - Automated Grading System

**Automated Grading System for Ampayon National High School - Senior High School**

A modern, role-based academic management system built with Vue 3, TypeScript, Vuetify, and Supabase.

---

## 🎯 Project Overview

SmartGrade is a comprehensive grading and academic management system designed specifically for DepEd Senior High School requirements, including:

- ✅ Automated grade computation and finalization
- ✅ SF9/SF10 document generation
- ✅ Honors and awards computation (With Honors, High Honors, Highest Honors)
- ✅ Role-based access control (Admin, Teacher, Student)
- ✅ Email-only authentication (@deped.gov.ph)
- ✅ Certificate generation with QR verification
- ✅ Audit logging and unlock request system

---

## 📚 Documentation

### Core Documentation

- **[Project Structure](./PROJECT_STRUCTURE.md)** - Complete directory structure and file organization
- **[Missing Implementations](./MISSING_IMPLEMENTATIONS.md)** - Tracking incomplete features and known issues
- **[Step One Process](./step-one-process.md)** - Initial development guidelines
- **[Policy Adjustments](./step-one-policy-adjustments.md)** - DepEd-specific rules

### Phase Documentation

- **[Phase 1: Architecture](./docs/phase-1-architecture.md)** - Routing and layout system
- **[Phase 2: Supabase Setup](./docs/phase-2-supabase-setup.md)** - Backend connection configuration
- **[Phase 3: Authentication](./docs/phase-3-authentication.md)** - Email-only auth with @deped.gov.ph validation

### Additional Resources

- **[Database Schema](./smartgrade_db_upgrade_supabase.sql)** - Complete PostgreSQL schema
- **[Copilot Instructions](./.github/copilot-instructions.md)** - AI-assisted development guidelines

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Vue 3 (Composition API) + TypeScript
- **UI Framework**: Vuetify 3 + Tailwind CSS
- **State Management**: Pinia
- **Backend**: Supabase (PostgreSQL + Auth)
- **Build Tool**: Vite

### Role-Based Access

- **Admin**: Full system access, user management, school configuration
- **Teacher**: Class management, grade entry, document generation
- **Student**: Read-only access to personal academic records

## 💿 Install

Set up your project using your preferred package manager:

| Package Manager                                           | Command        |
| --------------------------------------------------------- | -------------- |
| [yarn](https://yarnpkg.com/getting-started)               | `yarn install` |
| [npm](https://docs.npmjs.com/cli/v7/commands/npm-install) | `npm install`  |
| [pnpm](https://pnpm.io/installation)                      | `pnpm install` |
| [bun](https://bun.sh/#getting-started)                    | `bun install`  |

After completing the installation, your environment is ready for Vuetify development.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

Copy the environment template and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase project details:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

See [Phase 2 Supabase Setup](./docs/phase-2-supabase-setup.md) for detailed instructions.

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 💡 Available Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start development server with hot-reload |
| `npm run build`      | Build for production                     |
| `npm run preview`    | Preview production build locally         |
| `npm run type-check` | Run TypeScript type checking             |
| `npm run lint`       | Run ESLint and auto-fix issues           |

## ✨ Features

### Core Features

- 🔐 **Secure Authentication**: Email-only auth with @deped.gov.ph domain validation
- 🎭 **Role-Based Access**: Separate interfaces for Admin, Teacher, and Student
- 📊 **Grade Management**: Grade entry, computation, and finalization
- 📄 **Document Generation**: SF9, SF10, and certificate templates
- 🏆 **Honors Computation**: Automatic honors designation (With/High/Highest Honors)
- ✅ **Certificate Verification**: Public QR-based certificate verification
- 📝 **Audit Logging**: Complete audit trail for all critical operations
- 🔓 **Unlock Requests**: Workflow for unlocking finalized grades

### Technical Features

- 🗄️ **Supabase Integration**: Secure backend with PostgreSQL and authentication
- 🖼️ **Modern UI Stack**: Vue 3 + Vuetify 3 + Tailwind CSS
- 🗃️ **State Management**: Pinia for modular, type-safe state
- 🚦 **Smart Routing**: File-based routing with automatic layouts
- 💻 **TypeScript**: Full type safety across the application
- ⚡ **Vite**: Lightning-fast development with instant HMR
- 🧩 **Auto-Import**: Components and composables auto-imported
- 🛠️ **Code Quality**: ESLint + TypeScript for consistency

### In Progress

For features currently being developed or not yet implemented, see **[MISSING_IMPLEMENTATIONS.md](./MISSING_IMPLEMENTATIONS.md)**.

## 📁 Project Structure

For the complete project structure with detailed directory organization, see **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**.

### Quick Overview

```
smartgrade-vue/
├── docs/                           # Documentation
├── src/
│   ├── components/                # Reusable components
│   │   ├── layout/               # AppHeader, NavigationDrawer
│   │   └── documents/            # SF9Template, SF10Template
│   ├── composables/              # Business logic (useAuth, useGrades, etc.)
│   ├── layouts/                  # Role-based layouts
│   ├── pages/                    # File-based routes
│   │   ├── admin/               # Admin dashboard & management
│   │   ├── teacher/             # Classes, grades, documents
│   │   └── student/             # Student views
│   ├── stores/                   # Pinia state management
│   ├── services/                 # Supabase client
│   └── types/                    # TypeScript definitions
├── PROJECT_STRUCTURE.md          # Detailed structure documentation
├── MISSING_IMPLEMENTATIONS.md    # Incomplete features tracker
└── README.md                     # This file
```

## 🔒 Security

- ✅ Environment variables for sensitive data
- ✅ `.env` excluded from version control
- ✅ Row Level Security (RLS) ready
- ✅ Email-only authentication (@deped.gov.ph) and development standards.

### Before Contributing

1. Read **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** for code organization
2. Check **[MISSING_IMPLEMENTATIONS.md](./MISSING_IMPLEMENTATIONS.md)** for available tasks
3. R� Quick Links

- **[Project Structure](./PROJECT_STRUCTURE.md)** - Complete file organization
- **[Missing Features](./MISSING_IMPLEMENTATIONS.md)** - Incomplete implementations tracker
- **[Development Guidelines](./step-one-process.md)** - Process documentation
- **[DepEd Requirements](./step-one-policy-adjustments.md)** - Policy adjustments
- **[Database Schema](./smartgrade_db_upgrade_supabase.sql)** - PostgreSQL schema

## 🏫 About

**SmartGrade** is developed for Ampayon National High School - Senior High School Department to automate and streamline the academic grading process in compliance with DepEd standards.

### Key Objectives

- Eliminate manual grade computation errors
- Ensure compliance with DepEd grading policies
- Automate SF9/SF10 document generation
- Provide transparent grade access for students
- Create audit trail for academic records
- Simplify honors and awards computation

## 📄 License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2025 SmartGrade - Ampayon National High School

---

**For questions, issues, or contributions, please refer to the documentation above or contact the development team.**

- **Code Style**: Follow ESLint rules (single quotes, no semicolons, 2-space indent)
- **TypeScript**: Full type safety required, avoid `any` types
- **Components**: PascalCase naming, documented props/events
- **Composables**: Prefix with `use`, export typed functions
- **Commits**: Descriptive messages following conventional commits
- **Testing**: Add tests for new functionality (when testing framework added)

### Pull Request Process

1. Create feature branch from `development`
2. Implement changes following project standards
3. Update documentation (README, MISSING_IMPLEMENTATIONS, etc.)
4. Ensure all ESLint and TypeScript checks pass
5. Test thoroughly in all affected user roles
6. Submit PR with detailed description of changes

### Reporting Issues

When reporting bugs or requesting features:

- Check **[MISSING_IMPLEMENTATIONS.md](./MISSING_IMPLEMENTATIONS.md)** first
- Provide clear reproduction steps for bugs
- Include screenshots/videos if applicable
- Specify affected user roles (Admin/Teacher/Student)
- Tag with appropriate labels (bug, feature, documentation, etc.)

### Completed Phases

- ✅ **Phase 1**: Routing and layout architecture
- ✅ **Phase 2**: Supabase client connection
- ✅ **Phase 3**: Authentication (@deped.gov.ph email-only)
- ✅ **Phase 4**: User profiles and role-based access
- 🔨 **Phase 5**: Grade entry and computation (Partial)
- 🔨 **Phase 6**: Document generation (SF9/SF10) (Partial)
- 🔨 **Phase 7**: Honors and awards computation (Partial)

### Current Status

**Phase**: Active Development (Phase 5-7 Completion)  
**Focus**: Grade computation, document templates, testing

For detailed tracking of incomplete features, see **[MISSING_IMPLEMENTATIONS.md](./MISSING_IMPLEMENTATIONS.md)**.

### Recently Completed

- ✅ TypeScript error fixes (profile.id → profile.user_id)
- ✅ ESLint compliance across entire codebase
- ✅ Supabase relation object access fixes
- ✅ Certificate verification system
- ✅ Audit logging infrastructure
- ✅ Unlock request system

## 🤝 Contributing

This project follows strict architectural guidelines. Please review:

- [Copilot Instructions](./.github/copilot-instructions.md)
- [Step One Process](./step-one-process.md)
- Phase documentation in `./docs/`

## 📄 License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2025 SmartGrade - Ampayon National High School
