# Database Migration Note

## Role Change: Teacher → Student

The system has been updated to use "student" instead of "teacher" as the user role.

### ⚠️ IMPORTANT - Backward Compatibility Maintained
**Existing users with "teacher" role can still login and use the system!**

The system now accepts BOTH "teacher" and "student" roles during the migration period.

### Changes Made:
1. ✅ User model: role enum now includes ["student", "admin", "teacher"] for backward compatibility
2. ✅ Database models updated: Schedule, ClassroomUsage, TimeIn now use "student" field instead of "teacher"
3. ✅ All frontend components support both "student" and "teacher" roles
4. ✅ UserManagement component filters out admin accounts (shows students and teachers)
5. ✅ Middleware: Added requireStudent function that accepts both student and teacher roles

### Database Migration (Optional):

**You can use the system immediately without any migration!** However, for consistency, you may want to run these commands later:

```javascript
// Run these commands in MongoDB shell or create a migration script

// Update Schedules collection - rename teacher field to student
db.schedules.updateMany({}, { $rename: { "teacher": "student" } })

// Update ClassroomUsage collection - rename teacher field to student
db.classroomusages.updateMany({}, { $rename: { "teacher": "student" } })

// Update TimeIn collection - rename teacher field to student
db.timeins.updateMany({}, { $rename: { "teacher": "student" } })

// Update Users collection - change role from 'teacher' to 'student' (OPTIONAL)
// Note: This is optional as the system accepts both roles
db.users.updateMany(
  { role: "teacher" },
  { $set: { role: "student" } }
)
```

**After Migration:** Once all data is migrated, you can remove "teacher" from the role enum in `models/User.js` to clean up.

### Route Files Updated:
✅ routes/schedules.js - Fully updated to use "student" instead of "teacher"

### Route Files Still Referencing "teacher":
The following route files still contain references to the "teacher" field name in database queries:
- routes/usage.js
- routes/timein.js
- routes/reports.js

These should be updated if you use those features. Update process is the same as schedules.js.

