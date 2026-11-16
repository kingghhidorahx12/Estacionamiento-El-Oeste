CREATE TABLE devices(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),token_hash TEXT NOT NULL,label TEXT NOT NULL,approved_by TEXT NOT NULL REFERENCES users(id),created INTEGER NOT NULL,expires INTEGER NOT NULL,user_revision INTEGER NOT NULL,state TEXT NOT NULL DEFAULT 'active' CHECK(state IN ('active','revoked')),revision INTEGER NOT NULL DEFAULT 0,UNIQUE(user_id,token_hash));
CREATE INDEX devices_user ON devices(user_id,state);
ALTER TABLE sessions ADD COLUMN device_id TEXT REFERENCES devices(id);
CREATE TABLE device_requests(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),token_hash TEXT NOT NULL,code TEXT NOT NULL UNIQUE,label TEXT NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL,user_revision INTEGER NOT NULL,state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','approved','denied')),revision INTEGER NOT NULL DEFAULT 0);
CREATE INDEX device_requests_pending ON device_requests(user_id,token_hash,state,expires);
