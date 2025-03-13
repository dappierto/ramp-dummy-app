# Ramp Dummy App

A Next.js application for connecting to Ramp accounts.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Initialize Database**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

## Running the Application

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Connecting Your Ramp Account

Simply:

1. Click "Connect Ramp Account"
2. Log in to your existing Ramp account when prompted
3. Authorize the connection

That's it! Just use your regular Ramp login credentials.

## Features

- Easy Ramp account connection
  - Just use your existing Ramp login
  - No additional credentials needed
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

1. **Connection Issues**
   - Make sure you're using your regular Ramp login credentials
   - Try clearing your browser cookies
   - Contact support if issues persist

2. **Database Issues**
   ```bash
   # If you see database errors, try:
   rm prisma/dev.db
   npx prisma migrate reset
   ```

3. **Missing Database**
   ```bash
   npx prisma migrate deploy
   ```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Ramp API Documentation](https://docs.ramp.com/api)
