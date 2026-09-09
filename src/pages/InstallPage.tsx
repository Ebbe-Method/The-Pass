import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { githubAppManifest, PUBLIC_HOST, REPO_HOME } from '@/lib/app-manifest'
import { buttonVariants } from '@/components/ui/button'
import type { RepoRef } from '@/lib/install-flow'

const MANIFEST = JSON.stringify(githubAppManifest())

export function InstallPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const code = params.get('code')
  const installationId = params.get('installation_id')
  const [status, setStatus] = useState<'idle' | 'working' | 'pick' | 'error'>(
    code || installationId ? 'working' : 'idle',
  )
  const [message, setMessage] = useState('')
  const [repos, setRepos] = useState<RepoRef[]>([])
  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (code) {
        setStatus('working')
        try {
          const res = await fetch('/api/install', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          })
          const body = (await res.json()) as {
            installUrl?: string
            persisted?: boolean
            error?: string
          }
          if (!res.ok || !body.installUrl) {
            throw new Error(body.error ?? 'Could not convert the App manifest')
          }
          if (cancelled) return
          setPersisted(Boolean(body.persisted))
          window.location.replace(body.installUrl)
        } catch (error) {
          if (cancelled) return
          setStatus('error')
          setMessage(error instanceof Error ? error.message : 'Conversion failed')
        }
        return
      }
      if (installationId) {
        setStatus('working')
        try {
          const res = await fetch('/api/install', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ installation_id: installationId }),
          })
          const body = (await res.json()) as {
            repos?: RepoRef[]
            kioskPath?: string | null
            error?: string
          }
          if (!res.ok) {
            throw new Error(body.error ?? 'Could not read the installation')
          }
          if (cancelled) return
          if (body.kioskPath) {
            navigate(body.kioskPath)
            return
          }
          setRepos(body.repos ?? [])
          setStatus('pick')
        } catch (error) {
          if (cancelled) return
          setStatus('error')
          setMessage(error instanceof Error ? error.message : 'Install failed')
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [code, installationId, navigate])

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

      {status === 'working' && (
        <p className="mt-8 font-clock text-sm tracking-wide text-lamp uppercase">
          {code ? 'Saving the App. Opening install…' : 'Opening the kiosk…'}
        </p>
      )}

      {status === 'error' && (
        <p className="mt-8 text-sm text-heat">{message}</p>
      )}

      {status === 'pick' && (
        <div className="mt-8">
          <p className="text-sm text-paper/70">Pick the repo for this pass.</p>
          <ul className="mt-4 flex flex-col gap-2">
            {repos.map((repo) => (
              <li key={`${repo.owner}/${repo.name}`}>
                <a
                  className={buttonVariants({ variant: 'paper' })}
                  href={`/${repo.owner}/${repo.name}`}
                >
                  {repo.owner}/{repo.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {status === 'idle' && (
        <>
          <form
            className="mt-8"
            action="https://github.com/organizations/Ebbe-Method/settings/apps/new"
            method="post"
          >
            <input type="hidden" name="manifest" value={MANIFEST} />
            <button className={buttonVariants()} type="submit">
              Create the GitHub App
            </button>
          </form>
          <form
            className="mt-3"
            action="https://github.com/settings/apps/new"
            method="post"
          >
            <input type="hidden" name="manifest" value={MANIFEST} />
            <button
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
              type="submit"
            >
              Or create under your personal account
            </button>
          </form>
        </>
      )}

      {persisted === false && (
        <p className="mt-6 text-sm text-paper/55">
          This browser can open the pass. For a room display, set{' '}
          <code className="font-clock text-lamp">GITHUB_APP_ID</code>,{' '}
          <code className="font-clock text-lamp">GITHUB_APP_PRIVATE_KEY</code>, and{' '}
          <code className="font-clock text-lamp">GITHUB_WEBHOOK_SECRET</code> on
          the Vercel project — conversion writes them when a Vercel token is
          present.
        </p>
      )}

      <p className="mt-6 text-sm text-paper/55">
        After install, the kiosk is{' '}
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
