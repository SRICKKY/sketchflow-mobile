# SketchFlow Mobile

Tablet-first SketchFlow client for iPadOS and Android tablets, built with Expo,
React Native, TypeScript, and Expo Router.

## Requirements

- Node.js 20 or newer
- The Expo-compatible iOS Simulator / Xcode or Android emulator setup described
  in the [Expo environment guide](https://docs.expo.dev/get-started/set-up-your-environment/)

## Configure the API

The app consumes the Rust backend. Copy `.env.example` to `.env` and set
`EXPO_PUBLIC_API_URL` to the backend origin reachable from the device:

```env
EXPO_PUBLIC_API_URL=http://localhost:8080
```

`EXPO_PUBLIC_` values are included in the app bundle and must not contain
credentials. `localhost` works when the app and backend run on the same host.
For an Android emulator, use `http://10.0.2.2:8080`; for a physical tablet, use
the computer's LAN IP and make sure both devices are on the same network. Use
local HTTP only for development; native standalone builds may block it unless
configured for development, and production builds should use HTTPS.

The current sign-in flow uses the backend's `sketchflow_session` cookie. API
requests include credentials; the backend must be configured for the production
client origin if the web target is used.

## Run the app

```sh
npm install
npx expo start
```

For native development builds:

```sh
npx expo run:ios
npx expo run:android
```

The project enables iPad support and supports both portrait and landscape
orientations. Tablet layouts use responsive breakpoints rather than a fixed
screen size.

## Current API integration

- `GET /api/auth/session` restores the current session on app launch.
- `POST /api/auth/login` signs in with email and password.
- `POST /api/auth/register` creates an account.
- `POST /api/auth/logout` ends the current session.

The app expects the Rust API's JSON error shape (`{ "error": "..." }`) and
displays the returned message in the UI.
