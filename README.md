# Ramp Dummy App

A Next.js application for managing Ramp API integrations and project approvals.

## Required Setup

Before running the application, you must:

1. **Get Ramp API Credentials**
   - Sign up for a Ramp developer account at [Ramp Developer Portal](https://developers.ramp.com)
   - Create a new application to get your CLIENT_ID and CLIENT_SECRET

2. **Create Environment Variables**
   Create a `.env` file in the root directory with:
   ```
   DATABASE_URL="file:./dev.db"
   CLIENT_ID=your_ramp_client_id_here
   CLIENT_SECRET=your_ramp_client_secret_here
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

After completing the required setup:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- OAuth integration with Ramp API
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

2. **OAuth Errors**
   - Verify your CLIENT_ID and CLIENT_SECRET in .env
   - Make sure you're using the correct Ramp environment (sandbox/production)

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
