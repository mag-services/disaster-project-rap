# DRMIS Field Checks PWA

A Progressive Web App (PWA) for field damage verification with offline capabilities and direct DRMIS database synchronization.

## Features

### 🏗️ Architecture
- **React 18** with TypeScript for type safety
- **PWA** with offline-first design
- **IndexedDB** for local data storage
- **Service Worker** for background sync
- **Component-based** damage assessment (roof + wall)

### 📱 Field Data Collection
- **Component-based damage assessment** (separate roof/wall evaluation)
- **GPS location capture** with accuracy indicators
- **Photo capture** with metadata (roof, wall, overall, interior)
- **Offline data storage** with automatic sync
- **Form validation** with real-time error checking

### 🔄 Sync & Storage
- **Offline-first** data collection
- **Automatic background sync** when online
- **Progressive retry** mechanism for failed uploads
- **Conflict resolution** for concurrent edits
- **Real-time sync status** indicators

### 🗺️ GIS Integration
- **Interactive maps** for asset location
- **GPS coordinate capture** and validation
- **Council boundary overlays**
- **Offline map caching**

### 📊 Reporting
- **Component-level damage statistics**
- **Sync status dashboard**
- **Field check history**
- **Photo galleries** with captions

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- DRMIS API access

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd field-checks-app

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Build PWA with service worker
npm run build:pwa
```

### Environment Variables

Create `.env` file:

```env
REACT_APP_DRMIS_API_URL=https://your-drmis-api.com/api
REACT_APP_MAP_API_KEY=your-map-api-key
REACT_APP_ENVIRONMENT=development
```

## Usage

### Field Assessment Workflow

1. **Login** with DRMIS credentials
2. **Select Asset Type** (Education, Health, Shelter, etc.)
3. **Enter Asset Details** (ID, name, location)
4. **Capture GPS Location** (automatic or manual)
5. **Assess Roof Damage** (condition, percentage, notes, photos)
6. **Assess Wall Damage** (condition, percentage, notes, photos)
7. **Overall Assessment** (functionality, priority, needs)
8. **Save Field Check** (stores locally, queues for sync)

### Component-Based Damage Assessment

**Roof Damage Categories:**
- **Intact** (0-10%): Minor cosmetic issues
- **Minor Damage** (10-30%): Some sheets loose, small holes
- **Major Damage** (30-70%): Large sections missing, structural damage
- **Destroyed** (70-100%): Complete loss

**Wall Damage Categories:**
- **Intact** (0-10%): Minor cracks, cosmetic damage
- **Minor Damage** (10-30%): Some holes, partial damage
- **Major Damage** (30-70%): Large holes, partial collapse
- **Destroyed** (70-100%): Complete wall failure

### Offline Operation

- **Data Collection**: Full functionality offline
- **Photo Storage**: Local storage with compression
- **Map Caching**: Pre-loaded council boundaries
- **Sync Queue**: Automatic when connectivity restored

## Technical Architecture

### Data Flow

```
Field App → IndexedDB → Service Worker → DRMIS API → PostgreSQL
    ↓              ↓              ↓              ↓
  Local Cache → Background Sync → Conflict Resolution → Admin Review
```

### Database Schema

**FieldCheck Table:**
```typescript
interface FieldCheck {
  id?: number;
  uuid: string;
  deviceId: string;
  timestamp: number;
  synced: boolean;
  gpsCoordinates: { latitude, longitude, accuracy };
  assetType: 'education' | 'health' | 'shelter' | ...;
  assetId: string;
  assetName: string;
  roofDamage: { condition, percentage, notes };
  wallDamage: { condition, percentage, notes };
  photos: Array<{ id, type, dataUrl, timestamp }>;
  // ... additional fields
}
```

### Sync Mechanism

1. **Queue Management**: Track unsynced field checks
2. **Retry Logic**: Progressive delays (1s, 5s, 15s, 1m, 5m)
3. **Conflict Resolution**: Last-write-wins with audit trail
4. **Background Sync**: Service worker triggers on connectivity

## DRMIS Integration

### API Endpoints

```typescript
// Authentication
POST /api/auth/login
POST /api/auth/refresh

// Field Checks
GET /api/field-checks
POST /api/field-checks
PUT /api/field-checks/:id
DELETE /api/field-checks/:id

// Photos
POST /api/field-checks/:id/photos
GET /api/field-checks/:id/photos

// Reference Data
GET /api/councils
GET /api/assets
GET /api/asset-types
```

### Data Mapping

**Field Check → DRMIS:**
- Component damage → Separate damage records
- GPS coordinates → Location geometry
- Photos → Media attachments
- Assessment → Priority/needs classification

## Deployment

### Production Build

```bash
# Build optimized PWA
npm run build

# Test service worker
npx workbox-cli generateSW workbox-config.js

# Deploy to hosting
firebase deploy
# or
aws s3 sync build/ s3://your-bucket
```

### PWA Installation

- **Android**: "Add to Home Screen" from browser menu
- **iOS**: Share → "Add to Home Screen"
- **Desktop**: Install icon in address bar

## Development

### Component Structure

```
src/
├── components/
│   ├── FieldCheckForm.tsx     # Main assessment form
│   ├── FieldCheckList.tsx     # List of field checks
│   ├── PhotoCapture.tsx       # Camera component
│   ├── GPSLocation.tsx        # Location capture
│   └── SyncStatus.tsx         # Sync dashboard
├── contexts/
│   ├── AuthContext.tsx        # Authentication state
│   └── SyncContext.tsx        # Sync management
├── services/
│   ├── syncManager.ts         # Background sync logic
│   ├── drmis.ts               # API client
│   └── camera.ts              # Photo handling
├── database/
│   └── index.ts               # IndexedDB schema
└── utils/
    ├── validation.ts          # Form validation
    └── constants.ts           # App constants
```

### Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# PWA testing
npx lighthouse --view
```

## Troubleshooting

### Common Issues

**Sync Failures:**
- Check network connectivity
- Verify API credentials
- Review sync queue status

**GPS Issues:**
- Enable location services
- Check browser permissions
- Verify accuracy requirements

**Photo Upload:**
- Check storage permissions
- Verify file size limits
- Review compression settings

### Debug Tools

```javascript
// Service worker debugging
navigator.serviceWorker.getRegistration()
  .then(reg => reg.active?.postMessage({type: 'debug'}));

// IndexedDB inspection
indexedDB.databases().then(console.log);

// Sync status check
localStorage.getItem('sync_status');
```

## Contributing

1. **Fork** the repository
2. **Create** feature branch
3. **Implement** changes with tests
4. **Submit** pull request
5. **Review** and merge

## License

Government of Vanuatu - Disaster Management Information System
