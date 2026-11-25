DROP POLICY IF EXISTS "notifications_update_own"
  ON public.notifications;

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      part_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.parts p
        JOIN public.vehicles v ON v.id = p.vehicle_id
        WHERE p.id = notifications.part_id AND v.user_id = auth.uid()
      )
    )
    AND (
      schedule_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.maintenance_schedules s
        JOIN public.parts p ON p.id = s.part_id
        JOIN public.vehicles v ON v.id = p.vehicle_id
        WHERE s.id = notifications.schedule_id AND v.user_id = auth.uid()
      )
    )
  );
