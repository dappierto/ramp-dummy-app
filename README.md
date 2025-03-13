# Ramp Dummy App

A Next.js application for managing Ramp API integrations and project approvals.

## For Users

To use this application, you only need to:

1. Log into the application with your credentials
2. Click "Connect Ramp Account" when you want to link your Ramp account
3. Authorize the application on Ramp's secure login page

No API credentials or technical setup is required for users.

## For Administrators

Before deploying the application, the server administrator must:

1. **Configure Ramp API Access**
   - Sign up for a Ramp developer account at [Ramp Developer Portal](https://developers.ramp.com)
   - Create a new application to get the application's CLIENT_ID and CLIENT_SECRET
   - These credentials are for server configuration only and are never exposed to users

2. **Set Environment Variables**
   Create a `.env` file in the root directory with:
   ```
   DATABASE_URL="file:./dev.db"
   RAMP_CLIENT_ID=your_ramp_client_id_here
   RAMP_CLIENT_SECRET=your_ramp_client_secret_here
   ```

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

After completing the server setup:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- Simple one-click Ramp account connection
  - Users connect their accounts through Ramp's secure OAuth login
  - No API credentials or technical setup needed for users
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

1. **Database Issues** (Administrators only)
   ```bash
   # If you have database issues, try:
   rm prisma/dev.db
   npx prisma migrate reset
   ```

2. **Connection Issues**
   - For users:
     - Make sure you're logged into your Ramp account
     - Try clearing your browser cookies if the connection fails
     - Contact your administrator if issues persist
   - For administrators:
     - Check that RAMP_CLIENT_ID and RAMP_CLIENT_SECRET are correctly set in .env
     - Verify you're using the correct Ramp environment (sandbox/production)

3. **Missing Database** (Administrators only)
   - If you see database-related errors, make sure you've run the migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. **Type Errors** (Administrators only)
   - If you see TypeScript errors, try regenerating the Prisma client:
   ```bash
   npx prisma generate
   ```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Ramp API Documentation](https://docs.ramp.com/api)
