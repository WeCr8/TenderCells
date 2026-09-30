# Stripe Billing Setup

TenderCells keeps local and open-source operation free. The initial hosted plans are:

| Plan | Price | Trial | Stripe lookup/config purpose |
| --- | ---: | ---: | --- |
| TenderCells Starter | $5/month | 30 days | Individual hosted services |
| TenderCells School Pilot | $499/year | 60 days | School pilot, card or PO/invoice |

## Test-mode setup

1. In Stripe test mode, create the two Products and recurring Prices above.
2. Record the resulting `price_...` IDs as `STRIPE_STARTER_PRICE_ID` and `STRIPE_SCHOOL_PRICE_ID`.
3. Enable the Stripe customer portal for payment-method updates, invoice history, and cancellation.
4. Add a webhook endpoint for `https://us-central1-tender-cells.cloudfunctions.net/stripeBillingWebhook`.
5. Subscribe it to `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
6. Store secrets with Firebase CLI, never in `.env` committed to Git:

```powershell
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

Set the non-secret Price IDs in the Functions deployment environment. Deploy `createBillingCheckout`, `createBillingPortal`, and `stripeBillingWebhook`, then complete one test checkout for each plan using a Stripe test card.

## Production checklist

- Complete Stripe business, bank, tax, support, statement-descriptor, and branding details.
- Recreate or activate Products and Prices in live mode; test-mode IDs do not work in live mode.
- Replace both Firebase secrets with live values and register the live webhook signing secret.
- Configure Stripe Tax only after confirming the business's tax registrations and school exemption process.
- Keep school purchase orders in the existing organization workflow; never store card or bank data in Firestore.
- Confirm trial reminders, cancellation terms, privacy policy, terms, refund policy, and support contact before accepting live payments.
