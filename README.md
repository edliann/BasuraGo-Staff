# BasuraGo Staff

Dedicated Expo Router app for facility staff. The initial app supports sign-in,
server-authorized access, assigned facility details, and logout. Pickup
verification and QR scanning are intentionally not included.

## Configure Firebase

Copy `.env.example` to `.env.local` and set the public Firebase web app
configuration using the same Firebase project as BasuraGo Customer and Rider.
Do not add service-account credentials or Admin SDK keys to this app.

For Android emulator testing, set `EXPO_PUBLIC_FIREBASE_USE_EMULATORS=true`.
The default emulator host is `10.0.2.2`; set
`EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` to the development machine's LAN address
when using a physical Android device. Keep emulator mode disabled for normal
Firebase project use.

## Run

```sh
npm install
npm run start
```

The dashboard facility data comes from the authenticated
`getFacilityStaffDashboardFunction` callable. The app does not read facility
documents directly or accept a facility ID from the user.
