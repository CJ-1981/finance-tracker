# Implementation Plan - SPEC-QR-001: QR Code for Invitation and Supabase Config Setup

## SPEC Metadata

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-QR-001 |
| Title | QR Code for Invitation and Supabase Config Setup |
| Domain | UI + AUTH |
| Priority | Medium |
| Status | Planned |
| Related Issue | #24 |

---

## EARS Requirements Structure

### WHEN Requirements (Event-Driven)

**WHEN** user generates invitation link, **THEN** system **SHALL** provide QR code generation option in invite success modal

**WHEN** user clicks "Show QR Code" button in invite modal, **THEN** system **SHALL** display scannable QR code containing invite URL

**WHEN** user opens Supabase config setup page, **THEN** system **SHALL** offer QR code scanning option alongside manual input

**WHEN** user grants camera permission, **THEN** system **SHALL** activate QR scanner with live camera preview

**WHEN** QR code is successfully scanned, **THEN** system **SHALL** extract URL, decode config, validate, and auto-fill form fields

**WHEN** camera permission is denied, **THEN** system **SHALL** display manual input fallback with clear explanation

**WHEN** scanned QR code contains invalid data, **THEN** system **SHALL** show specific error message and allow retry

**WHEN** invite modal is closed, **THEN** system **SHALL** stop camera stream and release resources

### WHERE Requirements (Display and Interaction)

QR code display **SHALL BE** integrated into invite success modal in `src/pages/ProjectsPage.tsx` (lines 710-767)

QR scanner **SHALL BE** accessible from ConfigPage in `src/pages/ConfigPage.tsx` (lines 88-131)

Camera preview **SHALL** use new modal component following existing modal patterns from `src/components/TransactionModal.tsx`

Error messages **SHALL** display inline following existing error patterns from `src/pages/ConfigPage.tsx`

QR code image **SHALL** support copy-to-clipboard functionality for pasting into email clients

Dark mode **SHALL BE** supported for all new QR-related components

### WHO Requirements (User Roles and Permissions)

Project administrators **MUST HAVE** ability to generate QR codes for project invitations

Invite recipients **MUST HAVE** ability to scan QR codes to accept invitations

Camera access **REQUIRES** explicit user permission via browser permission prompt

System **SHALL** validate user has appropriate project permissions before generating invite QR codes

System **SHALL NOT** store camera stream data beyond scanning session

### WHAT Requirements (Core Functionality)

QR code generation **SHALL** encode full invite URL including embedded Supabase config (if present)

QR code scanner **SHALL** use device camera to capture and decode QR codes

Config extraction **SHALL** use existing `decodeConfigFromInvite` function from `src/lib/inviteConfig.ts`

Validation **SHALL** verify decoded config format (URL structure, anonKey format)

Auto-fill **SHALL** populate Supabase config form fields with decoded values

System **SHALL** support both config-embedded and simple token invite links

System **SHALL** handle Base64-encoded config data with Unicode-safe decoding

### HOW Requirements (Implementation Approach)

QR code generation **SHALL** use `react-qr-code` library (stable, TypeScript-supported)

QR code scanning **SHALL** use `qr-scanner` library (cross-platform, mobile-optimized)

Modal components **SHALL** follow existing patterns from `TransactionModal.tsx` and `CashCounterModal.tsx`

State management **SHALL** use React useState with proper cleanup for camera streams

I18n integration **SHALL** add translation keys to `src/locales/en.json` following existing structure

Error handling **SHALL** include camera permission denied, invalid QR code, and HTTPS requirement warnings

Accessibility **SHALL** include ARIA labels for camera controls and keyboard navigation

---

## Implementation Plan

### Phase 1: QR Code Generation (Foundation)

**Goal:** Enable QR code generation for invite links in invite success modal

**Tasks:**

1. Install `react-qr-code` library
   ```bash
   npm install react-qr-code@^2.0.15
   ```

2. Create `QRCodeDisplay` component
   - Props: `url` (string), `size` (number, optional)
   - Renders QR code using `react-qr-code`
   - Includes copy-to-clipboard button
   - Supports dark mode styling

3. Modify `ProjectsPage.tsx` invite success modal (lines 710-767)
   - Add "Show QR Code" button alongside existing link display
   - Conditionally render QR code when button clicked
   - Maintain existing copy link functionality

4. Add I18n keys to `src/locales/en.json`
   - `qrCode.title`, `qrCode.generateQR`, `qrCode.copyQR`
   - Follow existing translation structure

**Success Criteria:**
- QR code generates successfully from invite URL
- QR code image can be copied and pasted into email clients
- Modal maintains existing functionality

**Complexity:** Low

### Phase 2: QR Code Scanner (Core Feature)

**Goal:** Enable QR code scanning via camera for Supabase config setup

**Tasks:**

1. Install `qr-scanner` library with TypeScript types
   ```bash
   npm install qr-scanner@^1.4.2
   npm install --save-dev @types/qr-scanner
   ```

2. Create `QRScannerModal` component
   - Follow modal pattern from `TransactionModal.tsx`
   - Props: `onScan` (callback with decoded URL), `onClose`
   - Camera preview with start/stop controls
   - Scan result display with confirmation

3. Integrate camera permission handling
   - Request `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`
   - Handle permission denied with fallback message
   - Stop camera stream on modal close

4. Add QR scanning to `ConfigPage.tsx`
   - Add "Scan QR Code" button near config form (line ~130)
   - Open `QRScannerModal` on button click
   - On scan success: decode config, validate, auto-fill form

5. Integrate with existing `decodeConfigFromInvite`
   - Import from `src/lib/inviteConfig.ts`
   - Validate decoded URL format
   - Extract Supabase config parameters
   - Populate form fields

**Success Criteria:**
- Camera activates with user permission
- QR code scanning successfully decodes invite URLs
- Config auto-fills form fields correctly
- Manual input remains available as fallback

**Complexity:** Medium

**Dependencies:** Depends on Phase 1 (establishes QR code patterns)

### Phase 3: Error Handling and Edge Cases (Robustness)

**Goal:** Handle all error scenarios gracefully with clear user feedback

**Tasks:**

1. Camera permission denied handling
   - Display clear explanation for permission requirement
   - Provide "Try Again" button
   - Fallback to manual input option

2. Invalid QR code handling
   - Detect non-QR code in camera view
   - Detect QR code with invalid URL format
   - Display specific error messages
   - Allow retry without closing modal

3. HTTPS requirement detection
   - Check if `window.location.protocol` is `https:` or `localhost`
   - Display warning if accessing via HTTP (not localhost)
   - Explain camera API HTTPS requirement

4. Mobile compatibility
   - Test on iOS Safari (user gesture requirement)
   - Test on Android Chrome
   - Ensure responsive camera preview
   - Handle orientation changes

5. Resource cleanup
   - Stop camera stream on unmount
   - Release media device references
   - Cleanup event listeners

**Success Criteria:**
- All error scenarios handled gracefully
- Clear error messages guide users
- No resource leaks (camera streams properly cleaned up)
- Mobile devices scan QR codes successfully

**Complexity:** Medium

**Dependencies:** Depends on Phase 2 (scanner implementation)

### Phase 4: I18n and Accessibility (Localization)

**Goal:** Full internationalization and accessibility support

**Tasks:**

1. Add translation keys to `src/locales/en.json`
   - `qrCode.title`: "QR Code Invitation"
   - `qrCode.scanInstructions`: "Scan this QR code to accept invitation"
   - `qrCode.generateQR`: "Generate QR Code"
   - `qrCode.scanQR`: "Scan QR Code"
   - `qrCode.scanning`: "Scanning QR code..."
   - `qrCode.scanSuccess`: "QR code scanned successfully"
   - `qrCode.scanError`: "Failed to scan QR code"
   - `qrCode.permissionDenied`: "Camera permission denied. Please enable camera access or enter config manually."
   - `qrCode.invalidQR`: "Invalid QR code. Please scan a valid invitation QR code."
   - `qrCode.httpsRequired`: "Camera access requires HTTPS (except localhost)."

2. Add corresponding translations to other locale files

3. Accessibility features
   - ARIA labels for camera controls
   - Keyboard navigation for all buttons
   - Focus management on modal open/close
   - Screen reader announcements for scan results

4. Dark mode support
   - Ensure all new components support `dark:` variants
   - Test QR code contrast in both themes
   - Ensure camera preview borders are visible

**Success Criteria:**
- All UI text is translatable
- Keyboard navigation works throughout
- Screen reader announces important events
- Dark mode displays correctly

**Complexity:** Low

**Dependencies:** Can be done in parallel with Phases 1-3

---

## Technical Stack

### Library Recommendations

| Library | Version | Purpose |
|---------|---------|---------|
| react-qr-code | ^2.0.15 | QR code generation (stable, TypeScript-supported) |
| qr-scanner | ^1.4.2 | QR code scanning (cross-platform, mobile-optimized) |
| @types/qr-scanner | Latest | TypeScript types for qr-scanner |

**Version Justification:**
- `react-qr-code` 2.0.15: Latest stable as of 2025, active maintenance, zero dependencies
- `qr-scanner` 1.4.2: Stable release, good mobile support, regular updates, TypeScript-compatible

**Installation Commands:**
```bash
npm install react-qr-code@^2.0.15 qr-scanner@^1.4.2
npm install --save-dev @types/qr-scanner
```

### Integration Points

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Invite generation | `src/pages/ProjectsPage.tsx` | 300-385 | `handleMultiInvite` function |
| Invite modal | `src/pages/ProjectsPage.tsx` | 710-767 | Success modal for QR display |
| Config setup | `src/pages/ConfigPage.tsx` | 88-131 | Config form and validation |
| Config encoding | `src/lib/inviteConfig.ts` | All | `encodeConfigForInvite`, `decodeConfigFromInvite` |
| Modal pattern | `src/components/TransactionModal.tsx` | All | Reusable modal structure |
| I18n | `src/locales/en.json` | All | Translation structure |

---

## Risk Analysis

### Browser Compatibility (Medium Risk)

**Risks:**
- Camera API requires HTTPS (except localhost)
- iOS Safari requires user gesture to start camera
- Desktop browsers have limited camera support

**Mitigation:**
- Feature detection before attempting camera access
- Clear error messages for unsupported browsers
- Manual input fallback always available
- Test matrix: Chrome, Firefox, Safari (iOS/macOS), Edge

### Camera Permission (Low Risk)

**Risks:**
- Users may deny camera permission
- Permission prompts may be confusing

**Mitigation:**
- Clear UX explaining why camera is needed
- Graceful denial handling with manual input option
- "Try Again" button after permission denial

### Security (Low Risk)

**Risks:**
- QR codes make tokens visible to nearby users
- Malicious QR codes could contain invalid data

**Mitigation:**
- Document token exposure as known limitation
- Existing config validation (`decodeConfigFromInvite`)
- Input sanitization before applying to localStorage
- Reject malformed or suspicious config

### Mobile UX (Medium Risk)

**Risks:**
- Camera preview may not work well on all devices
- Touch targets may be too small
- Orientation changes may break camera view

**Mitigation:**
- Responsive design for camera preview
- Large touch-friendly buttons (min 44x44px)
- Test on real devices (iOS and Android)
- Handle orientation changes gracefully

### Performance (Low Risk)

**Risks:**
- QR code generation may be slow for large URLs
- Camera preview may impact battery life

**Mitigation:**
- QR generation is typically fast (< 100ms)
- Stop camera when not needed (modal closed)
- Efficient QR scanning algorithm in qr-scanner library

---

## Reference Implementations

### Modal Pattern Reference

**File:** `src/components/TransactionModal.tsx`

**Pattern to Follow:**
```typescript
<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
  <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
    {/* Close button */}
    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
      <XMarkIcon className="w-6 h-6" />
    </button>

    {/* Content */}
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{title}</h2>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>

    {/* Footer with action buttons */}
    <div className="flex gap-3">
      <button onClick={onCancel} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300">
        Cancel
      </button>
      <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Invite Generation Reference

**File:** `src/pages/ProjectsPage.tsx`
**Lines:** 300-385 (`handleMultiInvite` function)

**Key Integration Point:**
- After successful invite generation, add QR code option to success modal
- Use existing `generateInviteLink` from `src/lib/inviteConfig.ts`

### Config Validation Reference

**File:** `src/pages/ConfigPage.tsx`
**Lines:** 88-131 (`handleSubmit` function)

**Key Integration Point:**
- Add "Scan QR Code" button near form (after line ~130)
- On scan success, populate form fields with decoded config

### Config Encoding/Decoding Reference

**File:** `src/lib/inviteConfig.ts`

**Functions to Use:**
- `encodeConfigForInvite(config: SupabaseConfig): string` - Already exists
- `decodeConfigFromInvite(url: string): SupabaseConfig | null` - Already exists
- `generateInviteLink(...)` - Already exists

---

## Acceptance Criteria Summary

1. **QR Generation:** QR code generates from invite URL and can be copied as image
2. **QR Scanning:** QR scanner successfully decodes invite URLs via camera
3. **Config Auto-fill:** Scanned config populates form fields correctly
4. **Error Handling:** All error scenarios handled with clear messages
5. **Mobile Support:** QR generation and scanning work on mobile devices
6. **Dark Mode:** All new components support dark theme
7. **I18n:** All UI text is translatable
8. **Accessibility:** Keyboard navigation and screen reader support
9. **Fallback:** Manual input always available as fallback
10. **Resource Cleanup:** Camera streams properly stopped on modal close

---

## Next Steps

1. Review this plan and approve for implementation
2. Run `/moai:2-run SPEC-QR-001` to begin implementation
3. Implementation will follow phases 1-4 in order
4. Each phase will be tested before moving to next phase

---

**Document Version:** 1.0
**Last Updated:** 2025-03-04
**Status:** Ready for Implementation
