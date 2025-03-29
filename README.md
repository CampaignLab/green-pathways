# green-pathways
Audio upload and parse project

# Architecture

A Python server built with Chalice, meant to run on AWS Lambda. A React frontend built with Next.js, deployed to AWS S3 and served with CloudFront.

# Backend

## Running locally

You must have Python3 installed on a Unix-like system.

Then:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
chalice local --port 5000
```

This will create a server at http://127.0.0.1:5000
