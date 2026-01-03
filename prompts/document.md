# SMARTGRADE-Vue – Implementation Prompts

This document contains **ready-to-use, precise prompts** for building the **Vue 3 + TypeScript + Vuetify 3 + Supabase** version of SMARTGRADE.  

All features, roles, permissions, and document workflows are **exactly the same** as the original PHP version — no changes in logic, only modern frontend implementation.

Copy and paste any prompt below to instantly get complete, production-ready code (component, routing, Supabase queries, UI).

---

### Admin Role Prompts

```
admin dashboard full implementation with school stats (students, teachers, sections), active school year, quick actions cards, recent activity list
```

```
admin school settings page with form to edit school name, principal name, and upload school logo (using Supabase storage)
```

```
admin user management page with data table to list all users, filter by role, add new teacher/admin, edit, delete
```

```
admin section management page to create new sections, assign adviser from teachers list, edit section name
```

```
admin subject management page to add/edit/delete subjects with code, name, units, type (core/applied/specialized)
```

```
admin school year management page to create new school year, set active year, view history
```

---

### Adviser / Teacher Role Prompts

```
adviser dashboard with list of assigned sections and subjects as cards, showing section name, subject, semester
```

```
adviser document center page with section selector, student table (LRN, name, SF9 count), buttons: Generate New SF9, View Latest, Revoke
```

```
adviser encode final grades page with LRN, Student Name, Final Grade input only, Save All button, success message
```

```
adviser enroll students page with search by LRN/name, bulk checkbox enroll, individual enroll button, remove from section with confirmation
```

```
adviser manage subjects page to assign/unassign subjects to their section, select teacher (themselves)
```

```
adviser preview certificate template button and modal/page showing sample certificate with current school logo
```

---

### Student Role Prompts

```
student dashboard with welcome message, final grades table grouped by semester (Subject, Final Grade, Remarks), SF9 view button
```

```
student grades view table with columns: LRN, Student Name, Subject, Final Grade, Remarks (Passed/Failed)
```

```
student view SF9 page using Supabase storage file or client-side watermark overlay on PDF
```

---

### Shared / System Prompts

```
login page with Supabase auth: email/password form and Google sign-in button
```

```
role detection from Supabase user metadata or users table, redirect to correct dashboard after login
```

```
navigation drawer sidebar with dynamic menu based on role: Admin (full menu), Adviser (their sections), Student (grades + SF9)
```

```
global loading spinner and error toast notifications using Vuetify snackbar
```

```
404 not found page with back to home button
```

```
responsive layout that works on mobile, tablet, desktop
```

---

### Full Flow Prompts (Complete Sections)

```
implement full admin flow: login → admin dashboard → school settings (logo upload) → user management → section & subject creation
```

```
implement full adviser flow: login → adviser dashboard → select section → encode grades → document center → generate/view/revoke SF9
```

```
implement full student flow: login → student dashboard → view grades table → view watermarked SF9
```

---

Use these prompts exactly as written — they are optimized for instant, accurate code generation that matches your original PHP SMARTGRADE 100%.

**Your Vue version will be faster, more beautiful, and fully modern — while keeping every feature and rule intact.**

Now go build it — one prompt at a time.

You're turning SMARTGRADE into a **next-generation app**.

Let's make it stunning. 🚀

Which prompt do you want first?