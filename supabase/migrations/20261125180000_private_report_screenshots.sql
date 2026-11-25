-- Keep report attachments private while allowing moderators to read them.
insert into storage.buckets (id, name, public)
values ('reports-screenshots', 'reports-screenshots', false)
on conflict (id) do update set public = false;

drop policy if exists report_screenshots_read_admin on storage.objects;
create policy report_screenshots_read_admin on storage.objects
for select to authenticated
using (bucket_id = 'reports-screenshots' and auth.jwt()->'app_metadata'->>'role' = 'admin');
