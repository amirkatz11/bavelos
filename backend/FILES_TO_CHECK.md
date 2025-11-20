# Files to Check for Missing Grid Data

## Primary Files (Check These First)

### 1. **`web/app.py`** - Backend API Endpoint
   **Location:** Lines 54-181
   **What to check:**
   - After running analysis, check your **terminal/console** where Flask is running
   - Look for the `DEBUG:` output that shows the first result structure
   - Verify all fields are present: `has_discount`, `discount_percentage`, `apr`, `action`, `status`, `savings`
   
   **Key sections:**
   - Line 130-161: Where `result` dictionary is built
   - Line 131: `has_discount` assignment
   - Line 136-139: ROI fields (only if `roi` exists)
   - Line 141-145: Recommendation fields

### 2. **`web/static/js/app.js`** - Frontend Data Transformation
   **Location:** Multiple functions
   
   **A. `runAnalysis()` function (Line 610)**
   - Check browser console for `DEBUG: BEFORE TRANSFORMATION`
   - Verify `analyzedResults[0]` has all expected fields
   
   **B. `transformResultsForGrid()` function (Line 665)**
   - Check browser console for `DEBUG: AFTER TRANSFORMATION`
   - Compare field names: backend uses `has_discount`, frontend needs `Has Discount`
   - Verify `isAnalyzed` is `true` (line 681)
   
   **C. `updateGrid()` function (Line 273)**
   - Check browser console for `Field match check:`
   - Look for `MISMATCH` warnings
   - Verify column `field` names match row data keys exactly

## How to Inspect

### Step 1: Check Backend (Terminal)
```bash
# Look at your Flask terminal output
# After clicking "Run Analysis", you should see:
DEBUG: First result from /api/analyze:
Keys: ['invoice_number', 'supplier_name', 'has_discount', 'apr', ...]
```

### Step 2: Check Frontend (Browser Console)
1. Open DevTools (F12)
2. Go to Console tab
3. Click "Run Analysis"
4. Look for:
   - `DEBUG: BEFORE TRANSFORMATION` - Shows backend data
   - `DEBUG: AFTER TRANSFORMATION` - Shows transformed data
   - `Field match check:` - Shows if columns match rows

### Step 3: Check Network Request
1. DevTools → Network tab
2. Click "Run Analysis"
3. Find `/api/analyze` request
4. Click → Response tab
5. Verify `results` array has data

## What to Look For

### ✅ Good Signs:
- Backend shows all fields in DEBUG output
- Frontend `BEFORE TRANSFORMATION` shows same fields
- Frontend `AFTER TRANSFORMATION` shows Title Case fields
- No `MISMATCH` warnings in console

### ❌ Bad Signs:
- Backend DEBUG shows missing fields
- `isAnalyzed` is `false` in transformation
- `MISMATCH` warnings in console
- Field names don't match between columns and rows

## Quick Test

Run this in browser console after clicking "Run Analysis":
```javascript
// Check if data exists
console.log('analyzedResults length:', analyzedResults.length);
console.log('First row:', analyzedResults[0]);
console.log('Has discount?', analyzedResults[0].has_discount);
console.log('Has action?', analyzedResults[0].action);
```

## Most Likely Issues

1. **Field name mismatch** - Backend uses `has_discount`, grid expects `Has Discount`
   - **Fix:** Check `transformResultsForGrid()` mapping

2. **ROI is None** - When no discount, `roi` is `None`, so ROI fields aren't added
   - **Fix:** Backend should still add empty ROI fields

3. **isAnalyzed check fails** - If `has_discount` is undefined, transformation skips analysis columns
   - **Fix:** Check backend is setting `has_discount` correctly

