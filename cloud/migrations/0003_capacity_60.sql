-- Requested capacity change, 16/11/2026. Preserve stays, payments and QR.
DROP TRIGGER enforce_capacity;
CREATE TRIGGER enforce_capacity BEFORE INSERT ON stays WHEN NEW.state='active'
BEGIN
  SELECT CASE WHEN (SELECT count(*) FROM stays WHERE state='active')>=60
    THEN RAISE(ABORT,'OESTE_CAPACITY') END;
END;
