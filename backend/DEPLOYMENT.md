# Bavelos FinOps - Deployment Guide

## Local Development

### Prerequisites
- Python 3.10+
- Virtual environment

### Setup
```bash
# Clone/download project
cd bavelos

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run locally
python3 web/app.py
```

Access at: http://localhost:5001

---

## Deploy to Replit (Recommended - Free)

### Step 1: Prepare for Upload
1. Create account at replit.com
2. Zip your `bavelos` folder (exclude `venv/`, `__pycache__/`, `outputs/`)

### Step 2: Create Repl
1. Click "+ Create Repl"
2. Select "Import from GitHub" or "Upload"
3. Upload your zip file
4. Replit auto-detects Python and installs dependencies

### Step 3: Configure
Replit will automatically:
- Read `.replit` configuration
- Install `requirements.txt`
- Set up Python environment

### Step 4: Run
1. Click "Run" button
2. Replit shows your app in iframe
3. Click "Open in new tab" for full view

### Step 5: Share
Your public URL: `https://bavelos-[username].repl.co`
- Share this with anyone
- No authentication required
- Free tier includes: 500MB storage, always-on with Hacker plan

---

## Deploy to Railway (Alternative)

### Quick Deploy
1. Go to railway.app
2. "New Project" → "Deploy from GitHub"
3. Connect your GitHub repo
4. Railway auto-detects Python
5. Sets PORT environment variable
6. Deploys automatically

Public URL: `https://bavelos-production.up.railway.app`

**Pricing:** $5/month for hobby plan

---

## Deploy to Heroku

### Prerequisites
- Heroku account
- Heroku CLI installed

### Steps
```bash
# Login
heroku login

# Create app
heroku create bavelos-finops

# Add buildpack
heroku buildpacks:set heroku/python

# Deploy
git push heroku main

# Open
heroku open
```

Public URL: `https://bavelos-finops.herokuapp.com`

**Pricing:** Free tier available (sleeps after 30min idle)

---

## Environment Variables

For production, set these:
- `PORT`: Auto-set by hosting platform
- `FLASK_ENV`: "production"
- `MAX_UPLOAD_SIZE`: "50MB" (optional)

---

## Security Considerations

### For Production:
1. Enable rate limiting
2. Add file validation (CSV only, max size)
3. Add authentication (if needed)
4. Use HTTPS (automatic on Replit/Railway/Heroku)
5. Set CORS restrictions

### Optional Enhancements:
- Add user accounts
- Save analysis history
- Enable team sharing
- Schedule automated runs

---

## Monitoring

### Check App Health:
- Replit: Built-in console logs
- Railway: Dashboard → Logs tab
- Heroku: `heroku logs --tail`

### Metrics to Watch:
- Request response time
- Upload success rate
- Analysis completion rate
- Export downloads

---

## Troubleshooting

### "Module not found" errors:
```bash
pip install -r requirements.txt --force-reinstall
```

### "Port already in use":
```bash
lsof -ti:5001 | xargs kill -9
python3 web/app.py
```

### CSV upload fails:
- Check file size < 50MB
- Verify CSV format (header row required)
- Check required columns exist

### Analysis returns errors:
- Check agent imports working
- Verify payment terms format
- Check numeric fields are numbers

---

## Performance Tips

### For Large Files (1000+ invoices):
- Consider batch processing
- Add progress indicators
- Implement caching
- Use background jobs (Celery)

### For Production Scale:
- Use Gunicorn instead of Flask dev server
- Add Redis for caching
- Implement database for history
- Use CDN for static assets

---

## Next Steps

After deployment:
1. Test with real invoice data
2. Share URL with 3-5 CFOs
3. Collect feedback
4. Track usage metrics
5. Iterate based on feedback

---

## Support

For issues:
- Check logs first
- Verify dependencies installed
- Test locally before deploying
- Check hosting platform status

