import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const userAEmail = process.env.TEST_USER_A_EMAIL;
const userAPassword = process.env.TEST_USER_A_PASSWORD;
const userBEmail = process.env.TEST_USER_B_EMAIL;
const userBPassword = process.env.TEST_USER_B_PASSWORD;

const hasLiveTestConfig = Boolean(
  supabaseUrl &&
    supabasePublishableKey &&
    userAEmail &&
    userAPassword &&
    userBEmail &&
    userBPassword,
);

function expectPolicyRejection(result: {
  data: unknown;
  error: { code?: string } | null;
}) {
  expect(result.data).toBeNull();
  expect(result.error?.code).toBe('42501');
}

async function expectNoVisibleRows<T>(
  query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
) {
  const result = await query;
  expect(result.error).toBeNull();
  expect(result.data ?? []).toHaveLength(0);
}

function updateProtectedRecord(
  client: SupabaseClient,
  table:
    | 'parts'
    | 'maintenance_schedules'
    | 'maintenance_records'
    | 'odometer_readings',
  id: string,
  marker: string,
) {
  switch (table) {
    case 'parts':
      return client
        .from('parts')
        .update({ part_name: marker })
        .eq('id', id)
        .select('id');
    case 'maintenance_schedules':
      return client
        .from('maintenance_schedules')
        .update({ schedule_name: marker })
        .eq('id', id)
        .select('id');
    case 'maintenance_records':
      return client
        .from('maintenance_records')
        .update({ description: marker })
        .eq('id', id)
        .select('id');
    case 'odometer_readings':
      return client
        .from('odometer_readings')
        .update({ note: marker })
        .eq('id', id)
        .select('id');
  }
}

describe.skipIf(!hasLiveTestConfig)(
  'Supabase RLS cross-user isolation (live)',
  () => {
    it('isolates all user-owned tables using authenticated clients', async () => {
      const clientOptions = {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      };
      const clientA = createClient(
        supabaseUrl!,
        supabasePublishableKey!,
        clientOptions,
      );
      const clientB = createClient(
        supabaseUrl!,
        supabasePublishableKey!,
        clientOptions,
      );
      const runId = randomUUID();
      let userAId: string | null = null;
      let userBId: string | null = null;
      let vehicleAId: string | null = null;
      let vehicleBId: string | null = null;
      let unauthorizedVehicleId: string | null = null;

      try {
        const [authA, authB] = await Promise.all([
          clientA.auth.signInWithPassword({
            email: userAEmail!,
            password: userAPassword!,
          }),
          clientB.auth.signInWithPassword({
            email: userBEmail!,
            password: userBPassword!,
          }),
        ]);
        expect(authA.error).toBeNull();
        expect(authA.data.user).not.toBeNull();
        expect(authB.error).toBeNull();
        expect(authB.data.user).not.toBeNull();
        userAId = authA.data.user!.id;
        userBId = authB.data.user!.id;
        expect(userAId).not.toBe(userBId);

        const vehicleA = await clientA
          .from('vehicles')
          .insert({
            user_id: userAId,
            vehicle_type: 'FOUR_WHEELER',
            brand: 'RLS Verification',
            model: `A-${runId}`,
          })
          .select('id')
          .single();
        expect(vehicleA.error).toBeNull();
        vehicleAId = vehicleA.data!.id;

        const vehicleB = await clientB
          .from('vehicles')
          .insert({
            user_id: userBId,
            vehicle_type: 'FOUR_WHEELER',
            brand: 'RLS Verification',
            model: `B-${runId}`,
          })
          .select('id')
          .single();
        expect(vehicleB.error).toBeNull();
        vehicleBId = vehicleB.data!.id;

        const [partA, partB] = await Promise.all([
          clientA
            .from('parts')
            .insert({ vehicle_id: vehicleAId, part_name: `A-${runId}` })
            .select('id')
            .single(),
          clientB
            .from('parts')
            .insert({ vehicle_id: vehicleBId, part_name: `B-${runId}` })
            .select('id')
            .single(),
        ]);
        expect(partA.error).toBeNull();
        expect(partB.error).toBeNull();

        const [scheduleA, scheduleB] = await Promise.all([
          clientA
            .from('maintenance_schedules')
            .insert({
              part_id: partA.data!.id,
              schedule_name: `A-${runId}`,
              schedule_type: 'DATE_INTERVAL',
              interval_months: 6,
              next_due_on: '2027-01-01',
            })
            .select('id')
            .single(),
          clientB
            .from('maintenance_schedules')
            .insert({
              part_id: partB.data!.id,
              schedule_name: `B-${runId}`,
              schedule_type: 'DATE_INTERVAL',
              interval_months: 6,
              next_due_on: '2027-01-01',
            })
            .select('id')
            .single(),
        ]);
        expect(scheduleA.error).toBeNull();
        expect(scheduleB.error).toBeNull();

        const [recordA, recordB] = await Promise.all([
          clientA
            .from('maintenance_records')
            .insert({
              part_id: partA.data!.id,
              schedule_id: scheduleA.data!.id,
              service_date: '2026-11-25',
              service_type: 'SERVICE',
              description: `A-${runId}`,
            })
            .select('id')
            .single(),
          clientB
            .from('maintenance_records')
            .insert({
              part_id: partB.data!.id,
              schedule_id: scheduleB.data!.id,
              service_date: '2026-11-25',
              service_type: 'SERVICE',
              description: `B-${runId}`,
            })
            .select('id')
            .single(),
        ]);
        expect(recordA.error).toBeNull();
        expect(recordB.error).toBeNull();

        const [odometerA, odometerB] = await Promise.all([
          clientA
            .from('odometer_readings')
            .insert({
              vehicle_id: vehicleAId,
              reading_km: 101,
              note: `A-${runId}`,
            })
            .select('id')
            .single(),
          clientB
            .from('odometer_readings')
            .insert({
              vehicle_id: vehicleBId,
              reading_km: 202,
              note: `B-${runId}`,
            })
            .select('id')
            .single(),
        ]);
        expect(odometerA.error).toBeNull();
        expect(odometerB.error).toBeNull();

        const [profileA, profileB, reminderA, reminderB] = await Promise.all([
          clientA
            .from('profiles')
            .select('id, full_name')
            .eq('id', userAId)
            .single(),
          clientB.from('profiles').select('id').eq('id', userBId).single(),
          clientA
            .from('reminder_settings')
            .select(
              'user_id, in_app_enabled, email_enabled, reminder_days_before, reminder_km_before',
            )
            .eq('user_id', userAId)
            .single(),
          clientB
            .from('reminder_settings')
            .select(
              'user_id, in_app_enabled, email_enabled, reminder_days_before, reminder_km_before',
            )
            .eq('user_id', userBId)
            .single(),
        ]);
        expect(profileA.error).toBeNull();
        expect(profileB.error).toBeNull();
        expect(reminderA.error).toBeNull();
        expect(reminderB.error).toBeNull();

        await expectNoVisibleRows(
          clientA.from('vehicles').select('id').eq('id', vehicleBId),
        );
        await expectNoVisibleRows(
          clientB.from('vehicles').select('id').eq('id', vehicleAId),
        );
        await expectNoVisibleRows(
          clientA.from('parts').select('id').eq('id', partB.data!.id),
        );
        await expectNoVisibleRows(
          clientB.from('parts').select('id').eq('id', partA.data!.id),
        );
        await expectNoVisibleRows(
          clientA
            .from('maintenance_schedules')
            .select('id')
            .eq('id', scheduleB.data!.id),
        );
        await expectNoVisibleRows(
          clientB
            .from('maintenance_schedules')
            .select('id')
            .eq('id', scheduleA.data!.id),
        );
        await expectNoVisibleRows(
          clientA
            .from('maintenance_records')
            .select('id')
            .eq('id', recordB.data!.id),
        );
        await expectNoVisibleRows(
          clientB
            .from('maintenance_records')
            .select('id')
            .eq('id', recordA.data!.id),
        );
        await expectNoVisibleRows(
          clientA
            .from('odometer_readings')
            .select('id')
            .eq('id', odometerB.data!.id),
        );
        await expectNoVisibleRows(
          clientB
            .from('odometer_readings')
            .select('id')
            .eq('id', odometerA.data!.id),
        );
        await expectNoVisibleRows(
          clientA.from('profiles').select('id').eq('id', userBId),
        );
        await expectNoVisibleRows(
          clientB.from('profiles').select('id').eq('id', userAId),
        );
        await expectNoVisibleRows(
          clientA.from('reminder_settings').select('user_id').eq('user_id', userBId),
        );
        await expectNoVisibleRows(
          clientB.from('reminder_settings').select('user_id').eq('user_id', userAId),
        );
        await expectNoVisibleRows(
          clientB.from('notifications').select('id').eq('user_id', userAId),
        );

        const unauthorizedVehicleInsert = await clientB
          .from('vehicles')
          .insert({
            user_id: userAId,
            vehicle_type: 'TWO_WHEELER',
            brand: 'RLS Verification',
            model: `Spoof-${runId}`,
          })
          .select('id');
        unauthorizedVehicleId =
          unauthorizedVehicleInsert.data?.[0]?.id ?? null;
        expectPolicyRejection(unauthorizedVehicleInsert);

        const unauthorizedPartInsert = await clientB
          .from('parts')
          .insert({ vehicle_id: vehicleAId, part_name: `Foreign-${runId}` })
          .select('id');
        expectPolicyRejection(unauthorizedPartInsert);

        const unauthorizedScheduleInsert = await clientB
          .from('maintenance_schedules')
          .insert({
            part_id: partA.data!.id,
            schedule_name: `Foreign-${runId}`,
            schedule_type: 'DATE_INTERVAL',
            interval_months: 6,
          })
          .select('id');
        expectPolicyRejection(unauthorizedScheduleInsert);

        const unauthorizedRecordInsert = await clientB
          .from('maintenance_records')
          .insert({
            part_id: partA.data!.id,
            service_date: '2026-11-25',
            service_type: 'SERVICE',
            description: `Foreign-${runId}`,
          })
          .select('id');
        expectPolicyRejection(unauthorizedRecordInsert);

        const unauthorizedOdometerInsert = await clientB
          .from('odometer_readings')
          .insert({ vehicle_id: vehicleAId, reading_km: 303 })
          .select('id');
        expectPolicyRejection(unauthorizedOdometerInsert);

        await expectNoVisibleRows(
          clientA
            .from('vehicles')
            .update({ model: `Unauthorized-${runId}` })
            .eq('id', vehicleBId)
            .select('id'),
        );
        await expectNoVisibleRows(
          clientB
            .from('vehicles')
            .update({ model: `Unauthorized-${runId}` })
            .eq('id', vehicleAId)
            .select('id'),
        );
        await expectNoVisibleRows(
          clientA.from('vehicles').delete().eq('id', vehicleBId).select('id'),
        );
        await expectNoVisibleRows(
          clientB.from('vehicles').delete().eq('id', vehicleAId).select('id'),
        );

        const protectedResources: Array<{
          table:
            | 'parts'
            | 'maintenance_schedules'
            | 'maintenance_records'
            | 'odometer_readings';
          idA: string;
          idB: string;
        }> = [
          { table: 'parts', idA: partA.data!.id, idB: partB.data!.id },
          {
            table: 'maintenance_schedules',
            idA: scheduleA.data!.id,
            idB: scheduleB.data!.id,
          },
          {
            table: 'maintenance_records',
            idA: recordA.data!.id,
            idB: recordB.data!.id,
          },
          {
            table: 'odometer_readings',
            idA: odometerA.data!.id,
            idB: odometerB.data!.id,
          },
        ];
        for (const resource of protectedResources) {
          await expectNoVisibleRows(
            updateProtectedRecord(
              clientA,
              resource.table,
              resource.idB,
              `Unauthorized-A-${runId}`,
            ),
          );
          await expectNoVisibleRows(
            updateProtectedRecord(
              clientB,
              resource.table,
              resource.idA,
              `Unauthorized-B-${runId}`,
            ),
          );
          await expectNoVisibleRows(
            clientA
              .from(resource.table)
              .delete()
              .eq('id', resource.idB)
              .select('id'),
          );
          await expectNoVisibleRows(
            clientB
              .from(resource.table)
              .delete()
              .eq('id', resource.idA)
              .select('id'),
          );
        }

        const profileUpdate = await clientB
          .from('profiles')
          .update({ full_name: `Unauthorized-${runId}` })
          .eq('id', userAId)
          .select('id');
        if (profileUpdate.data?.length) {
          const restoreProfile = await clientB
            .from('profiles')
            .update({ full_name: profileA.data!.full_name })
            .eq('id', userAId)
            .select('id');
          expect(restoreProfile.error).toBeNull();
          expect(restoreProfile.data ?? []).toHaveLength(1);
        }
        expect(profileUpdate.error).toBeNull();
        expect(profileUpdate.data ?? []).toHaveLength(0);
        const profileInsert = await clientB
          .from('profiles')
          .insert({ id: userAId, full_name: `Unauthorized-${runId}` })
          .select('id');
        expectPolicyRejection(profileInsert);

        const changedReminderValue =
          reminderA.data!.reminder_km_before === 1 ? 2 : 1;
        const reminderUpdate = await clientB
          .from('reminder_settings')
          .update({ reminder_km_before: changedReminderValue })
          .eq('user_id', userAId)
          .select('user_id');
        if (reminderUpdate.data?.length) {
          const restoreReminder = await clientB
            .from('reminder_settings')
            .update({
              reminder_km_before: reminderA.data!.reminder_km_before,
            })
            .eq('user_id', userAId)
            .select('user_id');
          expect(restoreReminder.error).toBeNull();
          expect(restoreReminder.data ?? []).toHaveLength(1);
        }
        expect(reminderUpdate.error).toBeNull();
        expect(reminderUpdate.data ?? []).toHaveLength(0);
        const reminderInsert = await clientB
          .from('reminder_settings')
          .insert({ user_id: userAId })
          .select('user_id');
        expectPolicyRejection(reminderInsert);

        const ownNotifications = await clientA
          .from('notifications')
          .select('id, part_id, schedule_id')
          .eq('user_id', userAId);
        expect(ownNotifications.error).toBeNull();
        for (const notification of ownNotifications.data ?? []) {
          const crossOwnerReference = await clientA
            .from('notifications')
            .update({ part_id: partB.data!.id })
            .eq('id', notification.id)
            .select('id');

          if (!crossOwnerReference.error && crossOwnerReference.data?.length) {
            const restoreNotification = await clientA
              .from('notifications')
              .update({
                part_id: notification.part_id,
                schedule_id: notification.schedule_id,
              })
              .eq('id', notification.id);
            expect(restoreNotification.error).toBeNull();
            expect(restoreNotification.data).toBeNull();
          }

          if (crossOwnerReference.error) {
            expect(crossOwnerReference.error.code).toBe('42501');
          } else {
            expect(crossOwnerReference.data ?? []).toHaveLength(0);
          }
        }

        const notificationInsert = await clientA
          .from('notifications')
          .insert({
            user_id: userAId,
            notification_type: 'MAINTENANCE',
            title: `RLS ${runId}`,
            message: `RLS ${runId}`,
            dedupe_key: `rls-${runId}`,
          })
          .select('id');
        expectPolicyRejection(notificationInsert);
        const notificationDelete = await clientA
          .from('notifications')
          .delete()
          .eq('user_id', userAId)
          .select('id');
        expectPolicyRejection(notificationDelete);

        const profileDelete = await clientA
          .from('profiles')
          .delete()
          .eq('id', userAId)
          .select('id');
        expectPolicyRejection(profileDelete);
        const reminderDelete = await clientA
          .from('reminder_settings')
          .delete()
          .eq('user_id', userAId)
          .select('user_id');
        expectPolicyRejection(reminderDelete);

        const anonymousClient = createClient(
          supabaseUrl!,
          supabasePublishableKey!,
          clientOptions,
        );
        const anonymousVehicles = await anonymousClient
          .from('vehicles')
          .select('id')
          .eq('id', vehicleAId);
        expect(
          anonymousVehicles.error !== null ||
            (anonymousVehicles.data ?? []).length === 0,
        ).toBe(true);
      } finally {
        const cleanupResults: Array<{
          client: SupabaseClient;
          vehicleId: string | null;
        }> = [
          { client: clientA, vehicleId: vehicleAId },
          { client: clientB, vehicleId: vehicleBId },
        ];
        for (const cleanup of cleanupResults) {
          if (cleanup.vehicleId) {
            const result = await cleanup.client
              .from('vehicles')
              .delete()
              .eq('id', cleanup.vehicleId)
              .select('id');
            expect(result.error).toBeNull();
            expect(result.data ?? []).toHaveLength(1);
          }
        }
        if (unauthorizedVehicleId) {
          const result = await clientA
            .from('vehicles')
            .delete()
            .eq('id', unauthorizedVehicleId)
            .select('id');
          expect(result.error).toBeNull();
          expect(result.data ?? []).toHaveLength(1);
        }
        await Promise.all([
          clientA.auth.signOut(),
          clientB.auth.signOut(),
        ]);
      }
    }, 60_000);
  },
);
