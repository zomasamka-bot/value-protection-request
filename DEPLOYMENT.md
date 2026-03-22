# Deployment Guide - Value Protection Request (stable.pi)

## Pre-Deployment Checklist

### 1. Code Verification
- [x] All TypeScript types are correct
- [x] No console errors in development
- [x] Pi SDK integration tested
- [x] Error handling implemented
- [x] Mobile-responsive verified

### 2. Domain Configuration
- [x] Domain set to **stable.pi** in action-config.ts
- [x] Domain bound in all evidence packs
- [x] Domain displayed in UI header
- [x] Domain included in manifest JSON

### 3. Pi Network Integration
- [x] Pi SDK v2.0 configured
- [x] Authentication scopes correct (username, payments)
- [x] Wallet authorization implemented
- [x] Zero-amount payment for authorization only
- [x] Incomplete payment handling configured

## Deployment Steps

### Option 1: Pi App Engine (Recommended)

1. **Prepare Repository**
   ```bash
   git init
   git add .
   git commit -m "Production-ready Value Protection Request app"
   ```

2. **Connect to Pi Developer Portal**
   - Log in to https://developers.minepi.com
   - Create new app or select existing
   - Link GitHub repository

3. **Configure Deployment**
   - Set build command: `npm run build`
   - Set start command: `npm start`
   - Set Node version: 18.x or higher

4. **Request Domain**
   - Submit request for **stable.pi** domain
   - Provide app description and purpose
   - Include evidence of institutional-grade features

5. **Deploy**
   - Push to main branch or trigger manual deployment
   - Monitor build logs
   - Test in Pi Browser once deployed

### Option 2: Custom Hosting

If deploying to your own infrastructure:

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Configure Backend**
   - Ensure backend URL in system-config.ts points to your backend
   - Backend must be accessible from Pi Network

3. **Deploy Built App**
   - Upload .next folder and dependencies
   - Configure Node.js server (18.x+)
   - Set up SSL certificate (required for Pi SDK)

4. **Update Pi Developer Portal**
   - Register app with Pi Network
   - Provide your custom domain/URL
   - Request stable.pi domain mapping

## Post-Deployment Testing

### 1. Pi Browser Testing
```
Test Device: Mobile device with Pi Browser installed
Test Account: Use testnet Pi account

Steps:
1. Open app in Pi Browser
2. Complete authentication
3. Create protection request
4. Approve wallet authorization
5. Verify evidence pack displays correctly
6. Check all monitoring hooks show "active"
7. Verify domain displays as "stable.pi"
8. Test state machine transitions
9. Verify all timestamps are accurate
10. Export and verify manifest JSON
```

### 2. Desktop Testing
```
Browser: Chrome/Firefox with Pi SDK fallback
Purpose: Verify development mode works

Expected Behavior:
- Simulated wallet authorization (no Pi SDK)
- All features functional except actual Pi auth
- Evidence packs generate correctly
- State machine works as expected
```

### 3. Error Handling Testing
```
Test Scenarios:
1. Cancel wallet authorization → Should show rejected state
2. Network error during request → Should display error message
3. Invalid state transition → Should log error
4. Missing Pi SDK → Should show appropriate error
```

## Domain Approval Process

### Requesting stable.pi Domain

1. **Prepare Application Profile**
   - App Name: Value Protection Request
   - Domain Request: stable.pi
   - Purpose: Institutional-grade governance and value protection
   - User Base: Testnet users, institutional partners

2. **Demonstrate Requirements**
   - Show unified architecture documentation
   - Provide evidence pack examples
   - Demonstrate monitoring hooks
   - Highlight institutional features

3. **Submit for Review**
   - Complete app submission in Pi Developer Portal
   - Include this documentation
   - Reference Core Engine architecture
   - Emphasize no-custody, authorization-only approach

4. **Review Stages**
   - Technical review (code quality, security)
   - Domain validation (stable.pi appropriateness)
   - User experience review
   - Final approval and domain assignment

## Monitoring After Deployment

### Key Metrics to Track

1. **User Flow Completion Rate**
   - Track: Draft → Pending → Approved transitions
   - Goal: >90% completion rate
   - Monitor: Rejection reasons

2. **Evidence Pack Generation**
   - Verify all fields populate correctly
   - Check domain binding consistency
   - Validate manifest JSON structure

3. **Wallet Authorization Success**
   - Track authorization approval rate
   - Monitor cancellation rate
   - Log any Pi SDK errors

4. **Performance**
   - State update latency
   - Evidence pack generation time
   - UI responsiveness on mobile

### Debug Console Messages

The app uses `[v0]` prefixed console logs for debugging:
```javascript
[v0] Wallet approval requested - authorization session
[v0] Requesting Pi wallet authorization session...
[v0] Wallet authorization ready: <paymentId>
[v0] Wallet authorization completed: { paymentId, txid }
[v0] Failed to create request: <error>
```

## Rollback Procedure

If issues arise post-deployment:

1. **Immediate Actions**
   - Revert to previous working version
   - Notify users via Pi Developer Portal
   - Log all errors for analysis

2. **Investigation**
   - Review error logs
   - Check Pi SDK version compatibility
   - Verify backend connectivity
   - Test wallet authorization flow

3. **Fix and Redeploy**
   - Address identified issues
   - Test thoroughly in sandbox
   - Deploy fix
   - Monitor for 24 hours

## Support and Maintenance

### Regular Checks
- Weekly: Review error logs
- Monthly: Update dependencies
- Quarterly: Review Pi SDK updates

### Contact Points
- Pi Developer Support: https://developers.minepi.com/support
- Community Forum: Pi Developer Discord
- Documentation: https://developers.minepi.com/docs

## Success Criteria

Application is production-ready when:
- [x] Deploys without errors
- [x] Pi authentication works in Pi Browser
- [x] Wallet authorization completes successfully
- [x] Evidence packs generate with correct domain
- [x] All state transitions work smoothly
- [x] Monitoring hooks display correctly
- [x] Error handling provides clear feedback
- [x] Mobile UI is responsive and clean
- [x] Domain stable.pi is bound throughout
- [x] Ready for institutional use cases

## Next Steps After Deployment

1. Monitor user feedback
2. Collect usage analytics
3. Plan additional action configurations (future apps)
4. Expand Core Engine capabilities
5. Add institutional partner features
