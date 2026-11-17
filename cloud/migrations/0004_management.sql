ALTER TABLE users ADD COLUMN deleted_at INTEGER CHECK(deleted_at IS NULL OR (active=0 AND deleted_at>0));
INSERT INTO meta(id,value) VALUES('operationEpoch','0') ON CONFLICT(id) DO NOTHING;
CREATE TABLE maintenance_reset_gate(operation_id TEXT PRIMARY KEY REFERENCES operations(id),actor_id TEXT NOT NULL REFERENCES users(id));
DROP TRIGGER immutable_payment_delete;
CREATE TRIGGER immutable_payment_delete BEFORE DELETE ON payments WHEN NOT EXISTS( SELECT 1 FROM maintenance_reset_gate g JOIN operations o ON o.id=g.operation_id AND o.kind='delivery-reset' AND o.user_id=g.actor_id JOIN users u ON u.id=g.actor_id AND u.role='admin' AND u.active=1 AND u.deleted_at IS NULL WHERE EXISTS(SELECT 1 FROM meta WHERE id='authority' AND value='cloud-test') AND EXISTS(SELECT 1 FROM meta WHERE id='sourceKind' AND value='synthetic') ) BEGIN SELECT RAISE(ABORT,'OESTE_IMMUTABLE_PAYMENT'); END;
