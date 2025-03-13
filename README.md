# Ramp Dummy App

A Next.js application for managing Ramp API integrations and project approvals.

## Server Setup

Before deploying the application, you must:

1. **Get Ramp API Credentials**
   - Sign up for a Ramp developer account at [Ramp Developer Portal](https://developers.ramp.com)
   - Create a new application to get your CLIENT_ID and CLIENT_SECRET
   - These credentials are only needed for server configuration

2. **Create Environment Variables**
   Create a `.env` file in the root directory with:
   ```
   DATABASE_URL="file:./dev.db"
   RAMP_CLIENT_ID=your_ramp_client_id_here
   RAMP_CLIENT_SECRET=your_ramp_client_secret_here
   ```
   Note: These environment variables are for server configuration only. Users of the application will not need to provide these credentials.

3. **Initialize Database**
   ```bash
   # Install dependencies first
   npm install
   # or
   yarn install

   # Generate Prisma client and run migrations
   npx prisma generate
   npx prisma migrate deploy
   ```

## Running the Application

After completing the required setup:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- Secure OAuth 2.0 integration with Ramp API
  - Users can connect their Ramp accounts with a simple authorization flow
  - No need for users to handle API credentials
- Project and client management
- Approval rules configuration
- Dynamic approval workflows
- Account switching capability

## Development Notes

- The application uses SQLite for development. The database file (`dev.db`) is not included in the repository and will be created when you run migrations.
- All Prisma migrations are included in the `prisma/migrations` directory.
- The application requires Node.js version 18 or higher.

## Troubleshooting

Common issues and solutions:

1. **Database Issues**
   ```bash
   # If you have database issues, try:
   rm prisma/dev.db
   npx prisma migrate reset
   ```

2. **OAuth Connection Issues**
   - For server administrators:
     - Verify your RAMP_CLIENT_ID and RAMP_CLIENT_SECRET in .env
     - Make sure you're using the correct Ramp environment (sandbox/production)
   - For users:
     - Ensure you're logged into your Ramp account before connecting
     - Clear your browser cookies if you encounter persistent issues
     - Contact your administrator if connection problems persist

3. **Missing Database**
   - If you see database-related errors, make sure you've run the migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. **Type Errors**
   - If you see TypeScript errors, try regenerating the Prisma client:
   ```bash
   npx prisma generate
   ```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Ramp API Documentation](https://docs.ramp.com/api)
