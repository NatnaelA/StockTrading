# Changelog

## 2024-05-28 - Migration from Firebase to Supabase

### Added

- Supabase client integration
- SQL migration files for database schema
- Supabase authentication
- Database service layer for Supabase
- OAuth callback route for Supabase
- Data migration script
- Detailed migration documentation

### Changed

- Authentication flow now uses Supabase
- Database operations use Supabase Postgres instead of Firestore
- User session management
- Protected routes implementation
- Login and registration processes
- Environment variable configuration
- Database schema to match Supabase conventions

### Removed

- Firebase dependencies (will be gradually phased out)
- Firebase initialization code
- Firestore database operations
- Firebase Authentication
- Firebase Admin SDK

## Benefits of this Migration

- Simplified architecture
- Better developer experience
- SQL-based database with full query capabilities
- More predictable pricing
- Open-source backend
- Improved local development experience
- Better type safety with PostgreSQL

## Next Steps

- Complete removal of unused Firebase code
- Add more Supabase features (realtime subscriptions, storage)
- Review and optimize database queries
- Implement server-side rendering optimizations
- Set up CI/CD pipeline for Supabase migrations
