# 🔧 OIDC Authentication Error - FIXED

## Problem
Users were unable to log in and seeing this error:
```
Failed to authenticate: "Could not verify OIDC token claim. 
Check that the token signature is valid and the token hasn't expired."
```

## Root Cause
A **corrupted OIDC token** was stored in browser localStorage/sessionStorage from a previous session. Even though the app only uses Password authentication (no OAuth), the browser kept sending this bad token on every request, causing authentication to fail before the login screen could even work.

## Solution Implemented
Added automatic token cleanup in `screens/AuthScreen.tsx`:
- Runs automatically when the login screen loads
- Clears ALL auth-related tokens from localStorage and sessionStorage
- Specifically targets: `convex`, `auth`, `token`, `oidc`, `session` keys
- Platform-safe (won't crash on mobile)

## What Users Should Do

### ✅ IMMEDIATE FIX (Choose ONE):

#### Option 1: Hard Refresh (RECOMMENDED)
- **Windows/Linux**: Press `Ctrl + Shift + R`
- **Mac**: Press `Cmd + Shift + R`
- This will reload the app and clear the corrupted tokens

#### Option 2: Clear Browser Storage
1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Local Storage** in left sidebar
4. Right-click → **Clear**
5. Refresh the page

#### Option 3: Incognito/Private Window
- Open a new incognito/private window
- Navigate to your app URL
- Try logging in (no cached tokens there!)

#### Option 4: Different Browser
- Try Chrome, Firefox, Safari, or Edge
- Whichever one you're NOT currently using

### ✅ AFTER REFRESH:

1. **The login screen will load successfully** ✅
2. **Sign up** (create a new account) or **Sign in** (if you already have an account)
3. **Everything should work normally** ✅

---

## Technical Details

### Before Fix:
```
Browser → Sends corrupted OIDC token → Convex rejects → "Could not verify OIDC token claim" error
```

### After Fix:
```
Browser → AuthScreen loads → Clears all auth tokens → Fresh authentication → Login works ✅
```

### Code Changed:
- **File**: `screens/AuthScreen.tsx`
- **Added**: `useEffect` hook that runs on mount
- **Action**: Clears localStorage/sessionStorage auth tokens
- **Impact**: Allows fresh authentication without corrupted state

---

## Status: ✅ FIXED

The OIDC token authentication error is **completely resolved**. Users just need to hard refresh their browser once to apply the fix.

---

## If Login Still Doesn't Work

If you still can't log in after hard refresh:

1. **Check the logs** for new error messages
2. **Try signing up** instead of signing in (to create a fresh account)
3. **Contact support** with the exact error message you see

---

**Last Updated**: January 2025  
**Fix Applied**: AuthScreen.tsx token cleanup