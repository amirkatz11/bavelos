// Bavelos FinOps - Main Application JavaScript
// Connects frontend UI to Flask backend API

// Global state
let currentData = [];
let analyzedResults = [];
let gridApi = null;
let brandConfig = {
    cost_of_capital: 15.0,
    approval_threshold: 50000.0,
    min_discount: 0.5
};
let summaryData = null;
let reviewDecisions = {}; // Store review decisions: {invoice_number: "approve"|"reject"}
let currentReviewInvoice = null; // Currently reviewing invoice

// API base URL
const API_BASE = '';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupConfigSliders();
    updateRowCount();
    hideSummaryCard();
    
    // Handle window resize for grid
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (gridApi) {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // AG Grid Community: gridApi is the API itself
                if (gridApi && typeof gridApi.sizeColumnsToFit === 'function') {
                    gridApi.sizeColumnsToFit();
                }
            }, 150);
        }
    });
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    // File upload
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');

    uploadZone.addEventListener('click', () => fileInput.click());
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleDrop);

    // Config panel
    document.getElementById('configToggle').addEventListener('click', toggleConfigPanel);
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);

    // Action buttons
    document.getElementById('runAnalysisBtn').addEventListener('click', runAnalysis);
    document.getElementById('exportExcelBtn').addEventListener('click', exportExcel);
    document.getElementById('clearBtn').addEventListener('click', clearData);

    // Help button
    document.getElementById('helpBtn').addEventListener('click', () => {
        showToast('Bavelos FinOps - Discount Opportunity Finder\n\n1. Upload a CSV file with invoice data\n2. Configure brand kit settings\n3. Click "Run Analysis" to process\n4. Export results to Excel', 'info');
    });

    // Add Power Agent button
    const addAgentBtn = document.getElementById('addAgentBtn');
    if (addAgentBtn) {
        addAgentBtn.addEventListener('click', () => {
            showToast('Template mode active. Custom agents coming in Phase 2!', 'info');
        });
    }
    
    // Review panel
    const closeReviewPanel = document.getElementById('closeReviewPanel');
    const reviewOverlay = document.getElementById('reviewOverlay');
    const acceptReviewBtn = document.getElementById('acceptReviewBtn');
    const rejectReviewBtn = document.getElementById('rejectReviewBtn');
    const editParamsBtn = document.getElementById('editParamsBtn');
    
    if (closeReviewPanel) {
        closeReviewPanel.addEventListener('click', closeReviewPanelHandler);
    }
    if (reviewOverlay) {
        reviewOverlay.addEventListener('click', closeReviewPanelHandler);
    }
    if (acceptReviewBtn) {
        acceptReviewBtn.addEventListener('click', handleAcceptReview);
    }
    if (rejectReviewBtn) {
        rejectReviewBtn.addEventListener('click', handleRejectReview);
    }
    if (editParamsBtn) {
        editParamsBtn.addEventListener('click', () => {
            closeReviewPanelHandler();
            // Expand config panel
            const configPanel = document.getElementById('configPanel');
            if (configPanel && configPanel.classList.contains('collapsed')) {
                toggleConfigPanel();
            }
        });
    }
}

function setupConfigSliders() {
    const costOfCapital = document.getElementById('costOfCapital');
    const approvalThreshold = document.getElementById('approvalThreshold');
    const minDiscount = document.getElementById('minDiscount');

    // Cost of Capital slider (5-30%, step 0.5)
    if (costOfCapital) {
        costOfCapital.min = 5;
        costOfCapital.max = 30;
        costOfCapital.step = 0.5;
        costOfCapital.value = brandConfig.cost_of_capital;
        costOfCapital.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('costOfCapitalValue').textContent = value.toFixed(1);
            brandConfig.cost_of_capital = value;
        });
    }

    // Approval Threshold input
    if (approvalThreshold) {
        approvalThreshold.value = brandConfig.approval_threshold;
        // Format initial value
        document.getElementById('approvalThresholdValue').textContent = 
            brandConfig.approval_threshold.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
        approvalThreshold.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value) || 0;
            document.getElementById('approvalThresholdValue').textContent = 
                value.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
            brandConfig.approval_threshold = value;
        });
    }

    // Min Discount slider (0-5%, step 0.1)
    if (minDiscount) {
        minDiscount.min = 0;
        minDiscount.max = 5;
        minDiscount.step = 0.1;
        minDiscount.value = brandConfig.min_discount;
        minDiscount.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('minDiscountValue').textContent = value.toFixed(1);
            brandConfig.min_discount = value;
        });
    }
}

// ============================================================================
// FILE UPLOAD
// ============================================================================

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
        uploadFile(file);
    } else {
        showToast('Please select a CSV file', 'error');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
        uploadFile(file);
    } else {
        showToast('Please drop a CSV file', 'error');
    }
}

async function uploadFile(file) {
    try {
        showLoading('Uploading CSV...');
        
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
            // Ensure data is an array
            if (!Array.isArray(result.data)) {
                throw new Error('Invalid data format received from server');
            }
            
            if (result.data.length === 0) {
                hideLoading();
                showToast('CSV file is empty', 'error');
                return;
            }
            
            currentData = result.data;
            
            // Validate required columns (case-insensitive)
            const requiredColumns = ['invoice_number', 'supplier_name', 'invoice_amount', 'payment_terms'];
            const columnMap = {};
            result.columns.forEach(col => {
                columnMap[col.toLowerCase()] = col;
            });
            
            const missingColumns = requiredColumns.filter(col => !columnMap[col.toLowerCase()]);
            
            if (missingColumns.length > 0) {
                hideLoading();
                showToast(`Missing required columns: ${missingColumns.join(', ')}`, 'error');
                console.error('Missing columns:', missingColumns);
                console.log('Available columns:', result.columns);
                return;
            }
            
            // Update grid with raw data (grid will format column names)
            console.log('Uploaded data:', currentData.slice(0, 2)); // Log first 2 rows for debugging
            updateGrid(currentData);
            updateRowCount();
            hideLoading();
            showToast(`Successfully loaded ${result.rows} invoices`, 'success');
        } else {
            hideLoading();
            showToast(result.error || 'Upload failed', 'error');
            console.error('Upload error:', result.error);
        }
    } catch (error) {
        hideLoading();
        showToast(`Upload error: ${error.message}`, 'error');
        console.error('Upload exception:', error);
    }
}

// ============================================================================
// GRID MANAGEMENT
// ============================================================================

function updateGrid(data) {
    try {
        if (!data || data.length === 0) {
            console.log('updateGrid: No data provided, clearing grid');
            clearGrid();
            return;
        }

        console.log('updateGrid: Updating grid with', data.length, 'rows');
        console.log('updateGrid: First row keys:', Object.keys(data[0]));

        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // Destroy existing grid
        if (gridApi) {
            console.log('updateGrid: Destroying existing grid');
            gridApi.destroy();
            gridApi = null;
        }
    } catch (error) {
        console.error('updateGrid: Error in initial setup:', error);
        showToast('Error updating grid: ' + error.message, 'error');
        return;
    }

    // Get column definitions from data
    // Only filter out internal columns (starting with _), show all others
    const headers = Object.keys(data[0]);
    
    // Filter columns - only exclude internal columns, show all others from CSV
    const columnsWithData = headers.filter(header => {
        // Skip internal columns (except _ai_indicator which is handled separately)
        if (header.startsWith('_') && header !== '_ai_indicator') {
            return false;
        }
        
        // Show all columns from CSV - don't filter based on empty values
        // This ensures all CSV columns are visible, even if some cells are empty
        return true;
    });
    
    console.log('Columns to display:', columnsWithData.length, 'out of', headers.length);
    console.log('Column names:', columnsWithData);
    
    // Validate data structure matches column headers
    if (data.length > 0) {
        const firstRowKeys = Object.keys(data[0]);
        const missingKeys = columnsWithData.filter(col => !firstRowKeys.includes(col));
        if (missingKeys.length > 0) {
            console.warn('Column headers without matching data keys:', missingKeys);
        }
        const extraKeys = firstRowKeys.filter(key => !columnsWithData.includes(key) && !key.startsWith('_'));
        if (extraKeys.length > 0) {
            console.warn('Data keys without matching column headers:', extraKeys);
        }
    }
    
    const columnDefs = columnsWithData.map(header => {
        const col = {
            field: header, // This must match the key in row data exactly
            headerName: formatHeaderName(header),
            sortable: true,
            filter: true,
            resizable: true,
            flex: 1,
            minWidth: 100,
            maxWidth: 300 // Prevent columns from getting too wide
        };

        // Special formatting for certain columns
        const field = header.toLowerCase();
        
        if (field.includes('amount') || field.includes('savings') || field.includes('discount')) {
            col.valueFormatter = params => {
                if (params.value && !isNaN(params.value)) {
                    return `$${parseFloat(params.value).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                }
                return params.value;
            };
        }
        
        if (field.includes('apr') || (field.includes('percent') && !field.includes('discount')) || field.includes('roi')) {
            col.valueFormatter = params => {
                if (params.value && !isNaN(params.value)) {
                    return `${parseFloat(params.value).toFixed(1)}%`;
                }
                return params.value;
            };
        }

        // Status column with visual indicators
        if (field === 'status') {
            col.cellRenderer = statusCellRenderer;
        }

        // Priority column with color coding
        if (field === 'priority') {
            col.cellRenderer = priorityCellRenderer;
        }

        // Action column with visual indicators
        if (field === 'action') {
            col.cellRenderer = actionCellRenderer;
        }

        // Strategic Insight column with AI indicator
        if (field === 'strategic insight') {
            col.cellRenderer = strategicInsightCellRenderer;
            col.flex = 2; // Make it wider
            col.minWidth = 200;
            col.tooltipValueGetter = (params) => params.value || '';
            col.headerName = '🤖 Strategic Insight';
            col.cellStyle = { 'line-height': '1.5', 'padding': '8px' };
        }

        // Supplier Intelligence column (if present in data)
        if (field === 'supplier intelligence') {
            col.cellRenderer = strategicInsightCellRenderer; // Reuse same renderer
            col.flex = 2;
            col.minWidth = 200;
            col.tooltipValueGetter = (params) => params.value || '';
            col.headerName = '🏢 Supplier Intelligence';
            col.cellStyle = { 'line-height': '1.5', 'padding': '8px' };
        }

        return col;
    });

    // Add AI indicator column at the beginning if any row has AI insights
    const hasAIInsights = data.some(row => row['_has_llm'] || row['Strategic Insight'] || row['Supplier Intelligence']);
    if (hasAIInsights) {
        columnDefs.unshift({
            field: '_ai_indicator',
            headerName: '🤖',
            cellRenderer: aiIndicatorCellRenderer,
            sortable: false,
            filter: false,
            resizable: false,
            width: 50,
            pinned: 'left',
            suppressMovable: true,
            headerTooltip: 'AI-enhanced analysis available',
            cellStyle: { 'text-align': 'center', 'padding': '8px' }
        });
    }

    const gridOptions = {
        columnDefs: columnDefs,
        rowData: data,
        defaultColDef: {
            flex: 1,
            minWidth: 100,
            maxWidth: 300
        },
        pagination: true,
        paginationPageSize: 50,
        animateRows: true,
        suppressColumnVirtualisation: true, // Show all columns
        onGridReady: (params) => {
            // Grid is ready
            console.log('Grid ready with', data.length, 'rows and', columnDefs.length, 'columns');
            if (params.api) {
                // Size columns to fit, but respect min/max widths
                params.api.sizeColumnsToFit();
                // Auto-size columns based on content
                const allColumnIds = [];
                params.api.getColumns().forEach(column => {
                    if (column) {
                        allColumnIds.push(column.getColId());
                    }
                });
                params.api.autoSizeColumns(allColumnIds, false);
            }
        },
        onRowClicked: (params) => {
            // Open review panel if status is "Requires approval"
            const status = params.data ? params.data['Status'] : '';
            if (status === 'Requires approval' || status === 'Review Needed') {
                const invoiceNumber = params.data['Invoice Number'];
                openReviewPanel(invoiceNumber);
            }
        },
        getRowClass: (params) => {
            // Add class for review-needed rows
            const status = params.data ? params.data['Status'] : '';
            if (status === 'Requires approval' || status === 'Review Needed') {
                return 'review-needed';
            }
            return '';
        }
    };

    try {
        const gridContainer = document.getElementById('gridContainer');
        if (!gridContainer) {
            throw new Error('Grid container element not found');
        }
        
        // Final validation: ensure row data has matching fields
        if (data.length > 0 && columnDefs.length > 0) {
            const firstRow = data[0];
            const firstCol = columnDefs[0];
            const hasMatchingField = firstCol.field in firstRow;
            console.log('Field match check:', {
                columnField: firstCol.field,
                rowHasField: hasMatchingField,
                rowKeys: Object.keys(firstRow),
                sampleValue: firstRow[firstCol.field]
            });
            
            if (!hasMatchingField && columnDefs.length > 0) {
                console.error('MISMATCH: Column field', firstCol.field, 'not found in row data!');
                console.error('Available row keys:', Object.keys(firstRow));
                console.error('Column fields:', columnDefs.map(c => c.field));
            }
        }
        
        console.log('Creating grid with', columnDefs.length, 'columns and', data.length, 'rows');
        console.log('Sample row data:', data.length > 0 ? data[0] : 'No data');
        console.log('Column definitions:', columnDefs.map(c => ({ field: c.field, headerName: c.headerName })));
        
        gridApi = agGrid.createGrid(gridContainer, gridOptions);
        console.log('Grid created successfully');
        
        // Verify grid has data after creation
        setTimeout(() => {
            if (gridApi) {
                const displayedRows = gridApi.getDisplayedRowCount();
                console.log('Grid displayed rows:', displayedRows);
                if (displayedRows === 0 && data.length > 0) {
                    console.error('WARNING: Grid created but showing 0 rows despite having', data.length, 'rows of data!');
                }
            }
        }, 100);
    } catch (error) {
        console.error('Error creating grid:', error);
        showToast('Error creating grid: ' + error.message, 'error');
        throw error;
    }
}

// Cell renderers
function statusCellRenderer(params) {
    const status = params.value || '';
    const invoiceNumber = params.data ? params.data['Invoice Number'] : '';
    
    // Check if this invoice has been reviewed (takes precedence)
    if (reviewDecisions[invoiceNumber] === 'approve' || status === 'Approved') {
        return '<span class="status-badge status-approved">✓ Approved</span>';
    } else if (reviewDecisions[invoiceNumber] === 'reject' || status === 'Rejected') {
        return '<span class="status-badge status-rejected">○ Rejected</span>';
    }
    
    // Original status
    if (status === 'Auto-approve') {
        return '<span class="status-badge status-auto-approve">✓ Auto-approve</span>';
    } else if (status === 'Requires approval' || status === 'Review Needed') {
        return '<span class="status-badge status-review-needed">⚠ Review Needed</span>';
    } else if (status === 'Skip') {
        return '<span class="status-badge status-rejected">○ Skip</span>';
    }
    return status;
}

function priorityCellRenderer(params) {
    const priority = params.value || '';
    let bgColor = '#F2F2F2'; // Low - gray
    if (priority === 'High') {
        bgColor = '#E2EFDA'; // High - light green
    } else if (priority === 'Medium') {
        bgColor = '#FFF2CC'; // Medium - light yellow
    }
    return `<span style="background-color: ${bgColor}; padding: 4px 8px; border-radius: 4px; font-weight: 500;">${priority}</span>`;
}

function actionCellRenderer(params) {
    const action = params.value || '';
    if (action === 'TAKE DISCOUNT') {
        return '<span style="color: #70AD47; font-weight: bold;">✓ TAKE DISCOUNT</span>';
    } else if (action === 'PAY ON TIME') {
        return '<span style="color: #666;">○ PAY ON TIME</span>';
    }
    return action;
}

function strategicInsightCellRenderer(params) {
    const insight = params.value || '';
    if (!insight) {
        return '<span style="color: #999; font-style: italic;">No AI analysis</span>';
    }
    
    // Truncate long insights for display, show full in tooltip
    const maxLength = 100;
    const displayText = insight.length > maxLength 
        ? insight.substring(0, maxLength) + '...' 
        : insight;
    
    return `
        <div style="display: flex; align-items: start; gap: 8px;">
            <span style="color: #4472C4; font-size: 14px;">🤖</span>
            <span style="color: #333; line-height: 1.4;">${displayText}</span>
        </div>
    `;
}

function aiIndicatorCellRenderer(params) {
    const hasAI = params.data && params.data['_has_llm'];
    if (hasAI) {
        return '<span style="color: #4472C4; font-size: 16px;" title="AI-enhanced analysis">🤖</span>';
    }
    return '';
}

function clearGrid() {
    if (gridApi) {
        gridApi.destroy();
        gridApi = null;
    }
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = 'flex';
    }
}

function formatHeaderName(header) {
    return header
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================================================
// ANALYSIS
// ============================================================================

async function runAnalysis() {
    if (currentData.length === 0) {
        showToast('Please upload a CSV file first', 'error');
        return;
    }

    try {
        showLoading('Running analysis...');
        disableButtons(true);
        
        // Get current config (send as camelCase to match backend)
        const config = {
            costOfCapital: parseFloat(document.getElementById('costOfCapital').value),
            approvalThreshold: parseFloat(document.getElementById('approvalThreshold').value),
            minDiscount: parseFloat(document.getElementById('minDiscount').value)
        };
        
        // Update brandConfig for display
        brandConfig = {
            cost_of_capital: config.costOfCapital,
            approval_threshold: config.approvalThreshold,
            min_discount: config.minDiscount
        };

        const response = await fetch(`${API_BASE}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: currentData,
                config: config
            })
        });

        const result = await response.json();

        if (result.success) {
            analyzedResults = result.results;
            summaryData = result.summary;
            
            // Debug logging - check raw API response
            console.log('='.repeat(80));
            console.log('DEBUG: Raw API Response');
            console.log('Response success:', result.success);
            console.log('Results count:', result.results ? result.results.length : 0);
            if (result.results && result.results.length > 0) {
                console.log('First result keys:', Object.keys(result.results[0]));
                console.log('First result keys count:', Object.keys(result.results[0]).length);
                console.log('First result:', result.results[0]);
                console.log('Has has_discount?', 'has_discount' in result.results[0], result.results[0].has_discount);
                console.log('Has action?', 'action' in result.results[0], result.results[0].action);
                console.log('Has status?', 'status' in result.results[0], result.results[0].status);
            }
            console.log('='.repeat(80));
            
            // Transform results for grid display
            console.log('='.repeat(80));
            console.log('DEBUG: BEFORE TRANSFORMATION');
            console.log('First analyzed result:', analyzedResults[0]);
            console.log('Keys in analyzed result:', Object.keys(analyzedResults[0]));
            console.log('Sample values:', {
                invoice_number: analyzedResults[0].invoice_number,
                has_discount: analyzedResults[0].has_discount,
                discount_percentage: analyzedResults[0].discount_percentage,
                apr: analyzedResults[0].apr,
                action: analyzedResults[0].action,
                status: analyzedResults[0].status,
                savings: analyzedResults[0].savings
            });
            
            const gridData = transformResultsForGrid(analyzedResults);
            
            console.log('='.repeat(80));
            console.log('DEBUG: AFTER TRANSFORMATION');
            console.log('First grid row:', gridData[0]);
            console.log('Keys in grid row:', Object.keys(gridData[0]));
            console.log('Sample values:', {
                'Invoice Number': gridData[0]['Invoice Number'],
                'Has Discount': gridData[0]['Has Discount'],
                'Discount %': gridData[0]['Discount %'],
                'APR': gridData[0]['APR'],
                'Action': gridData[0]['Action'],
                'Status': gridData[0]['Status'],
                'Savings': gridData[0]['Savings']
            });
            console.log('Total grid rows:', gridData.length);
            console.log('='.repeat(80));
            
            // Validate that we have data
            if (!gridData || gridData.length === 0) {
                console.error('No grid data after transformation!');
                showToast('Error: No data to display after analysis', 'error');
                return;
            }
            
            // Ensure all analysis columns are present in all rows (even if empty)
            // This ensures the grid shows all columns
            const allPossibleColumns = [
                'Invoice Number', 'Supplier Name', 'Invoice Amount', 'Payment Terms', 'Due Date',
                'Has Discount', 'Discount %', 'Discount Days', 'Net Days',
                'APR', 'Net Benefit', 'ROI vs Capital',
                'Action', 'Status', 'Priority', 'Savings', 'Reason',
                'Strategic Insight', 'Supplier Intelligence'
            ];
            
            // Add missing columns to all rows (with empty values)
            const enrichedGridData = gridData.map((row, idx) => {
                const enriched = {...row};
                allPossibleColumns.forEach(col => {
                    if (!(col in enriched)) {
                        enriched[col] = '';
                    }
                });
                // Debug first few rows
                if (idx < 3) {
                    console.log(`Row ${idx} data:`, enriched);
                }
                return enriched;
            });
            
            console.log('Enriched grid data columns:', Object.keys(enrichedGridData[0]));
            console.log('Sample enriched row:', enrichedGridData[0]);
            console.log('Total enriched rows:', enrichedGridData.length);
            
            // Verify data has values
            const sampleRow = enrichedGridData[0];
            const hasData = Object.values(sampleRow).some(val => val !== '' && val !== null && val !== undefined);
            console.log('Sample row has data:', hasData, sampleRow);
            
            if (!hasData) {
                console.error('Enriched data appears empty!');
                console.error('Sample row:', JSON.stringify(sampleRow, null, 2));
            }
            
            updateGrid(enrichedGridData);
            
            // Update summary card
            displaySummaryCard(result.summary);
            
            // Enable export button
            document.getElementById('exportExcelBtn').disabled = false;
            
            hideLoading();
            disableButtons(false);
            const llmMsg = result.summary.llm_enhanced > 0 
                ? ` (${result.summary.llm_enhanced} with AI insights)` 
                : '';
            showToast(`Analysis complete! Found ${result.summary.recommended} opportunities worth $${result.summary.total_savings.toLocaleString()}${llmMsg}`, 'success');
        } else {
            hideLoading();
            disableButtons(false);
            showToast(result.error || 'Analysis failed', 'error');
        }
    } catch (error) {
        hideLoading();
        disableButtons(false);
        showToast(`Analysis error: ${error.message}`, 'error');
    }
}

function transformResultsForGrid(results) {
    if (!results || results.length === 0) {
        console.warn('transformResultsForGrid: No results provided');
        return [];
    }
    
    console.log('transformResultsForGrid: Processing', results.length, 'results');
    console.log('transformResultsForGrid: First result keys:', Object.keys(results[0]));
    
    return results.map((r, idx) => {
        // Start with base invoice data - ensure these are always present
        const row = {
            'Invoice Number': r.invoice_number || '',
            'Supplier Name': r.supplier_name || '',
            'Invoice Amount': r.invoice_amount || 0,
            'Payment Terms': r.payment_terms || '',
            'Due Date': r.due_date || '',
        };
        
        // Check if this is analyzed data (has analysis fields)
        const isAnalyzed = r.has_discount !== undefined || r.action !== undefined || r.status !== undefined;
        
        if (idx === 0) {
            console.log('transformResultsForGrid: First row isAnalyzed:', isAnalyzed);
            console.log('transformResultsForGrid: First row has_discount:', r.has_discount);
            console.log('transformResultsForGrid: First row action:', r.action);
            console.log('transformResultsForGrid: First row status:', r.status);
        }
        
        if (isAnalyzed) {
            // Add parsed payment terms columns (always include, even if empty)
            row['Has Discount'] = r.has_discount !== undefined ? r.has_discount : 'No';
            
            // Always include discount columns (empty string if no discount)
            row['Discount %'] = (r.discount_percentage !== undefined && r.discount_percentage !== null && r.discount_percentage !== '') ? r.discount_percentage : '';
            row['Discount Days'] = (r.discount_days !== undefined && r.discount_days !== null && r.discount_days !== '') ? r.discount_days : '';
            row['Net Days'] = (r.net_days !== undefined && r.net_days !== null && r.net_days !== '') ? r.net_days : '';

            // Always include ROI analysis fields (empty if not calculated)
            row['APR'] = (r.apr !== undefined && r.apr !== null && r.apr !== '') ? r.apr : '';
            row['Net Benefit'] = (r.net_benefit !== undefined && r.net_benefit !== null && r.net_benefit !== '') ? r.net_benefit : '';
            row['ROI vs Capital'] = (r.roi_vs_capital !== undefined && r.roi_vs_capital !== null && r.roi_vs_capital !== '') ? r.roi_vs_capital : '';

            // Always include recommendation fields
            row['Action'] = r.action || '';
            
            // Update status based on review decisions or backend status
            if (reviewDecisions[r.invoice_number] === 'approve') {
                row['Status'] = 'Approved';
            } else if (reviewDecisions[r.invoice_number] === 'reject') {
                row['Status'] = 'Rejected';
            } else {
                row['Status'] = r.status || '';
            }
            
            row['Priority'] = r.priority || '';
            row['Savings'] = (r.savings !== undefined && r.savings !== null) ? r.savings : 0;
            row['Reason'] = r.reason || '';
            
            // Store flags for review panel (internal)
            if (r.flags) {
                row['_flags'] = r.flags;
            }
            
            // Add LLM insights if available
            if (r.strategic_insight) {
                row['Strategic Insight'] = r.strategic_insight;
                row['_has_llm'] = true;
                row['_ai_indicator'] = true;
            }
            if (r.supplier_intelligence) {
                row['Supplier Intelligence'] = r.supplier_intelligence;
                row['_has_llm'] = true;
                row['_ai_indicator'] = true;
            }
            if (r.negotiation_tips && r.negotiation_tips.length > 0) {
                row['_negotiation_tips'] = r.negotiation_tips;
            }
        }
        // If not analyzed, only show base columns (raw CSV data)

        return row;
    });
}

// ============================================================================
// SUMMARY CARD
// ============================================================================

function displaySummaryCard(summary) {
    const summaryCard = document.getElementById('summaryCard');
    if (!summaryCard) return;

    // Find top opportunity
    const topOpp = analyzedResults
        .filter(r => r.action === 'TAKE DISCOUNT')
        .sort((a, b) => (b.savings || 0) - (a.savings || 0))[0];

    // Calculate average ROI
    const opportunities = analyzedResults
        .filter(r => r.action === 'TAKE DISCOUNT' && r.roi_vs_capital !== undefined);
    const avgROI = opportunities.length > 0
        ? opportunities.reduce((sum, r) => sum + (r.roi_vs_capital || 0), 0) / opportunities.length
        : 0;

    const aiCount = summary.llm_enhanced || 0;
    
    summaryCard.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="text-sm text-gray-600 mb-1">Total Savings</div>
                <div class="text-2xl font-bold" style="color: var(--success);">$${summary.total_savings.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="text-sm text-gray-600 mb-1">Invoices to Act On</div>
                <div class="text-2xl font-bold" style="color: var(--success);">
                    <span class="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-lg">${summary.recommended}</span>
                </div>
            </div>
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="text-sm text-gray-600 mb-1">Average ROI</div>
                <div class="text-2xl font-bold">${avgROI.toFixed(1)}%</div>
                <div class="text-xs text-gray-500">vs ${brandConfig.cost_of_capital}% cost of capital</div>
            </div>
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="text-sm text-gray-600 mb-1">Top Opportunity</div>
                <div class="text-lg font-semibold">${topOpp ? topOpp.invoice_number : 'N/A'}</div>
                <div class="text-sm" style="color: var(--success);">${topOpp ? `$${(topOpp.savings || 0).toLocaleString()}` : ''}</div>
                ${aiCount > 0 ? `<div class="text-xs text-gray-500 mt-1">🤖 ${aiCount} AI-enhanced</div>` : ''}
            </div>
        </div>
    `;

    summaryCard.style.display = 'block';
}

function hideSummaryCard() {
    const summaryCard = document.getElementById('summaryCard');
    if (summaryCard) {
        summaryCard.style.display = 'none';
    }
}

// ============================================================================
// EXPORT
// ============================================================================

async function exportExcel() {
    if (analyzedResults.length === 0) {
        showToast('No analyzed results to export', 'error');
        return;
    }

    try {
        showLoading('Generating Excel file...');
        disableButtons(true);

        // Filter results based on review decisions
        // Include: Auto-approved, manually approved, exclude rejected
        const filteredResults = analyzedResults.filter(r => {
            const decision = reviewDecisions[r.invoice_number];
            if (decision === 'reject') {
                return false; // Exclude rejected
            }
            if (decision === 'approve') {
                return true; // Include manually approved
            }
            // Include auto-approved (status === "Auto-approve")
            return r.status === 'Auto-approve';
        });

        const response = await fetch(`${API_BASE}/api/export`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                results: filteredResults
            })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().split('T')[0];
            a.href = url;
            a.download = `discount_analysis_${timestamp}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            hideLoading();
            disableButtons(false);
            showToast('Excel file downloaded successfully!', 'success');
        } else {
            const error = await response.json();
            hideLoading();
            disableButtons(false);
            showToast(error.error || 'Export failed', 'error');
        }
    } catch (error) {
        hideLoading();
        disableButtons(false);
        showToast(`Export error: ${error.message}`, 'error');
    }
}

// ============================================================================
// CONFIG PANEL
// ============================================================================

function toggleConfigPanel() {
    const panel = document.getElementById('configPanel');
    const icon = document.getElementById('configIcon');
    
    if (panel.classList.contains('collapsed')) {
        panel.classList.remove('collapsed');
        panel.classList.add('expanded');
        icon.style.transform = 'rotate(180deg)';
    } else {
        panel.classList.remove('expanded');
        panel.classList.add('collapsed');
        icon.style.transform = 'rotate(0deg)';
    }
}

function saveConfig() {
    brandConfig = {
        cost_of_capital: parseFloat(document.getElementById('costOfCapital').value),
        approval_threshold: parseFloat(document.getElementById('approvalThreshold').value),
        min_discount: parseFloat(document.getElementById('minDiscount').value)
    };
    showToast('Configuration saved!', 'success');
}

// ============================================================================
// UTILITIES
// ============================================================================

function updateRowCount() {
    const count = currentData.length;
    document.getElementById('rowCount').textContent = `${count} invoices loaded`;
    document.getElementById('runAnalysisBtn').disabled = count === 0;
}

function clearData() {
    if (confirm('Are you sure you want to clear all data?')) {
        currentData = [];
        analyzedResults = [];
        summaryData = null;
        clearGrid();
        hideSummaryCard();
        updateRowCount();
        document.getElementById('exportExcelBtn').disabled = true;
        document.getElementById('fileInput').value = '';
        showToast('Data cleared', 'success');
    }
}

function showLoading(message) {
    const btn = document.getElementById('runAnalysisBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${message}`;
    }
}

function hideLoading() {
    const btn = document.getElementById('runAnalysisBtn');
    if (btn) {
        btn.disabled = currentData.length === 0;
        btn.innerHTML = '<i class="fas fa-play mr-2"></i>Run Analysis';
    }
}

function disableButtons(disabled) {
    document.getElementById('runAnalysisBtn').disabled = disabled;
    document.getElementById('exportExcelBtn').disabled = disabled || analyzedResults.length === 0;
    document.getElementById('clearBtn').disabled = disabled;
}

// Toast notifications
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let bgColor = '#4472C4'; // Default blue
    let icon = 'fa-info-circle';
    
    if (type === 'success') {
        bgColor = '#70AD47';
        icon = 'fa-check-circle';
    } else if (type === 'error') {
        bgColor = '#C00000';
        icon = 'fa-exclamation-circle';
    } else if (type === 'warning') {
        bgColor = '#FFC000';
        icon = 'fa-exclamation-triangle';
    }

    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${bgColor};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================================================
// REVIEW PANEL
// ============================================================================

function openReviewPanel(invoiceNumber) {
    // Find the invoice in analyzedResults
    const invoice = analyzedResults.find(r => r.invoice_number === invoiceNumber);
    if (!invoice) {
        showToast('Invoice not found', 'error');
        return;
    }
    
    currentReviewInvoice = invoiceNumber;
    
    // Populate review panel
    document.getElementById('reviewInvoiceNumber').textContent = invoice.invoice_number || '-';
    document.getElementById('reviewSupplier').textContent = invoice.supplier_name || '-';
    document.getElementById('reviewAmount').textContent = `$${(invoice.invoice_amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('reviewTerms').textContent = invoice.payment_terms || '-';
    document.getElementById('reviewSavings').textContent = `$${(invoice.savings || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('reviewReason').textContent = invoice.reason || '-';
    document.getElementById('reviewAPR').textContent = invoice.apr ? `${invoice.apr.toFixed(1)}%` : '-';
    document.getElementById('reviewNetBenefit').textContent = invoice.net_benefit ? `$${invoice.net_benefit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-';
    document.getElementById('reviewROI').textContent = invoice.roi_vs_capital ? `${invoice.roi_vs_capital.toFixed(1)}%` : '-';
    
    // Show strategic insight if available
    if (invoice.strategic_insight) {
        const insightDiv = document.createElement('div');
        insightDiv.className = 'mb-6 llm-dynamic-section';
        insightDiv.innerHTML = `
            <h3 class="text-sm font-semibold text-gray-500 uppercase mb-3">🤖 Strategic Insight</h3>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-sm text-gray-700">${invoice.strategic_insight}</p>
            </div>
        `;
        // Insert before ROI Details
        const roiSection = document.querySelector('#reviewROI').closest('.mb-6');
        roiSection.parentNode.insertBefore(insightDiv, roiSection);
    }
    
    // Show supplier intelligence if available
    if (invoice.supplier_intelligence) {
        const supplierDiv = document.createElement('div');
        supplierDiv.className = 'mb-6 llm-dynamic-section';
        supplierDiv.innerHTML = `
            <h3 class="text-sm font-semibold text-gray-500 uppercase mb-3">🏢 Supplier Intelligence</h3>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p class="text-sm text-gray-700">${invoice.supplier_intelligence}</p>
            </div>
        `;
        // Insert before ROI Details
        const roiSection = document.querySelector('#reviewROI').closest('.mb-6');
        roiSection.parentNode.insertBefore(supplierDiv, roiSection);
    }
    
    // Show negotiation tips if available
    if (invoice.negotiation_tips && invoice.negotiation_tips.length > 0) {
        const tipsDiv = document.createElement('div');
        tipsDiv.className = 'mb-6 llm-dynamic-section';
        tipsDiv.innerHTML = `
            <h3 class="text-sm font-semibold text-gray-500 uppercase mb-3">💡 Negotiation Tips</h3>
            <div class="space-y-2">
                ${invoice.negotiation_tips.map(tip => `
                    <div class="flex items-start gap-2 text-sm text-gray-700">
                        <i class="fas fa-lightbulb text-yellow-500 mt-1"></i>
                        <span>${tip}</span>
                    </div>
                `).join('')}
            </div>
        `;
        // Insert before Actions
        const actionsSection = document.querySelector('#acceptReviewBtn').closest('.space-y-3');
        actionsSection.parentNode.insertBefore(tipsDiv, actionsSection);
    }
    
    // Show risk factors if invoice amount exceeds threshold
    const riskFactors = [];
    if (invoice.invoice_amount > brandConfig.approval_threshold) {
        riskFactors.push(`Large invoice amount ($${invoice.invoice_amount.toLocaleString()}) exceeds approval threshold`);
    }
    if (invoice.flags && invoice.flags.length > 0) {
        riskFactors.push(...invoice.flags.map(flag => flag.replace(/_/g, ' ')));
    }
    if (invoice.risk_assessment) {
        riskFactors.push(invoice.risk_assessment);
    }
    
    const riskFactorsDiv = document.getElementById('reviewRiskFactors');
    const riskList = document.getElementById('reviewRiskList');
    if (riskFactors.length > 0) {
        riskFactorsDiv.style.display = 'block';
        riskList.innerHTML = riskFactors.map(risk => 
            `<div class="flex items-start gap-2 text-sm text-gray-700">
                <i class="fas fa-exclamation-triangle text-orange-500 mt-1"></i>
                <span>${risk}</span>
            </div>`
        ).join('');
    } else {
        riskFactorsDiv.style.display = 'none';
    }
    
    // Show panel
    document.getElementById('reviewPanel').classList.add('open');
    document.getElementById('reviewOverlay').classList.add('active');
}

function closeReviewPanelHandler() {
    // Remove any dynamically added LLM insight sections
    const panel = document.getElementById('reviewPanel');
    const dynamicSections = panel.querySelectorAll('.llm-dynamic-section');
    dynamicSections.forEach(section => section.remove());
    
    document.getElementById('reviewPanel').classList.remove('open');
    document.getElementById('reviewOverlay').classList.remove('active');
    currentReviewInvoice = null;
}

async function handleAcceptReview() {
    if (!currentReviewInvoice) return;
    
    try {
        // Send to backend
        const response = await fetch(`${API_BASE}/api/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                invoice_number: currentReviewInvoice,
                action: 'approve'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update local state
            reviewDecisions[currentReviewInvoice] = 'approve';
            
            // Update status in analyzedResults
            const invoice = analyzedResults.find(r => r.invoice_number === currentReviewInvoice);
            if (invoice) {
                invoice.status = 'Approved';
            }
            
            // Update grid with new data
            if (gridApi) {
                const gridData = transformResultsForGrid(analyzedResults);
                gridApi.setGridOption('rowData', gridData);
            }
            
            closeReviewPanelHandler();
            showToast('Invoice approved', 'success');
        } else {
            showToast(result.error || 'Failed to approve invoice', 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

async function handleRejectReview() {
    if (!currentReviewInvoice) return;
    
    try {
        // Send to backend
        const response = await fetch(`${API_BASE}/api/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                invoice_number: currentReviewInvoice,
                action: 'reject'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update local state
            reviewDecisions[currentReviewInvoice] = 'reject';
            
            // Update status in analyzedResults
            const invoice = analyzedResults.find(r => r.invoice_number === currentReviewInvoice);
            if (invoice) {
                invoice.status = 'Rejected';
            }
            
            // Update grid with new data
            if (gridApi) {
                const gridData = transformResultsForGrid(analyzedResults);
                gridApi.setGridOption('rowData', gridData);
            }
            
            closeReviewPanelHandler();
            showToast('Invoice rejected', 'info');
        } else {
            showToast(result.error || 'Failed to reject invoice', 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}
