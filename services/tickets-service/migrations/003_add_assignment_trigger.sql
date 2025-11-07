-- Create trigger to automatically update last_assigned_at when a ticket is assigned

-- Function to update user's last_assigned_at timestamp
CREATE OR REPLACE FUNCTION update_user_last_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if assigned_to has changed and is not NULL
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR NEW.assigned_to <> OLD.assigned_to) THEN
    UPDATE users
    SET last_assigned_at = NOW()
    WHERE id = NEW.assigned_to;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on tickets table
DROP TRIGGER IF EXISTS trg_update_user_last_assigned ON tickets;

CREATE TRIGGER trg_update_user_last_assigned
  AFTER INSERT OR UPDATE OF assigned_to ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_assigned();

COMMENT ON FUNCTION update_user_last_assigned IS 'Automatically updates users.last_assigned_at when a ticket is assigned';
COMMENT ON TRIGGER trg_update_user_last_assigned ON tickets IS 'Updates user assignment timestamp for round-robin distribution';
