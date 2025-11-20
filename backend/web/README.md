# Bavelos FinOps - Discount Opportunity Finder

AirOps-style grid interface for finding missed early payment discounts.

## Features

- Upload CSV of invoices
- AI agents analyze payment terms
- Calculate ROI vs cost of capital
- Generate recommendations
- Export professional Excel reports

## Run Locally

```bash
pip install -r requirements.txt
python web/app.py
```

Open http://localhost:5001

## Tech Stack

- Backend: Python + Flask
- Frontend: HTML + Tailwind CSS + AG Grid
- Agents: Custom financial analysis logic
- Export: OpenPyXL

## Configuration (Brand Kit)

- Cost of Capital: 15% (adjustable 5-30%)
- Approval Threshold: $50,000
- Minimum Discount: 0.5%

## Deployment

### Replit

The project is configured for Replit deployment with:
- `.replit` - Replit configuration
- `replit.nix` - Nix package dependencies
- Production-ready Flask app

### Production Settings

- Debug mode: Disabled
- Host: 0.0.0.0 (all interfaces)
- Port: Configurable via PORT environment variable (default: 5001)

## API Endpoints

- `GET /` - Main interface
- `POST /api/upload` - Upload CSV file
- `POST /api/analyze` - Run analysis on invoice data
- `POST /api/export` - Export results to Excel
- `GET /api/templates` - Get available templates

## File Structure

```
web/
├── app.py              # Flask application
├── config.py           # Configuration settings
├── templates/
│   └── index.html      # Main UI
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js      # Main application logic
│       ├── grid.js
│       └── agents.js
├── uploads/            # Uploaded CSV files
└── outputs/            # Generated Excel reports
```

