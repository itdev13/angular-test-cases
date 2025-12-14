# Setup Instructions for Other System

## Problem
Tests failing with errors like:
- `TypeError: $(...).find is not a function`
- `TypeError: $(...).scrollTop is not a function`
- `TypeError: $(...).height is not a function`

## Root Cause
AngularJS uses **jqLite** (a lightweight jQuery subset) by default, which doesn't include these methods. Our code uses full jQuery methods.

## Solution

### Step 1: Pull Latest Changes
```bash
git pull origin main
```

### Step 2: Install jQuery
```bash
npm install
```

This will install jQuery 3.7.1 as specified in package.json.

### Step 3: Verify karma.conf.js
Make sure jQuery is loaded BEFORE Angular in karma.conf.js:

```javascript
files: [
  'node_modules/jquery/dist/jquery.js',  // ← MUST BE FIRST!
  'node_modules/angular/angular.js',
  // ... rest of files
]
```

### Step 4: Run Tests
```bash
npm test
```

## Expected Result
All 1086 tests should pass:
- ✅ TOTAL: 1086 SUCCESS
- ✅ Coverage: ~69% statements, ~61% branches, ~75% functions

## Key Points
1. **jQuery MUST load before Angular** - When Angular detects jQuery is already loaded, it uses full jQuery instead of jqLite
2. **All systems must use same configuration** - Commit and push these changes so all team members have the same setup
3. **Run `npm install`** - Critical step to ensure jQuery is installed

## Files Modified
- `package.json` - Added jQuery dependency
- `karma.conf.js` - Load jQuery first, fixed test order
- `spec/services/services.spec.js` - Fixed module() order
- `spec/directives/file-upload.spec.js` - Fixed jQuery mock
- `spec/controllers/loginCtr.spec.js` - Fixed $provide usage

## Troubleshooting
If errors persist on the other system:
1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again
4. Run `npm test`
