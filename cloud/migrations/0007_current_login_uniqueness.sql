-- A deleted identity keeps its ledger name, but no longer claims a login alias.
DROP INDEX users_login_identifier;
CREATE UNIQUE INDEX users_login_identifier ON users(COALESCE(login_name,name)) WHERE deleted_at IS NULL;
