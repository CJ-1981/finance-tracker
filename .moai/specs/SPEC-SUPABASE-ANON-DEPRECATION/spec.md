# SPEC-SUPABASE-ANON-DEPRECATION: Supabase Anon Key Deprecation Investigation and Remediation

**Status**: Investigation Complete - Action Required
**Created**: 2026-03-06
**Last Updated**: 2026-03-06
**Priority**: Medium - Connection testing requires fix before April 8, 2026
**Impact**: Low - Only connection testing affected

---

## Executive Summary

This SPEC documents the investigation into Supabase's announced deprecation of OpenAPI spec access via anon key and provides the required remediation plan for the finance-tracker application.

**Key Finding** (2026-03-06):
- **Deprecation CONFIRMED**: OpenAPI spec endpoint `/rest/v1/` via anon key
- **Deadline**: April 8, 2026 for all existing projects
- **Normal Usage SAFE**: Client library and standard data API operations unaffected
- **Finance Tracker Impact**: Only connection testing function requires update
- **Action Required**: Update `testConnection()` to use alternative endpoint or approach

---

## Background

### Supabase Announcement Summary

**Source**: GitHub Discussion #42949 - "Breaking Change: Removing access to OpenAPI spec via the anon key"

**What's Changing**:
- The Data API returns OpenAPI schema at root path: `/rest/v1/`
- Starting March 11, 2026: Newly created projects blocked
- Starting April 8, 2026: All existing projects blocked (FINAL DEADLINE)
- Access via anon key will return: `403 Forbidden`

**Why**:
- Endpoint exposes schema details (tables, columns, types) to anyone with anon key
- Less than 0.1% of projects use this endpoint with anon key
- Security tightening to reduce schema information exposure
- Alternative: Use service_role key during development

---

## Investigation Findings

### Finance Tracker Usage Analysis

**Current Anon Key Usage in Codebase**:

1. **Supabase Client Initialization** (`src/lib/supabase.ts:17`)
   ```typescript
   supabaseInstance = createClient<Database>(config.url, config.anonKey, {...})
   ```
   - Status: ✅ **NOT AFFECTED** - Client library usage explicitly excluded

2. **Connection Testing** (`src/lib/supabase.ts:116-121`)
   ```typescript
   const response = await fetch(`${config.url}/rest/v1/`, {
     headers: {
       'apikey': config.anonKey,
       'Authorization': `Bearer ${config.anonKey}`
     }
   })
   ```
   - Status: ⚠️ **AFFECTED** - Fetches OpenAPI spec via anon key
   - Impact: Will return 403 after April 8, 2026

3. **Auth Health Check** (`src/lib/supabase.ts:132-138`)
   ```typescript
   const authResponse = await fetch(`${config.url}/auth/v1/health`, {
     headers: {
       'apikey': config.anonKey,
     }
   })
   ```
   - Status: ✅ **NOT AFFECTED** - `/auth/v1/health` not targeted by deprecation

4. **Standard Data Operations** (throughout application)
   ```typescript
   supabase.from('table').select()  // Safe
   supabase.from('table').insert()  // Safe
   supabase.rpc('function_name')   // Safe
   ```
   - Status: ✅ **NOT AFFECTED** - Normal data API operations explicitly excluded

### Codebase Impact Summary

| Component | File Location | Status | Action Required |
|-----------|----------------|----------|-----------------|
| Client initialization | `src/lib/supabase.ts:17` | ✅ Safe | None |
| Connection test (OpenAPI) | `src/lib/supabase.ts:116` | ⚠️ Affected | Yes |
| Auth health check | `src/lib/supabase.ts:132` | ✅ Safe | None |
| Data operations | Multiple files | ✅ Safe | None |

### Rollout Timeline

| Date | Change | Status |
|-------|---------|--------|
| Feb 17, 2026 | Changelog published | ✅ Complete |
| Mar 4, 2026 | Newsletter announcement | ✅ Complete |
| Mar 6, 2026 | Email to affected projects | ✅ Complete |
| Mar 11, 2026 | New projects blocked | ⏳ Upcoming |
| Mar 24, 2026 | Final email notification | 🔜 Future |
| Apr 8, 2026 | All projects blocked | 🔜 **DEADLINE** |

---

## Remediation Plan

### Issue

The `testConnection()` function in `src/lib/supabase.ts` currently tests connectivity by fetching the OpenAPI spec from `/rest/v1/` using the anon key. After April 8, 2026, this will fail with a 403 error.

### Recommended Solution

Replace the OpenAPI spec fetch with a more appropriate health check mechanism.

#### Option A: Auth Health Check (Recommended)

**Approach**: Use the existing `/auth/v1/health` endpoint that is already being tested as a fallback.

**Pros**:
- Already implemented in code (lines 132-138)
- Auth endpoint explicitly not affected by deprecation
- Simple, no additional endpoints required
- Works with anon key

**Implementation**:
```typescript
// Replace the primary connection test (lines 116-138) with:
const authResponse = await fetch(`${config.url}/auth/v1/health`, {
  headers: {
    'apikey': config.anonKey,
  }
})

return authResponse.ok || authResponse.status === 401
```

**Effort**: Low (5 minutes)

#### Option B: Database Query Test

**Approach**: Use Supabase client to perform a simple query (e.g., check if a system table exists).

**Pros**:
- Tests actual database connectivity
- More comprehensive health check
- Uses client library (guaranteed to work)

**Cons**:
- Requires a known table to query
- Slightly more complex logic
- May fail if database has issues unrelated to connectivity

**Implementation**:
```typescript
// Try to fetch a simple query
try {
  const { error } = await supabase.from('auth.users').select('id').limit(1)
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found (expected)
    throw error
  }
  return true
} catch (err) {
  // Fallback to auth health check
  const authResponse = await fetch(`${config.url}/auth/v1/health`, {
    headers: { 'apikey': config.anonKey }
  })
  return authResponse.ok || authResponse.status === 401
}
```

**Effort**: Medium (15-20 minutes)

#### Option C: Remove Connection Test Entirely

**Approach**: Remove the `testConnection()` function entirely and rely on runtime error handling.

**Pros**:
- Simplest solution
- No endpoints to maintain
- Runtime errors will naturally surface connectivity issues

**Cons**:
- Worse user experience (errors appear during setup instead of upfront validation)
- May delay troubleshooting
- Less proactive error detection

**Effort**: Low (10 minutes to remove function and update callers)

### Recommendation

**Go with Option A: Auth Health Check**

This is the best choice because:
1. Already implemented as fallback in current code
2. Auth endpoint explicitly not affected by deprecation
3. Minimal code changes required
4. Provides adequate connectivity verification
5. Works reliably with anon key

---

## Acceptance Criteria

### Functional Requirements

1. **Connection Testing**:
   - [ ] Connection test works correctly after April 8, 2026
   - [ ] No errors returned when project is accessible
   - [ ] Appropriate error messages when connection fails

2. **Compatibility**:
   - [ ] Changes work with existing Supabase projects
   - [ ] No breaking changes to API
   - [ ] Configuration flow remains unchanged

3. **Testing**:
   - [ ] Manual testing in development environment
   - [ ] Verify error handling for various failure scenarios
   - [ ] Test with anon key only (no service role required)

### Non-Functional Requirements

1. **Reliability**:
   - [ ] False positive rate < 1%
   - [ ] False negative rate < 1%
   - [ ] Response time < 2 seconds

2. **Maintainability**:
   - [ ] Code is well-documented
   - [ ] Changes are minimal and focused
   - [ ] No additional dependencies introduced

---

## Implementation Plan

### Phase 1: Code Update (Day 1)

**Tasks**:
1. Update `testConnection()` function in `src/lib/supabase.ts`
2. Remove OpenAPI spec fetch logic (lines 116-127)
3. Use auth health check as primary test method
4. Update comments to reflect change
5. Remove now-redundant fallback to auth check

**Files Modified**:
- `src/lib/supabase.ts` (lines 109-144)

### Phase 2: Testing (Day 1)

**Tasks**:
1. Manual test in development environment
2. Test with valid Supabase credentials
3. Test with invalid credentials
4. Test with network failures
5. Verify error messages are clear

### Phase 3: Documentation Update (Optional)

**Tasks**:
1. Update any documentation referencing connection testing
2. Update CHANGELOG.md if applicable
3. No deployment guide changes needed (configuration remains same)

---

## Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|-------|----------|------------|-------------|
| Auth endpoint also deprecated in future | Medium | Low | Monitor Supabase announcements |
| Connection test less effective with auth endpoint | Low | Medium | Accept as adequate for connectivity verification |
| Regression in existing functionality | Low | Low | Comprehensive testing before deployment |

---

## Rollout Plan

### Pre-Deployment (Before April 8, 2026)

1. **Development Testing**:
   - Test changes in local development environment
   - Verify all connection scenarios work correctly

2. **Deployment**:
   - Deploy to production before April 8, 2026 deadline
   - Monitor for any unexpected errors

3. **Post-Deployment**:
   - Monitor connection test success rates
   - Check for any user-reported issues
   - Verify no increase in support tickets

### Contingency

If unexpected issues arise:
- Revert to previous version immediately
- Use service role key temporarily (not recommended for client-side)
- Report issue to Supabase support

---

## Questions and Open Issues

1. **None** - All questions resolved after reading GitHub discussion

---

## Next Steps

1. **Immediate Action**: Update `testConnection()` function (Recommended: Option A)
2. **Testing**: Verify changes in development environment
3. **Deployment**: Deploy before April 8, 2026 deadline
4. **Monitoring**: Watch for any connection test failures post-deployment

---

## References

### External Documentation
- GitHub Discussion #42949: https://github.com/orgs/supabase/discussions/42949
- Supabase Documentation: https://supabase.com/docs
- Auth API Reference: https://supabase.com/docs/reference/javascript/auth-getuser

### Internal Documentation
- `src/lib/supabase.ts` - Connection testing implementation
- `src/lib/config.ts` - Configuration management
- `src/types/index.ts` - Type definitions

---

**Document Status**: Investigation Complete - Action Required

**Deadline**: April 8, 2026

**Priority**: Medium - Connection testing requires update before deadline

**Contact**: chimin
