# Security Architecture Guide

This document explains the security architecture of our Next.js application with Firebase, outlining how we've implemented a client-server approach for enhanced security.

## Overview

We use a hybrid approach that leverages Next.js's server components and API routes to implement a secure client-server architecture while still benefiting from Firebase's real-time capabilities.

## Key Security Components

### 1. Server-Side Authentication

- **Session Cookies**: Instead of storing Firebase ID tokens in localStorage (which is vulnerable to XSS), we create secure, httpOnly cookies on the server.
- **Middleware Protection**: API routes are protected by middleware that verifies session cookies before allowing access.
- **Server-Side Verification**: User authentication state is verified on the server using Firebase Admin SDK.

### 2. Secure API Routes

- **Firebase Admin SDK**: Server-side operations use the Firebase Admin SDK with service account credentials.
- **Permission Validation**: API routes validate user permissions before performing operations.
- **Request Validation**: Input data is validated before processing.

### 3. Environment Variable Management

- **Client vs Server Variables**: We separate environment variables for client-side and server-side use.
- **Public vs Private Keys**: Only public configuration keys are exposed to the client.

## Security Best Practices

### Environment Variables

```
# Client-side variables (prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...

# Server-side variables (not exposed to client)
FIREBASE_SERVICE_ACCOUNT_KEY=...
SESSION_SECRET=...
```

### Service Account Security

1. **Never commit your service account key to Git**
2. **Use environment variables or secure secret management**
3. **Apply the principle of least privilege to service accounts**

### Firebase Security Rules

Even with server-side validation, maintain proper Firestore and Storage security rules as a defense-in-depth measure.

```
// Example Firestore security rule
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if false;  // Only allow writes through the server
}
```

## Authentication Flow

1. User logs in via Firebase Auth on the client
2. Client sends ID token to server API route
3. Server verifies token and creates secure session cookie
4. Cookie is used for subsequent API requests
5. Server-side middleware validates cookie on each request

## Benefits of This Approach

- **Enhanced Security**: Sensitive operations happen server-side
- **Defense in Depth**: Multiple layers of security (client, server, Firebase Rules)
- **XSS Protection**: No sensitive tokens in localStorage or client-accessible cookies
- **CSRF Protection**: Proper token validation prevents cross-site request forgery

## Deployment Considerations

- Ensure environment variables are properly set in your hosting environment
- Use secret management solutions for service account keys (Vercel/Netlify secrets, etc.)
- Set up proper CORS headers for API routes
- Configure Content Security Policy (CSP) headers

## Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction)
- [OWASP Web Security Cheat Sheet](https://cheatsheetseries.owasp.org/)
