import { githubAppManifest, PUBLIC_HOST, REPO_HOME } from '@/lib/app-manifest'
import { buttonVariants } from '@/components/ui/button'

const MANIFEST = JSON.stringify(githubAppManifest())

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
        GitHub creates the App from the manifest. Install it on a repo. Land on{' '}
        <code className="font-clock text-lamp">/{'{owner}'}/{'{repo}'}</code>{' '}
        already in kiosk. No PAT, no .env, no npm.
      </p>
      <form
        className="mt-8"
        action="https://github.com/settings/apps/new"
        method="post"
      >
        <input type="hidden" name="manifest" value={MANIFEST} />
        <button className={buttonVariants()} type="submit">
          Create the GitHub App
        </button>
      </form>
      <p className="mt-6 text-sm text-paper/55">
        After install, open{' '}
        <code className="font-clock text-lamp">
          {PUBLIC_HOST}/owner/repo
        </code>
        . Source:{' '}
        <a className="text-lamp underline" href={REPO_HOME}>
          Ebbe-Method/kitchen-board
        </a>
        .
      </p>
      <p className="mt-8 text-sm text-paper/45">
        Until Marketplace lists the App, the public demo is the product.
      </p>
    </div>
  )
}
