
# Create Test Client with Full Portfolio Flow

## Overview

I'll create a complete test scenario with a new client, 5 investment quotes, and convert them into portfolio properties. This will allow you to verify the entire flow end-to-end: Client Management → Quotes → Portfolio → Client Portal.

---

## Test Data to Create

### Step 1: Create Test Client

**Client: "Maria Santos"**
- Email: maria.santos@test.com
- Phone: +971 50 999 8888
- Country: Colombia
- Portal Enabled: Yes (with portal token)

### Step 2: Create 5 Quotes (Investment Proposals)

| # | Project Name | Developer | Unit | Type | Price (AED) | Status |
|---|--------------|-----------|------|------|-------------|--------|
| 1 | Marina Vista Tower | Emaar | 1204 | 2BR Apartment | 2,850,000 | draft |
| 2 | Creek Harbour Residences | Emaar | 2508 | 3BR Apartment | 4,200,000 | draft |
| 3 | Downtown Edge | Sobha | 1605 | 1BR Apartment | 1,680,000 | sold |
| 4 | Palm Beach Towers | Nakheel | 801 | 2BR Apartment | 3,100,000 | sold |
| 5 | Business Bay Central | Damac | 2212 | Studio | 890,000 | sold |

### Step 3: Convert 3 Quotes to Portfolio Properties

Properties 3, 4, and 5 will be converted to acquired properties with:
- Purchase dates in the past (2022-2024)
- Current values showing appreciation
- Some with rental income
- Some with mortgages

| Property | Purchase Date | Purchase Price | Current Value | Appreciation | Rented | Rent/mo | Mortgage |
|----------|---------------|----------------|---------------|--------------|--------|---------|----------|
| Downtown Edge | 2023-03-15 | 1,680,000 | 1,950,000 | +16% | Yes | 9,500 | No |
| Palm Beach Towers | 2022-08-20 | 3,100,000 | 3,800,000 | +23% | Yes | 15,000 | Yes (1.2M balance) |
| Business Bay Central | 2024-01-10 | 890,000 | 920,000 | +3% | No | - | Yes (500K balance) |

---

## Expected Portal Views After Setup

### Maria's Portal as Investor

Since Maria has 3 acquired properties:

1. **Default Tab: Portfolio**
   - Total Portfolio Value: ~AED 6.67M
   - Total Appreciation: ~AED 1.0M (+17.6%)
   - Monthly Rental Income: AED 24,500
   - Mortgage Payments: ~AED 9,500/mo
   - Net Cashflow: ~AED 15,000/mo

2. **Opportunities Tab (2 remaining quotes)**
   - Marina Vista Tower - AED 2.85M
   - Creek Harbour Residences - AED 4.2M

3. **Compare Feature**
   - Can compare the 2 opportunity quotes side by side

### Hugo's Portal as Prospect

Hugo has 21 quotes but 0 properties:

1. **Default Tab: Opportunities**
   - Shows all 21 investment proposals
   - Compare feature available

2. **Portfolio Tab**
   - Shows empty state with teaser message

---

## Implementation Steps

### Database Operations

1. **Insert Client Record**
   ```sql
   INSERT INTO clients (broker_id, name, email, phone, country, portal_token, portal_enabled)
   VALUES ('c02581d8-d1ec-4be6-aea0-242b424f172f', 'Maria Santos', 
           'maria.santos@test.com', '+971509998888', 'Colombia', 
           'test_maria_2024', true);
   ```

2. **Insert 5 Quotes**
   - Each quote linked to Maria's client_id
   - Proper inputs JSON with basePrice, rental yield, etc.
   - 3 marked as 'sold', 2 as 'draft'

3. **Insert 3 Acquired Properties**
   - Linked to Maria's client_id
   - Linked to source quotes via source_quote_id
   - Include current valuations, rental info, and mortgages

### Verification Checklist

After implementation, you can verify:

- [ ] **Clients Manager**: Maria appears with "3 Properties" and "5 Quotes" count
- [ ] **Preview Portal**: Click "Preview Portal" on Maria's card
- [ ] **Portfolio Tab**: Shows total value ~6.67M, 3 property cards
- [ ] **Opportunities Tab**: Shows 2 remaining quotes
- [ ] **Compare Tool**: Select both quotes and compare
- [ ] **Hugo's Portal**: Still shows Opportunities first (no properties)

---

## Files to Modify

No code changes needed - only database inserts to create the test data.

---

## Technical Notes

### Quote Inputs Structure

The quotes will include proper `inputs` JSON structure:
```json
{
  "basePrice": 2850000,
  "rentalYieldPercent": 6.5,
  "constructionAppreciation": 12,
  "growthAppreciation": 8,
  "matureAppreciation": 4,
  "growthPeriodYears": 5,
  "preHandoverPercent": 20,
  "postHandoverPercent": 80,
  "serviceChargePerSqft": 22
}
```

### Property Linkage

The `acquired_properties` table has:
- `client_id` → Links to Maria's client record
- `source_quote_id` → Links to the original quote (for audit trail)
- `broker_id` → Links to your broker account

This creates a complete paper trail from quote analysis to acquired investment.

---

## Portal Access URLs

After setup, you can access:

- **Maria's Portal**: `/portal/test_maria_2024` (Investor view)
- **Hugo's Portal**: `/portal/1ee00850fe4a4ebb` (Prospect view)

This will demonstrate both portal experiences side-by-side.
