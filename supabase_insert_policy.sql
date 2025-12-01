-- Enable insert access for authenticated users where user_id matches their auth.uid()
create policy "Enable insert for authenticated users only"
on "public"."scans"
as PERMISSIVE
for INSERT
to authenticated
with check (auth.uid() = user_id);
