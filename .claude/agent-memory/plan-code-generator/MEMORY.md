# Plan-Code-Generator Agent Memory

## Project

G-Sync (공공업무 자동화) - Cloud Functions backend at:
`C:\Users\363ky\Desktop\공공업무 자동화\backend\functions\index.js`

## Security Fixes Applied

### CORS Restriction (2026-03-15)
- File: `backend/functions/index.js`, `handleCors()` function (line 76)
- Changed wildcard `'*'` to allowlist: `['https://yskim8908.github.io', 'http://localhost:3000']`
- Pattern: read `req.get('origin')`, set header only if origin is in ALLOWED_ORIGINS, else set `'null'`
- Also added `Authorization` to allowed headers (needed for future Firebase ID Token auth)

## Remaining Critical Security Issues

1. Password plaintext storage - `frontend/ui/auth.py` line 40, 81 - apply bcrypt
2. Cloud Functions unauthenticated - `backend/functions/index.js` all functions - add Firebase ID Token verification
