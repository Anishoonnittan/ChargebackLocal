# 🔒 Security Quick Start Guide

## 🚀 How to Use the Security Features

### 1. **CSRF Protection** (For Forms)

Add CSRF tokens to all forms that modify data:

```typescript
// In your form component
import { generateCSRFToken } from '@/lib/securityUtils';

function MyForm() {
const [csrfToken, setCsrfToken] = useState('');

useEffect(() => {
// Generate CSRF token when form loads
const token = generateCSRFToken(sessionToken);
setCsrfToken(token);
}, [sessionToken]);

return (
<form onSubmit={handleSubmit}>
<input type="hidden" name="csrf_token" value={csrfToken} />
{/* Your form fields */}
</form>
);
}

// In your Convex mutation
import { verifyCSRFToken } from '@/lib/securityUtils';

export const submitForm = mutation({
args: {
csrfToken: v.string(),
// ... other args
},
handler: async (ctx, args) => {
// Get session token from context
const session = await getSession(ctx);

// Verify CSRF token
const result = verifyCSRFToken(args.csrfToken, session.token);
if (!result.valid) {
throw new Error(`CSRF validation failed: ${result.reason}`);
}

// Process form...
},
});
```

### 2. **Request Signing** (For API Calls)

Sign all API requests to prevent tampering:

```typescript
// Client-side: Sign the request
import { signRequest } from '@/lib/securityUtils';

async function callAPI(endpoint, body) {
const timestamp = Date.now();
const bodyString = JSON.stringify(body);
const signature = signRequest('POST', endpoint, bodyString, timestamp, apiSecret);

const response = await fetch(endpoint, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-Timestamp': timestamp.toString(),
'X-Signature': signature,
},
body: bodyString,
});

return response.json();
}

// Server-side: Verify the signature
import { verifyRequestSignature } from '@/lib/securityUtils';

export const apiEndpoint = httpAction(async (ctx, request) => {
const timestamp = parseInt(request.headers.get('X-Timestamp') || '0');
const signature = request.headers.get('X-Signature') || '';
const body = await request.text();

// Verify signature
const result = verifyRequestSignature(
request.method,
request.url,
body,
timestamp,
signature,
apiSecret
);

if (!result.valid) {
return new Response(JSON.stringify({ error: result.reason }), {
status: 401,
});
}

// Process request...
});
```

### 3. **Input Validation** (Always Sanitize User Input)

```typescript
import { 
sanitizeInput, 
isValidEmail, 
containsSQLInjection, 
containsXSS 
} from '@/lib/securityUtils';

export const createUser = mutation({
args: {
email: v.string(),
name: v.string(),
},
handler: async (ctx, args) => {
// Validate email
if (!isValidEmail(args.email)) {
throw new Error('Invalid email format');
}

// Sanitize name
const cleanName = sanitizeInput(args.name);

// Check for injection attacks
if (containsSQLInjection(cleanName) || containsXSS(cleanName)) {
// Log security incident
await ctx.db.insert('securityLogs', {
eventType: 'INJECTION_ATTEMPT',
severity: 'HIGH',
description: `Injection attempt detected in name field`,
isSuspicious: true,
threatScore: 80,
timestamp: Date.now(),
});

throw new Error('Invalid input detected');
}

// Create user...
},
});
```

### 4. **Rate Limiting** (Prevent Abuse)

Rate limiting is automatically applied to authentication endpoints. To add it to other endpoints:

```typescript
export const expensiveOperation = mutation({
args: { /* ... */ },
handler: async (ctx, args) => {
const userId = await getUserId(ctx);

// Check rate limit
const now = Date.now();
const windowMs = 60 * 1000; // 1 minute
const limit = 10; // 10 requests per minute

const recentRequests = await ctx.db
.query('rateLimitTracking')
.filter(q => 
q.and(
q.eq(q.field('identifier'), userId),
q.eq(q.field('endpoint'), '/api/expensive'),
q.gt(q.field('windowEnd'), now)
)
)
.first();

if (recentRequests && recentRequests.requestCount >= limit) {
throw new Error('Rate limit exceeded. Please try again later.');
}

// Update rate limit counter...
// Process request...
},
});
```

### 5. **Bot Detection** (Protect Against Scrapers)

```typescript
import { detectBotBehavior } from '@/lib/securityUtils';

export const publicEndpoint = httpAction(async (ctx, request) => {
const userAgent = request.headers.get('User-Agent') || '';

// Track request patterns
const ipAddress = request.headers.get('X-Forwarded-For') || 'unknown';
const recentRequests = await getRecentRequests(ipAddress);

// Detect bot behavior
const detection = detectBotBehavior(
userAgent,
recentRequests.length,
60000, // 1 minute window
recentRequests.map(r => r.endpoint)
);

if (detection.isBot) {
// Log suspicious activity
await ctx.runMutation(internal.security.logSuspiciousActivity, {
activityType: 'BOT_DETECTED',
severity: 'MEDIUM',
description: `Bot detected: ${detection.reasons.join(', ')}`,
ipAddress,
userAgent,
confidenceScore: detection.confidence,
});

// Block or challenge
return new Response('Too many requests', { status: 429 });
}

// Process request...
});
```

---

## 📋 Security Checklist for New Features

When adding new features, always:

- [ ] **Validate all user input** (use `sanitizeInput()`)
- [ ] **Check for injection attacks** (use `containsSQLInjection()`, `containsXSS()`)
- [ ] **Add CSRF protection** to forms (use `generateCSRFToken()`, `verifyCSRFToken()`)
- [ ] **Sign API requests** (use `signRequest()`, `verifyRequestSignature()`)
- [ ] **Implement rate limiting** for expensive operations
- [ ] **Log security events** to `securityLogs` table
- [ ] **Validate authentication** (check session token)
- [ ] **Sanitize error messages** (don't leak sensitive info)

---

## 🔍 Monitoring Security

### Check Recent Security Logs

```typescript
// In Convex dashboard or via query
const recentLogs = await ctx.db
.query('securityLogs')
.withIndex('by_timestamp')
.order('desc')
.take(50);

// Filter by severity
const criticalLogs = await ctx.db
.query('securityLogs')
.withIndex('by_severity', q => q.eq('severity', 'CRITICAL'))
.order('desc')
.take(20);
```

### Check Suspicious Activity

```typescript
const suspiciousActivity = await ctx.db
.query('suspiciousActivity')
.withIndex('by_detected_at')
.order('desc')
.take(20);
```

### Check Rate Limit Status

```typescript
const rateLimits = await ctx.db
.query('rateLimitTracking')
.withIndex('by_exceeded', q => q.eq('exceeded', true))
.collect();
```

---

## 🚨 Incident Response

If you detect a security incident:

1. **Check the logs** - Review `securityLogs` and `suspiciousActivity` tables
2. **Identify the threat** - Look at IP addresses, user agents, patterns
3. **Block the attacker** - Add to blocklist or increase rate limits
4. **Review the damage** - Check what data was accessed
5. **Patch the vulnerability** - Fix the security hole
6. **Notify users** - If data was compromised (GDPR requirement)

---

## 📞 Need Help?

- **Security Documentation**: See `SECURITY_AUDIT_REPORT.md`
- **Implementation Details**: See `SECURITY_IMPLEMENTATION_SUMMARY.md`
- **Full Checklist**: See `PRODUCTION_SECURITY_CHECKLIST.md`

---

*Your app is protected! 🛡️*
