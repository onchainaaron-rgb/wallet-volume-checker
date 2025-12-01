-- Enable read access for everyone (authenticated and anonymous)
create policy "Enable read access for all users"
on "public"."scans"
as PERMISSIVE
for SELECT
to public
using (true);

-- Ensure the table has RLS enabled
alter table "public"."scans" enable row level security;
