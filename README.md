# Bible Devotional AI

An AI-powered Bible study and devotional application built with React Native and Expo.

## Storage Architecture (Expo 54 FileSystem)

The application uses a high-performance, chunked storage architecture for user data, specifically optimized for Bible highlights.

### High-Performance Highlights
- **Chunking Strategy:** Highlights are partitioned by Bible book (e.g., `GEN.json`, `MAT.json`).
- **Partial Loading:** The Bible Reader only loads highlights for the book currently being read, preventing performance bottlenecks as the user's library grows.
- **Migration:** Automatically migrates legacy monolithic `highlights.json` and `AsyncStorage` data into the new chunked structure.
- **Bulk Operations:** Optimized for multi-verse highlighting and removal.

### Core Data Persistence
- **Library & Favorites:** Stored in `saved_devotionals.json` and `favorites.json`.
- **Bible Cache:** High-speed JSON caching for Bible text in a dedicated cache directory.
- **Clean Architecture:** Centralized `store.js` service manages all I/O operations using the latest Expo `File` and `Directory` APIs.

## Key Features
- **Bible Reader:** Fast navigation, multi-version support, and persistent highlights.
- **Reading Plans:** Track progress across multi-day spiritual journeys.
- **Devotionals:** AI-generated or curated daily spiritual content.
- **Verse Sharing:** Create beautiful, shareable verse-on-image graphics.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   npx expo start
   ```

## Testing
Stress tests are available in the Settings screen to verify storage integrity and performance under heavy loads (5,000+ items).
