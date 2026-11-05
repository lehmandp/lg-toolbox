# Shared Professional Branding

Native LG Loan Toolbox features should retrieve the authenticated user's profile from `getProfessionalProfile()` in `lib/professional-profile.ts` on the server, or GET `/api/profile` from an authenticated browser.

The shared profile contains the user's optional `review_url` (a full HTTP or HTTPS URL to any review destination, including Google, Yelp, or another provider), along with the loan officer's contact details, licensing/disclosure text, logo URL, headshot URL and `branding_default` (`logo`, `headshot`, `both`, or `none`). For reports and PDFs, use `visibleBrandImages(profile, optionalOverride)` to choose which of the two saved images should be shown. Per-form overrides should not change the account default. Do not implicitly substitute the business logo for a missing headshot, or vice versa.

For review-request emails, documents, and PDFs, use `profile.review_url` from the current authenticated user, and only render a review call-to-action when a link is configured. Example HTML template: `<a href="{{review_url}}">Leave a Review</a>`, where the placeholder is replaced with the safely escaped link before rendering. In plain-text emails, use the complete URL. The review link is optional and editable in Professional Settings. No existing email template is automatically changed.

All report generators must explicitly adopt the shared profile loader. This foundation does **not** inject branding into existing exports automatically. On every export, retrieve the current account's profile rather than caching a different user's credentials or image URL. Treat disclosure text as user data: escape in HTML/PDF templates.

Images are uploaded via authenticated POST `/api/profile/image`, multipart fields `kind=logo|headshot` and `file`. The server validates the file and writes it into `toolbox-branding/<authenticated user id>/...`. The upload endpoint, not the user-edited profile API, is the only writer of image URLs.

Apply the database changes in `supabase/shared-professional-branding.sql` **before** deploying the feature branch. Confirm storage bucket access policies and run a signed-in upload test. Logo/headshot URLs are public assets suitable for outward-facing marketing; never upload private client material to this bucket.

The existing AI key settings and the Realtor Partner Engine are not modified by this work.
