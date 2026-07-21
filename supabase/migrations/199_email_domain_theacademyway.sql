-- =========================================
-- Align seed / founder emails to Academy Way domain
-- Outbound mail uses noreply@theacademyway.org (EMAIL_FROM).
-- Idempotent: rewrites legacy product-domain addresses only.
-- =========================================

update public.users
set email = regexp_replace(email, '@academyos\.org$', '@theacademyway.org', 'i')
where email ~* '@academyos\.org$';

update auth.users
set
  email = regexp_replace(email, '@academyos\.org$', '@theacademyway.org', 'i'),
  updated_at = now()
where email ~* '@academyos\.org$';

update auth.identities
set
  identity_data = case
    when coalesce(identity_data->>'email', '') ~* '@academyos\.org$'
      then jsonb_set(
        coalesce(identity_data, '{}'::jsonb),
        '{email}',
        to_jsonb(
          regexp_replace(
            identity_data->>'email',
            '@academyos\.org$',
            '@theacademyway.org',
            'i'
          )
        )
      )
    else identity_data
  end,
  provider_id = case
    when provider = 'email' and provider_id ~* '@academyos\.org$'
      then regexp_replace(provider_id, '@academyos\.org$', '@theacademyway.org', 'i')
    else provider_id
  end
where
  coalesce(identity_data->>'email', '') ~* '@academyos\.org$'
  or (provider = 'email' and provider_id ~* '@academyos\.org$');
