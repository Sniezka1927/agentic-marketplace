import Link from "next/link";
import { Button } from "@/components/ui";

export default function Home() {
  return (
    <section className="flex flex-col items-start gap-6 py-16">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight">
        Find, share and install agent templates for Grok Bot
      </h1>
      <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
        List a bot from x.ai by pasting its link, browse what others shared, and install any
        template straight into Grok Bot.
      </p>
      <div className="flex gap-3">
        <Link href="/templates">
          <Button>Browse templates</Button>
        </Link>
        <Link href="/register">
          <Button variant="secondary">Create account</Button>
        </Link>
      </div>
    </section>
  );
}
