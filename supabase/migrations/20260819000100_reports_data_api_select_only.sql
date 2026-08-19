-- A Data API de reports é somente leitura. O REVOKE da baseline tira
-- INSERT/UPDATE/DELETE, mas o GRANT ALL interno do stack local deixa TRUNCATE.
-- TRUNCATE não dispara reports_immutable e apagaria emissões oficiais.

revoke insert, update, delete, truncate on public.reports
  from public, anon, authenticated, service_role;

notify pgrst, 'reload schema';
