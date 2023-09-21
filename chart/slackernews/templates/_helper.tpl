
{{/*
Expand the name of the chart.
*/}}
{{- define "slackernews.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "slackernews.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "slackernews.labels" -}}
helm.sh/chart: {{ include "slackernews.chart" . }}
app.kubernetes.io/name: {{ include "slackernews.name" . }}
{{ include "slackernews.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "slackernews.selectorLabels" -}}
app.kubernetes.io/name: {{ include "slackernews.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
