# Google Analytics 4

Measurement ID: `G-PVW65CG68J` (public identifier, not a server credential).

`components/analytics/GoogleAnalytics.tsx` loads Google's tag once with Next.js Script after hydration. The server enables it only for `mindapp.icu`, `www.mindapp.icu` and the existing public alias `mind-lemon.vercel.app`. Preview deployments and the administrative hostname do not load the tag.

The owner explicitly authorized measurement on the landing. Public exploration, creator profiles, published prompts/resources, plans and contact pages are included. No landing styles, content or navigation were changed. Direct visits to authentication, account, onboarding and administrative routes do not load the tag. Navigating into an excluded route sets Google's measurement opt-out flag. The integration adds no user IDs, profile fields, prompt text or form values to events. Google signals and advertising personalization are disabled, and Analytics cookies use the current hostname.

The tag uses Google's normal automatic page measurement. SPA history measurement is provided by the web stream's Enhanced Measurement setting; keep "Page changes based on browser history events" enabled. The application does not also send manual `page_view` events, avoiding a second application-generated pageview for the same navigation. Default Google measurement may include public page URLs, query strings, titles and enhanced-measurement events according to the stream configuration.

The admin shows the installed measurement ID separately from report connectivity. Installing a tag does not authorize access to the GA4 Data API. Reading reports inside the admin still requires the numeric GA4 property ID and a server identity with access to that property; no report metrics are simulated.

After deployment, real public visits can be viewed in GA4 Realtime. No synthetic Analytics events were generated to claim collection had been verified.
