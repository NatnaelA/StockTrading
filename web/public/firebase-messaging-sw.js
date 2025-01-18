// Initialize self with empty config
self.FIREBASE_CONFIG = {};

// Listen for config messages
self.addEventListener('message', (event) => {
  if (event.data.type === 'CONFIG') {
    const { type, ...config } = event.data;
    Object.assign(self, config);

    // Initialize Firebase if we have all required config
    if (
      self.FIREBASE_API_KEY &&
      self.FIREBASE_AUTH_DOMAIN &&
      self.FIREBASE_PROJECT_ID &&
      self.FIREBASE_STORAGE_BUCKET &&
      self.FIREBASE_MESSAGING_SENDER_ID &&
      self.FIREBASE_APP_ID
    ) {
      initializeFirebase();
    }
  }
});

function initializeFirebase() {
  importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

  firebase.initializeApp({
    apiKey: self.FIREBASE_API_KEY,
    authDomain: self.FIREBASE_AUTH_DOMAIN,
    projectId: self.FIREBASE_PROJECT_ID,
    storageBucket: self.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
    appId: self.FIREBASE_APP_ID,
  });

  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/logo.png',
      badge: '/badge.png',
      tag: payload.data?.tag || 'default',
      data: payload.data,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  // Get the action (if any)
  const action = event.action;
  const notification = event.notification;
  const data = notification.data;

  // Handle different actions
  let url = '/';
  if (data?.portfolioId) {
    switch (data.type) {
      case 'trade':
        url = `/trade/${data.tradeId}?portfolioId=${data.portfolioId}`;
        break;
      case 'deposit':
      case 'withdrawal':
        url = `/transactions?portfolioId=${data.portfolioId}`;
        break;
      default:
        url = `/portfolio/${data.portfolioId}`;
    }
  }

  // Open the appropriate URL
  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
}); 