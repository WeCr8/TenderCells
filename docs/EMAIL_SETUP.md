# Email — auth emails, newsletter, preferences

## Auth emails (verify address, reset password, email change)

Firebase Auth sends these emails.

1. **Branded action page.**
   - In the Firebase console → Authentication → Templates, open each template → **Customize action URL**.
   - Set it to `https://tendercells.com/account/action`.
   - That page (`AuthActionPage.tsx`) handles `verifyEmail`, `resetPassword`, `recoverEmail` and `verifyAndChangeEmail` on our own domain.
2. **Sender.**
   - In the same Templates screen, set the sender name ("Tender Cells") and **Customize domain** to send from `noreply@tendercells.com`.
   - Add the DNS records Firebase shows (SPF, DKIM). Without them, mail lands in spam.
3. **Return link.**
   - The site passes `ACTION_CODE_SETTINGS` (continue URL `https://tendercells.com/account`).
   - After verifying, people return to their account page.

## Newsletter (double opt-in)

1. **Sign-up.**
   - Forms: the footer, `/newsletter`, and Account → Email preferences.
   - They write to `newsletterSignups`, which is create-only; clients can never read it.
2. **Confirmation email.** `onNewsletterSignup` emails a confirmation link to `/newsletter/confirm`.
3. **Confirm.** `confirmNewsletter` marks the address confirmed in `newsletterSubscribers` (server-only).
4. **Unsubscribe.** Every email should carry the unsubscribe link (`/newsletter/unsubscribe`, handled by `unsubscribeNewsletter`).
5. **Signed-in users.** Toggling "Newsletter" in Email preferences is synced by `syncEmailPreferences`. No second confirmation is needed, because the account email is already verified.

Delivery uses the **Trigger Email from Firestore** extension:
- Install it with `firebase ext:install firebase/firestore-send-email`.
- Collection: `mail`.
- SMTP: your provider, e.g. SendGrid, Mailgun, or Google Workspace SMTP relay.
- Functions only write `{ to, message: { subject, text, html } }` docs to `mail`, so the provider can change without code changes.

## Preferences and billing (Account page)

- Stored in `user_preferences/{uid}`:
  - `email { deviceAlerts, productUpdates, lessonDigests, newsletter, frequency }`;
  - `billing { billingEmail, invoiceEmails }`.
- `billing/{uid}` (plan, status) is written only by the billing backend. Plan upgrades, payment methods, invoices and school purchase orders show **Coming soon** until billing (e.g. Stripe) is connected.
