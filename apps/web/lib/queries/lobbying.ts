import { query } from '../db';
import type { LobbyingRegistration, LobbyingActivity } from '@wa-transparency/db';

interface TopLobbyist {
  lobbyist_entity_id: string | null;
  lobbyist_name: string;
  client_count: number;
  total_compensation: number | null;
  clients: string[];
}

export async function getTopLobbyists(limit = 100): Promise<TopLobbyist[]> {
  const result = await query<TopLobbyist>(
    `SELECT * FROM active_lobbyists
     ORDER BY client_count DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function getLobbyingRegistration(
  id: string
): Promise<LobbyingRegistration | null> {
  const result = await query<LobbyingRegistration>(
    `SELECT * FROM lobbying_registrations WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getLobbyingRegistrationsByEmployer(
  entityId: string,
  limit = 50
): Promise<LobbyingRegistration[]> {
  const result = await query<LobbyingRegistration>(
    `SELECT * FROM lobbying_registrations
     WHERE employer_entity_id = $1
     ORDER BY registration_date DESC
     LIMIT $2`,
    [entityId, limit]
  );
  return result.rows;
}

export async function getLobbyingRegistrationsByLobbyist(
  entityId: string,
  limit = 50
): Promise<LobbyingRegistration[]> {
  const result = await query<LobbyingRegistration>(
    `SELECT * FROM lobbying_registrations
     WHERE lobbyist_entity_id = $1
     ORDER BY registration_date DESC
     LIMIT $2`,
    [entityId, limit]
  );
  return result.rows;
}

export async function getLobbyingActivities(
  registrationId: string,
  limit = 100
): Promise<LobbyingActivity[]> {
  const result = await query<LobbyingActivity>(
    `SELECT * FROM lobbying_activities
     WHERE registration_id = $1
     ORDER BY activity_date DESC
     LIMIT $2`,
    [registrationId, limit]
  );
  return result.rows;
}

export async function getLobbyingByBill(
  billId: string,
  limit = 50
): Promise<LobbyingActivity[]> {
  const result = await query<LobbyingActivity>(
    `SELECT la.*, lr.lobbyist_name, lr.employer_name
     FROM lobbying_activities la
     JOIN lobbying_registrations lr ON la.registration_id = lr.id
     WHERE la.bill_id = $1
     ORDER BY la.activity_date DESC
     LIMIT $2`,
    [billId, limit]
  );
  return result.rows;
}
