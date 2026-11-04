# Deployment

The site runs on the k3s cluster as an Argo CD `Application`, and **that
Application is not defined in this repo**. It is rendered by the
`wu-tech-cluster` chart, which creates one Application per entry in its
`applications:` list:

```yaml
applications:
  - name: wu-tech-website        # => Helm release name
    namespace: cssa              # => destination namespace
    repo_url: https://github.com/willamette-tech/website
    branch: main
    path: helm/cssa              # => this chart
    values:
      ingress:
        host: wu-tech.club
      global:
        security:
          allowInsecureImages: true
    images:
      - alias: server            # => --set image.server.name=<image>
        image: ghcr.io/willamette-tech/website
```

So the whole deploy loop is: **push to `main` → Argo CD syncs `helm/cssa`**.
Nothing in this repo applies an Application, and there is no per-environment
manifest to keep in step.

## What the chart may rely on

Only what that entry passes: the release name, `ingress.host`,
`global.security.allowInsecureImages`, and `image.server.name`. Everything else
comes from `cssa/values.yaml`. In particular the chart derives, rather than
being told:

| Value | Derived from |
| --- | --- |
| Resource names (`wu-tech-website-tech-club-*`) | release name; no `fullnameOverride` is passed |
| `NEXTAUTH_URL` | `https://<ingress.host>` |
| Database hostname | the PostgreSQL subchart's own fullname, `<release>-postgresql` |
| Image | `image.server.name` + `image.server.tag` |

`image.server.*` is also the path `argocd-image-updater` writes, which is why
the image lives under that key instead of the usual `image.repository`.

## Secrets

The Application is synced with:

```yaml
ignoreDifferences: [{kind: Secret, jsonPointers: [/data, /stringData]}]
syncOptions: [RespectIgnoreDifferences=true]
```

**Secret contents are therefore write-once.** Argo CD strips `data` and
`stringData` from what it applies to a Secret that already exists, so a Secret
this chart renders would receive its contents on create and never be corrected
again — a wrong value in one is unfixable by any chart change. (That is exactly
what happened to the old chart-rendered `-db-url` Secret, which pinned a
hostname that no longer existed.)

This chart consequently renders **no Secrets**:

- **`DATABASE_URL` is assembled in the pod.** The password is read from the
  PostgreSQL subchart's own Secret via `secretKeyRef`, and the URL is built
  around it with Kubernetes `$(VAR)` expansion. Every sync produces the current
  value, and the password is never copied anywhere.
- **App credentials come from a Secret you create by hand**, named
  `<release>-tech-club-secrets` (override with `existingSecret`). The app
  container will not start without it:

  ```sh
  kubectl create secret generic wu-tech-website-tech-club-secrets \
    --namespace cssa \
    --from-literal=NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
    --from-literal=GITHUB_CLIENT_ID='...' \
    --from-literal=GITHUB_CLIENT_SECRET='...'
  ```

  Edit it with `kubectl edit secret` whenever those change; Argo CD will not
  touch it. `DATABASE_URL` does **not** belong here unless you set
  `postgresql.enabled=false` and point the app at an external database, in
  which case add it to this Secret.

The GitHub OAuth app's callback URL must be
`https://<ingress.host>/api/auth/callback/github`.

## Database

The bundled Bitnami PostgreSQL subchart runs in the same namespace, with a
10Gi PVC. `postgresql.auth.username`/`.database` must stay `cssa`: Bitnami only
creates the role and database on first init, so renaming them here does not
rename them in the existing volume and only breaks auth.

Schema changes are applied by the `db-migrate` init container
(`prisma db push`) on every pod start, so a new image rolls out its own schema.
A failed migration leaves the pod in `Init` rather than serving a broken app.

The subchart's image is `bitnamilegacy/postgresql` because Bitnami moved
versioned tags there; the subchart rejects a non-standard repository unless
`global.security.allowInsecureImages=true`, which the cluster chart passes.

## Caveats

- **`prune` is not enabled** on the Application. Deleting a template from this
  chart leaves the live object orphaned — remove it with `kubectl delete`.
- **CI publishes `linux/amd64` only** (`.github/workflows/build.yaml`), so
  every node that runs this must be amd64.
- `charts/` and `Chart.lock` are gitignored, so Argo CD resolves the PostgreSQL
  dependency from the Bitnami repo at sync time.

## Running the chart outside the cluster chart

```sh
helm template wu-tech-website helm/cssa -n cssa \
  --set ingress.host=wu-tech.club \
  --set global.security.allowInsecureImages=true \
  --set image.server.name=ghcr.io/willamette-tech/website
```

Keep the release name you intend to deploy under: resource names, and the
database hostname, are derived from it.
