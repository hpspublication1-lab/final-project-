/**
 * Does this table have a `program_type` column in the database we're talking to?
 *
 * The repo's migrations add it to subjects, chapters, batches, questions,
 * video_lectures, exams and notes, but the live database answered as if at least
 * subjects and batches don't have it: a select naming it failed, so the course
 * dashboard came back empty. Every read and write of the column goes through here,
 * so the site works on either schema. Without the column, rows are placed by
 * the course words in their own titles, and writes simply leave it out.
 *
 * Works with any Supabase client (browser, server, admin). Cached per table for
 * the life of the process or page; an unexpected error is not cached.
 */
type FromClient = { from: (table: string) => any };

const known = new Map<string, boolean>();
const inflight = new Map<string, Promise<boolean>>();

function isMissingColumn(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === '42703' || error.code === 'PGRST204' || /program_type/i.test(error.message ?? '');
}

export async function hasProgramTypeColumn(client: FromClient, table: string): Promise<boolean> {
  const cached = known.get(table);
  if (cached !== undefined) return cached;
  const running = inflight.get(table);
  if (running) return running;
  const probe = (async () => {
    try {
      const { error } = await client.from(table).select('program_type').limit(1);
      if (!error) {
        known.set(table, true);
        return true;
      }
      if (isMissingColumn(error)) {
        known.set(table, false);
        console.warn(`[course-isolation] ${table}.program_type does not exist in this database; placing ${table} rows by title.`);
        return false;
      }
      // Something else went wrong (network, permissions): don't name the column this time.
      console.warn(`[course-isolation] could not check ${table}.program_type: ${error.message ?? error.code ?? 'unknown error'}`);
      return false;
    } catch (err) {
      console.warn(`[course-isolation] could not check ${table}.program_type:`, err);
      return false;
    } finally {
      inflight.delete(table);
    }
  })();
  inflight.set(table, probe);
  return probe;
}

/** `columns`, plus `program_type` when the table has it. */
export async function withProgramType(client: FromClient, table: string, columns: string): Promise<string> {
  return (await hasProgramTypeColumn(client, table)) ? `${columns}, program_type` : columns;
}

/** `{ program_type: value }` for an insert or update, or `{}` when there's no value or no column. */
export async function programTypeField(
  client: FromClient,
  table: string,
  value: string | null | undefined,
): Promise<{ program_type?: string }> {
  if (!value) return {};
  return (await hasProgramTypeColumn(client, table)) ? { program_type: value } : {};
}

/** Tests only. */
export function __resetProgramTypeCache(): void {
  known.clear();
  inflight.clear();
}
