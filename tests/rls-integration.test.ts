import { createClient } from '@supabase/supabase-js';
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

describe.skipIf(!hasLiveTestConfig)(
  'Supabase RLS cross-user isolation (live)',
  () => {
    it('prevents User B and anonymous clients from reading or mutating User A records', async () => {
      const anonClient = createClient(supabaseUrl!, supabasePublishableKey!);
      const clientA = createClient(supabaseUrl!, supabasePublishableKey!);
      const clientB = createClient(supabaseUrl!, supabasePublishableKey!);

      const { data: anonVehicles } = await anonClient
        .from('vehicles')
        .select('id');
      expect(anonVehicles ?? []).toHaveLength(0);

      const authA = await clientA.auth.signInWithPassword({
        email: userAEmail!,
        password: userAPassword!,
      });
      expect(authA.error).toBeNull();
      const userAId = authA.data.user!.id;

      const authB = await clientB.auth.signInWithPassword({
        email: userBEmail!,
        password: userBPassword!,
      });
      expect(authB.error).toBeNull();

      // User A creates a vehicle
      const createdVehicle = await clientA
        .from('vehicles')
        .insert({
          user_id: userAId,
          vehicle_type: 'FOUR_WHEELER',
          brand: 'RLS Test',
          model: 'Sedan',
        })
        .select('id')
        .single();
      expect(createdVehicle.error).toBeNull();
      const vehicleId = createdVehicle.data!.id;

      try {
        // User B cannot read User A's vehicle by UUID
        const readByB = await clientB
          .from('vehicles')
          .select('id')
          .eq('id', vehicleId);
        expect(readByB.data ?? []).toHaveLength(0);

        // User B cannot insert a part into User A's vehicle
        const insertPartByB = await clientB.from('parts').insert({
          vehicle_id: vehicleId,
          part_name: 'Cross-user Part',
        });
        expect(insertPartByB.error).not.toBeNull();
      } finally {
        // Clean up test record as User A
        await clientA.from('vehicles').delete().eq('id', vehicleId);
      }
    });
  },
);
