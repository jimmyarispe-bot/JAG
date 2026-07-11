/**
 * Enterprise Financial Intelligence Engine — Fixed Assets.
 *
 * Capitalization, depreciation schedules, disposals.
 * Straight-line and double-declining balance depreciation.
 */

import { createFinanceId } from "@/lib/platform/finance/ids";
import type {
  FinanceAssetStatus,
  FinanceDepreciationEntry,
  FinanceDepreciationMethod,
  FinanceDimensionalContext,
  FinanceFixedAsset,
  FinanceMetadata,
} from "@/lib/platform/finance/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface AddAssetInput {
  name: string;
  description?: string;
  acquisitionDate: string;
  acquisitionCost: number;
  salvageValue?: number;
  usefulLifeYears: number;
  depreciationMethod?: FinanceDepreciationMethod;
  glAccountId?: string | null;
  currency?: string;
  dimensions?: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface FinanceAssetsDependencies {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class FinanceAssets {
  private readonly assets = new Map<string, FinanceFixedAsset>();
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: FinanceAssetsDependencies) {
    this.createId = deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  addAsset(input: AddAssetInput): FinanceFixedAsset {
    const id = this.createId("asset");
    const acquisitionCost = input.acquisitionCost;
    const salvageValue = input.salvageValue ?? 0;

    const asset: FinanceFixedAsset = {
      id,
      name: input.name,
      description: input.description ?? "",
      acquisitionDate: input.acquisitionDate,
      acquisitionCost,
      salvageValue,
      usefulLifeYears: input.usefulLifeYears,
      depreciationMethod: input.depreciationMethod ?? "straight_line",
      accumulatedDepreciation: 0,
      bookValue: acquisitionCost,
      status: "active",
      disposedAt: null,
      disposalProceeds: null,
      glAccountId: input.glAccountId ?? null,
      currency: input.currency ?? "USD",
      dimensions: input.dimensions ?? emptyDimensions(),
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.assets.set(id, asset);
    return asset;
  }

  getAsset(id: string): FinanceFixedAsset | undefined {
    return this.assets.get(id);
  }

  listAssets(): FinanceFixedAsset[] {
    return [...this.assets.values()].sort((a, b) =>
      a.acquisitionDate.localeCompare(b.acquisitionDate)
    );
  }

  listByStatus(status: FinanceAssetStatus): FinanceFixedAsset[] {
    return this.listAssets().filter((a) => a.status === status);
  }

  /**
   * Calculate depreciation for a single period (one year) ending at asOfDate.
   * Uses straight-line or double-declining balance method.
   */
  calculateDepreciation(
    assetId: string,
    asOfDate: string
  ): FinanceDepreciationEntry {
    const asset = this.getAssetOrThrow(assetId);
    const acquisitionYear = new Date(asset.acquisitionDate).getFullYear();
    const asOfYear = new Date(asOfDate).getFullYear();
    const yearsInService = Math.max(asOfYear - acquisitionYear, 0) + 1;

    let depreciationAmount: number;

    if (asset.depreciationMethod === "straight_line") {
      const depreciableBase = asset.acquisitionCost - asset.salvageValue;
      const annualDep = depreciableBase / asset.usefulLifeYears;
      depreciationAmount = Math.min(annualDep, Math.max(asset.bookValue - asset.salvageValue, 0));
    } else {
      // Double-declining balance
      const rate = (2 / asset.usefulLifeYears);
      depreciationAmount = Math.min(
        asset.bookValue * rate,
        Math.max(asset.bookValue - asset.salvageValue, 0)
      );
    }

    // Cap if exceeding remaining depreciable amount
    const remainingDepreciable = Math.max(
      asset.bookValue - asset.salvageValue,
      0
    );
    depreciationAmount = Math.min(depreciationAmount, remainingDepreciable);

    const accumulated = asset.accumulatedDepreciation + depreciationAmount;
    const bookValue = asset.acquisitionCost - accumulated;

    const periodStart = `${asOfYear}-01-01`;
    const periodEnd = `${asOfYear}-12-31`;

    return {
      assetId,
      periodStart,
      periodEnd,
      depreciationAmount,
      accumulatedDepreciation: accumulated,
      bookValue: Math.max(bookValue, asset.salvageValue),
      currency: asset.currency,
    };
  }

  /**
   * Apply depreciation for one year and update the asset's book value.
   */
  applyDepreciation(assetId: string, asOfDate: string): FinanceFixedAsset {
    const asset = this.getAssetOrThrow(assetId);
    const entry = this.calculateDepreciation(assetId, asOfDate);

    const newBookValue = Math.max(entry.bookValue, asset.salvageValue);
    const newStatus: FinanceAssetStatus =
      newBookValue <= asset.salvageValue + 0.01 ? "fully_depreciated" : "active";

    const updated: FinanceFixedAsset = {
      ...asset,
      accumulatedDepreciation: entry.accumulatedDepreciation,
      bookValue: newBookValue,
      status: newStatus,
    };
    this.assets.set(assetId, updated);
    return updated;
  }

  /**
   * Generate a full depreciation schedule for the asset's useful life.
   */
  getDepreciationSchedule(assetId: string): FinanceDepreciationEntry[] {
    const asset = this.getAssetOrThrow(assetId);
    const startYear = new Date(asset.acquisitionDate).getFullYear();
    const schedule: FinanceDepreciationEntry[] = [];

    let runningBookValue = asset.acquisitionCost;
    let runningAccumulated = 0;

    for (let year = 0; year < asset.usefulLifeYears; year++) {
      const currentYear = startYear + year;
      const depreciableBase = runningBookValue - asset.salvageValue;
      if (depreciableBase <= 0.01) break;

      let annualDep: number;
      if (asset.depreciationMethod === "straight_line") {
        annualDep = (asset.acquisitionCost - asset.salvageValue) / asset.usefulLifeYears;
      } else {
        annualDep = runningBookValue * (2 / asset.usefulLifeYears);
      }
      annualDep = Math.min(annualDep, depreciableBase);

      runningAccumulated += annualDep;
      runningBookValue = asset.acquisitionCost - runningAccumulated;

      schedule.push({
        assetId,
        periodStart: `${currentYear}-01-01`,
        periodEnd: `${currentYear}-12-31`,
        depreciationAmount: annualDep,
        accumulatedDepreciation: runningAccumulated,
        bookValue: Math.max(runningBookValue, asset.salvageValue),
        currency: asset.currency,
      });
    }

    return schedule;
  }

  /**
   * Dispose of an asset. Records disposal date and proceeds.
   * Status becomes "disposed" — asset record is retained immutably.
   */
  disposeAsset(
    assetId: string,
    disposalDate: string,
    proceeds: number
  ): FinanceFixedAsset {
    const asset = this.getAssetOrThrow(assetId);
    const updated: FinanceFixedAsset = {
      ...asset,
      status: "disposed",
      disposedAt: disposalDate,
      disposalProceeds: proceeds,
    };
    this.assets.set(assetId, updated);
    return updated;
  }

  /** Total net book value of all active assets. */
  getTotalNetBookValue(): number {
    return this.listByStatus("active").reduce((s, a) => s + a.bookValue, 0);
  }

  private getAssetOrThrow(id: string): FinanceFixedAsset {
    const a = this.assets.get(id);
    if (!a) throw new Error(`Asset not found: ${id}`);
    return a;
  }
}

export function createFinanceAssets(
  deps?: FinanceAssetsDependencies
): FinanceAssets {
  return new FinanceAssets(deps);
}
