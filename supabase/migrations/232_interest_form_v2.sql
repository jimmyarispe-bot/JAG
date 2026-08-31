-- 232_interest_form_v2.sql
--
-- Version 2 of the Express Interest form.
--
-- Changes from version 1:
--   * Funding sources removed. Asking a family how they intend to pay before
--     they have spoken to anyone reads as a means test on the first screen.
--   * "Learning concerns" replaced by two questions, in this order:
--       - What is your child's GREATNESS?
--       - What challenges does your child experience in school (academically,
--         socially, and/or emotionally)?
--     Neither carries placeholder text. A prompt inside the box narrows the
--     answer to whatever the prompt suggested, and the first of these two is
--     the one question on the form we most want answered in the family's own
--     words.
--   * Every question is required.
--
-- Version 1 is archived, not deleted: submissions reference their form version,
-- and an archived version keeps the answers already collected interpretable.
--
-- Safe to re-run. The guard is the content hash: if a published version with
-- this exact definition already exists for an organization, that organization
-- is skipped.

do $$
declare
  form record;
  new_version_id uuid;
  next_number int;
  definition jsonb;
  hash text;
begin
  definition := $json$
  {
    "schemaVersion": "interest_form.v1",
    "title": "Express Interest",
    "sections": [
      {
        "key": "student",
        "title": "Student Information",
        "description": "Tell us about the student you would like to enroll.",
        "order": 0,
        "questionKeys": [
          "first_name",
          "last_name",
          "preferred_name",
          "date_of_birth",
          "current_grade",
          "applying_for_grade"
        ]
      },
      {
        "key": "program_school",
        "title": "Program & School",
        "order": 1,
        "questionKeys": [
          "school_id",
          "program",
          "referral_source",
          "student_greatness",
          "student_challenges"
        ]
      },
      {
        "key": "guardian",
        "title": "Parent / Guardian Contact",
        "description": "Use the email you will sign in with to access your admissions portal.",
        "order": 2,
        "questionKeys": [
          "guardian_first_name",
          "guardian_last_name",
          "guardian_email",
          "guardian_phone",
          "preferred_contact_method"
        ]
      }
    ],
    "questions": [
      {
        "key": "first_name",
        "type": "text",
        "label": "First Name",
        "required": true,
        "order": 0,
        "systemBinding": "lead.first_name"
      },
      {
        "key": "last_name",
        "type": "text",
        "label": "Last Name",
        "required": true,
        "order": 1,
        "systemBinding": "lead.last_name"
      },
      {
        "key": "preferred_name",
        "type": "text",
        "label": "Preferred Name",
        "required": true,
        "order": 2,
        "systemBinding": "lead.preferred_name"
      },
      {
        "key": "date_of_birth",
        "type": "date",
        "label": "Date of Birth",
        "required": true,
        "order": 3,
        "systemBinding": "lead.date_of_birth"
      },
      {
        "key": "current_grade",
        "type": "select",
        "label": "Current Grade",
        "required": true,
        "order": 4,
        "systemBinding": "lead.current_grade",
        "optionSource": "grades"
      },
      {
        "key": "applying_for_grade",
        "type": "select",
        "label": "Applying For Grade",
        "required": true,
        "order": 5,
        "systemBinding": "lead.applying_for_grade",
        "optionSource": "grades"
      },
      {
        "key": "school_id",
        "type": "school_selector",
        "label": "School",
        "required": true,
        "order": 6,
        "systemBinding": "lead.school_id"
      },
      {
        "key": "program",
        "type": "program_selector",
        "label": "Program",
        "required": true,
        "order": 7,
        "systemBinding": "lead.program"
      },
      {
        "key": "referral_source",
        "type": "text",
        "label": "Referral source",
        "required": true,
        "order": 8,
        "systemBinding": "lead.referral_source",
        "placeholder": "How did you hear about us?"
      },
      {
        "key": "student_greatness",
        "type": "rich_text",
        "label": "What is your child's GREATNESS?",
        "required": true,
        "order": 9,
        "systemBinding": null
      },
      {
        "key": "student_challenges",
        "type": "rich_text",
        "label": "What challenges does your child experience in school (academically, socially, and/or emotionally)?",
        "required": true,
        "order": 10,
        "systemBinding": null
      },
      {
        "key": "guardian_first_name",
        "type": "text",
        "label": "First Name",
        "required": true,
        "order": 11,
        "systemBinding": "lead.guardian_first_name"
      },
      {
        "key": "guardian_last_name",
        "type": "text",
        "label": "Last Name",
        "required": true,
        "order": 12,
        "systemBinding": "lead.guardian_last_name"
      },
      {
        "key": "guardian_email",
        "type": "email",
        "label": "Email",
        "required": true,
        "order": 13,
        "systemBinding": "lead.guardian_email"
      },
      {
        "key": "guardian_phone",
        "type": "phone",
        "label": "Phone",
        "required": true,
        "order": 14,
        "systemBinding": "lead.guardian_phone"
      },
      {
        "key": "preferred_contact_method",
        "type": "select",
        "label": "Preferred contact method",
        "required": true,
        "order": 15,
        "systemBinding": null,
        "options": [
          { "value": "email", "label": "Email" },
          { "value": "phone", "label": "Phone" },
          { "value": "text", "label": "Text" }
        ],
        "defaultValue": "email"
      }
    ]
  }
  $json$::jsonb;

  hash := encode(sha256(convert_to(definition::text, 'UTF8')), 'hex');

  for form in
    select f.id, f.organization_id
    from public.admissions_interest_forms f
  loop
    -- Already on this exact definition; nothing to do.
    if exists (
      select 1
      from public.admissions_interest_form_versions v
      where v.form_id = form.id
        and v.content_hash = hash
        and v.lifecycle = 'published'
    ) then
      continue;
    end if;

    -- One published version per form is enforced by a partial unique index,
    -- so the incumbent has to step down before the new one is inserted.
    update public.admissions_interest_form_versions
    set lifecycle = 'archived'
    where form_id = form.id
      and lifecycle = 'published';

    select coalesce(max(version_number), 0) + 1
    into next_number
    from public.admissions_interest_form_versions
    where form_id = form.id;

    insert into public.admissions_interest_form_versions (
      form_id,
      organization_id,
      version_number,
      lifecycle,
      schema_version,
      definition,
      content_hash,
      published_at
    )
    values (
      form.id,
      form.organization_id,
      next_number,
      'published',
      'interest_form.v1',
      definition,
      hash,
      now()
    )
    returning id into new_version_id;

    update public.admissions_interest_forms
    set published_version_id = new_version_id,
        updated_at = now()
    where id = form.id;
  end loop;
end $$;

-- What is now live, per organization. Expect one row per form, version 2,
-- lifecycle published.
select
  o.name as organization,
  f.title,
  v.version_number,
  v.lifecycle,
  v.published_at,
  jsonb_array_length(v.definition -> 'questions') as question_count
from public.admissions_interest_forms f
join public.admissions_interest_form_versions v on v.id = f.published_version_id
left join public.org_organizations o on o.id = f.organization_id
order by o.name;
