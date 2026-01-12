import { InfoTooltip } from "./InfoTooltip";
import type { CalculatorInputValues } from "@/lib/tax/types";

const inputBase =
  "mt-1 w-full rounded-xl border bg-white/80 px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2";

const getInputClass = (hasError: boolean) =>
  `${inputBase} ${
    hasError
      ? "border-rose-400 focus:border-rose-400 focus:ring-rose-200"
      : "border-card-border focus:border-accent focus:ring-accent/30"
  }`;

type CalculatorFormProps = {
  values: CalculatorInputValues;
  errors: Record<string, string>;
  onChange: (field: keyof CalculatorInputValues, value: string | boolean) => void;
  onReset: () => void;
  onSaveDefaults: () => void;
  canSaveDefaults: boolean;
};

type CalculatorFormPropsWithModal = CalculatorFormProps & {
  isInModal?: boolean;
};

export function CalculatorForm({
  values,
  errors,
  onChange,
  onReset,
  onSaveDefaults,
  canSaveDefaults,
  isInModal = false,
}: CalculatorFormPropsWithModal) {
  return (
    <div className={isInModal ? "" : "rounded-3xl border border-card-border bg-card/80 p-5 shadow-[0_20px_60px_-40px_rgba(25,25,25,0.35)] backdrop-blur"}>
      {!isInModal && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Вхідні дані
            </p>
            <h2 className="mt-2 font-display text-2xl text-foreground">
              Ваші припущення
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-card-border px-4 py-2 text-xs font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground"
              onClick={onReset}
            >
              Скинути
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
                canSaveDefaults
                  ? "bg-accent hover:bg-accent-strong"
                  : "cursor-not-allowed bg-muted/40"
              }`}
              disabled={!canSaveDefaults}
              onClick={onSaveDefaults}
            >
              Зберегти за замовчуванням
            </button>
          </div>
        </div>
      )}

      {isInModal && (
        <div className="mb-6 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-card-border px-4 py-2 text-xs font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground"
            onClick={onReset}
          >
            Скинути
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
              canSaveDefaults
                ? "bg-accent hover:bg-accent-strong"
                : "cursor-not-allowed bg-muted/40"
            }`}
            disabled={!canSaveDefaults}
            onClick={onSaveDefaults}
          >
            Зберегти за замовчуванням
          </button>
        </div>
      )}

      <div className={isInModal ? "grid gap-5" : "mt-6 grid gap-5"}>
        <div>
          <label className="text-sm font-medium text-foreground">
            Податковий рік (РРРР)
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={1900}
            max={2100}
            value={values.year}
            onChange={(event) => onChange("year", event.target.value)}
            className={getInputClass(Boolean(errors.year))}
            aria-invalid={Boolean(errors.year)}
          />
          {errors.year ? (
            <p className="mt-1 text-xs text-rose-600">{errors.year}</p>
          ) : null}
        </div>


        <div>
          <label className="text-sm font-medium text-foreground">
            Коефіцієнт ATECO
            <InfoTooltip text="За замовчуванням 0.67 для багатьох послуг. Налаштуйте, якщо ваш ATECO відрізняється." />
          </label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={1}
            step="0.01"
            value={values.coeff}
            onChange={(event) => onChange("coeff", event.target.value)}
            className={getInputClass(Boolean(errors.coeff))}
            aria-invalid={Boolean(errors.coeff)}
          />
          {errors.coeff ? (
            <p className="mt-1 text-xs text-rose-600">{errors.coeff}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            Ставка податкового режиму
          </label>
          <select
            value={values.taxRate}
            onChange={(event) => onChange("taxRate", event.target.value)}
            className={getInputClass(Boolean(errors.taxRate))}
            aria-invalid={Boolean(errors.taxRate)}
          >
            <option value="0.05">5%</option>
            <option value="0.15">15%</option>
          </select>
          {errors.taxRate ? (
            <p className="mt-1 text-xs text-rose-600">{errors.taxRate}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Тип INPS</label>
          <select
            value={values.inpsType}
            onChange={(event) => onChange("inpsType", event.target.value)}
            className={getInputClass(Boolean(errors.inpsType))}
            aria-invalid={Boolean(errors.inpsType)}
          >
            <option value="gestione_separata">Gestione Separata</option>
            <option value="artigiani_commercianti" disabled>
              Artigiani/Commercianti (v2)
            </option>
          </select>
        </div>

        {values.inpsType === "gestione_separata" ? (
          <div>
            <label className="text-sm font-medium text-foreground">
              Ставка INPS
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={1}
              step="0.01"
              value={values.inpsRate}
              onChange={(event) => onChange("inpsRate", event.target.value)}
              className={getInputClass(Boolean(errors.inpsRate))}
              aria-invalid={Boolean(errors.inpsRate)}
            />
            {errors.inpsRate ? (
              <p className="mt-1 text-xs text-rose-600">{errors.inpsRate}</p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-card-border bg-white/60 p-4 text-xs text-muted">
            Внески Artigiani/Commercianti ще не змодельовані.
          </div>
        )}

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-card-border bg-white/70 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              INPS відраховується від оподатковуваної бази
              <InfoTooltip text="Якщо увімкнено, INPS зменшує базу для imposta sostitutiva." />
            </p>
            <p className="text-xs text-muted">За замовчуванням увімкнено.</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={values.inpsDeductible}
              onChange={(event) =>
                onChange("inpsDeductible", event.target.checked)
              }
            />
            <span className="h-6 w-11 rounded-full bg-muted/30 transition peer-checked:bg-accent/70"></span>
            <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5"></span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-card-border bg-white/70 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Застосувати аконто
              <InfoTooltip text="Аконто розраховуються як орієнтовна сума від загальної суми поточного року." />
            </p>
            <p className="text-xs text-muted">За замовчуванням увімкнено.</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={values.applyAcconti}
              onChange={(event) =>
                onChange("applyAcconti", event.target.checked)
              }
            />
            <span className="h-6 w-11 rounded-full bg-muted/30 transition peer-checked:bg-accent/70"></span>
            <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5"></span>
          </label>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            Модель розподілу аконто
          </label>
          <select
            value={values.splitModel}
            onChange={(event) => onChange("splitModel", event.target.value)}
            className={getInputClass(Boolean(errors.splitModel))}
          >
            <option value="standard">Червень 40% + Листопад 60%</option>
            <option value="custom">Власні відсотки</option>
          </select>
        </div>

        {values.splitModel === "custom" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">
                Розподіл за червень (0.00 - 1.00)
              </label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={1}
                step="0.01"
                value={values.customSplitJune}
                onChange={(event) =>
                  onChange("customSplitJune", event.target.value)
                }
                className={getInputClass(Boolean(errors.customSplitJune))}
                aria-invalid={Boolean(errors.customSplitJune)}
              />
              {errors.customSplitJune ? (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.customSplitJune}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Розподіл за листопад (0.00 - 1.00)
              </label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={1}
                step="0.01"
                value={values.customSplitNovember}
                onChange={(event) =>
                  onChange("customSplitNovember", event.target.value)
                }
                className={getInputClass(Boolean(errors.customSplitNovember))}
                aria-invalid={Boolean(errors.customSplitNovember)}
              />
              {errors.customSplitNovember ? (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.customSplitNovember}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
