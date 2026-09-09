import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'

export function InstallPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="font-clock text-[11px] tracking-[0.28em] text-lamp uppercase">
        The Pass
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold">
        One click. Then the kiosk.
      </h1>
      <p className="mt-4 text-paper/70">
        GitHub Marketplace install lands on{' '}
        <code className="font-clock text-lamp">/org/repo</code> already
        in kiosk. No PAT, no .env, no npm.
      </p>
      <ol className="mt-8 list-decimal space-y-3 pl-5 text-paper/75">
        <li>
          Create the GitHub App from{' '}
          <a className="text-lamp underline" href="/app-manifest.json">
            the manifest
          </a>
          . GitHub&apos;s form is{' '}
          <a
            className="text-lamp underline"
            href="https://github.com/settings/apps/new"
          >
            github.com/settings/apps/new
          </a>
          .
        </li>
        <li>Install that App on the repo you actually watch.</li>
        <li>
          Open <code className="font-clock text-lamp">/owner/repo</code>.
          Tickets land as webhooks arrive.
        </li>
      </ol>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          className={buttonVariants()}
          href="/app-manifest.json"
          target="_blank"
          rel="noreferrer"
        >
          App manifest
        </a>
        <Link className={buttonVariants({ variant: 'ghost' })} to="/">
          Back to the demo
        </Link>
      </div>
      <p className="mt-8 text-sm text-paper/45">
        Until Marketplace lists the App, the public demo is the product.
        Webhook: <code>POST /api/webhook</code>. Live board:{' '}
        <code>GET /api/board/:owner/:repo</code>.
      </p>
    </div>
  )
}
