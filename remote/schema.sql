CREATE TABLE IF NOT EXISTS payments (
  installation TEXT NOT NULL,
  id TEXT NOT NULL,
  epoch TEXT NOT NULL,
  seq INTEGER NOT NULL,
  paid INTEGER NOT NULL,
  actor TEXT NOT NULL,
  total INTEGER NOT NULL,
  lines TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  PRIMARY KEY (installation,id),
  UNIQUE (installation,epoch,seq)
);
CREATE INDEX IF NOT EXISTS remote_payment_time ON payments(paid);
CREATE TABLE IF NOT EXISTS snapshots (
  installation TEXT PRIMARY KEY,
  at INTEGER NOT NULL,
  occupancy INTEGER NOT NULL,
  entries INTEGER NOT NULL,
  exits INTEGER NOT NULL,
  confirmed INTEGER NOT NULL
);
