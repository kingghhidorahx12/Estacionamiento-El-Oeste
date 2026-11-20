
-- Cobros de baños independientes de estancias y pensiones.
CREATE TABLE bathroom_payments (
 id TEXT PRIMARY KEY,
 quantity INTEGER NOT NULL
   CHECK(typeof(quantity)='integer' AND quantity BETWEEN 1 AND 50),
 unit_price INTEGER NOT NULL
   CHECK(typeof(unit_price)='integer' AND unit_price>0 AND unit_price<=100000000),
 rate_version INTEGER NOT NULL CHECK(rate_version>0),
 lines TEXT NOT NULL CHECK(json_valid(lines)),
 total INTEGER NOT NULL
   CHECK(typeof(total)='integer'
     AND total=quantity*unit_price
     AND total<=100000000),
 actor TEXT NOT NULL,
 paid INTEGER NOT NULL
);

CREATE INDEX bathroom_payments_time
 ON bathroom_payments(paid);

CREATE INDEX bathroom_payments_actor_time
 ON bathroom_payments(actor,paid);

CREATE TRIGGER immutable_bathroom_update
BEFORE UPDATE ON bathroom_payments
BEGIN
 SELECT RAISE(ABORT,'OESTE_IMMUTABLE_PAYMENT');
END;

CREATE TRIGGER immutable_bathroom_delete
BEFORE DELETE ON bathroom_payments
WHEN NOT EXISTS (
 SELECT 1
 FROM maintenance_reset_gate g
 JOIN operations o
   ON o.id=g.operation_id
   AND o.kind='delivery-reset'
   AND o.user_id=g.actor_id
 JOIN users u
   ON u.id=g.actor_id
   AND u.role='admin'
   AND u.active=1
   AND u.deleted_at IS NULL
 WHERE EXISTS (
   SELECT 1 FROM meta
   WHERE id='authority' AND value='cloud-test'
 )
 AND EXISTS (
   SELECT 1 FROM meta
   WHERE id='sourceKind' AND value='synthetic'
 )
)
BEGIN
 SELECT RAISE(ABORT,'OESTE_IMMUTABLE_PAYMENT');
END;
