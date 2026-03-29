import { DocpipeWorkspace } from '@/components/docpipe/docpipe-workspace';

export default function Home(): React.JSX.Element {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-10 h-64 w-64 rounded-full bg-[rgba(200,100,59,0.12)] blur-3xl" />
        <div className="absolute bottom-10 right-[-6rem] h-72 w-72 rounded-full bg-[rgba(217,204,184,0.75)] blur-3xl" />
      </div>

      <div className="relative mx-auto min-h-screen max-w-7xl px-6 py-12 sm:px-8 lg:px-16 lg:py-16">
        <div className="mb-12 max-w-2xl">
          <p className="mb-4 text-[0.8125rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Phase 4 shell
          </p>
          <h1 className="font-display text-[3rem] font-bold leading-none tracking-[-0.05em] text-[var(--color-ink)] sm:text-[4.5rem]">
            DocPipe
          </h1>
          <p className="mt-4 text-xl leading-[1.25] text-[var(--color-muted)] sm:text-2xl">
            Drop a document to start
          </p>
          <p className="mt-4 max-w-xl text-base text-[var(--color-muted)]">
            Add a PDF, PNG, or JPG, choose a provider, paste your key for this
            session, then choose a template.
          </p>
        </div>

        <DocpipeWorkspace />
      </div>
    </main>
  );
}
