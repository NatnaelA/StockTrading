import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

class NotificationService {
  private messaging: any;
  private db: any;
  private auth: any;

  constructor() {
    if (typeof window !== 'undefined') {
      this.messaging = getMessaging();
      this.db = getFirestore();
      this.auth = getAuth();
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      const currentToken = await getToken(this.messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (currentToken) {
        await this.saveFCMToken(currentToken);
        return currentToken;
      }

      console.log('No registration token available');
      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  private async saveFCMToken(token: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    try {
      await setDoc(
        doc(this.db, 'users', user.uid),
        {
          fcmTokens: { [token]: true },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  setupMessageListener(callback: (payload: any) => void): () => void {
    return onMessage(this.messaging, (payload) => {
      // Show browser notification
      if (Notification.permission === 'granted') {
        const { title, body } = payload.notification || {};
        if (title) {
          new Notification(title, {
            body,
            icon: '/logo.png', // Add your app's icon path
          });
        }
      }

      // Call the callback with the payload
      callback(payload);
    });
  }

  async sendTestNotification(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }
}

export const notificationService = new NotificationService(); 