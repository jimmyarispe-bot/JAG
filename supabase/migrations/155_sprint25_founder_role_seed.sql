-- Sprint 2.5 stabilization: grant FOUNDER role to seed founder account (Executive Intelligence + full platform access)
insert into public.user_roles (user_id, role_id)
select u.id, r.id
from public.users u
join public.roles r on r.name = 'FOUNDER'
where lower(u.email) = 'jimmy@academyos.org'
on conflict do nothing;
