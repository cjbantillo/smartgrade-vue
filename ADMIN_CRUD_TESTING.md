# Admin CRUD Operations Testing Guide

## Overview

This document provides comprehensive testing procedures for CRUD operations in the SmartGrade admin module, specifically for audit logs and unlock requests.

## 1. Audit Logs Page (`/admin/audit-logs`)

### READ Operations

- [x] **View all audit logs**

  - Navigate to Admin > System Audit Logs
  - Verify logs are displayed in table format
  - Confirm pagination works (25 items per page)
  - Check that all columns display correctly

- [x] **Filter by action type**

  - Use "Action Type" dropdown filter
  - Test each action type: teacher_approved, teacher_rejected, grades_finalized, grades_unlocked, grades_refinalized
  - Verify table updates when filter is applied
  - Clear filter and verify all logs reappear

- [x] **Filter by entity type**

  - Use "Entity Type" dropdown filter
  - Test: Profile, Grade, Student, Teacher
  - Verify correct filtering

- [x] **Filter by date range**

  - Enter "From Date" and "To Date"
  - Verify logs are filtered to date range
  - Test with various date combinations

- [x] **View detailed log information**
  - Click eye icon on any log entry
  - Verify details dialog opens with:
    - Full timestamp
    - User email and role
    - Complete action name
    - Entity ID
    - Old values (if available)
    - New values (if available)
    - Metadata (if available)
    - IP address
    - User agent

### DELETE Operations

- [x] **Delete single audit log**

  - Click delete (trash) icon on any log entry
  - Verify confirmation dialog appears with warning
  - Confirm deletion removes log from table
  - Verify log no longer appears after refresh

- [x] **Delete with confirmation**
  - Attempt to delete log
  - Cancel in confirmation dialog
  - Verify log is NOT deleted
  - Try again and confirm deletion

### EXPORT Operations

- [x] **Export filtered logs to CSV**
  - Apply filters (optional)
  - Click "Export CSV" button
  - Verify CSV file downloads with correct filename: `audit-logs-YYYY-MM-DD.csv`
  - Verify CSV contains:
    - Header row with all columns
    - Timestamp, User Email, User Role, Action, Entity Type, Entity ID, IP Address
    - Old Values, New Values, Metadata columns (JSON formatted)
  - Open CSV and verify data integrity

### UI/UX Tests

- [x] **Pagination works correctly**

  - More than 25 logs should show pagination
  - Navigate between pages
  - Verify correct logs display per page
  - Page indicator shows correct total

- [x] **Loading states**

  - Refresh button shows loading spinner
  - Table displays loading alert during initial load
  - No actions available while loading

- [x] **Empty states**

  - Apply filters that return no results
  - Verify "No audit logs found" message displays
  - Clear filters and verify logs reappear

- [x] **Action color coding**
  - teacher_approved: green (success)
  - teacher_rejected: red (error)
  - grades_finalized: blue (info)
  - grades_unlocked: orange (warning)
  - grades_refinalized: purple (primary)

---

## 2. Unlock Requests Page (`/admin/unlock-requests`)

### CREATE Operations (Teacher-initiated, read by admin)

- [x] **View created unlock requests**
  - Navigate to Admin > Grade Unlock Requests
  - Verify pending requests display in "Pending" tab
  - Confirm all request data shows:
    - Request Date
    - Teacher name
    - Student name
    - Subject
    - Reason for unlock
    - Status: "Pending"

### READ Operations

#### Pending Requests Tab

- [x] **View pending requests**
  - "Pending" tab shows count of pending requests
  - All pending requests display in table
  - Action buttons (Approve/Reject) are visible
  - Refresh loads latest pending requests

#### All Requests Tab

- [x] **View all historical requests**

  - "All Requests" tab shows total count
  - All statuses display: pending, approved, rejected
  - Response date shows for processed requests
  - Response date shows "Pending" for unapproved requests

- [x] **View request details**
  - Click eye icon on any request
  - Verify details dialog shows:
    - Teacher, Student, Subject
    - Status with color coding
    - Request date
    - Response date (if applicable)
    - Reason for unlock
    - Admin notes (if available)

### UPDATE Operations

#### Approve Request

- [x] **Approve pending request**

  - Click "Approve" on pending request
  - Verify approval dialog opens
  - Optional: add admin notes
  - Click "Approve" button
  - Verify:
    - Success snackbar shows "Grades have been unlocked"
    - Request moves to "All Requests" tab
    - Status changes to "Approved" (green)
    - Response date updates to current date/time
    - Grades are unlocked (finalization status updated)

- [x] **Admin notes in approval**
  - Approve request with detailed admin notes
  - Navigate to "All Requests"
  - View request details
  - Verify admin notes are saved and visible

#### Reject Request

- [x] **Reject pending request**

  - Click "Reject" on pending request
  - Verify rejection dialog opens
  - Enter rejection reason (REQUIRED)
  - Click "Reject" button
  - Verify:
    - Success snackbar shows "Unlock request rejected"
    - Request moves to "All Requests" tab
    - Status changes to "Rejected" (red)
    - Response date updates to current date/time
    - Admin notes (reason) are saved

- [x] **Validation for rejection reason**
  - Click "Reject" on pending request
  - Try to reject WITHOUT entering reason
  - Verify warning snackbar: "Rejection reason is required"
  - Verify rejection does not proceed
  - Enter reason and verify rejection succeeds

### DELETE Operations

- [x] **Delete pending request**

  - Click delete (trash) icon on PENDING request (All Requests tab)
  - Verify delete confirmation dialog
  - Warning: "This action cannot be undone"
  - Confirm deletion
  - Verify request is removed from table
  - Verify success snackbar: "Unlock request deleted"

- [x] **Delete is only available for pending requests**

  - Approve or reject a request
  - View in "All Requests" tab
  - Verify delete button is NOT visible for non-pending requests

- [x] **Cancel deletion**
  - Click delete icon
  - Click "Cancel" in confirmation dialog
  - Verify request is NOT deleted
  - Try deletion again and confirm

### EXPORT Operations

- [x] **Export all requests to CSV**

  - Click "Export CSV" button in "All Requests" tab
  - Verify CSV downloads with: `unlock-requests-YYYY-MM-DD.csv`
  - Verify CSV contains:
    - Header row: Request Date, Teacher, Student, Subject, Reason, Status, Response Date, Admin Notes
    - All request records
    - Proper CSV formatting (commas escaped in text fields)
  - Verify data integrity in spreadsheet application

- [x] **Export button disabled when no requests**
  - Apply filter that returns no results
  - Verify "Export CSV" button is disabled
  - Clear filters to re-enable

### Status Transitions

- [x] **Pending → Approved**

  - Create scenario with pending request
  - Approve it
  - Verify status changes
  - Verify grade finalization is updated

- [x] **Pending → Rejected**

  - Create scenario with pending request
  - Reject it with reason
  - Verify status changes

- [x] **Tab switching with updates**
  - Have pending requests
  - Approve one request
  - Switch to "Pending" tab
  - Verify count decreased and request removed
  - Switch to "All" tab
  - Verify request now shows as "Approved"

### Snackbar Notifications

- [x] **Success notifications**

  - Approve request → "Unlock request approved. Grades have been unlocked."
  - Reject request → "Unlock request rejected."
  - Delete request → "Unlock request deleted."

- [x] **Error notifications**

  - Trigger error (e.g., network issue)
  - Verify error message displays in snackbar with color='error'

- [x] **Warning notifications**
  - Attempt invalid action (e.g., reject without reason)
  - Verify warning snackbar with color='warning'

---

## 3. Access Control & Security Tests

### Authorization

- [x] **Admin-only access**
  - Verify `/admin/audit-logs` requires admin role
  - Verify `/admin/unlock-requests` requires admin role
  - Non-admin users cannot access pages (redirect to login or home)
  - Teachers cannot view or manage requests/logs

### Data Privacy

- [x] **Email addresses displayed correctly**

  - Audit logs show user emails
  - Unlock requests show teacher emails
  - No passwords or sensitive data exposed

- [x] **Audit logging of admin actions**
  - Admin approval/rejection is logged in audit_logs
  - Verify `grade_unlock_approved` and `grade_unlock_rejected` actions logged
  - Check that admin_notes are included in audit log

---

## 4. Database Integrity Tests

### Audit Logs Table

- [x] **Verify all required fields populated**

  - id, user_id, action, entity_type, entity_id
  - created_at, old_values, new_values, metadata
  - ip_address, user_agent

- [x] **Verify relationships**
  - user_id links to profiles table correctly
  - Each log displays correct user email/role

### Grade Unlock Requests Table

- [x] **Verify required fields for new request**

  - id, student_id, teacher_id, school_year_id
  - reason, status (defaults to 'pending')
  - created_at, response_date

- [x] **Verify updates save correctly**
  - Status changes persist after page refresh
  - Admin notes saved and retrieved correctly
  - Response dates update accurately

### Grade Finalization Status Table

- [x] **Verify unlock updates finalization status**
  - is_finalized set to false on approval
  - last_unlocked_by, last_unlocked_at updated
  - unlock_reason, unlock_count incremented

---

## 5. Performance & Edge Cases

### Large Dataset Handling

- [x] **Pagination with many logs**

  - 500+ logs load without lag
  - Pagination navigation is smooth
  - Filtering works on large dataset

- [x] **Export with large dataset**
  - CSV export completes for 100+ records
  - File downloads correctly
  - No memory issues

### Edge Cases

- [x] **Null/missing data handling**

  - Logs without admin_notes display "N/A"
  - Missing ip_address shows "N/A"
  - Missing response_date shows "Pending"

- [x] **Special characters in CSV export**

  - Commas in reasons are properly escaped
  - Quotes in text are handled correctly
  - JSON data in old_values/new_values is properly escaped

- [x] **Date edge cases**
  - Midnight dates filter correctly
  - Timezone handling is consistent
  - Historical dates export correctly

---

## 6. Browser Compatibility

- [ ] **Chrome/Chromium**
- [ ] **Firefox**
- [ ] **Safari**
- [ ] **Edge**

Test on each browser:

- Tables render correctly
- Dialogs function properly
- CSV export works
- All buttons are clickable
- Responsive design on mobile

---

## Test Data Requirements

### Prerequisite Data

1. Multiple audit logs with various action types
2. Pending unlock requests (not yet approved/rejected)
3. Approved unlock requests
4. Rejected unlock requests
5. Users with different roles

### Sample Test Scenarios

**Scenario 1: Complete Unlock Request Workflow**

- Create grade for a student
- Teacher finalizes grades
- Teacher submits unlock request
- Admin reviews request details
- Admin approves with notes
- Verify grades are unlocked
- Verify audit log created
- Export and verify CSV

**Scenario 2: Rejection Workflow**

- Create unlock request
- Admin rejects with specific reason
- Verify status changes to rejected
- Verify grades remain finalized
- Verify audit log shows rejection

**Scenario 3: Audit Trail Verification**

- Perform multiple actions (approve, reject, delete)
- View audit logs
- Filter by action type
- Export logs
- Verify all actions are properly logged with timestamps

---

## Sign-off Checklist

- [ ] All READ operations tested and passing
- [ ] All CREATE operations tested and passing
- [ ] All UPDATE operations tested and passing
- [ ] All DELETE operations tested and passing
- [ ] All EXPORT operations tested and passing
- [ ] Access control verified
- [ ] Data integrity confirmed
- [ ] Error handling works correctly
- [ ] Snackbar notifications display appropriately
- [ ] CSV exports are valid and complete
- [ ] Performance acceptable with large datasets
- [ ] Browser compatibility verified
- [ ] Edge cases handled gracefully

---

## Known Issues & Resolutions

_Document any issues found during testing with resolutions_

| Issue | Severity | Status | Notes |
| ----- | -------- | ------ | ----- |
|       |          |        |       |

---

## Testing Notes

_Space for tester comments and observations_

---

**Last Updated:** [Current Date]
**Tested By:** [Tester Name]
**Environment:** [Dev/Staging/Production]
