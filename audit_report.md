# Security Audit Report — Tadriss

This report documents the security audit performed during Phase 1 of the production-readiness mission.

## Executive Summary
The platform has a solid foundation with RLS and Edge Functions, but several **CRITICAL** and **HIGH** severity issues must be addressed before onboarding real clients. Most critical is the exposure of temporary passwords in the `invite-teacher` response and missing `DELETE` policies for attendance data.

---

## 1. Row Level Security (RLS)

| Severity | Table | Issue | Recommendation |
| :--- | :--- | :--- | :--- |
| **HIGH** | `attendance_sessions` | Missing `DELETE` policy. Teachers cannot delete erroneous sessions they created. | Add `DELETE` policy for teachers assigned to the class. |
| **HIGH** | `attendance_records` | Missing `DELETE` policy. Teachers cannot fix submission errors by deleting records. | Add `DELETE` policy for teachers who teach the session. |
| **MEDIUM** | `homework` | Manage policy (INSERT/UPDATE/DELETE) doesn't explicitly check `institution_id` in `USING`. | Add `institution_id = get_institution_id()` to all policies for multi-tenant safety. |
| **LOW** | `profiles` | `get_user_role()` and `get_institution_id()` return `NULL` if claims are missing. | Use `COALESCE` or strict checks to avoid unexpected `NULL = NULL` edge cases. |

---

## 2. Edge Function Security

| Severity | Function | Issue | Recommendation |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | `invite-teacher` | Response returns `temp_password` in cleartext. If intercepted, an attacker can take over the invite. | Remove `temp_password` from response. Trigger a Supabase Auth invitation email or a password reset link. |
| **HIGH** | ALL | Lack of input validation. Functions destructure `req.json()` without schema validation. | Implement `shared/validators` (Zod) in all Edge Functions to prevent malformed data injection. |
| **MEDIUM** | `onboard-institution` | Open signup. Anyone can call this function to create an institution. | Add a secret `ONBOARDING_KEY` or CAPTCHA requirement to the function. |
| **LOW** | `dashboard-stats` | Bypasses RLS using Service Role Key. While scoped via JWT claims, it increases attack surface if claims are spoofed. | Keep service role for speed, but ensure the `institution_id` extraction from JWT is extremely robust. |

---

## 3. API & Shared Logic

| Severity | File | Issue | Recommendation |
| :--- | :--- | :--- | :--- |
| **MEDIUM** | `profiles.ts` | Uses `.select('*')` in `getProfiles` and `getProfileById`. | Explicitly select required columns only to prevent accidental PII leakage (e.g., in a JS bundle). |
| **LOW** | `institutions.ts` | Uses `.select('*')` in `getInstitution`. | Explicitly select required columns (name, slug, logo, etc.). |

---

## 4. Script & Environment Security

| Severity | script | Issue | Recommendation |
| :--- | :--- | :--- | :--- |
| **HIGH** | `deploy_to_oracle.sh` | Directly `rsync`s `.env.local` to production as `.env`. | Use a proper CI/CD secret manager or a separate `.env.production` file. |
| **MEDIUM** | `deploy_to_oracle.sh` | Hardcoded SSH key path and IP address. | Move configuration to environment variables or a config file. |
| **MEDIUM** | `dev.sh` | Destructive overwrite of `.env.local` on every run. | Append or prompt before overwriting existing environment files. |

---

## Next Steps
1. **Higher Priority**: Fix `invite-teacher` cleartext password leak.
2. **High Priority**: Add missing `DELETE` policies to Attendance RLS.
3. **High Priority**: Implement Zod validation in Edge Functions.
4. **Medium Priority**: Refactor shared queries to remove `select('*')`.
