# Technical & Compliance

## Data Residency
- EU-friendly deployment required.  
- Supabase EU region by default.

## Data Encryption
- Encrypt at rest: user conversations, project context, research data.  
- Supabase default encryption deemed sufficient for v1.

## Deployment
- **Primary:** Vercel (Next.js optimised).  
- **Database:** Supabase (managed Postgres + Auth).  
- **Alt:** Railway / Render if integration issues.

## Other Compliance Notes
- GDPR obligations: right to access, deletion flows.  
- No healthcare/finance regulatory requirements currently.

---
### Open Questions
- HMW automate data deletion requests across Supabase & Vercel logs?  
- HMW support US-only hosting if future clients demand? 