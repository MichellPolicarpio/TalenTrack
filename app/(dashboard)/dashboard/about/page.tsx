export default function AboutPage() {
  return (
    <div className="flex flex-col p-6 md:p-8">
      <div>
        <div className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#E87722]">
              Purpose
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              This application centralizes professional resumes for Brindley Engineering
              employees in a controlled, auditable workspace with TalentTrack.
            </p>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#E87722]">
              User Flow
            </h2>
            <ul className="mt-2 space-y-1 text-sm leading-relaxed text-neutral-600">
              <li>1. Employee signs in with corporate Microsoft account.</li>
              <li>2. Resume sections are completed and updated in profile editor.</li>
              <li>3. Resume is submitted for HR review and approval.</li>
            </ul>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#E87722]">
              Core Features
            </h2>
            <ul className="mt-2 space-y-1 text-sm leading-relaxed text-neutral-600">
              <li>- Structured sections for experience, education, skills and projects.</li>
              <li>- Role-based access for Employee, HR Reviewer and Admin.</li>
              <li>- Approval queue and review lifecycle for quality control.</li>
            </ul>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#E87722]">
              Security and Access
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Authentication is managed through Microsoft sign-in and aligned with
              Brindley identity and role permissions.
            </p>
          </section>
        </div>

        <section className="mx-auto mt-4 w-full max-w-5xl rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#E87722]">
            Technology Snapshot
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Built with Next.js, TypeScript, Tailwind CSS, Microsoft authentication and Azure SQL.
            Designed for internal Brindley workflows and resume governance.
          </p>
        </section>
      </div>
    </div>
  );
}
