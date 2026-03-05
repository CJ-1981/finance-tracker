# SPEC-QR-001: QR Code for Invitation and Supabase Config Setup

## TAG BLOCK

```yaml
SPEC_ID: SPEC-QR-001
TITLE: QR Code for Invitation and Supabase Config Setup
DOMAIN: UI + AUTH
PRIORITY: Medium
STATUS: Completed
CREATED: 2025-03-04
ISSUE: #24
```

## Environment

**Project Context:**
- Financial Tracking Web Application built with React 19, TypeScript, Vite
- Supabase backend with authentication and project management
- Current invite system generates text-based invite links
- Current config setup requires manual form entry

**Browser Environment:**
- Modern browsers with ES6+ support
- Camera API requires HTTPS (except localhost)
- Mobile-optimized responsive design required

**Development Environment:**
- React 19.2.4 with TypeScript
- Tailwind CSS 3.4.19 for styling
- i18next 25.8.13 for internationalization
- Supabase 2.97.0 for backend

## Assumptions

1. **Camera API Availability:** Users have devices with camera capability and browsers supporting MediaDevices API
2. **HTTPS Deployment:** Production deployment uses HTTPS (localhost exception during development)
3. **User Permissions:** Users will grant camera permission when prompted for QR scanning
4. **Config Format:** Existing `encodeConfigForInvite` and `decodeConfigFromInvite` functions remain compatible
5. **Modal Patterns:** Existing modal components (TransactionModal, CashCounterModal) provide sufficient patterns
6. **I18n Structure:** Existing translation structure in `src/locales/en.json` can be extended

## Requirements

### Ubiquitous Requirements (System-Wide)

The system **SHALL** maintain existing modal patterns for all new QR-related components

The system **SHALL** support dark mode for all QR code generation and scanning interfaces

The system **SHALL** provide internationalization support for all QR-related user-facing text

The system **SHALL** validate all Supabase config extracted from QR codes before applying to localStorage

The system **SHALL** provide manual input fallback when QR functionality is unavailable

### Event-Driven Requirements (WHEN...THEN...)

**WHEN** user generates invitation link, **THEN** the system **SHALL** provide QR code generation option in invite success modal

**WHEN** user clicks "Show QR Code" button, **THEN** the system **SHALL** display scannable QR code containing full invite URL

**WHEN** user clicks "Copy QR Code" button, **THEN** the system **SHALL** copy QR code image to clipboard for pasting into email clients

**WHEN** user opens Supabase config setup page, **THEN** the system **SHALL** display "Scan QR Code" option alongside manual input fields

**WHEN** user clicks "Scan QR Code" button, **THEN** the system **SHALL** open QR scanner modal with camera preview and file upload option

**WHEN** QR scanner modal opens, **THEN** the system **SHALL** display both camera scan and file upload options with clear explanation

**WHEN** user chooses camera scan, **THEN** the system **SHALL** request camera permission with clear explanation of purpose

**WHEN** user grants camera permission, **THEN** the system **SHALL** activate live camera preview for QR code scanning

**WHEN** user clicks "Upload QR Code Image" button, **THEN** the system **SHALL** open file picker for image selection

**WHEN** user selects an image file, **THEN** the system **SHALL** decode QR code from the uploaded image

**WHEN** camera detects valid QR code, **THEN** the system **SHALL** automatically decode and extract URL

**WHEN** QR code is successfully decoded, **THEN** the system **SHALL** validate URL format and extract Supabase config parameters

**WHEN** Supabase config is successfully extracted and validated, **THEN** the system **SHALL** auto-fill form fields and close scanner modal

**WHEN** user denies camera permission, **THEN** the system **SHALL** display manual input option with clear error message

**WHEN** QR scanner detects invalid QR code, **THEN** the system **SHALL** display specific error message and allow retry

**WHEN** user closes QR scanner modal, **THEN** the system **SHALL** stop camera stream and release media resources

**WHEN** scanned URL contains embedded Supabase config, **THEN** the system **SHALL** use existing `decodeConfigFromInvite` function for extraction

**WHEN** scanned URL contains only invitation token, **THEN** the system **SHALL** redirect to invitation acceptance flow

### State-Driven Requirements (IF...THEN...)

**IF** browser detects HTTP (not localhost) protocol, **THEN** the system **SHALL** display warning that camera API requires HTTPS

**IF** device does not have camera capability, **THEN** the system **SHALL** hide QR scan option and show file upload and manual input

**IF** user uploads invalid image file, **THEN** the system **SHALL** display specific error message and allow retry

**IF** uploaded image contains no QR code, **THEN** the system **SHALL** display "No QR code found" error and allow retry

**IF** QR code generation fails due to invalid URL, **THEN** the system **SHALL** display error message and offer link text fallback

**IF** extracted Supabase config fails validation, **THEN** the system **SHALL** display validation error and allow manual correction

**IF** camera stream cannot be acquired, **THEN** the system **SHALL** display technical error with troubleshooting steps

### Unwanted Requirements (SHALL NOT...)

The system **SHALL NOT** store camera stream data beyond the scanning session

The system **SHALL NOT** activate camera without explicit user action

The system **SHALL NOT** expose Supabase anon keys in error messages or logs

The system **SHALL NOT** apply config to localStorage without successful validation

The system **SHALL NOT** require camera access for users who prefer manual input

### Optional Requirements (Nice-to-Have)

**WHERE POSSIBLE**, the system **SHOULD** provide visual feedback when QR code is detected in camera view

**WHERE POSSIBLE**, the system **SHOULD** support both front and rear cameras on mobile devices

**WHERE POSSIBLE**, the system **SHOULD** provide haptic feedback on successful QR scan (mobile devices)

**WHERE POSSIBLE**, the system **SHOULD** remember last used camera preference

**WHERE POSSIBLE**, the system **SHOULD** support QR code scanning from uploaded images (fallback for devices without camera) ✅ IMPLEMENTED

## Specifications

### QR Code Generation Component

**Component Name:** `QRCodeDisplay`

**Location:** `src/components/QRCodeDisplay.tsx` (new file)

**Props:**
- `url: string` - The invite URL to encode as QR code
- `t: (key: string) => string` - Translation function for i18n
- `size?: number` - QR code size in pixels (default: 128)
- `darkMode?: boolean` - Whether to apply dark mode styles (default: false)

**Behavior:**
- Renders QR code using `react-qr-code` library
- Handles copy-to-clipboard internally with fallback for older browsers
- Displays "Copy QR Code" button below QR code
- Shows success feedback when QR code is copied
- Supports dark mode with appropriate contrast
- Truncates very long URLs for display (max 60 chars)

**Dependencies:**
- `react-qr-code@^2.0.18`

### QR Scanner Modal Component

**Component Name:** `QRScannerModal`

**Location:** `src/components/QRScannerModal.tsx` (new file)

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onScan: (url: string) => void` - Callback when QR code is successfully scanned
- `onClose: () => void` - Callback when modal is closed

**Behavior:**
- Follows modal pattern from `TransactionModal.tsx`
- Requests camera permission on mount
- Displays live camera preview
- Automatically detects and decodes QR codes
- Shows visual feedback when QR code is detected
- Handles permission denied state with fallback message
- Stops camera stream on unmount
- Displays error messages for invalid QR codes

**Dependencies:**
- `qr-scanner@^1.4.2`

### Integration Points

**Invite Success Modal Modification:**
- **File:** `src/pages/ProjectsPage.tsx`
- **Lines:** 710-767 (invite success modal)
- **Changes:**
  - Add "Show QR Code" toggle button
  - Conditionally render `QRCodeDisplay` component
  - Maintain existing copy link functionality

**Config Page Enhancement:**
- **File:** `src/pages/ConfigPage.tsx`
- **Lines:** 88-131 (config form area)
- **Changes:**
  - Add "Scan QR Code" button near form submit
  - Integrate `QRScannerModal` component
  - Handle scan result to auto-fill form fields
  - Use existing `validateConfig` for extracted config

**Config Extraction:**
- **File:** `src/lib/inviteConfig.ts`
- **Functions:** Existing `decodeConfigFromInvite` function
- **Usage:** No modification required, use as-is for config extraction

### I18n Keys

**Add to `src/locales/en.json`:**

```json
{
  "qr": {
    "title": "QR Code Invitation",
    "generateQR": "Generate QR Code",
    "showQR": "Show QR Code",
    "hideQR": "Hide QR Code",
    "copyQR": "Copy QR Code",
    "copied": "Copied!",
    "scanQR": "Scan QR Code",
    "scanning": "Scanning QR code...",
    "scanInstructions": "Position the QR code within the frame to scan",
    "scanSuccess": "QR code scanned successfully",
    "scanError": "Failed to scan QR code. Please try again.",
    "permissionDenied": "Camera permission denied. Please enable camera access or enter config manually.",
    "permissionRequired": "Camera access is required to scan QR codes",
    "invalidQR": "Invalid QR code. Please scan a valid invitation QR code.",
    "httpsRequired": "Camera access requires HTTPS. Please use HTTPS or localhost.",
    "noCamera": "No camera detected on this device.",
    "configExtracted": "Configuration extracted from QR code. Please verify and save."
  }
}
```

**Add to `src/locales/ko.json` (Korean translations):**

All English keys above MUST have corresponding Korean translations. Korean translations follow the same nested structure and use Korean text for all user-facing strings.

### Security Considerations

1. **Token Visibility:** QR codes make invitation tokens visible to nearby users. Document this as a known limitation.

2. **Config Validation:** All extracted Supabase config must pass existing `validateConfig` checks before application.

3. **Input Sanitization:** Use existing `decodeConfigFromInvite` function which includes validation and sanitization.

4. **Camera Privacy:**
   - Stop camera immediately when modal closes
   - Do not store or transmit camera stream data
   - Clear permission explanation in UI

5. **HTTPS Enforcement:** Detect HTTP access and warn users about camera API limitations.

### Error Handling

| Error Scenario | User Message | Action |
|----------------|--------------|--------|
| Camera permission denied | "Camera permission denied. Please enable camera access or enter config manually." | Show manual input option |
| Invalid QR code | "Invalid QR code. Please scan a valid invitation QR code." | Continue scanning, allow retry |
| No camera detected | "No camera detected on this device." | Hide scan option, manual input only |
| HTTPS required | "Camera access requires HTTPS. Please use HTTPS or localhost." | Hide scan option, manual input only |
| Config validation failed | "Invalid configuration in QR code. Please check and enter manually." | Show validation errors |
| Camera stream error | "Could not access camera. Please check permissions and try again." | Show retry button and manual input |

### Accessibility Requirements

- All QR-related buttons must have accessible labels
- Keyboard navigation must be supported for all interactions
- Focus must be managed when QR scanner modal opens and closes
- Scan success/failure must be announced to screen readers
- Camera preview must have appropriate ARIA labels
- Error messages must be associated with relevant controls

## Traceability

**Traceability Tags:**
- `@TAG:SPEC-QR-001` - All implementation files related to this SPEC
- `@TAG:QR-GENERATION` - QR code generation components
- `@TAG:QR-SCANNER` - QR code scanner components
- `@TAG:INVITE-FLOW` - Integration with invitation flow

**Related Files:**
- `src/components/QRCodeDisplay.tsx` (new)
- `src/components/QRScannerModal.tsx` (new)
- `src/pages/ProjectsPage.tsx` (modify)
- `src/pages/ConfigPage.tsx` (modify)
- `src/lib/inviteConfig.ts` (use existing)
- `src/locales/en.json` (modify)

**Related Components:**
- `TransactionModal.tsx` (pattern reference)
- `CashCounterModal.tsx` (pattern reference)
- `InvitePage.tsx` (invite flow reference)

---

## Implementation Notes

**Version:** 1.2
**Last Updated:** 2026-03-05
**Status:** Completed

### Scope Expansion: File Upload QR Scanning

The implementation included an OPTIONAL requirement from the original SPEC that was not part of the initial MVP scope:

**Implemented Feature:**
- QR code scanning from uploaded image files
- Provides fallback for devices without camera capability
- Enables scanning from saved QR code images
- No camera permission required for this method

**Implementation Details:**
- Added `jsqr` library dependency (v1.4.0) for image-based QR decoding
- Extended `QRScannerModal.tsx` with file upload functionality:
  - File input button: "Upload QR Code Image"
  - Image preview display before decoding
  - jsQR integration for decoding QR codes from image data
  - Error handling for invalid images and missing QR codes
- Added translation keys for file upload UI (EN/KO):
  - `qr.uploadImage`: "Upload QR Code Image"
  - `qr.or`: "or"
  - `qr.noQrFound`: "No QR code found in the uploaded image"
  - `qr.invalidImage`: "Invalid image file"

**Benefits:**
- Improved accessibility for users without cameras
- Privacy-friendly alternative (no camera permission needed)
- Flexibility to scan saved QR code images
- Fallback when camera access is denied or unavailable

**Quality Metrics:**
- All 21 tests passing
- Zero TypeScript errors
- Zero LSP warnings
- @MX:ANCHOR tag maintained for QRScannerModal component

---

**Document Version:** 1.1
**Last Updated:** 2026-03-04
**Status:** Implemented
