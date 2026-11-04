{{/*
Expand the name of the chart.
*/}}
{{- define "tech-club.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "tech-club.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "tech-club.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "tech-club.labels" -}}
helm.sh/chart: {{ include "tech-club.chart" . }}
{{ include "tech-club.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "tech-club.selectorLabels" -}}
app.kubernetes.io/name: {{ include "tech-club.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "tech-club.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "tech-club.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Name of the hand-made Secret holding the app's own credentials
(NEXTAUTH_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET). This chart never
renders it: Argo CD is configured to ignore Secret data, so anything rendered
here could never be corrected after the first sync.
*/}}
{{- define "tech-club.secretName" -}}
{{- default (printf "%s-secrets" (include "tech-club.fullname" .)) .Values.existingSecret }}
{{- end }}

{{/*
Container image for the app. The repository lives at image.server.name because
the cluster chart renders --set image.server.name=<repo> from its `images:`
alias, and argocd-image-updater writes that same path (plus image.server.tag).
*/}}
{{- define "tech-club.image" -}}
{{- $server := (.Values.image | default dict).server | default dict -}}
{{- $repo := required "image.server.name is required" $server.name -}}
{{- printf "%s:%s" $repo (default .Chart.AppVersion $server.tag) }}
{{- end }}

{{/*
Public URL of the site, derived from the single ingress.host the cluster chart
overrides. Used for NEXTAUTH_URL, which nothing else supplies.
*/}}
{{- define "tech-club.appUrl" -}}
{{- $ing := .Values.ingress | default dict -}}
{{- $scheme := ternary "https" "http" (($ing.tls | default dict).enabled | default false) -}}
{{- printf "%s://%s" $scheme (required "ingress.host is required" $ing.host) }}
{{- end }}

{{/*
Fullname of the bundled PostgreSQL subchart's own resources (its Secret, and
the base of its Service names).

The subchart names these after ITS fullname ("<release>-postgresql" by
default), which is not this chart's fullname: the two only coincide when
fullnameOverride equals the release name. Under the cluster chart no
fullnameOverride is passed, so this chart is "<release>-tech-club" while the
database is "<release>-postgresql" — assuming otherwise is what left the app
waiting on a hostname DNS could not resolve. Mirrors common.names.fullname
from the subchart.
*/}}
{{- define "tech-club.postgresqlFullname" -}}
{{- $pg := .Values.postgresql | default dict -}}
{{- if $pg.fullnameOverride -}}
{{- $pg.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default "postgresql" $pg.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end }}

{{/*
Hostname of the PostgreSQL primary Service, i.e. the subchart's fullname plus
the suffix it appends in "replication" mode.
*/}}
{{- define "tech-club.postgresqlHost" -}}
{{- $pg := .Values.postgresql | default dict -}}
{{- $base := include "tech-club.postgresqlFullname" . -}}
{{- if eq ($pg.architecture | default "standalone") "replication" -}}
{{- printf "%s-%s" $base (dig "primary" "name" "primary" $pg) | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $base -}}
{{- end -}}
{{- end }}

{{/*
DATABASE_URL, assembled in the pod rather than in a rendered Secret.

Argo CD ignores Secret data/stringData here (see values.yaml), so a Secret
holding a ready-made DATABASE_URL is write-once: when the hostname in it was
wrong, no chart change could ever fix it. Building the URL from env instead
means every sync produces the current value, and the password is read straight
from the Secret the subchart manages — this chart never copies it. Relies on
Kubernetes $(VAR) expansion, so POSTGRES_PASSWORD must stay declared first.
*/}}
{{- define "tech-club.dbEnv" -}}
{{- $auth := (.Values.postgresql | default dict).auth | default dict -}}
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "tech-club.postgresqlFullname" . }}
      key: {{ if eq ($auth.username | default "") "postgres" }}postgres-password{{ else }}password{{ end }}
- name: DATABASE_URL
  value: postgresql://{{ $auth.username }}:$(POSTGRES_PASSWORD)@{{ include "tech-club.postgresqlHost" . }}:5432/{{ $auth.database }}
{{- end }}
