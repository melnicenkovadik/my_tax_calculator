# Italian Forfettario Tax Calculator

Single-user web app to estimate Regime Forfettario taxable base, INPS, imposta sostitutiva, and payment schedule. Features transaction management with file attachments support.

## Features

- Tax calculations for Italian Forfettario regime
- Transaction management with CRUD operations
- File attachments (PDF and images) for transactions
- Rich transaction fields: sender, description, notes
- Search and filter transactions by date, amount, sender, notes
- Year-based data organization

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
   
   Required variables:
   - `DATABASE_URL` - PostgreSQL connection string (Neon Postgres)
   - `POSTGRES_URL` - Same as DATABASE_URL
   - `BLOB_READ_WRITE_TOKEN` - Vercel Blob token for file storage
     - Get it from: https://vercel.com/dashboard/stores

3. **Database migrations:**
   
   Migrations run automatically on first API request via `ensureTables()`. The following will be created:
   - `transactions` table with `sender` and `notes` columns
   - `transaction_attachments` table for file metadata
   - Required indexes

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Run tests

```bash
npm test
```

## Project structure

- UI components: `src/components`
- API routes: `src/app/api`
- Pure calculation logic: `src/lib/tax`
- Formatting helpers: `src/lib/format`
- Database schema: `src/lib/db.ts`

## Usage

### Transactions

- **Add transaction:** Fill in date, amount, description (optional), sender (optional), and notes (optional)
- **Edit transaction:** Click the edit icon (✎) on any transaction
- **Delete transaction:** Click the delete icon (✕) on any transaction
- **Attach files:** Click "Додати файл" in the attachments column (supports PDF and images, max 10MB)

### Search and Filter

- Use the search box to filter by description, sender, notes, or date
- Filter by month using the month dropdown
- Sort by date (newest/oldest) or amount (high/low)

## Adjust defaults

Update `defaultInputValues` in `src/app/HomeClient.tsx` to change the initial assumptions (coefficients, rates, year, etc.). Saved defaults can also be updated in the UI via "Save defaults".

## Database Schema

### transactions
- `id` (TEXT PRIMARY KEY)
- `year` (INTEGER)
- `date` (DATE)
- `amount` (NUMERIC)
- `description` (TEXT, optional)
- `sender` (TEXT, optional)
- `notes` (TEXT, optional)
- `created_at` (TIMESTAMPTZ)

### transaction_attachments
- `id` (TEXT PRIMARY KEY)
- `transaction_id` (TEXT, FK to transactions)
- `url` (TEXT) - Vercel Blob URL
- `content_type` (TEXT)
- `original_name` (TEXT)
- `size` (BIGINT)
- `created_at` (TIMESTAMPTZ)

## Disclaimer

This is an indicative calculator. Italian tax rules vary; confirm with a qualified professional.
