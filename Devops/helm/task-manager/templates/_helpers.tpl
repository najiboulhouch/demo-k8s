{{- define "task-manager.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "task-manager.fullname" -}}
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

{{- define "task-manager.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "task-manager.labels" -}}
helm.sh/chart: {{ include "task-manager.chart" . }}
{{ include "task-manager.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}

{{- define "task-manager.api.podLabels" -}}
{{ include "task-manager.api.selectorLabels" . }}
helm.sh/chart: {{ include "task-manager.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}

{{- define "task-manager.web.podLabels" -}}
{{ include "task-manager.web.selectorLabels" . }}
helm.sh/chart: {{ include "task-manager.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}

{{- define "task-manager.selectorLabels" -}}
app.kubernetes.io/name: {{ include "task-manager.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "task-manager.api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "task-manager.name" . }}-api
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "task-manager.web.selectorLabels" -}}
app.kubernetes.io/name: {{ include "task-manager.name" . }}-web
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "task-manager.api.fullname" -}}
{{ include "task-manager.fullname" . }}-api
{{- end }}

{{- define "task-manager.web.fullname" -}}
{{ include "task-manager.fullname" . }}-web
{{- end }}

{{- define "task-manager.openrouterSecretName" -}}
{{- if .Values.openrouter.existingSecret }}
{{- .Values.openrouter.existingSecret }}
{{- else if and .Values.openrouter.createSecret .Values.openrouter.apiKey }}
{{- printf "%s-openrouter" (include "task-manager.fullname" .) }}
{{- end }}
{{- end }}
