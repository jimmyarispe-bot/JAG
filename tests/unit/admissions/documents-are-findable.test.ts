import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A CHILD'S PAPERWORK IS FINDABLE FROM THE CHILD'S CARD.
 *
 * 17 September 2026. Documents had been uploaded for Julian Oubre Towa. His
 * card's Documents tab said "No checklist items".
 *
 * It was reading one store out of four. It asked admissions_applications for an
 * application id, and Julian has no application row, so it returned an empty
 * checklist and stopped. Even with an application it rendered one line - a
 * percentage - with no filename, no date and nothing to open. Staff filed the
 * documents exactly where the system told them to and then could not reach them
 * from the case.
 *
 * The four stores a child's paperwork can land in:
 *   person_documents      (subject_type 'lead' or 'student')
 *   platform_documents    (via platform_document_relations)
 *   application_documents (posted with an application)
 *   the application checklist
 *
 * These are source assertions because the fault was an ABSENCE - three of the
 * four stores were never queried. There is no wrong value to assert on.
 */

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

const sections = read("src/lib/admissions/profile/sections.ts");
const view = read("src/components/admissions/case/sections/DocumentsSection.tsx");

/** The documents section's loadData, not the whole file. */
function documentsLoadData(): string {
  const start = sections.indexOf('key: "documents"');
  expect(start, "no documents section registered").toBeGreaterThan(-1);
  const next = sections.indexOf('key: "visits"', start);
  return sections.slice(start, next > -1 ? next : undefined);
}

describe("the case Documents tab reads every store", () => {
  const loader = documentsLoadData();

  it("joins documents filed through the Documents module", () => {
    expect(loader).toContain("platform_document_relations");
    expect(loader).toContain("platform_documents");
  });

  it("reads documents sent with the application", () => {
    expect(loader).toContain("application_documents");
  });

  /**
   * THE ONE THAT COST THREE FAMILIES.
   *
   * application_documents carries lead_id (migration 326) so an inquiry upload
   * can attach to a lead before any application exists. attachInquiryDocuments
   * writes it with application_id deliberately null.
   *
   * Read this table by application_id alone and every one of those files is
   * invisible. On 17 September that was Maddox Mixon's, Ziare Moore's and Alana
   * Swan's scholarship award letters - uploaded, stored, correctly attached,
   * and on nobody's card. There is no error to notice: the query succeeds and
   * returns nothing.
   */
  it("reads them by lead, not only by application", () => {
    expect(
      loader,
      "the case Documents tab is back to application_id only - inquiry uploads are invisible again"
    ).toContain("lead_id.eq.");
  });

  it("still reads the checklist", () => {
    expect(loader).toContain("getApplicationChecklist");
  });

  /**
   * The exact old shape: no application, so return nothing and stop. A child
   * with no application can still have four PDFs on file.
   */
  it("does not give up when there is no application", () => {
    expect(loader).not.toMatch(/if \(!appId\) return \{ items: \[\], percentComplete: 0 \}/);
    expect(loader).toContain("admissions_lead_id");
  });

  it("looks past the lead, to the student and the family", () => {
    expect(loader).toContain("family_id");
    expect(loader).toMatch(/entityIds/);
  });
});

describe("the tab shows the files, not a percentage", () => {
  it("mounts the upload panel against the lead", () => {
    expect(view).toContain("PersonDocumentsPanel");
    expect(view).toContain('subjectType="lead"');
  });

  it("mounts it against the student record too", () => {
    expect(view).toContain('subjectType="student"');
  });

  it("links a Documents-module file to something openable", () => {
    expect(view).toContain("/dashboard/documents/");
  });

  it("says where each file is filed", () => {
    expect(view).toContain("filedOn");
  });

  /** A list you cannot open is a list of things you still have to go and find. */
  it("can open a file the family uploaded", () => {
    expect(view).toContain("CaseDocumentOpenButton");
  });

  /**
   * file_name holds the form's question, not a filename, because the stored
   * object is a bare UUID and a browser-supplied name is never trusted. Showing
   * it raw puts "Upload your scholarship award letter" in a list of things that
   * have already been uploaded.
   */
  it("does not label an uploaded file with the question that asked for it", () => {
    expect(view).toContain("documentLabel");
  });

  /**
   * The empty state has to distinguish "nobody sent anything" from "no
   * application exists yet", or it reads as the former and a family gets told
   * they never sent their paperwork.
   */
  it("does not let an absent application read as absent paperwork", () => {
    expect(view).toContain("No application has been started");
  });
});
