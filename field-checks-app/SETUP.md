# DRMIS Field Checks App - Installation & Setup Guide

## Overview

This React PWA enables field teams to conduct granular damage assessments with component-level evaluation (roof + wall) and direct DRMIS database synchronization.

## Prerequisites

- Node.js 16+ 
- npm or yarn
- DRMIS API access and credentials
- HTTPS required for PWA features (GPS, camera, service workers)

## Quick Installation

```bash
# 1. Navigate to the field-checks-app directory
cd "/home/htevilili/Documents/Work/Disaster Project/RAP/vanuatu/field-checks-app"

# 2. Install all dependencies
npm install

# 3. Set up environment variables
cp .env.example .env

# 4. Configure DRMIS API connection
# Edit .env file with your settings

# 5. Start development server
npm start
```

## Environment Configuration

Create `.env` file in the project root:

```env
# DRMIS API Configuration
REACT_APP_DRMIS_API_URL=https://your-drmis-server.gov.vu/api
REACT_APP_MAP_API_KEY=your-openstreetmap-api-key

# Environment Settings
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true

# PWA Settings
REACT_APP_OFFLINE_MODE=true
REACT_APP_SYNC_INTERVAL=300000
```

## Key Features Implemented

### 🏗️ Component-Based Damage Assessment
- **Separate roof and wall evaluation** (more granular than whole-building)
- **Standardized damage categories** with percentage ranges
- **Photo documentation** for each component
- **Auto-calculated damage percentages** based on condition

### 📱 Offline-First Architecture
- **IndexedDB storage** for local data persistence
- **Service worker** for background sync
- **Progressive retry mechanism** for failed uploads
- **Conflict resolution** for concurrent edits

### 🔄 DRMIS Integration
- **Direct API sync** to PostgreSQL database
- **Authentication** with DRMIS user credentials
- **Real-time sync status** indicators
- **Background sync** when connectivity restored

### 📊 Field Data Collection
- **GPS location capture** with accuracy validation
- **Photo capture** with metadata and captions
- **Form validation** with real-time error checking
- **Component-specific assessment** workflows

## Development Commands

```bash
# Development
npm start              # Start development server
npm test               # Run unit tests
npm run test:coverage  # Test with coverage report

# Production Build
npm run build          # Build for production
npm run build:pwa      # Build with optimized service worker

# PWA Testing
npx lighthouse --view  # Audit PWA features
npx workbox-cli        # Service worker debugging
```

## Field Assessment Workflow

1. **Login** with DRMIS credentials
2. **Select Asset Type** (Education, Health, Shelter, etc.)
3. **Enter Asset Details** (ID, name, construction type)
4. **Capture GPS Location** (automatic high-accuracy)
5. **Assess Roof Damage**:
   - Condition: Intact/Minor/Major/Destroyed
   - Auto-calculated percentage (0%, 20%, 60%, 100%)
   - Detailed notes and photos
6. **Assess Wall Damage**:
   - Condition: Intact/Minor/Major/Destroyed  
   - Auto-calculated percentage (0%, 15%, 50%, 100%)
   - Detailed notes and photos
7. **Overall Assessment** (functionality, priority, needs)
8. **Save & Sync** (local storage + automatic DRMIS sync)

## Component Damage Categories

### Roof Damage Assessment
- **Intact (0-10%)**: Minor cosmetic issues, no structural damage
- **Minor (10-30%)**: Some loose sheets, small holes, minor leaks
- **Major (30-70%)**: Large sections missing, structural damage, major leaks
- **Destroyed (70-100%)**: Complete loss, unsafe structure

### Wall Damage Assessment  
- **Intact (0-10%)**: Minor cracks, cosmetic damage only
- **Minor (10-30%)**: Some holes, partial damage, still functional
- **Major (30-70%)**: Large holes, partial collapse, safety concerns
- **Destroyed (70-100%)**: Complete wall failure, unsafe

## Offline Operation

The app works completely offline:
- **Full data collection** without connectivity
- **Local photo storage** with compression
- **GPS capture** with device sensors
- **Automatic sync** when connection restored

## Sync Mechanism

1. **Queue Management**: Track all unsynced field checks
2. **Progressive Retry**: 1s → 5s → 15s → 1m → 5m delays
3. **Background Sync**: Service worker monitors connectivity
4. **Conflict Resolution**: Last-write-wins with audit trail
5. **Status Indicators**: Real-time sync progress

## DRMIS Database Integration

### API Endpoints Used
```
POST /api/auth/login           # Authentication
GET  /api/councils             # Reference data
GET  /api/assets               # Asset lookup
POST /api/field-checks         # Submit assessments
PUT  /api/field-checks/:id     # Update assessments
POST /api/field-checks/:id/photos # Upload photos
```

### Data Flow
```
Field App → IndexedDB → Service Worker → DRMIS API → PostgreSQL
    ↓              ↓              ↓              ↓
Local Cache → Background Sync → Validation → Admin Review
```

## Troubleshooting

### Common Issues

**Sync Not Working:**
- Check network connectivity
- Verify DRMIS API credentials in .env
- Review browser console for errors
- Clear IndexedDB and retry

**GPS Not Capturing:**
- Enable location services in device settings
- Grant browser location permissions
- Try moving to open area for better accuracy
- Check browser compatibility

**Photos Not Uploading:**
- Check camera permissions in browser
- Verify available device storage
- Test with smaller photos (compression enabled)
- Review sync queue status

### Debug Tools

```javascript
// Service Worker Status
navigator.serviceWorker.getRegistration()
  .then(reg => console.log('SW:', reg));

// IndexedDB Contents
indexedDB.databases().then(console.log);

// Sync Queue Status
localStorage.getItem('sync_queue');

// Network Status
navigator.onLine; // true/false
```

## Production Deployment

### Build & Deploy
```bash
# Production build
npm run build

# Generate service worker
npx workbox generateSW workbox-config.js

# Deploy to hosting
firebase deploy
# or
aws s3 sync build/ s3://your-bucket --delete
```

### PWA Installation
- **Android**: Browser menu → "Add to Home Screen"
- **iOS**: Share → "Add to Home Screen"  
- **Desktop**: Address bar install icon

## Security Considerations

- **HTTPS required** for PWA features
- **API tokens** stored securely in localStorage
- **Photo compression** reduces data exposure
- **Device authentication** with DRMIS credentials
- **Data encryption** in transit (TLS)

## Performance Optimization

- **Service worker** caches static assets
- **Image compression** reduces upload size
- **Lazy loading** for large datasets
- **Background sync** prevents UI blocking
- **Progressive loading** for maps and images

## Support & Maintenance

- **Regular updates** to DRMIS API integration
- **Monitor sync success rates** and error patterns
- **Update damage multipliers** based on field feedback
- **Performance monitoring** for mobile devices
- **User training** and documentation updates

## Next Steps

1. **Install dependencies** and configure environment
2. **Test authentication** with DRMIS API
3. **Create sample field check** to verify workflow
4. **Test offline functionality** by disabling network
5. **Deploy to staging** for team testing
6. **Train field teams** on component-based assessment

This PWA provides a robust foundation for granular field damage verification with seamless DRMIS integration and reliable offline operation.
