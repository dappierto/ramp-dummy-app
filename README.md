# Ramp Dummy App

A Next.js application that allows users to connect their existing Ramp accounts.

## For Users

To use this application, simply:

1. Click "Connect Ramp Account"
2. Log in to your existing Ramp account when prompted
3. Authorize the connection

That's it! No API credentials or technical setup needed - just your regular Ramp login.

## For Application Provider

These steps are only for setting up the application itself:

1. **Set Up Ramp Developer Account** (One-time setup)
   - Sign up as a Ramp developer at [Ramp Developer Portal](https://developers.ramp.com)
   - Create an application to get the application's credentials
   - These credentials are only for the application server

2. **Configure Server**
   Create a `.env` file in the root directory with:
   ```
   DATABASE_URL="file:./dev.db"
   RAMP_CLIENT_ID=your_application_client_id
   RAMP_CLIENT_SECRET=your_application_client_secret
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

After server setup:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

- Easy Ramp account connection
  - Users just log in with their existing Ramp credentials
  - No developer account or API setup needed for users
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

1. **For Users**
   - Can't connect your Ramp account?
     - Make sure you're using your regular Ramp login credentials
     - Try clearing your browser cookies
     - Contact support if issues persist

2. **For Application Provider**
   - Database Issues:
     ```bash
     # If you have database issues, try:
     rm prisma/dev.db
     npx prisma migrate reset
     ```
   - Connection Issues:
     - Verify RAMP_CLIENT_ID and RAMP_CLIENT_SECRET in .env
     - Check you're using the correct Ramp environment (sandbox/production)
   - Missing Database:
     ```bash
     npx prisma migrate deploy
     ```
   - Type Errors:
     ```bash
     npx prisma generate
     ```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Ramp API Documentation](https://docs.ramp.com/api)
