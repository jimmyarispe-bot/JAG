import { list1099Vendors, TAX_FOUNDATION_NOTE } from "../../tax";
import { listPayments } from "../../store";

/** 1099 tracking — YTD payments to flagged vendors (no e-filing in P-011). */
export function vendor1099Ytd(organizationId: string): readonly {
  readonly vendorId: string;
  readonly name: string;
  readonly ytdPayments: number;
}[] {
  const flagged = list1099Vendors(organizationId);
  const year = new Date().getUTCFullYear();
  return Object.freeze(
    flagged.map((v) => {
      const ytd = listPayments(organizationId)
        .filter(
          (p) =>
            p.vendorId === v.vendorId &&
            p.direction === "out" &&
            Date.parse(p.paidAt) >= Date.UTC(year, 0, 1)
        )
        .reduce((s, p) => s + p.amount, 0);
      return Object.freeze({
        vendorId: v.vendorId,
        name: v.name,
        ytdPayments: ytd,
      });
    })
  );
}

export { list1099Vendors, TAX_FOUNDATION_NOTE };
