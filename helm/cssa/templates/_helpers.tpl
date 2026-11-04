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
Create the name of the secret to use
*/}}
{{- define "tech-club.secretName" -}}
{{- if .Values.secrets.create }}
{{- include "tech-club.fullname" . }}-secrets
{{- else }}
{{- include "tech-club.fullname" . }}-secrets
{{- end }}
{{- end }}

{{/*
Hostname of the PostgreSQL primary Service created by the bundled subchart.

The subchart names that Service after its own fullname ("<release>-postgresql"
by default), which is NOT this chart's fullname. The two only coincide when
fullnameOverride equals the release name, as in the deployed "cssa" release; a
plain `helm install <release> helm/cssa` gets a "<release>-postgresql" Service
while this chart's fullname is "<release>-tech-club", so anything that assumed
the latter waited forever on a name DNS can't resolve.

Mirrors common.names.fullname from the subchart, plus the primary suffix it
appends in "replication" mode.
*/}}
{{- define "tech-club.postgresqlHost" -}}
{{- $pg := .Values.postgresql | default dict -}}
{{- $base := "" -}}
{{- if $pg.fullnameOverride -}}
{{- $base = $pg.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default "postgresql" $pg.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- $base = .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $base = printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- if eq ($pg.architecture | default "standalone") "replication" -}}
{{- printf "%s-%s" $base (dig "primary" "name" "primary" $pg) | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $base -}}
{{- end -}}
{{- end }}
