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

## ✨ Features

- 🖼️ **Optimized Front-End Stack**: Leverage the latest Vue 3 and Vuetify 3 for a modern, reactive UI development experience. [Vue 3](https://v3.vuejs.org/) | [Vuetify 3](https://vuetifyjs.com/en/)
- 🗃️ **State Management**: Integrated with [Pinia](https://pinia.vuejs.org/), the intuitive, modular state management solution for Vue.
- 🚦 **Routing and Layouts**: Utilizes Vue Router for SPA navigation and vite-plugin-vue-layouts-next for organizing Vue file layouts. [Vue Router](https://router.vuejs.org/) | [vite-plugin-vue-layouts-next](https://github.com/loicduong/vite-plugin-vue-layouts-next)
- 💻 **Enhanced Development Experience**: Benefit from TypeScript's static type checking and the ESLint plugin suite for Vue, ensuring code quality and consistency. [TypeScript](https://www.typescriptlang.org/) | [ESLint Plugin Vue](https://eslint.vuejs.org/)
- ⚡ **Next-Gen Tooling**: Powered by Vite, experience fast cold starts and instant HMR (Hot Module Replacement). [Vite](https://vitejs.dev/)
- 🧩 **Automated Component Importing**: Streamline your workflow with unplugin-vue-components, automatically importing components as you use them. [unplugin-vue-components](https://github.com/antfu/unplugin-vue-components)
- 🛠️ **Strongly-Typed Vue**: Use vue-tsc for type-checking your Vue components, and enjoy a robust development experience. [vue-tsc](https://github.com/johnsoncodehk/volar/tree/master/packages/vue-tsc)

These features are curated to provide a seamless development experience from setup to deployment, ensuring that your Vuetify application is both powerful and maintainable.

## 💡 Usage

This section covers how to start the development server and build your project for production.

### Starting the Development Server

To start the development server with hot-reload, run the following command. The server will be accessible at [http://localhost:3000](http://localhost:3000):

```bash
yarn dev
```

(Repeat for npm, pnpm, and bun with respective commands.)

> Add NODE_OPTIONS='--no-warnings' to suppress the JSON import warnings that happen as part of the Vuetify import mapping. If you are on Node [v21.3.0](https://nodejs.org/en/blog/release/v21.3.0) or higher, you can change this to NODE_OPTIONS='--disable-warning=5401'. If you don't mind the warning, you can remove this from your package.json dev script.

### Building for Production

To build your project for production, use:

```bash
yarn build
```

(Repeat for npm, pnpm, and bun with respective commands.)

Once the build process is completed, your application will be ready for deployment in a production environment.

## 💪 Support Vuetify Development

This project is built with [Vuetify](https://vuetifyjs.com/en/), a UI Library with a comprehensive collection of Vue components. Vuetify is an MIT licensed Open Source project that has been made possible due to the generous contributions by our [sponsors and backers](https://vuetifyjs.com/introduction/sponsors-and-backers/). If you are interested in supporting this project, please consider:

- [Requesting Enterprise Support](https://support.vuetifyjs.com/)
- [Sponsoring John on Github](https://github.com/users/johnleider/sponsorship)
- [Sponsoring Kael on Github](https://github.com/users/kaelwd/sponsorship)
- [Supporting the team on Open Collective](https://opencollective.com/vuetify)
- [Becoming a sponsor on Patreon](https://www.patreon.com/vuetify)
- [Becoming a subscriber on Tidelift](https://tidelift.com/subscription/npm/vuetify)
- [Making a one-time donation with Paypal](https://paypal.me/vuetify)

## 📑 License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2016-present Vuetify, LLC
