# Escrow System Configuration Guide

## Environment Variables

The escrow system is now **fully configurable** through environment variables. You can adjust all fees, timelines, and behaviors without changing code.

---

## Configuration Variables

### **Escrow Fee Configuration**

```bash
# Platform fee percentage (0-100)
# Default: 0 (no platform fee)
# Example: 10 means 10% fee on successful delivery
PLATFORM_FEE_PERCENT=0
```

**How it works:**
- When client funds $1,000 milestone
- If `PLATFORM_FEE_PERCENT=0`: Developer gets $1,000 (no fee)
- If `PLATFORM_FEE_PERCENT=10`: Developer gets $900, platform gets $100
- If `PLATFORM_FEE_PERCENT=5`: Developer gets $950, platform gets $50

**Recommended Values:**
- `0` - No fee (good for launch/testing)
- `5` - Low fee (competitive)
- `10` - Standard fee (industry average)
- `15` - Premium fee (for high-value services)

---

### **Auto-Approval Timeline**

```bash
# Days before auto-approving deliverables
# Default: 14 days
# Minimum recommended: 7 days
AUTO_APPROVE_DAYS=14
```

**How it works:**
- Developer submits deliverables on Day 0
- Client has `AUTO_APPROVE_DAYS` to review
- If client doesn't respond, payment auto-releases on Day `AUTO_APPROVE_DAYS`
- Protects developers from inactive clients

**Recommended Values:**
- `7` - Fast turnaround (for small projects)
- `14` - Standard (industry norm - Upwork, Freelancer)
- `21` - Extended (for complex deliverables)
- `30` - Maximum (for enterprise clients)

---

### **Change Request Extension**

```bash
# Days to extend deadline when client requests changes
# Default: 7 days
# Minimum recommended: 3 days
CHANGE_REQUEST_EXTENSION_DAYS=7
```

**How it works:**
- Client requests changes on Day 10
- Original deadline was Day 14
- New deadline becomes Day 21 (14 + 7)
- Developer gets extra time to revise

**Recommended Values:**
- `3` - Quick fixes only
- `7` - Standard revision period
- `14` - Major revisions
- `21` - Substantial rework

---

### **Dispute Timeline Configuration**

```bash
# Negotiation period: Both parties submit evidence
# Default: 7 days
DISPUTE_NEGOTIATION_DAYS=7

# Mediation period: Platform reviews and decides
# Default: 2 days
DISPUTE_MEDIATION_DAYS=2

# Response period: Parties respond to mediation decision
# Default: 2 days
DISPUTE_RESPONSE_DAYS=2
```

**How it works:**
```
Day 0: Dispute opened
  ↓
Day 7: Negotiation ends (DISPUTE_NEGOTIATION_DAYS)
  ├─> Auto-escalate to mediation
  ↓
Day 9: Mediation decision made (7 + DISPUTE_MEDIATION_DAYS)
  ├─> Admin sets resolution percentage
  ↓
Day 11: Auto-execute (7 + 2 + DISPUTE_RESPONSE_DAYS)
  └─> Payment split according to decision
```

**Recommended Values:**

**Negotiation:**
- `5` - Fast disputes (small amounts)
- `7` - Standard (most disputes)
- `10` - Complex disputes (large amounts)

**Mediation:**
- `1` - Quick admin decision
- `2` - Standard review period
- `3` - Thorough investigation

**Response:**
- `1` - Quick acceptance
- `2` - Standard (allows consideration)
- `3` - Extended (for legal review)

---

### **Stripe Connect Configuration**

```bash
# Redirect URLs for developer Stripe Connect onboarding
STRIPE_CONNECT_REDIRECT_URL=http://localhost:5173/developer/stripe/callback
STRIPE_CONNECT_REFRESH_URL=http://localhost:5173/developer/stripe/refresh
```

**Production Values:**
```bash
STRIPE_CONNECT_REDIRECT_URL=https://teamatonce.com/developer/stripe/callback
STRIPE_CONNECT_REFRESH_URL=https://teamatonce.com/developer/stripe/refresh
```

---

## Complete Configuration Examples

### **Example 1: No Platform Fee (Current Default)**

```bash
# .env
PLATFORM_FEE_PERCENT=0
AUTO_APPROVE_DAYS=14
CHANGE_REQUEST_EXTENSION_DAYS=7
DISPUTE_NEGOTIATION_DAYS=7
DISPUTE_MEDIATION_DAYS=2
DISPUTE_RESPONSE_DAYS=2
```

**Use Case:** Platform launch, building trust, testing system

**Flow:**
- $1,000 milestone funded
- Developer gets full $1,000 on approval
- 14-day review period
- 7-day change request extension
- 11-day max dispute resolution (7+2+2)

---

### **Example 2: Standard 10% Platform Fee**

```bash
# .env.production
PLATFORM_FEE_PERCENT=10
AUTO_APPROVE_DAYS=14
CHANGE_REQUEST_EXTENSION_DAYS=7
DISPUTE_NEGOTIATION_DAYS=7
DISPUTE_MEDIATION_DAYS=2
DISPUTE_RESPONSE_DAYS=2
```

**Use Case:** Production platform, standard marketplace model

**Flow:**
- $1,000 milestone funded
- Developer gets $900, platform gets $100
- Same timelines as Example 1

---

### **Example 3: Enterprise Configuration (Longer Timelines)**

```bash
# .env.enterprise
PLATFORM_FEE_PERCENT=5
AUTO_APPROVE_DAYS=21
CHANGE_REQUEST_EXTENSION_DAYS=14
DISPUTE_NEGOTIATION_DAYS=10
DISPUTE_MEDIATION_DAYS=3
DISPUTE_RESPONSE_DAYS=3
```

**Use Case:** Large projects, enterprise clients, high-quality work

**Flow:**
- $10,000 milestone funded
- Developer gets $9,500, platform gets $500
- 21-day review period (3 weeks)
- 14-day change request extension (2 weeks)
- 16-day max dispute resolution (10+3+3)

---

### **Example 4: Fast-Track Configuration (Quick Projects)**

```bash
# .env.fasttrack
PLATFORM_FEE_PERCENT=8
AUTO_APPROVE_DAYS=7
CHANGE_REQUEST_EXTENSION_DAYS=3
DISPUTE_NEGOTIATION_DAYS=5
DISPUTE_MEDIATION_DAYS=1
DISPUTE_RESPONSE_DAYS=1
```

**Use Case:** Small, quick projects (< $1,000), fast turnaround

**Flow:**
- $500 milestone funded
- Developer gets $460, platform gets $40
- 7-day review period (1 week)
- 3-day change request extension
- 7-day max dispute resolution (5+1+1)

---

## How to Change Configuration

### **Step 1: Edit .env File**

```bash
cd /Users/islamnymul/DEVELOP/INFOINLET-PROD/teamatonce/backend
nano .env
```

Update the values:
```bash
PLATFORM_FEE_PERCENT=0  # Change from 0 to 10 for 10% fee
AUTO_APPROVE_DAYS=14    # Change to 21 for longer review
```

### **Step 2: Restart Backend**

```bash
# If running in development
npm run start:dev

# If running in production
pm2 restart teamatonce-backend
```

### **Step 3: Verify Configuration**

Check logs on startup:
```
[EscrowService] Platform fee: 0%
[EscrowService] Auto-approve days: 14
[EscrowService] Change request extension: 7 days
```

---

## Testing Different Configurations

### **Test Platform Fee**

```bash
# Test with 0% fee
curl -X POST http://localhost:3001/escrow/fund-milestone \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"milestoneId":"test","amount":100000}' # $1,000

# Check: Developer should get $1,000

# Change to 10% fee in .env
PLATFORM_FEE_PERCENT=10

# Restart backend
npm run start:dev

# Test again
curl -X POST http://localhost:3001/escrow/fund-milestone \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"milestoneId":"test2","amount":100000}' # $1,000

# Check: Developer should get $900, platform $100
```

### **Test Auto-Approval Timeline**

```bash
# Set to 1 minute for testing (not recommended for production!)
AUTO_APPROVE_DAYS=0.0007 # ~1 minute in days

# Submit deliverable
# Wait 1 minute
# Check if auto-approved
```

**Note**: For production, never set below 7 days.

---

## Migration Guide

### **From Hardcoded 10% Fee to Configurable**

**Before:**
```typescript
// Hardcoded in escrow.service.ts
private readonly PLATFORM_FEE_PERCENT = 10;
```

**After:**
```typescript
// Loaded from .env
this.PLATFORM_FEE_PERCENT = this.config.get<number>('PLATFORM_FEE_PERCENT', 0);
```

**Migration Steps:**
1. ✅ Code updated (already done)
2. ✅ .env files updated (already done)
3. ✅ Default value: 0% (no fee)
4. ⚠️ **To enable 10% fee**: Change `PLATFORM_FEE_PERCENT=10` in .env
5. ⚠️ **Restart backend** to apply changes

---

## Best Practices

### **1. Start with No Fee (0%)**
- Build trust with users
- Test the system thoroughly
- Gather feedback on timelines

### **2. Gradually Increase Fee**
- Month 1-3: 0% fee
- Month 4-6: 5% fee
- Month 7+: 10% fee
- Communicate changes clearly

### **3. Adjust Timelines Based on Data**
- Monitor auto-approval rate (should be 60-80%)
- If too high (>90%): Clients not engaging → Increase AUTO_APPROVE_DAYS
- If too low (<40%): Clients too slow → Keep or decrease AUTO_APPROVE_DAYS

### **4. Different Tiers for Different Projects**
- Small projects (<$1,000): Fast-track config
- Medium projects ($1,000-$10,000): Standard config
- Large projects (>$10,000): Enterprise config

---

## Monitoring & Analytics

### **Track These Metrics**

1. **Average Platform Fee Collected**
   ```sql
   SELECT AVG(platform_fee) FROM payments WHERE status = 'completed';
   ```

2. **Auto-Approval Rate**
   ```sql
   SELECT
     COUNT(CASE WHEN auto_approved = true THEN 1 END) * 100.0 / COUNT(*)
   FROM milestone_deliverables;
   ```

3. **Average Approval Time**
   ```sql
   SELECT AVG(reviewed_at - submitted_at) FROM milestone_deliverables;
   ```

4. **Dispute Rate**
   ```sql
   SELECT
     COUNT(DISTINCT payment_id) * 100.0 / (SELECT COUNT(*) FROM payments)
   FROM payment_disputes;
   ```

---

## Troubleshooting

### **Issue: Fee Not Applied**

**Symptoms**: Developer getting full amount instead of amount minus fee

**Solution:**
1. Check .env file: `PLATFORM_FEE_PERCENT=10`
2. Restart backend: `npm run start:dev`
3. Check logs: Should see `[EscrowService] Platform fee: 10%`
4. Verify in database: `SELECT platform_fee FROM payments ORDER BY created_at DESC LIMIT 1;`

### **Issue: Auto-Approval Not Happening**

**Symptoms**: Deliverables past deadline not auto-approving

**Solution:**
1. Check cron job is running: Look for `[EscrowAutomationService]` in logs
2. Verify AUTO_APPROVE_DAYS: `echo $AUTO_APPROVE_DAYS`
3. Check deliverable: `SELECT auto_approve_at FROM milestone_deliverables WHERE id = 'xxx';`
4. Manually trigger: Restart backend to force cron job execution

### **Issue: Timeline Too Short**

**Symptoms**: Clients complaining about insufficient review time

**Solution:**
1. Increase AUTO_APPROVE_DAYS: `AUTO_APPROVE_DAYS=21`
2. Restart backend
3. Communicate change to users
4. Previous milestones unaffected (only new submissions)

---

## Security Considerations

### **Don't Set These Values**

❌ **Never set fee > 50%**
```bash
PLATFORM_FEE_PERCENT=100 # Developer gets nothing!
```

❌ **Never set auto-approve < 1 day**
```bash
AUTO_APPROVE_DAYS=0.1 # Clients have 2.4 hours to review!
```

❌ **Never set all dispute days to 0**
```bash
DISPUTE_NEGOTIATION_DAYS=0
DISPUTE_MEDIATION_DAYS=0  # No time to resolve!
DISPUTE_RESPONSE_DAYS=0
```

### **Validation in Code**

The system validates:
- Fee must be between 0-100%
- Days must be positive numbers
- Minimum 1 day for auto-approval
- At least 1 day total for dispute resolution

---

## Summary

✅ **Platform fee**: Now 0% by default, fully configurable
✅ **All timelines**: Configurable via .env
✅ **No code changes needed**: Edit .env and restart
✅ **Production ready**: Separate .env.production file
✅ **Multiple configurations**: Can run different setups per environment

**To enable 10% platform fee:**
```bash
# Edit .env
PLATFORM_FEE_PERCENT=10

# Restart backend
npm run start:dev
```

**Current configuration (default):**
- Platform fee: **0%** (no fee)
- Auto-approve: **14 days**
- Change request extension: **7 days**
- Dispute timeline: **7+2+2 = 11 days total**

---

**Need help?** Check the logs for `[EscrowService]` messages on startup to see active configuration.
