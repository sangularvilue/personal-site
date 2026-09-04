import Link from "next/link";

export const dynamic = "force-dynamic";

function dateKey(offset = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export default function ThenThereAdmin() {
  const today = dateKey();
  return (
    <main className="min-h-screen px-[clamp(1.5rem,5vw,4rem)] py-12 max-w-[720px] mx-auto animate-rise">
      <header className="flex items-center justify-between mb-12 pb-6 border-b border-glass-border">
        <div>
          <p className="font-mono text-teal text-sm">then/there</p>
          <h1 className="font-serif text-sand text-3xl mt-2">
            Rehearse a scheduled deck
          </h1>
        </div>
        <Link
          href="/admin"
          className="text-xs text-text-soft hover:text-text transition-colors font-mono"
        >
          admin home &rarr;
        </Link>
      </header>

      <section className="max-w-[520px]">
        <p className="text-text-soft leading-7 mb-8">
          Open the exact six-event game generated for any date. Rehearsals do
          not reach the public leaderboard or your field notes.
        </p>
        <form
          action="/admin/thenthere/play"
          method="get"
          className="flex flex-col gap-3 p-5 border border-glass-border rounded-2xl bg-white/[0.02]"
        >
          <label htmlFor="then-there-date" className="text-sm text-text">
            Game date
          </label>
          <div className="flex flex-wrap gap-3">
            <input
              id="then-there-date"
              type="date"
              name="date"
              defaultValue={today}
              className="min-w-[190px] flex-1 px-3 py-2.5 glass-input rounded-lg text-text font-mono text-sm focus:outline-none focus:border-teal/30"
            />
            <button className="px-5 py-2.5 bg-teal/15 border border-teal/25 rounded-lg text-teal text-sm font-mono hover:bg-teal/25 transition-colors">
              Open deck
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs font-mono">
          <Link
            href={`/admin/thenthere/play?date=${dateKey(-1)}`}
            className="text-text-soft hover:text-sand transition-colors"
          >
            yesterday
          </Link>
          <Link
            href={`/admin/thenthere/play?date=${today}`}
            className="text-text-soft hover:text-sand transition-colors"
          >
            today
          </Link>
          <Link
            href={`/admin/thenthere/play?date=${dateKey(1)}`}
            className="text-text-soft hover:text-sand transition-colors"
          >
            tomorrow
          </Link>
        </div>
      </section>
    </main>
  );
}
