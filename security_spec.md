# Security Specification - ID Card App

## Data Invariants
1. A user can only create and update their own profile.
2. A user cannot modify their `assignedStamps` field; only admins can do that.
3. Only admins can create, update, or delete stamps.
4. Admin status is determined by being in the `/admins` collection.
5. `alnimr60@gmail.com` is the initial admin.

## The "Dirty Dozen" Payloads (Potential Attacks)
1. **Identity Spoofing**: User A tries to create a document in `/users` with User B's UID as the document ID.
2. **Role Escalation**: User A tries to add themselves to the `/admins` collection.
3. **Ghost Stamp**: User A tries to update their own `assignedStamps` array.
4. **Unauthorized Deletion**: User A tries to delete User B's profile.
5. **Stamp Tampering**: User A tries to delete or modify a stamp in the `/stamps` collection.
6. **Admin Impersonation**: User A tries to set their email to `alnimr60@gmail.com` in their profile hoping it grants admin rights (it shouldn't, we check the `/admins` collection).
7. **Malicious ID**: User tries to create a document with a 1KB ID.
8. **Resource Exhaustion**: User sends a 1MB string for the `name` field.
9. **Timestamp Manipulation**: User tries to set a `updatedAt` in the future.
10. **Query Scraping**: User tries to list all users in the `/users` collection without proper filters.
11. **PII Leak**: Non-admin user tries to fetch User B's email.
12. **Unverified Bypass**: User with unverified email (if we enforce it) tries to write.

## Test Strategy
We will implement rules that deny these payloads.
The `firestore.rules` will strictly use `isAdmin()` and `isOwner()` helpers.
