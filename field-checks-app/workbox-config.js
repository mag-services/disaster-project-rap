module.exports = {
  // See https://github.com/Workbox/workbox-cli/blob/main/docs/workbox-config.md
  globDirectory: 'build/',
  globPatterns: [
    '**/*.{js,css,html,png,jpg,jpeg,svg,json,ico,woff,woff2}'
  ],
  swDest: 'build/sw.js',
  ignoreURLParametersMatching: [/^utm_/, /^fbclid/],
  
  // Define runtime caching strategies
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.drmis\.gov\.vu\/api/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'drmis-api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200]
        },
        networkTimeoutSeconds: 10
      }
    },
    {
      urlPattern: /^https:\/\/tiles\.openstreetmap\.org/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'map-tiles-cache',
        expiration: {
          maxEntries: 1000,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
    }
  ],
  
  // Background sync configuration
  backgroundSync: {
    globPatterns: [
      'sw.js'
    ]
  }
};
