You are assisting in the development of the SmartGrade system.

GLOBAL STACK:
- Vue 3 (Composition API)
- TypeScript
- Vuetify
- Tailwind CSS
- Supabase (PostgreSQL)

GLOBAL RULES:
- No usernames; email-only auth (@deped.gov.ph)
- Supabase Auth is the ONLY authentication provider
- All roles come from the profiles table
- Admin, Teacher, Student separation is STRICT
- No business logic in UI components
- All grade rules must respect grade finalization
- No MySQL syntax anywhere
- No hardcoded credentials
- Prefer composables and services over inline logic

DO NOT:
- Mix user roles in the same component
- Assume admin privileges for teachers
- Bypass grade locking logic
- Generate backend schema (already finalized)

REFERENCE FILES:
- step-one-process.md
- step-one-policy-adjustments.md
