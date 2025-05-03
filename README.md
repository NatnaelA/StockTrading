# Stock Trading Platform

A full-stack stock trading platform with React Native mobile app and Next.js web dashboard.

## Project Structure

```
root/
├─ mobile/          # Expo-based React Native app
├─ web/             # Next.js web dashboard
├─ functions/       # Firebase Cloud Functions
└─ shared/          # Shared utilities and types
```

## Prerequisites

- Node.js (v16 or later)
- npm or Yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase CLI (`npm install -g firebase-tools`)

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd stock-trading
   ```

2. Install dependencies:

   ```bash
   # Root dependencies
   npm install

   # Mobile app
   cd mobile && npm install

   # Web app
   cd ../web && npm install

   # Cloud Functions
   cd ../functions && npm install
   ```

3. Environment Setup:
   - Copy `.env.example` to `.env` in each project directory
   - Fill in the required environment variables

## Running the Applications

### Mobile App (Expo)

```bash
cd mobile
npm start
```

### Web Dashboard (Next.js)

```bash
cd web
npm run dev
```

### Cloud Functions

```bash
cd functions
npm run serve
```

## Development

- Mobile App: [http://localhost:19002](http://localhost:19002) (Expo DevTools)
- Web Dashboard: [http://localhost:3000](http://localhost:3000)
- Firebase Emulator: [http://localhost:4000](http://localhost:4000)

## API Reference

The Stock Trading Platform provides a comprehensive REST API for integrating with our services. The complete API documentation is available in the [API_REFERENCE.md](./API_REFERENCE.md) file.

Key API features include:

- Authentication and user management
- Portfolio operations
- Trading functionality
- Transaction history
- Notifications
- Payment processing

For any API-related questions, please contact our support team.

## Building for Production

### Mobile App

```bash
cd mobile
npm run build
```

### Web Dashboard

```bash
cd web
npm run build
```

## Testing

```bash
# Run all tests
npm run test

# Run tests for specific package
cd mobile && npm test
cd web && npm test
```

## Contributing

1. Create a new branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
