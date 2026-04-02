import React, { useState, useCallback } from 'react'
import { WorkflowViewer } from './workflow-viewer'
import type { Theme } from './workflow-viewer/types'

const EXAMPLES: Record<string, string> = {
  'CI/CD Pipeline': `name: ci-cd-pipeline
desc: Build, test, and deploy with environment branching

tasks:
  build:
    desc: Build and test
    steps:
      - name: compile
        func: shell
        do: go build -o app ./cmd/app
        timeout: 120s

      - name: unit_test
        func: shell
        do: go test ./... -cover
        retry:
          max_attempts: 2
          interval: 5s

      - name: lint
        func: shell
        do: golangci-lint run

  deploy:
    desc: Deploy to target environment
    steps:
      - name: run_build
        task: build

      - name: check_env
        if: '{{ eq vars.environment "production" }}'
        task: deploy_prod
        else: deploy_staging

  deploy_prod:
    desc: Production deployment
    steps:
      - name: push_image
        func: shell
        do: docker push myapp:latest

      - name: apply_k8s
        func: shell
        do: kubectl apply -f k8s/prod.yml
        timeout: 60s
        retry:
          max_attempts: 3
          interval: 10s
        catch:
          - name: rollback
            func: shell
            do: kubectl rollout undo deployment/myapp

      - name: health_check
        func: http
        args:
          url: https://api.example.com/health
          method: GET

  deploy_staging:
    desc: Staging deployment
    steps:
      - name: apply_staging
        func: shell
        do: kubectl apply -f k8s/staging.yml
`,

  'Data Pipeline': `name: data-pipeline
desc: ETL pipeline with validation

tasks:
  extract:
    desc: Extract data from sources
    steps:
      - name: fetch_api
        func: http
        args:
          url: https://api.datasource.com/export
          method: GET
        timeout: 300s

      - name: download_files
        func: shell
        do: aws s3 sync s3://data-bucket/raw ./data/raw

  transform:
    desc: Transform and validate
    steps:
      - name: run_extract
        task: extract

      - name: clean_data
        func: shell
        do: python scripts/clean.py --input ./data/raw

      - name: validate
        func: assert
        args:
          condition: '{{ gt steps.clean_data.row_count 0 }}'

  load:
    desc: Load into warehouse
    steps:
      - name: run_transform
        task: transform

      - name: upload
        func: shell
        do: python scripts/load.py --target warehouse
        retry:
          max_attempts: 3
          interval: 30s
`,
}

const lightEditor = {
  bg: '#f8f8f8',
  text: '#1e1e1e',
  headerBg: '#eee',
  headerText: '#333',
  border: '#ddd',
  selectBg: 'white',
  selectText: '#333',
  selectBorder: '#ccc',
  btnBg: '#e0e0e0',
  btnText: '#333',
}

const darkEditor = {
  bg: '#1e1e2e',
  text: '#e0e0e0',
  headerBg: '#2a2a3e',
  headerText: '#ccc',
  border: '#444',
  selectBg: '#333',
  selectText: '#eee',
  selectBorder: '#555',
  btnBg: '#444',
  btnText: '#ccc',
}

export default function VisualizePage() {
  const [yaml, setYaml] = useState(Object.values(EXAMPLES)[0])
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedExample, setSelectedExample] = useState(Object.keys(EXAMPLES)[0])
  const [theme, setTheme] = useState<Theme>('light')

  const handleExampleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value
    setSelectedExample(name)
    setYaml(EXAMPLES[name])
  }, [])

  // Listen for theme changes from the WorkflowViewer
  const handleThemeChange = useCallback(() => {
    // Check the data-theme attribute on the viewer container
    setTimeout(() => {
      const viewerEl = document.querySelector('[data-theme]')
      if (viewerEl) {
        const t = viewerEl.getAttribute('data-theme') as Theme
        if (t) setTheme(t)
      }
    }, 50)
  }, [])

  const ed = theme === 'dark' ? darkEditor : lightEditor

  return (
    <div
      style={{ display: 'flex', width: '100%', height: '100%' }}
      onClick={handleThemeChange}
    >
      {/* Editor panel */}
      {editorOpen && (
        <div style={{
          width: 380,
          flexShrink: 0,
          borderRight: `1px solid ${ed.border}`,
          display: 'flex',
          flexDirection: 'column',
          background: ed.bg,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: ed.headerBg,
            borderBottom: `1px solid ${ed.border}`,
          }}>
            <select
              value={selectedExample}
              onChange={handleExampleChange}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 4,
                border: `1px solid ${ed.selectBorder}`,
                background: ed.selectBg,
                color: ed.selectText,
                fontSize: 13,
              }}
            >
              {Object.keys(EXAMPLES).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <button
              onClick={() => setEditorOpen(false)}
              style={{
                background: ed.btnBg,
                border: 'none',
                borderRadius: 4,
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 12,
                color: ed.btnText,
              }}
            >
              Hide
            </button>
          </div>
          <textarea
            value={yaml}
            onChange={e => setYaml(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              padding: 16,
              fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              fontSize: 13,
              lineHeight: 1.6,
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: ed.bg,
              color: ed.text,
              tabSize: 2,
            }}
          />
        </div>
      )}

      {/* Editor toggle tab (when closed) */}
      {!editorOpen && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '8px 6px',
          background: ed.headerBg,
          borderRight: `1px solid ${ed.border}`,
        }}>
          <button
            onClick={() => setEditorOpen(true)}
            title="Open YAML Editor"
            style={{
              background: ed.btnBg,
              border: 'none',
              borderRadius: 4,
              padding: '8px 6px',
              cursor: 'pointer',
              fontSize: 11,
              color: ed.btnText,
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              letterSpacing: 1,
              fontWeight: 600,
            }}
          >
            YAML
          </button>
          <select
            value={selectedExample}
            onChange={handleExampleChange}
            title="Select example"
            style={{
              padding: '4px 2px',
              borderRadius: 4,
              border: `1px solid ${ed.selectBorder}`,
              background: ed.selectBg,
              color: ed.selectText,
              fontSize: 10,
              width: 32,
              cursor: 'pointer',
            }}
          >
            {Object.keys(EXAMPLES).map((name, i) => (
              <option key={name} value={name}>{i + 1}</option>
            ))}
          </select>
        </div>
      )}

      {/* Viewer */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <WorkflowViewer yaml={yaml} />
      </div>
    </div>
  )
}
