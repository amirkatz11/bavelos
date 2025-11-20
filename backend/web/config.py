"""Configuration for Bavelos FinOps web application."""

import os

# Flask configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'

# File upload settings
UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
ALLOWED_EXTENSIONS = {'csv'}

# Brand Kit defaults
DEFAULT_COST_OF_CAPITAL = 15.0
DEFAULT_APPROVAL_THRESHOLD = 50000.0
DEFAULT_MIN_DISCOUNT = 0.5

# Output settings
OUTPUT_FOLDER = 'outputs'

