// sw.js - Service Worker für Offline-Funktionalität

const CACHE_NAME = 'reha-schedule-v4';
const CACHE_URLS = [
    './',
    './index.html',
    './styles.css',
    './app.js', 
    './schedule-data.js',
    './manifest.json'
];

// Installation
self.addEventListener('install', event => {
    console.log('ServiceWorker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('ServiceWorker: Caching files');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('ServiceWorker: All files cached');
                // Sofort aktivieren
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('ServiceWorker: Cache failed', error);
            })
    );
});

// Aktivierung
self.addEventListener('activate', event => {
    console.log('ServiceWorker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                // Alte Caches löschen
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('ServiceWorker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('ServiceWorker: Claiming clients');
                return self.clients.claim();
            })
    );
});

// Fetch-Handler für Offline-Funktionalität
self.addEventListener('fetch', event => {
    const request = event.request;
    
    // Nur GET-Requests cachen
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip für Chrome-Extensions und nicht-HTTP(S) URLs
    if (!request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                // Cache hit - return cached version
                if (cachedResponse) {
                    console.log('ServiceWorker: Serving from cache', request.url);
                    return cachedResponse;
                }
                
                console.log('ServiceWorker: Fetching from network', request.url);
                
                // Network request
                return fetch(request)
                    .then(response => {
                        // Check if response is valid
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Cache the response for same-origin requests
                        if (request.url.startsWith(self.location.origin)) {
                            const responseToCache = response.clone();
                            
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    console.log('ServiceWorker: Caching new resource', request.url);
                                    cache.put(request, responseToCache);
                                });
                        }
                        
                        return response;
                    })
                    .catch(error => {
                        console.log('ServiceWorker: Network failed, trying cache', request.url);
                        
                        // Network failed - try to serve from cache
                        return caches.match(request)
                            .then(cachedResponse => {
                                if (cachedResponse) {
                                    return cachedResponse;
                                }
                                
                                // If it's a navigation request, serve the main page
                                if (request.destination === 'document') {
                                    return caches.match('./index.html');
                                }
                                
                                // For other requests, return a generic offline response
                                return new Response('Offline - Inhalt nicht verfügbar', {
                                    status: 503,
                                    statusText: 'Service Unavailable',
                                    headers: { 'Content-Type': 'text/plain' }
                                });
                            });
                    });
            })
    );
});

// Message-Handler für Updates
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('ServiceWorker: Script loaded');