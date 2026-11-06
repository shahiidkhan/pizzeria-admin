# Firebase Notifications

This project now uses Firestore notification documents plus Firebase Cloud Messaging.

## Required Firebase Setup

1. In Firebase Console, open Project settings > Cloud Messaging.
2. Create or copy the Web Push certificate key pair.
3. Add the public key to the admin web app environment:

```bash
VITE_FIREBASE_VAPID_KEY=your_web_push_public_key
```

4. Deploy Functions after dependencies are installed:

```bash
firebase deploy --only functions
```

Deploy hosting as usual after rebuilding the admin app.

## Firestore Collections

`notifications`

- `userId`: `"admin"` for admin alerts, or the customer user id for user alerts.
- `orderId`: related order document id.
- `type`: notification type, such as `new_order`, `order_processing`, `order_on_way`, `order_delivered`, or `order_received_confirmation`.
- `title`, `message`, `read`, `createdAt`.

`fcmTokens`

- Document id: URL-encoded FCM token.
- `token`: raw FCM token.
- `userId`: `"admin"` for admin web tokens, or the customer user id for mobile tokens.
- `role`: `"admin"` for admin users.
- `platform`: `"web"`, `"android"`, or `"ios"`.
- `updatedAt`.

## Mobile App Contract

The mobile app should save each logged-in user's FCM token in `fcmTokens`:

```js
await setDoc(doc(db, 'fcmTokens', encodeURIComponent(token)), {
  token,
  userId: currentUser.uid,
  role: 'customer',
  platform: Platform.OS,
  updatedAt: serverTimestamp(),
}, { merge: true });
```

When the user taps received/confirmed delivery, update the order with either:

```js
customerConfirmed: true
confirmedDelivered: true
confirmedAt: serverTimestamp()
confirmedDeliveredAt: serverTimestamp()
```

Cloud Functions will create the admin notification automatically.
