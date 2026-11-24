ALTER TABLE customers ADD COLUMN deleted_at INTEGER CHECK(deleted_at IS NULL OR (typeof(deleted_at)='integer' AND deleted_at>0 AND active=0));
