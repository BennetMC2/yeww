# Project: yeww Marketing Website

Build a hype-building landing page with early access waitlist for yeww, a health/longevity platform.

## About the Product

**yeww** is your single source of truth for all health data—wearables, fitness apps, nutrition, blood tests, weight, mood—with an AI assistant that actually knows your full picture.

**Core value props:**
1. **Single data repository** - All your health data in one place (Garmin, Oura, Whoop, Apple Watch, manual entry)
2. **AI assistant** - Ask anything, get personalized answers based on YOUR actual data
3. **Anticipatory intelligence** - Surfaces patterns and predictions before you ask (e.g., "Coffee after 2pm reduces your sleep quality by 23%")

**Target audience:** Health-conscious people who track data across multiple devices/apps but lack a unified view or intelligent insights.

## Website Requirements

### Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Deploy to Vercel

### Page Structure
Single landing page with these sections:

1. **Hero**
   - Bold headline communicating the core benefit (not what it is, what it does for them)
   - Subheadline addressing their pain point (data scattered everywhere, no actionable insights)
   - Early access CTA button
   - Optional: Animated mockup or product preview

2. **Problem/Solution**
   - Acknowledge the problem: "You track everything but understand nothing"
   - Show the scattered tools (logos of Garmin, Oura, Whoop, MyFitnessPal, etc.)
   - Position yeww as the unifier

3. **Key Features** (3 max)
   - Unified health data repository
   - AI that knows your full picture
   - Pattern detection that predicts before you ask

4. **Social Proof / Credibility Section**
   Use these to look legit even pre-launch:
   - "Backed by" or "Built with" logos (Anthropic/Claude, Supabase, Vercel, Terra)
   - Founder credentials if applicable
   - "Join X others on the waitlist" counter (update dynamically)
   - Optional: Testimonial from a beta tester or advisor quote

5. **Early Access Signup**
   - Email capture form
   - "Request Early Access" button (not just "Sign up")
   - Show waitlist position after signup: "You're #427 on the list"
   - Add referral program: "Move up the list by inviting friends" with shareable link

6. **Footer**
   - Simple: Logo, social links, email contact

### Waitlist Mechanics (Important)
Implement these hype-building features:

1. **Position display**: After signup, show "You're #X on the waitlist"
2. **Referral program**: Give each user a unique referral link
3. **Queue jumping**: Referred signups move the referrer up the list
4. **Tiered rewards** (optional):
   - 3 referrals → Priority access
   - 5 referrals → Founding member badge
   - 10 referrals → Free month

For the backend, you can use:
- Supabase for storing emails and referral tracking
- Or a service like Waitlist.wtf, GetWaitlist, or Viral Loops

### Design Direction
- Modern, clean, minimal
- Dark mode preferred (health/tech aesthetic)
- Accent color: Consider a vibrant gradient or single bold color
- Typography: Clean sans-serif (Inter, Geist, or similar)
- Mobile-first (83% of waitlist visitors are on mobile)

### Credibility Elements to Include
Even without real users yet, build trust:

- **Tech stack logos**: "Built with Claude AI, Supabase, Terra"
- **Integration logos**: Show supported devices (Garmin, Oura, Whoop, Apple Watch, Fitbit)
- **Security mention**: "Your data is encrypted and never sold"
- **Waitlist counter**: Shows social proof of interest
- **Founder section** (optional): Brief intro, photo, credibility
- **Press/awards** (if any): Add as you get them
- **"Coming Q2 2026"** or similar timeline creates urgency

### Copy Tone
- Confident but not arrogant
- Direct, benefit-focused
- Avoid jargon
- Create FOMO without being sleazy

### Example Headlines (pick or adapt)
- "Finally understand your health data"
- "One place. Every metric. Real insights."
- "Your health data is scattered. Your AI assistant isn't."
- "Stop collecting data. Start understanding it."

## Files to Create
- `src/app/page.tsx` - Main landing page
- `src/app/layout.tsx` - Root layout with fonts, metadata
- `src/app/globals.css` - Tailwind + custom styles
- `src/components/WaitlistForm.tsx` - Email capture with referral logic
- `src/components/WaitlistCounter.tsx` - Dynamic signup count
- `src/app/api/waitlist/route.ts` - API endpoint for signups

## SEO & Meta
- Title: "yeww - Your AI Health Assistant"
- Description: "All your health data in one place with an AI that actually understands your full picture. Join the waitlist."
- OG image: Create a compelling social share image

## Success Metrics
- Target 20%+ visitor-to-signup conversion rate
- Track: visits, signups, referral rate, share clicks

---

## References
- [Viral Loops - How to Build a Waitlist](https://viral-loops.com/blog/how-to-build-a-waitlist/)
- [GetWaitlist - Landing Page Best Practices](https://getwaitlist.com/blog/landing_page_waitlist)
- [WebStacks - Trust Signals](https://www.webstacks.com/blog/trust-signals)
- [Prefinery - Waitlist Guide](https://www.prefinery.com/blog/building-a-waitlist-for-your-startup-the-complete-step-by-step-guide/)
