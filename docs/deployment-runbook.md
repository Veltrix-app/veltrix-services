# Deployment Runbook

This repo owns the public web app, docs app, and shared service workspace. Keep production deploys tied to the canonical Vercel projects and the production branch so live state does not drift away from Git.

## Canonical Projects

| Surface | Vercel project | Production URL | Root directory | Production branch |
| --- | --- | --- | --- | --- |
| Web app | `veltrix-web` | `https://veltrix-web.vercel.app` | `apps/veltrix-web` | `master` |
| Docs | `veltrix-services-veltrix-docs` | `https://veltrix-services-veltrix-docs.vercel.app` | `apps/veltrix-docs` | `master` |

## Release Contract

1. Build feature work on `codex/*` branches.
2. Before production, fast-forward or merge the verified feature branch into `master`.
3. Run the repo verification from a clean `master` checkout.
4. Push `master` and let Vercel deploy from Git.
5. Use direct `vercel --prod` deploys only for emergencies, only from a clean `master` checkout, and immediately follow up by pushing the same commit to `origin/master`.

## Safe Commands

```powershell
git fetch origin
git switch master
git pull --ff-only origin master
git status --short --branch
npm run verify
git push origin master
```

Check live deployments after release:

```powershell
npx --yes vercel@52.2.0 inspect https://veltrix-web.vercel.app
npx --yes vercel@52.2.0 inspect https://veltrix-services-veltrix-docs.vercel.app
```

## Guardrails

- Do not deploy this repo to the admin portal Vercel project.
- Do not deploy from a dirty worktree.
- Do not treat preview deployments as production proof.
- If a production deploy is created from a feature branch, align `master` with that exact commit before continuing new work.
