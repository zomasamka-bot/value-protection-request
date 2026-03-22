# Value Protection Request - stable.pi

**Production-Ready One-Action Application for Pi Network Developer Portal**

## Overview

Value Protection Request is an institutional-grade governance application built for the Pi Network ecosystem, designed to demonstrate a unified Core Engine architecture where all behavior is defined through Action Configuration. The app provides a complete audit trail with evidence packs, monitoring hooks, and domain binding for the **stable.pi** domain.

## Application Type

**One-Action App** - Single clear flow:
1. Open → User views app in Pi Browser
2. Create Request → User initiates value protection request
3. Wallet Authorization → Pi wallet session approve/sign (authorization only, no asset custody)
4. Status → View complete evidence pack and audit trail

## Unified Architecture

### Core Engine (`/lib/core-engine.ts`)
Single source of truth for:
- Reference ID generation (VPR-STABLE-YYYYMMDD-XXXX format)
- Evidence pack creation with manifest data
- State machine management (Draft → Pending Approval → Approved → Rejected)
- Operation logging with timestamps
- Hook initialization (Limits / Approvals / Reporting)

### Action Configuration (`/lib/action-config.ts`)
Defines behavior through configuration:
- Domain binding: **stable.pi**
- Wallet authorization requirement
- Institutional-grade flag
- Hook configuration
- Execution flow with error handling

## Features

### Live State Updates
- Real-time status changes during request processing
- Live operation logs with timestamps
- Instant UI updates via React state management

### Evidence Pack
Complete audit trail including:
- **Reference ID**: Unique identifier for each request
- **Freeze ID**: Immutable snapshot identifier
- **Domain Binding**: Tied to stable.pi domain
- **Release Tag**: Version tracking
- **Runtime Logs**: Event-by-event execution trail
- **API Logs**: Backend interaction records
- **Manifest JSON**: Complete configuration export

### Monitoring Hooks
Institutional-grade governance layer:
- **Limits**: Transaction and operational boundaries
- **Approvals**: Multi-level authorization tracking
- **Reporting**: Audit and compliance reporting

### State Machine
Unified state flow:
```
Draft → Pending Approval → Approved
                        ↘ Rejected
```

## Technical Details

### Pi Network Integration
- **SDK Version**: 2.0
- **Authentication**: Username and payments scopes
- **Wallet Authorization**: Zero-amount signature for authorization only
- **No Asset Custody**: Approval-only workflow
- **Testnet Ready**: Configured for Pi Network testnet

### Domain Configuration
- **Target Domain**: stable.pi
- **Bound in Evidence**: All evidence packs include domain
- **UI Display**: Prominently featured in header and all records

### Mobile-First Design
- Optimized for Pi Browser on mobile devices
- Responsive layouts with Tailwind CSS
- Touch-friendly interactions
- Clean, institutional aesthetic

## Project Structure

```
/
├── app/
│   ├── layout.tsx          # Root layout with Pi authentication
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles and design tokens
├── lib/
│   ├── core-engine.ts      # Unified Core Engine
│   ├── action-config.ts    # Action Configuration Layer
│   ├── system-config.ts    # Pi Network configuration
│   ├── api.ts              # API client
│   └── pi-payment.ts       # Payment utilities
├── components/
│   ├── evidence-pack.tsx   # Evidence display component
│   ├── hooks-monitor.tsx   # Monitoring hooks display
│   ├── manifest-json.tsx   # Manifest JSON viewer
│   ├── state-machine-display.tsx  # State visualization
│   └── ...                 # Additional UI components
├── contexts/
│   └── pi-auth-context.tsx # Pi Network authentication
└── types/
    └── pi-sdk.d.ts         # Pi SDK type definitions
```

## Testing in Pi Browser

1. **Setup**:
   - Deploy to Pi App Engine or use developer sandbox
   - Configure backend URL in system-config.ts
   - Ensure Pi SDK loads correctly

2. **Test Flow**:
   - Open app in Pi Browser
   - Authenticate with Pi account
   - Click "Create Protection Request"
   - Approve wallet authorization (zero amount)
   - View completed evidence pack

3. **Validation Points**:
   - Check reference ID format (VPR-STABLE-YYYYMMDD-XXXX)
   - Verify domain binding in manifest
   - Confirm all runtime logs present
   - Test state machine transitions
   - Validate hooks monitoring display

## Portal Submission Checklist

- [x] Single clear action flow implemented
- [x] Pi SDK properly integrated
- [x] Wallet authorization (no payments)
- [x] Domain binding (stable.pi) throughout
- [x] Evidence pack with complete audit trail
- [x] Error handling and user feedback
- [x] Mobile-responsive design
- [x] Production-ready code quality
- [x] No asset custody or payment processing
- [x] Institutional-grade positioning

## Environment Variables

No environment variables required for core functionality. Backend URL is configured in `lib/system-config.ts`.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

Built for Pi Network Developer Portal submission.

## Support

For questions about this implementation or Pi Network integration, refer to the Pi Developer Documentation at https://developers.minepi.com
