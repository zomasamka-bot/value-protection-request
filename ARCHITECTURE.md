# Value Protection Request - Architecture

## Overview

Value Protection Request is a **One-Action App** built on the **stable.pi** domain using a **unified Core Engine** architecture. The application provides institutional-grade governance workflows with full audit trails and evidence packs, designed for expansion without rebuilding the core.

## Architecture Principles

### 1. Unified Core Engine
- **Location**: `/lib/core-engine.ts`
- **Purpose**: Reusable across all applications
- **Responsibilities**:
  - Reference ID generation (VPR-STABLE-YYYYMMDD-XXXX format)
  - Evidence pack creation with full manifest
  - State machine management
  - Operation logging
  - Hook initialization

### 2. Action Configuration Layer
- **Location**: `/lib/action-config.ts`
- **Purpose**: Defines behavior through configuration
- **Key Config**: `VALUE_PROTECTION_CONFIG`
  - Name: Value Protection Request
  - Domain: stable.pi
  - Institutional Grade: true
  - Hooks: Limits / Approvals / Reporting

### 3. Clear Separation of Concerns
```
┌─────────────────────────────────────┐
│     Application Layer (UI)          │
│     - Components                    │
│     - Page Logic                    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Action Configuration Layer        │
│   - ActionManager                   │
│   - Config Definitions              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Core Engine Layer              │
│      - State Machine                │
│      - Evidence Generation          │
│      - Operation Logging            │
└─────────────────────────────────────┘
```

## State Machine

### Unified States
```
Draft → Pending Approval → Approved
                         ↘ Rejected
```

### State Definitions
- **Draft**: Initial record created, evidence pack generated
- **Pending Approval**: Submitted for wallet authorization
- **Approved**: Wallet authorization completed, evidence finalized
- **Rejected**: Authorization denied or failed

## One-Action Flow

```
Open → Perform Action → Wallet Session Approve/Sign → Status
```

1. **Open**: User views the app, sees action configuration
2. **Perform Action**: User initiates Value Protection Request
3. **Wallet Approve**: Authorization-only session (no payments/custody)
4. **Status**: Live state updates with complete evidence pack

## Evidence Pack

Every action generates a comprehensive evidence pack:

### Components
- **Reference ID**: Unique identifier (VPR-STABLE-YYYYMMDD-XXXX)
- **Domain**: stable.pi (bound and displayed)
- **Timestamp**: ISO 8601 format
- **Manifest JSON**:
  - Domain binding
  - Hook configuration
  - Release tag
  - Freeze ID
- **Runtime Log**: Timestamped operation sequence
- **API Log**: Action initiation record

## Monitoring Hooks

Three institutional-grade monitoring hooks:

### 1. Limits Hook
- Purpose: Track and enforce governance limits
- Status: Active monitoring
- Real-time validation

### 2. Approvals Hook
- Purpose: Authorization tracking and audit
- Status: Active monitoring
- Wallet session verification

### 3. Reporting Hook
- Purpose: Compliance and audit reporting
- Status: Active monitoring
- Evidence aggregation

## Components

### Core Components
- **StatusBadge**: Displays unified state with proper labeling
- **EvidencePack**: Shows complete evidence manifest
- **HooksMonitor**: Real-time hook status display
- **OperationLog**: Timestamped action sequence
- **RecordCard**: Request summary with domain display

### Layout
- Mobile-first responsive design
- Sticky header with domain binding display
- Single-action primary interface
- Detailed dialog for evidence inspection

## Domain Architecture

### stable.pi Binding
- Domain displayed in header
- Included in all evidence manifests
- Referenced in API logs
- Part of reference ID generation

### Institutional Positioning
- Full audit trail
- Evidence-based governance
- Compliance-ready architecture
- No asset custody or payments
- Authorization-only workflows

## Extensibility

### Adding New Actions
1. Define new `ActionConfig` in `/lib/action-config.ts`
2. No changes required to Core Engine
3. UI automatically adapts to configuration
4. Evidence pack generation is automatic

### Example New Action
```typescript
export const NEW_ACTION_CONFIG: ActionConfig = {
  name: "New Action",
  description: "Description of new action",
  domain: "stable.pi", // or new domain
  requiresWalletApproval: true,
  institutionalGrade: true,
  hooks: {
    limits: true,
    approvals: true,
    reporting: true,
  },
};
```

## Technical Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Blockchain**: Pi Network (testnet)
- **State Management**: React hooks
- **Design**: Mobile-first responsive

## Future Expansion

The architecture supports:
- Multiple domains (stable.pi, base.pi, etc.)
- Additional hook types
- Custom evidence requirements
- Extended state machines
- Integration with external systems
- Multi-action workflows

All without modifying the Core Engine.
