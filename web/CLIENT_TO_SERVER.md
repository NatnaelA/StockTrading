# Converting a Client-Only Firebase App to Client-Server Architecture

This guide outlines the steps we've taken to convert our client-only Firebase application to a more secure client-server architecture using Next.js.

## Why Make This Change?

Client-only Firebase applications have security concerns:

1. All Firebase service calls happen directly from the browser
2. Security depends entirely on Firebase Security Rules
3. API keys are exposed to the client
4. Complex security rules can be difficult to maintain and test

A client-server architecture improves security by:

1. Moving sensitive operations to server-side code
2. Adding another layer of security beyond Firebase Rules
3. Protecting service accounts and sensitive credentials
4. Providing better error handling and logging

## Changes Made

### 1. Server-Side Authentication

- Created session cookie authentication using Firebase Admin SDK
- Added middleware to protect API routes
- Implemented helpers for server-side auth state verification

```typescript
// web/src/middleware.ts
// Protects API routes with session verification

// web/src/lib/auth-helper.ts
// Server-side authentication utilities
```

### 2. Server-Side API Routes

- Added server-side API routes for sensitive operations
- Created server-side handlers for Firebase Cloud Functions
- Implemented proper error handling and permissions

```typescript
// web/src/app/api/portfolios/[portfolioId]/history/capture/route.ts
// Example of server-side API route for portfolio history capture
```

### 3. Firebase Admin SDK Integration

- Added Firebase Admin SDK initialization
- Created environment variables for server-side configuration
- Set up service account authentication

```typescript
// web/src/lib/firebase-admin.ts
// Server-side Firebase Admin initialization
```

### 4. Updated Client Components

- Modified client components to call server API routes instead of Firebase directly
- Updated authentication flow to use sessions
- Added better error handling for server errors

```tsx
// web/src/components/trading/CapturePortfolioHistory.tsx
// Updated to use server API instead of direct Firebase function calls
```

### 5. Environment Variables

- Separated client and server environment variables
- Added secure handling of service account credentials

```
# Client-side variables
NEXT_PUBLIC_FIREBASE_API_KEY=...

# Server-side variables
FIREBASE_SERVICE_ACCOUNT_PATH=...
```

## Implementation Steps

1. **Install Dependencies**

   ```bash
   npm install firebase-admin
   ```

2. **Set Up Environment Variables**

   - Create `.env.local` file with both client and server variables
   - Add service account configuration

3. **Initialize Firebase Admin SDK**

   - Create a server-side initialization file

4. **Add Authentication Middleware**

   - Create middleware to protect API routes
   - Implement session cookie handling

5. **Create Server-Side API Routes**

   - Convert direct Firebase calls to server API routes
   - Add proper authentication and error handling

6. **Update Client Components**

   - Modify components to use server API routes
   - Update error handling for API responses

7. **Test and Deploy**
   - Test all functionality with the new architecture
   - Deploy with proper environment variables

## Security Considerations

- Never commit service account keys to version control
- Use environment variables or secret management services
- Implement proper CORS for API routes
- Maintain Firebase security rules as additional layer of defense
- Add rate limiting to prevent abuse

## Conclusion

Converting to a client-server architecture provides better security, more control, and improved maintainability for your Firebase application. The changes outlined in this guide should serve as a foundation for a more secure application architecture.

For more detailed information about security, see the [SECURITY.md](./SECURITY.md) file.
