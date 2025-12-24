# SmartGrade - Automated Grading System

**Automated Grading System for Ampayon National High School - Senior High School**

A modern, role-based academic management system built with Vue 3, TypeScript, Vuetify, and Supabase.

## 🎯 Project Overview

SmartGrade is a comprehensive grading and academic management system designed specifically for DepEd Senior High School requirements, including:

- Automated grade computation and finalization
- SF9/SF10 document generation
- Honors and awards computation (With Honors, High Honors, Highest Honors)
- Role-based access control (Admin, Teacher, Student)
- Email-only authentication (@deped.gov.ph)

## 📚 Documentation

- **[Phase 1 Architecture](./docs/phase-1-architecture.md)** - Routing and layout system
- **[Phase 2 Supabase Setup](./docs/phase-2-supabase-setup.md)** - Backend connection configuration
- **[Phase 3 Authentication](./docs/phase-3-authentication.md)** - Email-only auth with @deped.gov.ph validation
- **[Step One Process](./step-one-process.md)** - Initial development guidelines
- **[Policy Adjustments](./step-one-policy-adjustments.md)** - DepEd-specific rules

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

- � **Supabase Integration**: Secure backend with PostgreSQL database and authentication
- 🎭 **Role-Based Access**: Separate interfaces for Admin, Teacher, and Student roles
- 🖼️ **Modern UI Stack**: Vue 3 + Vuetify 3 + Tailwind CSS for beautiful, responsive interfaces
- 🗃️ **State Management**: Pinia for intuitive, modular state management
- 🚦 **Smart Routing**: File-based routing with automatic layouts and role-based guards
- 💻 **TypeScript**: Full type safety across the entire application
- ⚡ **Vite**: Lightning-fast development with instant HMR
- 🧩 **Auto-Import**: Components and composables imported automatically
- 🛠️ **Code Quality**: ESLint + TypeScript for consistent, error-free code

## 📁 Project Structure

```
smartgrade-vue/
├── .env                    # Environment variables (git-ignored)
├── .env.example           # Environment template
├── docs/                  # Project documentation
│   ├── phase-1-architecture.md
│   └── phase-2-supabase-setup.md
├── src/
│   ├── assets/           # Static assets
│   ├── components/       # Reusable components
│   │   └── layout/      # Layout components (headers, navs)
│   ├── layouts/         # Page layouts (admin, teacher, student)
│   ├── pages/           # File-based routes
│   │   ├── admin/      # Admin pages
│   │   ├── teacher/    # Teacher pages
│   │   └── student/    # Student pages
│   ├── plugins/        # Vue plugins configuration
│   ├── router/         # Router configuration
│   ├── services/       # External services (Supabase)
│   ├── stores/         # Pinia stores
│   ├── styles/         # Global styles
│   └── types/          # TypeScript type definitions
└── package.json
```

## 🔒 Security

- ✅ Environment variables for sensitive data
- ✅ `.env` excluded from version control
- ✅ Row Level Security (RLS) ready
- ✅ Email-only authentication (@deped.gov.ph)
- ✅ Role-based access control
- ✅ No hardcoded credentials

## 📖 Development Phases

- ✅ **Phase 1**: Routing and layout architecture
- ✅ **Phase 2**: Supabase client connection
- ✅ **Phase 3**: Authentication (@deped.gov.ph email-only)
- ⏳ **Phase 4**: User profiles and role-based access
- ⏳ **Phase 5**: Grade entry and computation
- ⏳ **Phase 6**: Document generation (SF9/SF10)
- ⏳ **Phase 7**: Honors and awards computation

## 🤝 Contributing

This project follows strict architectural guidelines. Please review:

- [Copilot Instructions](./.github/copilot-instructions.md)
- [Step One Process](./step-one-process.md)
- Phase documentation in `./docs/`

## 📄 License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2025 SmartGrade - Ampayon National High School
