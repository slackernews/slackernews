
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

{{/*
Image pull secrets
*}}
{{- define "slackernews.imagePullSecrets" -}}
  {{- $pullSecrets := list }}

  {{/* use any global pull secrets */}}
  {{- range ((.global).imagePullSecrets) -}}
    {{- if kindIs "map" . -}}
      {{- $pullSecrets = append $pullSecrets .name -}}
    {{- else -}}
      {{- $pullSecrets = append $pullSecrets . -}}
    {{- end }}
  {{- end -}}

  {{/* use image pull secrets provided as values */}}
  {{- range .images -}}
    {{- range .pullSecrets -}}
      {{- if kindIs "map" . -}}
        {{- $pullSecrets = append $pullSecrets .name -}}
      {{- else -}}
        {{- $pullSecrets = append $pullSecrets . -}}
      {{- end -}}
    {{- end -}}
  {{- end -}}

  {{/* use secret created with injected docker config */}}
  {{ if hasKey ((.Values.global).replicated) "dockerconfigjson" }}
    {{- $pullSecrets = append $pullSecrets "slackernews-pull-secret" -}}
  {{- end -}}


  {{- if (not (empty $pullSecrets)) -}}
imagePullSecrets:
    {{- range $pullSecrets | uniq }}
  - name: {{ . }}
    {{- end }}
  {{- end }}
{{- end -}}
