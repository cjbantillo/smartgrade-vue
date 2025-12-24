# Admin Module Improvements (Backlog)

> **⚠️ NOTE TO DEVELOPERS & AI AGENTS:** > This document outlines potential **future improvements** only. 
> These features are **OUT OF SCOPE** for the current development phase. 
> Do not treat these items as pending tasks or active implementation requirements.

✅ IMPLEMENTED FUNCTIONALITIES
1. Teacher Management (/admin/teachers)
✅ View pending teacher registrations
✅ Approve teacher accounts
✅ Reject teacher accounts (with reason)
✅ Pre-register teachers (invite system)
✅ Edit teacher data (employee #, department, specialization)
✅ Deactivate teacher accounts
✅ Email validation enforcement (@deped.gov.ph)
2. Audit Log Viewer (/admin/audit-logs)
✅ View system activity history
✅ Server-side pagination
✅ Filter by action type, entity, date range
✅ Detail view (old values vs new values JSON diff)
✅ User tracking (who did what, when)
3. System Settings (/admin/settings)
✅ School identity configuration (name, ID, logo)
✅ Document signatories (Principal, Superintendent)
✅ Grading configuration (passing grade, honors thresholds)
✅ School logo upload
4. School Year Management (/admin/school-years)
✅ Create/Edit/Delete school years
✅ Set active school year (only one active at a time)
✅ Grading period management (4 quarters per year)
✅ Set active grading period
5. Subject Management (/admin/subjects)
✅ Create/Edit/Delete subjects
✅ Configure: Code, Name, Grade Level, Track, Strand, Semester, Type, Units
✅ Status management (Active/Inactive)
6. Grade Unlock Management (/admin/unlock-requests)
✅ View all finalized grades
✅ Unlock finalized grades (with mandatory reason)
✅ Unlock history/audit trail
✅ Unlock count tracking
❌ NOT YET IMPLEMENTED (Priority Order)
Critical (Required for Full Operation)
7. Class/Section Management (/admin/classes)
Purpose: Manage class sections and teacher assignments

❌ Create/Edit/Delete class sections
❌ Assign homeroom teacher to section
❌ Set class schedule (room, time slots)
❌ Grade level assignment (Grade 11/12)
❌ Track/Strand assignment
❌ Section capacity management
❌ School year association
8. Student Management (/admin/students)
Purpose: Admin oversight of student records

❌ View all student profiles
❌ Verify/approve student registrations
❌ Edit student data (LRN, contact info, guardian)
❌ Assign students to sections
❌ Transfer students between sections
❌ Deactivate/graduate students
❌ Bulk enrollment (CSV import)
9. Enrollment Management (/admin/enrollment)
Purpose: Manage academic enrollment periods

❌ Set enrollment periods (dates)
❌ Configure enrollment requirements
❌ View enrollment statistics
❌ Approve/reject enrollments
❌ Enrollment status dashboard
Important (Operational Efficiency)
10. Teacher Class Assignment (/admin/teacher-classes)
Purpose: Assign teachers to specific subject-class combinations

❌ View teacher schedules
❌ Assign teacher to class-subject
❌ Manage teaching load
❌ Conflict detection (schedule overlaps)
❌ Advisory class assignments
11. Dashboard & Analytics (/admin/index enhancement)
Purpose: Executive overview and KPIs

✅ Basic stats (pending teachers, audit logs)
❌ Student enrollment trends
❌ Grade distribution charts
❌ Teacher workload distribution
❌ Finalization status overview
❌ System health metrics
12. Report Generation (/admin/reports)
Purpose: Generate administrative reports

❌ Teacher performance reports
❌ Student performance summaries
❌ Enrollment reports by track/strand
❌ Grade finalization status report
❌ Audit trail reports (by date range)
❌ Export to PDF/Excel
13. Backup & Data Export (/admin/backup)
Purpose: Data preservation and portability

❌ Backup student data
❌ Backup grade records
❌ Export database tables (CSV/JSON)
❌ Restore functionality
❌ Scheduled backups configuration
Nice-to-Have (Future Enhancements)
14. Certificate Management (/admin/certificates)
Purpose: Oversight of generated certificates

❌ View all issued certificates
❌ Revoke certificates (already in useCertificates.ts composable)
❌ Reissue certificates
❌ Certificate templates management
❌ Bulk certificate generation
15. School Calendar Management (/admin/calendar)
Purpose: Manage academic calendar events

❌ Add school events
❌ Set exam schedules
❌ Holiday management
❌ Activity calendar
❌ Calendar sync/export
16. Notification Management (/admin/notifications)
Purpose: System-wide announcements

❌ Send announcements to all users
❌ Role-based notifications (teachers, students)
❌ Email notification templates
❌ Notification history
17. User Role Management (/admin/users)
Purpose: Manage admin users and permissions

❌ Create additional admin accounts
❌ Role-based permissions (admin levels)
❌ View all user accounts
❌ Suspend/unsuspend users
❌ Password reset management
18. Grade Override/Correction (/admin/grade-corrections)
Purpose: Manual grade corrections (beyond unlock)

❌ Direct grade editing (emergency)
❌ Grade recalculation triggers
❌ GPA recalculation
❌ Grade correction audit trail
19. System Logs & Monitoring (/admin/system-logs)
Purpose: Technical system health monitoring

❌ Error logs viewer
❌ Performance metrics
❌ API usage statistics
❌ Database query performance
❌ Storage usage tracking
20. Settings Advanced (extension of /admin/settings)
Purpose: Advanced system configuration

❌ Email server configuration
❌ SMS notification settings
❌ API key management (external integrations)
❌ Session timeout configuration
❌ File upload size limits
