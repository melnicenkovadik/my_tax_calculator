# Italian Forfettario Tax Calculator

Single-user web app to estimate Regime Forfettario taxable base, INPS, imposta sostitutiva, and payment schedule. Inputs are stored locally in your browser.

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
- Pure calculation logic: `src/lib/tax`
- Formatting helpers: `src/lib/format`

## Adjust defaults

Update `defaultInputValues` in `src/app/page.tsx` to change the initial assumptions (coefficients, rates, year, etc.). Saved defaults can also be updated in the UI via "Save defaults".

## Disclaimer

This is an indicative calculator. Italian tax rules vary; confirm with a qualified professional.
# my_tax_calculator
