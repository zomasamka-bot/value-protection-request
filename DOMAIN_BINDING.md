# Domain Binding: stable.pi

## Official Domain Assignment

**Application Name:** Value Protection Request  
**Assigned Domain:** `stable.pi`  
**Status:** ✅ Verified and Bound

---

## Domain Integration Points

### 1. Application Metadata
- **File:** `app/layout.tsx`
- **Integration:** Meta description includes domain reference
- **Keywords:** Domain included in SEO keywords array

### 2. Header Display
- **File:** `app/page.tsx`
- **Integration:** Domain badge with verification checkmark in header
- **Visibility:** Persistent across all app views

### 3. Configuration Layer
- **File:** `lib/action-config.ts`
- **Integration:** `VALUE_PROTECTION_CONFIG.domain = "stable.pi"`
- **Usage:** Used throughout Core Engine for record generation

### 4. Evidence Pack
- **File:** `lib/core-engine.ts`
- **Integration:** Domain embedded in:
  - Evidence manifest JSON
  - Reference ID generation (VPR-STABLE-YYYYMMDD-XXXX)
  - Runtime logs
  - API logs

### 5. UI Components
- **DomainBadge:** Displays domain with globe icon and verified shield
- **DomainInfoCard:** Full domain information card in record details
- **InstitutionalBanner:** Domain badge in governance banner
- **EvidencePack:** Domain highlighted in evidence display
- **RecordCard:** Domain shown in each record listing

### 6. Pi SDK Integration
- **File:** `lib/action-config.ts`
- **Integration:** Domain included in wallet authorization metadata
- **Memo:** "Value Protection Request Authorization - stable.pi"

---

## Verification Checklist

✅ Domain visible in app header  
✅ Domain in page metadata/description  
✅ Domain bound in Core Engine  
✅ Domain in evidence manifests  
✅ Domain in reference IDs (VPR-STABLE format)  
✅ Domain in runtime logs  
✅ Domain in Pi wallet authorization  
✅ Domain in UI components (badges, cards)  
✅ Domain in institutional banner  
✅ Domain in record listings  

---

## Developer Portal Compliance

The application explicitly displays and binds the **stable.pi** domain throughout:

1. **User-Facing:** Domain badges, headers, and information cards
2. **Technical:** Core Engine, evidence packs, and manifest JSON
3. **Integration:** Pi SDK wallet authorization metadata
4. **Audit Trail:** Every record and log references the domain

This ensures clear domain-to-app linkage for Pi Network Developer Portal review and testnet deployment.

---

## Reference ID Format

```
VPR-STABLE-YYYYMMDD-XXXX
 │    │      │       │
 │    │      │       └─ Random 4-digit identifier
 │    │      └────────── Creation date
 │    └───────────────── Domain prefix (STABLE)
 └────────────────────── Application prefix (Value Protection Request)
```

---

## Evidence Manifest Structure

```json
{
  "domain": "stable.pi",
  "hooks": {
    "limits": true,
    "approvals": true,
    "reporting": true
  },
  "releaseTag": "v1.0.0-stable-2024",
  "freezeId": "FREEZE-1234567890"
}
```

The domain is the **primary key** in the manifest, ensuring all evidence is bound to `stable.pi`.
