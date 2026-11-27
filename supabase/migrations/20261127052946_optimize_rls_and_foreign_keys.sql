-- Performance hardening identified by Supabase Database Advisors.
-- This migration preserves every policy's roles, command and predicates.
-- It only evaluates auth.uid()/auth.jwt() once per statement (initPlan)
-- and adds covering indexes for foreign keys used by ownership/admin flows.

create index if not exists admin_audit_log_admin_id_idx
  on public.admin_audit_log (admin_id);

create index if not exists contact_messages_user_id_idx
  on public.contact_messages (user_id);

create index if not exists reminder_subscriptions_user_id_idx
  on public.reminder_subscriptions (user_id);

create index if not exists reports_user_id_idx
  on public.reports (user_id);

do $migration$
declare
  policy_row record;
  optimized_using text;
  optimized_check text;
  clauses text;
begin
  for policy_row in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname in ('public', 'storage')
      and (
        coalesce(qual, '') like '%auth.uid()%'
        or coalesce(qual, '') like '%auth.jwt()%'
        or coalesce(with_check, '') like '%auth.uid()%'
        or coalesce(with_check, '') like '%auth.jwt()%'
      )
  loop
    optimized_using := case
      when policy_row.qual is null then null
      else replace(
        replace(policy_row.qual, 'auth.uid()', '(select auth.uid())'),
        'auth.jwt()', '(select auth.jwt())'
      )
    end;

    optimized_check := case
      when policy_row.with_check is null then null
      else replace(
        replace(policy_row.with_check, 'auth.uid()', '(select auth.uid())'),
        'auth.jwt()', '(select auth.jwt())'
      )
    end;

    clauses := '';
    if optimized_using is not null then
      clauses := clauses || format(' using (%s)', optimized_using);
    end if;
    if optimized_check is not null then
      clauses := clauses || format(' with check (%s)', optimized_check);
    end if;

    execute format(
      'alter policy %I on %I.%I%s',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename,
      clauses
    );
  end loop;
end
$migration$;
