# Debugging Guide: Missing Grid Data After Analysis

## Files to Inspect (in order of data flow)

### 1. **Backend: `web/app.py`** (Lines 54-181)
   - **Check:** `/api/analyze` endpoint
   - **What to look for:**
     - Is `result` dictionary being built correctly? (line 130-161)
     - Are all fields being added to `result`?
     - Check if `roi` is `None` when there's no discount (line 82)
     - Verify `recommendation` has all expected fields
   
   **Key lines to check:**
   - Line 131: `result['has_discount'] = 'Yes' if parsed['has_discount'] else 'No'`
   - Line 136-139: ROI fields only added if `roi` exists
   - Line 141-145: Recommendation fields

### 2. **Frontend: `web/static/js/app.js`**
   
   **A. `runAnalysis()` function (Lines 610-663)**
   - **Check:** Is API response received?
   - **Look for:** Console logs showing `result.results` structure
   - **Verify:** `analyzedResults` is populated
   
   **B. `transformResultsForGrid()` function (Lines 665-737)**
   - **Check:** Is data being transformed correctly?
   - **Key issue:** Field name mapping (snake_case → Title Case)
   - **Verify:** `isAnalyzed` check (line 681) - is it `true`?
   - **Check:** Are all fields being added to `row` object?
   
   **C. `updateGrid()` function (Lines 273-469)**
   - **Check:** Are column definitions matching row data field names?
   - **Verify:** Field names in `columnDefs` match keys in `rowData`
   - **Look for:** Console warnings about mismatched fields

## Quick Debug Steps

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Run Analysis"
4. Look for these logs:
   - `"Analysis response received:"` - Shows API response
   - `"First result row:"` - Shows first row from backend
   - `"Transformed grid data (first row):"` - Shows after transformation
   - `"Field match check:"` - Shows if fields match

### Step 2: Check Backend Logs
1. Look at terminal where Flask is running
2. Check for any error messages or tracebacks
3. Verify data is being processed

### Step 3: Inspect Network Request
1. Open DevTools → Network tab
2. Click "Run Analysis"
3. Find `/api/analyze` request
4. Click on it → Response tab
5. Check if `results` array has data with all expected fields

## Common Issues

### Issue 1: Backend returns data but frontend doesn't display it
- **Check:** `transformResultsForGrid()` - field name mapping
- **Fix:** Ensure Title Case column names match row data keys

### Issue 2: Fields exist but values are empty
- **Check:** Backend `result` dictionary - are values being set?
- **Check:** `roi` might be `None` - ROI fields won't be added

### Issue 3: Grid shows headers but no rows
- **Check:** `updateGrid()` - field name matching
- **Check:** Console for "MISMATCH" warnings

## Manual Inspection Checklist

### Backend (`web/app.py`)
- [ ] Line 131: `has_discount` is set correctly
- [ ] Line 132-134: Discount fields are set (even if empty string)
- [ ] Line 136-139: ROI fields only added if `roi` exists
- [ ] Line 141-145: Recommendation fields are always set
- [ ] Line 167-177: Response includes all results

### Frontend (`web/static/js/app.js`)
- [ ] Line 648: `analyzedResults` is assigned
- [ ] Line 657: `transformResultsForGrid()` is called
- [ ] Line 681: `isAnalyzed` check is working
- [ ] Line 685-711: All fields are added to `row` object
- [ ] Line 320: Column `field` matches row data keys exactly

## Test Data Structure

Expected structure from backend:
```json
{
  "invoice_number": "INV-0001",
  "supplier_name": "Acme Corp",
  "invoice_amount": 10000,
  "payment_terms": "2/10 Net 30",
  "has_discount": "Yes",
  "discount_percentage": 2.0,
  "discount_days": 10,
  "net_days": 30,
  "apr": 36.5,
  "net_benefit": 150.0,
  "roi_vs_capital": 21.5,
  "action": "TAKE DISCOUNT",
  "status": "Auto-approve",
  "priority": "High",
  "savings": 150.0,
  "reason": "Save $150 by paying 20 days early (36.5% APR)"
}
```

Expected structure after transformation:
```json
{
  "Invoice Number": "INV-0001",
  "Supplier Name": "Acme Corp",
  "Invoice Amount": 10000,
  "Payment Terms": "2/10 Net 30",
  "Has Discount": "Yes",
  "Discount %": 2.0,
  "Discount Days": 10,
  "Net Days": 30,
  "APR": 36.5,
  "Net Benefit": 150.0,
  "ROI vs Capital": 21.5,
  "Action": "TAKE DISCOUNT",
  "Status": "Auto-approve",
  "Priority": "High",
  "Savings": 150.0,
  "Reason": "Save $150 by paying 20 days early (36.5% APR)"
}
```

## Quick Fix Test

Add this temporary debug code to `web/app.py` after line 161:
```python
# Debug: Print first result
if len(results) > 0:
    print("DEBUG: First result keys:", list(results[0].keys()))
    print("DEBUG: First result:", results[0])
```

Add this to `web/static/js/app.js` after line 657:
```javascript
// Debug: Log transformation
console.log('BEFORE transform - first row:', analyzedResults[0]);
console.log('AFTER transform - first row:', gridData[0]);
console.log('Field mapping check:', {
    backend_has_discount: analyzedResults[0].has_discount,
    frontend_Has_Discount: gridData[0]['Has Discount']
});
```

