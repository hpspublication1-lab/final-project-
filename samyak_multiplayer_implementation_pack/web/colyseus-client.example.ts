/** Browser-side usage example. Adapt to Samyak's existing Supabase Auth provider. */
import { Client, type Room } from "colyseus.js";

interface TicketResponse {
  ticket: string;
  wsEndpoint: string;
  expiresInSeconds: number;
}

export async function joinAuthorizedQuizBattle(args: {
  matchId: string;
  supabaseAccessToken: string;
}): Promise<Room> {
  const ticketResponse = await fetch("/api/arena/auth/ticket", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.supabaseAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ matchId: args.matchId }),
    credentials: "same-origin",
  });

  if (!ticketResponse.ok) {
    throw new Error(`Ticket request failed: ${ticketResponse.status}`);
  }

  const issued = (await ticketResponse.json()) as TicketResponse;
  const client = new Client(issued.wsEndpoint);
  // Colyseus sends this token through its supported auth mechanism.
  // Do not append bearer tokens to URL query parameters.
  client.auth.token = issued.ticket;

  // The matchId is not trusted for authorization: the ticket issuer and room
  // both validate it against the real match record and participant roster.
  // filterBy(["matchId"]) ensures the second participant joins the same match room.
  return client.joinOrCreate("quiz_battle", { matchId: args.matchId });
}
