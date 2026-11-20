-- Credential identifier can change without rewriting financial actor history.
ALTER TABLE users ADD COLUMN login_name TEXT;
CREATE UNIQUE INDEX users_login_identifier ON users(COALESCE(login_name,name));
