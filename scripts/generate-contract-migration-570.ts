import { FL_CONTRACT_BLOCKS } from "../src/lib/admissions/contract/fl-2026-09-06";
import { HS_CONTRACT_BLOCKS } from "../src/lib/admissions/contract/hs-2026-09-06";
import { VIRTUAL_CONTRACT_BLOCKS } from "../src/lib/admissions/contract/virtual-2026-09-06";

const q = (s: string) => {
  if (s.includes("$c$")) throw new Error("body contains $c$");
  return `$c$${s}$c$`;
};
const campus = (school: string, state: string, blocks: readonly { templateKey: string; title: string; sortOrder: number; requiresSignature: boolean; bodyHtml: string }[]) => `
-- ${school}
insert into public.enrollment_packet_templates
  (school_id, template_key, title, body_html, requires_signature, state_code, sort_order, is_active)
select sc.id, b.template_key, b.title, b.body_html, b.requires_signature, '${state}', b.sort_order, true
  from (values
${blocks.map((b) => `    (${q(b.templateKey)}, ${q(b.title)}, ${q(b.bodyHtml)}, ${b.requiresSignature}, ${b.sortOrder})`).join(",\n")}
  ) as b(template_key, title, body_html, requires_signature, sort_order)
  cross join public.schools sc
 where lower(trim(sc.name)) = '${school.toLowerCase()}'
on conflict (school_id, template_key) do update
   set title              = excluded.title,
       body_html          = excluded.body_html,
       requires_signature = excluded.requires_signature,
       state_code         = excluded.state_code,
       sort_order         = excluded.sort_order,
       is_active          = true,
       updated_at         = now();
`;

const header = `-- ============================================================================
-- 570  THE CONTRACTS FOR FL, HS AND VIRTUAL
--      18 October 2026
-- ============================================================================
--
-- GENERATED from src/lib/admissions/contract/fl-2026-09-06.ts,
-- hs-2026-09-06.ts and virtual-2026-09-06.ts (gen570.ts), which are the
-- source of record - as 447 was for GA. To change wording, change the module
-- and add a NEW migration. Contract language that lives only in a migration
-- is language nobody reviews a second time.
--
-- Jimmy, 18 October: "let's work on the contract, scholarships, schedule of
-- tuition payments, and payments", and on loading the 6 September revisions,
-- "with all of this too". Five blocks per campus, the same template keys as
-- GA, each initialled once; the Schedule of Tuition Payments renders on the
-- face. Elections (FL Tuition Lock, FL Tuition Insurance) are left out, as GA
-- left out insurance on 28 September: a signed block cannot record a choice.
--
-- DEPENDS ON 448 (contracting_legal_name, signatory_line). Run 448 and 449
-- first.
--
-- The old one-sentence placeholders at these three campuses were all
-- deactivated by 430 and stay that way. Nothing is deleted.
-- ============================================================================

begin;
`;

const footer = `
do $$
declare v int;
begin
  select count(*) into v
    from public.enrollment_packet_templates t
    join public.schools s on s.id = t.school_id
   where lower(trim(s.name)) in ('the academy fl', 'the academy hs', 'the academy virtual')
     and t.template_key like 'contract_%'
     and t.is_active and t.requires_signature;
  if v <> 15 then
    raise exception 'expected 15 active contract blocks across FL, HS and Virtual, found %', v;
  end if;
end $$;

commit;
`;

process.stdout.write(
  header +
    campus("The Academy FL", "FL", FL_CONTRACT_BLOCKS) +
    campus("The Academy HS", "GA", HS_CONTRACT_BLOCKS) +
    campus("The Academy Virtual", "FL", VIRTUAL_CONTRACT_BLOCKS) +
    footer
);
