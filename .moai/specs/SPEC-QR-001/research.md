# Phase 0.5 Deep Research - Issue #24: QR Code for Invitation and Supabase Config Setup

## 1. Architecture Analysis

### Invitation Generation Flow (`src/pages/ProjectsPage.tsx`)
- **Location**: Lines 300-385 (`handleMultiInvite` function)
- **Current Implementation**:
  - Generates invitation tokens using `Math.random().toString(36).substring(2) + Date.now().toString(36)`
  - Stores invitations in `invitations` table with token, project_id, email, role, invited_by
  - Uses `generateInviteLink` from `../lib/inviteConfig` to create combined invite links
  - Supports multiple project invitations with single link
- **Config Embedding**: Uses `encodeConfigForInvite` to embed Supabase config in invite links
- **Modal Display**: Lines 664-767 show invite success modal with link display and email client integration

### Config Setup Flow (`src/pages/ConfigPage.tsx`)
- **Location**: Lines 88-131 (`handleSubmit` function)
- **Current Implementation**:
  - Stores Supabase config in localStorage
  - Tests connection using `testConnection` function
  - Supports three modes: `configure`, `signin`, `authenticated`
  - Handles invitation token redirection (lines 105-116)
- **Validation**: Uses `validateConfig` function to check URL and anonKey format

### Config Encoding/Decoding (`src/lib/inviteConfig.ts`)
- **Encoding**: `encodeConfigForInvite` uses Unicode-safe Base64 encoding
- **Decoding**: `decodeConfigFromInvite` with validation
- **Link Generation**: `generateInviteLink` supports single/multiple tokens with embedded config

## 2. Existing Modal Patterns

### TransactionModal (`src/components/TransactionModal.tsx`)
- **Structure**: Fixed overlay with backdrop blur, centered content
- **State Management**: Uses React state for form data, loading states
- **Form Pattern**: Controlled inputs with validation
- **Buttons**: Primary/secondary button pattern with loading states
- **Dark Mode**: Full dark theme support with `dark:bg-slate-800`

### CashCounterModal (`src/components/CashCounterModal.tsx`)
- **Structure**: Similar fixed overlay pattern
- **Complex State**: Multiple categories (anonymous/named), denomination tracking
- **Data Persistence**: localStorage integration with project-specific keys
- **Real-time Calculations**: Live total updates with breakdown display

### Common Modal Pattern
```typescript
// Fixed overlay with backdrop
<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
  <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
    {/* Close button */}
    <button onClick={onClose} className="absolute top-4 right-4">✕</button>
    {/* Content */}
    {/* Footer with action buttons */}
  </div>
</div>
```

## 3. I18n Patterns

### Translation Structure (`src/locales/en.json`)
- **Nested Organization**: Organized by feature (projects, transactions, config, etc.)
- **Interpolation**: Uses `{{variable}}` syntax for dynamic content
- **Pluralization**: Supports plural forms with `_one`, `_other` suffixes
- **Default Values**: Fallback patterns for missing translations

### Key Translation Keys for QR Feature
```json
"projects": {
  "invite": "Invite",
  "inviteToProjects": "Invite to Projects",
  "invitationLinkGenerated": "QR code generated for {{count}} projects."
},
"qrCode": {
  "title": "QR Code Invitation",
  "scanInstructions": "Scan this QR code to accept invitation",
  "generateQR": "Generate QR Code",
  "qrScanning": "Scanning QR code...",
  "qrScanSuccess": "QR code scanned successfully",
  "qrScanError": "Failed to scan QR code"
}
```

## 4. Package Dependencies Analysis

### Current Stack (`package.json`)
- **React**: v19.2.4 with TypeScript
- **Routing**: React Router v7.13.0
- **UI Styling**: Tailwind CSS v3.4.19
- **Supabase**: v2.97.0
- **Charting**: Chart.js v4.5.1
- **I18n**: i18next v25.8.13

### Selected Dependencies for QR Feature
- **QR Code Generation**: `react-qr-code@^2.0.18` (installed)
- **QR Code Scanning**: `qr-scanner@^1.4.2` (installed)
- **Testing**: `vitest`, `@testing-library/react`, `jsdom` (installed)

## 5. Critical Implementation Questions

### Modal Pattern Reusability
- **YES**: Can reuse existing modal patterns from TransactionModal/CashCounterModal
- **Adaptations Needed**: Camera preview area, scan button, result display

### QR Code Embedding in Invite Modal
- **Location**: Invite success modal (lines 730-733 in ProjectsPage.tsx)
- **Current Display**: Shows link as text with copy buttons
- **Enhancement**: Add QR code option alongside text link

### Camera Permission Handling
- **Browser Requirements**: HTTPS (except localhost)
- **User Experience**: Request permission with clear explanation
- **Fallback Options**: Manual input of invite link if camera unavailable

### Config Validation from QR
- **Current System**: `decodeConfigFromInvite` function already exists
- **Enhancement**: Add real-time validation with error messages

## 6. Data Flow Architecture

```text
Generate Invite Link
  ↓
Embed Config in URL
  ↓
Display Invite Modal
  ↓
User Clicks "Show QR Code"
  ↓
QR Scanner Modal Opens
  ↓
Camera Preview + Scan Button
  ↓
QR Code Scanned
  ↓
Extract URL from QR
  ↓
Decode Config from URL
  ↓
Validate Config
  ↓
Redirect to Config with Token
  ↓
Auto-fill Supabase Config
  ↓
User Completes Setup
```

## 7. Risks and Constraints

### Browser Camera API Limitations
- **HTTPS Requirement**: Won't work on HTTP (except localhost)
- **Mobile Compatibility**: Requires mobile-optimized UI
- **Permission Handling**: Clear UX for permission requests

### Cross-Platform Considerations
- **iOS**: Requires user gesture to start camera
- **Android**: Similar gesture requirements
- **Desktop**: Limited camera support, fallback to file upload

### Security Considerations
- **Token Exposure**: QR codes make tokens visible to nearby users
- **Expiry**: Consider implementing token expiry for QR codes
- **One-Time Use**: Single-use QR codes for security

## 8. Reference Implementations

### Invite Success Modal
- **File**: `src/pages/ProjectsPage.tsx`
- **Lines**: 710-767
- **Pattern**: Success icon, title, description, action buttons, link display

### Config Validation
- **File**: `src/pages/ConfigPage.tsx`
- **Lines**: 88-131
- **Pattern**: Form validation, error display, success handling

### Error State Handling
- **File**: `src/pages/InvitePage.tsx`
- **Lines**: 215-246
- **Pattern**: Different status states with appropriate UI

## 9. Testing Strategy

### Test Cases to Verify
1. QR Generation: Invite link generates readable QR code
2. QR Scanning: QR code correctly decodes to original URL
3. Config Extraction: Decoded config passes validation
4. Error Handling: Camera denied, invalid QR, network errors
5. Mobile Responsiveness: QR displays and scans on mobile devices
6. Dark Mode: QR code works in both light/dark themes
