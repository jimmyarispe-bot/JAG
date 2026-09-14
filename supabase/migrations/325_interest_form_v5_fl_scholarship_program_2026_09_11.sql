-- 325_interest_form_v5_fl_scholarship_program_2026_09_11.sql
--
-- Version 5: Florida families pick their scholarship programme from a list, and
-- a Florida family WITHOUT a scholarship can submit the form again.
--
-- THE BUG THIS FIXES. v4 copied the Florida paper application faithfully,
-- including its asterisks: award ID and scholarship amount are both marked
-- required there. On paper an asterisk is a request — a parent who has no
-- scholarship leaves the box empty and hands the form in. On a web form it is a
-- wall. Between v4 and this migration, a private-pay Florida family could not
-- submit an inquiry at all. Porting the asterisk is not the same as porting the
-- form.
--
-- WHAT CHANGES
--
--   1. New question `fl_scholarship_program`, a required dropdown on the
--      Florida section. Its option VALUES are the `program_code` values in
--      `funding_program_catalog` — FTC, FES-EO, FES-UA, FTC-PEP — so the answer
--      maps to a catalogue row exactly rather than by string-matching a label
--      later. That is the same key AUP Section IV.A reports on: the number of
--      students and total received, per programme. A family who tells us their
--      programme at inquiry is a family we do not have to chase in September.
--
--      The fifth option, "none", is the one value with no catalogue row, and it
--      is the point of this migration.
--
--   2. `fl_step_up_award_id` and `fl_scholarship_amount` become conditional on
--      that answer not being "none". The submit validator skips hidden
--      questions before it checks required, so a private-pay family is never
--      asked for an award ID that does not exist.
--
-- WHY THE OPTIONS ARE TYPED OUT RATHER THAN READ FROM THE CATALOGUE. They
-- should come from `funding_program_catalog`, filtered by the school's state —
-- adding a scholarship next year would then be a catalogue row rather than a
-- form migration. `InterestOptionSource` accepts only "grades",
-- "funding_sources", "programs" and "schools", so a catalogue-backed option
-- source is a code change, and it is worth doing before Georgia's four
-- programmes are added. Typing four options is not worth blocking this on.
--
--   NOTE for whoever does that work: the catalogue currently also contains
--   `fl_step_up` ("Step Up For Students", the FUNDER recorded as a programme)
--   and `fl_esa` ("Florida ESA (Family Empowerment Scholarship)"). Drive a
--   dropdown off the catalogue today and a Florida parent is offered both
--   alongside FTC and FES-EO. Deactivate them first.
--
-- Version 4 is archived, not deleted. Safe to re-run; the content hash guard
-- skips an organization already on this exact definition.

do $$
declare
  form record;
  new_version_id uuid;
  next_number int;
  definition_text text;
  definition jsonb;
  hash text;
  id_fl text;
  id_ga text;
  id_hs text;
  id_virtual text;
begin
  definition_text := $json$
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
        "applying_for_grade",
        "desired_start_date"
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
    },
    {
      "key": "mailing_address",
      "title": "Mailing Address",
      "description": "Where we should send anything that goes in the post.",
      "order": 3,
      "questionKeys": [
        "mailing_street",
        "mailing_line_2",
        "mailing_city",
        "mailing_state",
        "mailing_postal_code",
        "mailing_country"
      ]
    },
    {
      "key": "fl_detail",
      "title": "The Academy FL",
      "description": "A few questions specific to our Florida campus.",
      "order": 4,
      "visibleWhen": {
        "all": [
          {
            "path": "school_id",
            "op": "eq",
            "value": "__SCHOOL_FL__"
          }
        ]
      },
      "questionKeys": [
        "fl_scholarship_program",
        "fl_current_school_name",
        "fl_current_school_city",
        "fl_zoned_public_school",
        "fl_step_up_award_id",
        "fl_scholarship_amount",
        "fl_peer_interaction",
        "fl_anything_else"
      ]
    },
    {
      "key": "ga_detail",
      "title": "The Academy GA",
      "description": "A few questions specific to our Georgia campus.",
      "order": 5,
      "visibleWhen": {
        "all": [
          {
            "path": "school_id",
            "op": "eq",
            "value": "__SCHOOL_GA__"
          }
        ]
      },
      "questionKeys": [
        "ga_current_school_name",
        "ga_zoned_public_school",
        "ga_scholarships",
        "ga_special_needs_amount",
        "ga_goal_narrative",
        "ga_peer_interaction",
        "ga_anything_else"
      ]
    },
    {
      "key": "hs_detail",
      "title": "The Academy HS",
      "description": "A few questions specific to our high school.",
      "order": 6,
      "visibleWhen": {
        "all": [
          {
            "path": "school_id",
            "op": "eq",
            "value": "__SCHOOL_HS__"
          }
        ]
      },
      "questionKeys": [
        "hs_student_email",
        "hs_years_high_school",
        "hs_suspended",
        "hs_suspension_detail",
        "hs_why_attend",
        "hs_anything_else"
      ]
    },
    {
      "key": "hs_student",
      "title": "Student Section",
      "description": "Students should complete this section on their own. We are not critiquing spelling or grammar. These questions are so we can learn what is in your head and heart, and why you believe you would be successful at The Academy HS.",
      "order": 7,
      "visibleWhen": {
        "all": [
          {
            "path": "school_id",
            "op": "eq",
            "value": "__SCHOOL_HS__"
          }
        ]
      },
      "questionKeys": [
        "hs_student_why_join",
        "hs_student_biggest_challenge",
        "hs_student_principal_change",
        "hs_student_greatness",
        "hs_student_treated_better"
      ]
    },
    {
      "key": "virtual_detail",
      "title": "The Academy Virtual",
      "description": "A few questions specific to our virtual school.",
      "order": 8,
      "visibleWhen": {
        "all": [
          {
            "path": "school_id",
            "op": "eq",
            "value": "__SCHOOL_VIRTUAL__"
          }
        ]
      },
      "questionKeys": [
        "virtual_program_interest",
        "virtual_has_scholarship",
        "virtual_anything_else"
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
      "systemBinding": "lead.date_of_birth",
      "helpText": "We calculate your child's age from this, so you only tell us once."
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
      "type": "multiselect",
      "label": "How did you hear about our school?",
      "required": true,
      "order": 8,
      "systemBinding": "lead.referral_source",
      "helpText": "Check all that apply.",
      "options": [
        {
          "value": "returning_student",
          "label": "Returning Student"
        },
        {
          "value": "facebook",
          "label": "Facebook"
        },
        {
          "value": "instagram",
          "label": "Instagram"
        },
        {
          "value": "billboard",
          "label": "Billboard"
        },
        {
          "value": "friend",
          "label": "Friend"
        },
        {
          "value": "tshirts",
          "label": "Kids wearing tshirts around town"
        },
        {
          "value": "bumper_sticker",
          "label": "Car bumper sticker"
        },
        {
          "value": "current_student",
          "label": "Current student"
        },
        {
          "value": "sidewalk_sign",
          "label": "Sidewalk sign"
        },
        {
          "value": "internet_search",
          "label": "Internet search"
        }
      ]
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
        {
          "value": "email",
          "label": "Email"
        },
        {
          "value": "phone",
          "label": "Phone"
        },
        {
          "value": "text",
          "label": "Text"
        }
      ],
      "defaultValue": "email"
    },
    {
      "key": "mailing_street",
      "type": "text",
      "label": "Street Address",
      "required": true,
      "order": 16,
      "systemBinding": null
    },
    {
      "key": "mailing_line_2",
      "type": "text",
      "label": "Address Line 2",
      "required": false,
      "order": 17,
      "systemBinding": null
    },
    {
      "key": "mailing_city",
      "type": "text",
      "label": "City",
      "required": true,
      "order": 18,
      "systemBinding": null
    },
    {
      "key": "mailing_state",
      "type": "text",
      "label": "State / Region / Province",
      "required": true,
      "order": 19,
      "systemBinding": null
    },
    {
      "key": "mailing_postal_code",
      "type": "text",
      "label": "Postal / Zip Code",
      "required": true,
      "order": 20,
      "systemBinding": null
    },
    {
      "key": "mailing_country",
      "type": "text",
      "label": "Country",
      "required": true,
      "order": 21,
      "systemBinding": null,
      "defaultValue": "United States"
    },
    {
      "key": "desired_start_date",
      "type": "date",
      "label": "When would you like to start?",
      "required": true,
      "order": 22,
      "systemBinding": null
    },
    {
      "key": "fl_scholarship_program",
      "type": "select",
      "label": "Which scholarship does your child have?",
      "required": true,
      "order": 29,
      "systemBinding": null,
      "helpText": "The programme named on your Step Up For Students award letter.",
      "options": [
        {
          "value": "FTC",
          "label": "Florida Tax Credit Scholarship (FTC)"
        },
        {
          "value": "FES-EO",
          "label": "Family Empowerment Scholarship for Educational Options (FES-EO)"
        },
        {
          "value": "FES-UA",
          "label": "Family Empowerment Scholarship for Students with Unique Abilities (FES-UA)"
        },
        {
          "value": "FTC-PEP",
          "label": "Personalized Education Program (FTC-PEP)"
        },
        {
          "value": "none",
          "label": "We are not using a scholarship"
        }
      ]
    },
    {
      "key": "fl_current_school_name",
      "type": "text",
      "label": "Current school name",
      "required": true,
      "order": 30,
      "systemBinding": null
    },
    {
      "key": "fl_current_school_city",
      "type": "text",
      "label": "Current school city",
      "required": true,
      "order": 31,
      "systemBinding": null
    },
    {
      "key": "fl_zoned_public_school",
      "type": "text",
      "label": "If homeschooled, what public school would your child be attending?",
      "required": false,
      "order": 32,
      "systemBinding": null
    },
    {
      "key": "fl_step_up_award_id",
      "type": "text",
      "label": "Step Up Award ID",
      "required": true,
      "order": 33,
      "systemBinding": null,
      "helpText": "The award ID on your Step Up For Students award letter. It changes each school year.",
      "visibleWhen": {
        "all": [
          {
            "path": "fl_scholarship_program",
            "op": "neq",
            "value": "none"
          }
        ]
      }
    },
    {
      "key": "fl_scholarship_amount",
      "type": "number",
      "label": "Scholarship / voucher amount",
      "required": true,
      "order": 34,
      "systemBinding": null,
      "visibleWhen": {
        "all": [
          {
            "path": "fl_scholarship_program",
            "op": "neq",
            "value": "none"
          }
        ]
      }
    },
    {
      "key": "fl_peer_interaction",
      "type": "rich_text",
      "label": "How does your son/daughter interact with other children his/her own age?",
      "required": true,
      "order": 35,
      "systemBinding": null
    },
    {
      "key": "fl_anything_else",
      "type": "rich_text",
      "label": "Is there anything else you would like to share with us about your child?",
      "required": false,
      "order": 36,
      "systemBinding": null
    },
    {
      "key": "ga_current_school_name",
      "type": "text",
      "label": "Student's current school name",
      "required": false,
      "order": 40,
      "systemBinding": null
    },
    {
      "key": "ga_zoned_public_school",
      "type": "text",
      "label": "If homeschooled, what public school would your child be attending?",
      "required": false,
      "order": 41,
      "systemBinding": null
    },
    {
      "key": "ga_scholarships",
      "type": "multiselect",
      "label": "I am applying for / using the following scholarships",
      "required": true,
      "order": 42,
      "systemBinding": null,
      "helpText": "Choose all that apply to your family situation.",
      "options": [
        {
          "value": "none",
          "label": "None"
        },
        {
          "value": "ga_special_needs",
          "label": "GA Special Needs Scholarship"
        },
        {
          "value": "ga_goal",
          "label": "GA GOAL Scholarship"
        },
        {
          "value": "academy_based",
          "label": "Academy-Based Scholarship"
        }
      ]
    },
    {
      "key": "ga_special_needs_amount",
      "type": "number",
      "label": "GA Special Needs Scholarship award amount",
      "required": false,
      "order": 43,
      "systemBinding": null,
      "helpText": "Your award amount is at https://finance.doe.k12.ga.us/ScholarshipPublicWeb/EligibilityCalculator.aspx?pagevalue=2"
    },
    {
      "key": "ga_goal_narrative",
      "type": "rich_text",
      "label": "For GA GOAL and Academy-Based applicants: 1) Why do you want your child to attend The Academy GA? 2) What can you do to support your child while he/she is a student at The Academy GA? 3) How can you contribute to our school community?",
      "required": false,
      "order": 44,
      "systemBinding": null
    },
    {
      "key": "ga_peer_interaction",
      "type": "rich_text",
      "label": "How does your son/daughter interact with other children his/her own age?",
      "required": false,
      "order": 45,
      "systemBinding": null
    },
    {
      "key": "ga_anything_else",
      "type": "rich_text",
      "label": "Is there anything else you would like to share with us about your child?",
      "required": false,
      "order": 46,
      "systemBinding": null
    },
    {
      "key": "hs_student_email",
      "type": "email",
      "label": "Student's email",
      "required": true,
      "order": 50,
      "systemBinding": null
    },
    {
      "key": "hs_years_high_school",
      "type": "number",
      "label": "How many years of high school have you attended?",
      "required": true,
      "order": 51,
      "systemBinding": null
    },
    {
      "key": "hs_suspended",
      "type": "select",
      "label": "Has your son/daughter ever been suspended from school?",
      "required": true,
      "order": 52,
      "systemBinding": null,
      "helpText": "We are not here to judge. We know kids do stupid things sometimes. We are trying to obtain as much information as possible to determine if we are the best school for your child and whether he/she can be successful with us.",
      "options": [
        {
          "value": "no",
          "label": "No"
        },
        {
          "value": "yes",
          "label": "Yes"
        }
      ]
    },
    {
      "key": "hs_suspension_detail",
      "type": "rich_text",
      "label": "If he/she has been suspended, provide a specific description of each incident.",
      "required": false,
      "order": 53,
      "systemBinding": null
    },
    {
      "key": "hs_why_attend",
      "type": "rich_text",
      "label": "Why do you want your child to attend The Academy HS?",
      "required": true,
      "order": 54,
      "systemBinding": null
    },
    {
      "key": "hs_anything_else",
      "type": "rich_text",
      "label": "Is there anything else we should know about your child?",
      "required": false,
      "order": 55,
      "systemBinding": null
    },
    {
      "key": "hs_student_why_join",
      "type": "rich_text",
      "label": "Why do you want to join The Academy HS family?",
      "required": true,
      "order": 60,
      "systemBinding": null
    },
    {
      "key": "hs_student_biggest_challenge",
      "type": "rich_text",
      "label": "What is your biggest challenge in your current school?",
      "required": true,
      "order": 61,
      "systemBinding": null
    },
    {
      "key": "hs_student_principal_change",
      "type": "rich_text",
      "label": "If you were the principal, what would you change about your current school?",
      "required": true,
      "order": 62,
      "systemBinding": null
    },
    {
      "key": "hs_student_greatness",
      "type": "rich_text",
      "label": "What do you believe is your GREATNESS?",
      "required": true,
      "order": 63,
      "systemBinding": null
    },
    {
      "key": "hs_student_treated_better",
      "type": "rich_text",
      "label": "Provide a specific example of when you could have treated someone better than you did.",
      "required": true,
      "order": 64,
      "systemBinding": null
    },
    {
      "key": "virtual_program_interest",
      "type": "multiselect",
      "label": "What program are you interested in for your child?",
      "required": true,
      "order": 70,
      "systemBinding": null,
      "options": [
        {
          "value": "full_school_3_8",
          "label": "3rd - 8th grade Full-School Program"
        },
        {
          "value": "tutoring_wilson",
          "label": "Tutoring: Wilson Structured Literacy"
        },
        {
          "value": "tutoring_math",
          "label": "Tutoring: Math"
        },
        {
          "value": "tutoring_writing",
          "label": "Tutoring: Writing"
        },
        {
          "value": "tutoring_reading_comp",
          "label": "Tutoring: Reading Comp"
        }
      ]
    },
    {
      "key": "virtual_has_scholarship",
      "type": "select",
      "label": "I/we have a scholarship from our state, district or other government source that we will be using to help offset the tuition cost.",
      "required": true,
      "order": 71,
      "systemBinding": null,
      "options": [
        {
          "value": "no",
          "label": "No"
        },
        {
          "value": "yes",
          "label": "Yes"
        }
      ]
    },
    {
      "key": "virtual_anything_else",
      "type": "rich_text",
      "label": "What would you like for us to know about your child?",
      "required": false,
      "order": 72,
      "systemBinding": null
    }
  ]
}
  $json$;

  for form in
    select f.id, f.organization_id
    from public.admissions_interest_forms f
  loop
    select s.id::text into id_fl from public.schools s
      where s.organization_id = form.organization_id and s.name = 'The Academy FL' limit 1;
    select s.id::text into id_ga from public.schools s
      where s.organization_id = form.organization_id and s.name = 'The Academy GA' limit 1;
    select s.id::text into id_hs from public.schools s
      where s.organization_id = form.organization_id and s.name = 'The Academy HS' limit 1;
    select s.id::text into id_virtual from public.schools s
      where s.organization_id = form.organization_id and s.name = 'The Academy Virtual' limit 1;

    definition := replace(
      replace(
        replace(
          replace(definition_text, '__SCHOOL_FL__', coalesce(id_fl, '__SCHOOL_FL__')),
          '__SCHOOL_GA__', coalesce(id_ga, '__SCHOOL_GA__')
        ),
        '__SCHOOL_HS__', coalesce(id_hs, '__SCHOOL_HS__')
      ),
      '__SCHOOL_VIRTUAL__', coalesce(id_virtual, '__SCHOOL_VIRTUAL__')
    )::jsonb;

    hash := encode(sha256(convert_to(definition::text, 'UTF8')), 'hex');

    if exists (
      select 1 from public.admissions_interest_form_versions v
      where v.form_id = form.id and v.content_hash = hash and v.lifecycle = 'published'
    ) then
      continue;
    end if;

    update public.admissions_interest_form_versions
    set lifecycle = 'archived'
    where form_id = form.id and lifecycle = 'published';

    select coalesce(max(version_number), 0) + 1 into next_number
    from public.admissions_interest_form_versions where form_id = form.id;

    insert into public.admissions_interest_form_versions (
      form_id, organization_id, version_number, lifecycle,
      schema_version, definition, content_hash, published_at
    )
    values (
      form.id, form.organization_id, next_number, 'published',
      'interest_form.v1', definition, hash, now()
    )
    returning id into new_version_id;

    update public.admissions_interest_forms
    set published_version_id = new_version_id, updated_at = now()
    where id = form.id;
  end loop;
end $$;

-- Expect version 5, 9 sections, 52 questions, 0 unresolved campus tokens.
select
  o.name as organization,
  v.version_number,
  v.lifecycle,
  jsonb_array_length(v.definition -> 'sections') as section_count,
  jsonb_array_length(v.definition -> 'questions') as question_count,
  (length(v.definition::text) - length(replace(v.definition::text, '__SCHOOL_', ''))) / length('__SCHOOL_')
    as unresolved_campus_tokens
from public.admissions_interest_forms f
join public.admissions_interest_form_versions v on v.id = f.published_version_id
left join public.org_organizations o on o.id = f.organization_id
order by o.name;
