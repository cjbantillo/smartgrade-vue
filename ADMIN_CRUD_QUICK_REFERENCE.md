# Admin CRUD Operations - Quick Reference

## Pages Included

### 1. Audit Logs Admin Page

**Path**: `/admin/audit-logs`  
**Icon**: View activity history

#### Operations Available

| Operation | Available | Method                   | Result                   |
| --------- | --------- | ------------------------ | ------------------------ |
| CREATE    | ❌ No     | System automatic         | Logged automatically     |
| READ      | ✅ Yes    | View all, filter, search | Display in table         |
| UPDATE    | ❌ No     | N/A                      | Immutable records        |
| DELETE    | ✅ Yes    | Click trash icon         | Remove with confirmation |
| EXPORT    | ✅ Yes    | Click "Export CSV"       | Download filtered data   |

#### Features

- **Advanced filtering**: Action type, Entity type, Date range
- **Pagination**: 25 items per page
- **Details view**: Click eye icon to see full information
- **Color coding**: Visual action type indicators
- **CSV export**: Download filtered logs

#### Sample Operations

```
1. View all logs → Page loads automatically
2. Filter by action → Select "Grades Finalized"
3. Filter by date → Set "From Date" to last 7 days
4. View details → Click eye icon on any log
5. Delete log → Click trash icon, confirm deletion
6. Export logs → Click "Export CSV" button
```

---

### 2. Grade Unlock Requests Admin Page

**Path**: `/admin/unlock-requests`  
**Icon**: Manage teacher unlock requests

#### Operations Available

| Operation | Available | Method                     | Result                   |
| --------- | --------- | -------------------------- | ------------------------ |
| CREATE    | ❌ No     | Teacher-initiated          | Auto-created by teachers |
| READ      | ✅ Yes    | View pending/all           | Display in tabs          |
| UPDATE    | ✅ Yes    | Approve/Reject             | Change status            |
| DELETE    | ✅ Yes    | Click trash (pending only) | Remove request           |
| EXPORT    | ✅ Yes    | Click "Export CSV"         | Download all requests    |

#### Key Statuses

- **Pending** ⚠️ - Awaiting admin action
- **Approved** ✅ - Grades unlocked
- **Rejected** ❌ - Grades remain locked

#### Features

- **Dual tabs**: Pending requests vs. All requests
- **Approval workflow**: Optional admin notes
- **Rejection workflow**: Required rejection reason
- **Details viewer**: Complete request information
- **CSV export**: All request history

#### Sample Workflow: Approving a Request

```
1. Navigate to /admin/unlock-requests
2. Find pending request in "Pending" tab
3. Click "Approve" button
4. (Optional) Add admin notes
5. Click "Approve" in dialog
6. Grades are unlocked automatically
7. Request moves to "All" tab with status "Approved"
```

#### Sample Workflow: Rejecting a Request

```
1. Find pending request in "Pending" tab
2. Click "Reject" button
3. Enter rejection reason (REQUIRED)
4. Click "Reject" in dialog
5. Request moves to "All" tab with status "Rejected"
6. Grades remain finalized
7. Teacher notified of rejection (optional)
```

---

## Database Operations Summary

### Audit Logs Queries

#### READ All

```sql
SELECT *
FROM audit_logs
LEFT JOIN profiles ON audit_logs.user_id = profiles.id
ORDER BY created_at DESC
LIMIT 500;
```

#### DELETE

```sql
DELETE FROM audit_logs
WHERE id = $1;
```

### Unlock Requests Queries

#### READ All

```sql
SELECT *
FROM grade_unlock_requests
ORDER BY created_at DESC;
```

#### UPDATE (Approve)

```sql
-- 1. Update request
UPDATE grade_unlock_requests
SET status = 'approved', response_date = NOW(), admin_notes = $1
WHERE id = $2;

-- 2. Unlock grades
UPDATE grade_finalization_status
SET is_finalized = false, last_unlocked_by = $1, last_unlocked_at = NOW()
WHERE student_id = $2 AND school_year_id = $3;

-- 3. Log action
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
VALUES ($1, 'grade_unlock_approved', 'grade_unlock_request', $2, $3);
```

#### UPDATE (Reject)

```sql
-- 1. Update request
UPDATE grade_unlock_requests
SET status = 'rejected', response_date = NOW(), admin_notes = $1
WHERE id = $2;

-- 2. Log action
INSERT INTO audit_logs (...)
VALUES (..., 'grade_unlock_rejected', ...);
```

#### DELETE

```sql
DELETE FROM grade_unlock_requests
WHERE id = $1;
```

---

## CSV Export Format

### Audit Logs CSV

```csv
Timestamp,User Email,User Role,Action,Entity Type,Entity ID,IP Address,Old Values,New Values,Metadata
2024-01-15 10:30:45,teacher@deped.gov.ph,teacher,grades_finalized,grade,123e4567-e89b,192.168.1.1,"{}","{""status"":""finalized""}","{}"
```

**Columns**:

- Timestamp: ISO format with date and time
- User Email: Email address of actor
- User Role: admin/teacher/student
- Action: What was done
- Entity Type: What was affected
- Entity ID: Which record
- IP Address: Source IP
- Old Values: Previous state (JSON)
- New Values: New state (JSON)
- Metadata: Additional info (JSON)

### Unlock Requests CSV

```csv
Request Date,Teacher,Student,Subject,Reason,Status,Response Date,Admin Notes
2024-01-15 09:20:00,Teacher Name,Student Name,Mathematics,Error in computation,approved,2024-01-15 10:15:00,Verified error
```

**Columns**:

- Request Date: When teacher submitted
- Teacher: Teacher's name
- Student: Student's name
- Subject: Which subject
- Reason: Why unlock requested
- Status: pending/approved/rejected
- Response Date: When admin responded
- Admin Notes: Admin's comment

---

## Buttons & Icons Quick Guide

### Audit Logs Page

| Icon | Name         | Action                 | Color   |
| ---- | ------------ | ---------------------- | ------- |
| 🔄   | Refresh      | Reload all logs        | Primary |
| 📥   | Export CSV   | Download filtered logs | Default |
| 👁️   | View Details | Open detail dialog     | Text    |
| 🗑️   | Delete       | Remove log entry       | Error   |

### Unlock Requests Page

| Button        | Action                     | Location    |
| ------------- | -------------------------- | ----------- |
| ✅ Approve    | Unlock grades + approve    | Pending tab |
| ❌ Reject     | Deny request + keep locked | Pending tab |
| 👁️ View       | Open detail dialog         | All tab     |
| 🗑️ Delete     | Remove pending request     | All tab     |
| 📥 Export CSV | Download all requests      | All tab     |

---

## Common Tasks

### Task: View activity for last 7 days

```
1. Go to /admin/audit-logs
2. Set "From Date" to 7 days ago
3. Leave "To Date" empty (defaults to today)
4. View filtered results
```

### Task: Find all grade-related changes

```
1. Go to /admin/audit-logs
2. Select Action Type = "Grades Finalized" (or other grade action)
3. View matching logs
4. Click eye icon for full details
```

### Task: Approve all pending unlock requests

```
1. Go to /admin/unlock-requests
2. "Pending" tab shows all waiting requests
3. For each request:
   - Click "Approve"
   - Add optional notes
   - Confirm approval
4. Requests move to "All" tab as "Approved"
```

### Task: Archive old logs

```
1. Go to /admin/audit-logs
2. Set date range for old entries
3. For each log:
   - Click trash icon
   - Confirm deletion
4. Or: Export to CSV first for backup
```

### Task: Download compliance report

```
1. Go to /admin/audit-logs
2. (Optional) Apply filters for specific period
3. Click "Export CSV"
4. Open in Excel/Google Sheets
5. Format and distribute as needed
```

---

## Keyboard Shortcuts

_None currently implemented - all operations via mouse/touchscreen_

---

## Troubleshooting

### "No audit logs found"

- ✓ Check filters are not too restrictive
- ✓ Verify date range includes actual data
- ✓ Clear all filters and try again
- ✓ Click Refresh button

### "Cannot approve request"

- ✓ Verify you have admin role
- ✓ Check request is still pending (not already approved)
- ✓ Verify student record exists
- ✓ Check grade finalization status exists

### "CSV won't download"

- ✓ Check popup blockers
- ✓ Verify browser download settings
- ✓ Check available disk space
- ✓ Try different browser

### "Snackbar notification missing"

- ✓ Look for small message at bottom right
- ✓ Check if hidden behind other dialogs
- ✓ Close open dialogs and try again
- ✓ Refresh page if needed

---

## Performance Tips

### For Large Log Datasets

1. **Use date filters** - Narrow to specific time period
2. **Export to CSV** - Process outside application
3. **Archive old logs** - Delete logs older than X days
4. **Filter first** - Apply filters before exporting

### For Multiple Unlock Requests

1. **Review pending first** - Use "Pending" tab
2. **Batch review** - Check 5-10 at once
3. **Keep notes brief** - Faster processing
4. **Export history** - For record keeping

---

## Data Security Notes

### What Gets Logged

✅ All admin approvals/rejections  
✅ User who performed action  
✅ Timestamp of action  
✅ IP address and user agent  
✅ Old and new values

### What's NOT Logged

❌ Student grades (only finalization status)  
❌ Password changes  
❌ Failed login attempts  
❌ Sensitive personal data

### Data Retention

- Audit logs: Permanent (compliance)
- Unlock requests: Depends on policy
- CSV exports: Admin responsibility

---

## Compliance Features

### Audit Trail ✅

- Every admin action is logged
- Timestamps recorded
- User attribution mandatory
- Immutable records

### Accountability ✅

- Admin notes required for rejections
- Optional notes for approvals
- Grade unlock tracking
- Action reversal documented

### Transparency ✅

- Teachers can see request status
- Status updates logged
- Reasons provided for rejections
- Complete activity history

---

## User Roles & Access

### Admin Users

✅ Full access to all operations  
✅ Can approve/reject unlock requests  
✅ Can view all audit logs  
✅ Can delete logs/requests  
✅ Can export data

### Teacher Users

❌ No access to audit logs  
❌ Cannot approve/reject requests  
❌ Can only submit unlock requests  
✅ Can see their own request status

### Student Users

❌ No access to admin pages  
❌ Cannot view logs or requests  
❌ Cannot approve/reject  
✅ Can see their own grade locks

---

## Support Resources

### Documentation

- [ADMIN_CRUD_OPERATIONS.md](ADMIN_CRUD_OPERATIONS.md) - Full implementation details
- [ADMIN_CRUD_TESTING.md](ADMIN_CRUD_TESTING.md) - Comprehensive test guide

### Code Files

- [src/pages/admin/audit-logs.vue](src/pages/admin/audit-logs.vue)
- [src/pages/admin/unlock-requests.vue](src/pages/admin/unlock-requests.vue)

### Related Pages

- [src/pages/admin/index.vue](src/pages/admin/index.vue) - Admin dashboard
- [src/pages/admin/teachers.vue](src/pages/admin/teachers.vue) - Teacher management

---

## Version History

| Version | Date | Changes                                      |
| ------- | ---- | -------------------------------------------- |
| 1.0     | 2024 | Initial CRUD implementation                  |
|         |      | Audit logs READ, DELETE, EXPORT              |
|         |      | Unlock requests READ, UPDATE, DELETE, EXPORT |
|         |      | CSV export functionality                     |
|         |      | Testing documentation                        |

---

**Last Updated**: 2024  
**Status**: Complete  
**Tested**: Yes  
**Ready for Production**: Yes
