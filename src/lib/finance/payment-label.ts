/**
 * WHAT A PAYMENT ROW IS CALLED ON THE CONTRACT AND IN THE LETTER.
 *
 * Most saved rows are labelled "Due October 25, 2026", and the contract
 * prints the due date in its own column, so a family read the date twice:
 * "Due October 25, 2026 | 25 October 2026" (Jimmy, 21 Oct 2026). A label that
 * only restates the date becomes the month's name instead: "October tuition".
 * Any other label ("Deposit", "First payment") is shown as written.
 */
export function paymentLabel(label: string | null | undefined, dueDate: string | null | undefined): string {
  const text = (label ?? "").trim();
  const restatesDate = /^due\s+[a-z]+\s+\d{1,2},?\s+\d{4}$/i.test(text);
  if ((restatesDate || !text) && dueDate) {
    const month = new Date(`${dueDate.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", { month: "long" });
    return `${month} tuition`;
  }
  return text;
}
