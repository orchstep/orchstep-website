import React, { useState, useCallback } from 'react'
import { WorkflowViewer } from './workflow-viewer'

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

export default function VisualizePage() {
  const [yaml, setYaml] = useState(Object.values(EXAMPLES)[0])
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedExample, setSelectedExample] = useState(Object.keys(EXAMPLES)[0])

  const handleExampleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value
    setSelectedExample(name)
    setYaml(EXAMPLES[name])
  }, [])

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: 'calc(100vh - 80px)',
      minHeight: 600,
      position: 'relative',
    }}>
      {/* Editor panel */}
      {editorOpen && (
        <div style={{
          width: 380,
          flexShrink: 0,
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          background: '#1e1e2e',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: '#2a2a3e',
            borderBottom: '1px solid #444',
          }}>
            <select
              value={selectedExample}
              onChange={handleExampleChange}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 4,
                border: '1px solid #555',
                background: '#333',
                color: '#eee',
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
                background: '#444',
                border: 'none',
                borderRadius: 4,
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 12,
                color: '#ccc',
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
              background: '#1e1e2e',
              color: '#e0e0e0',
              tabSize: 2,
            }}
          />
        </div>
      )}

      {/* Edit YAML button (when editor is closed) */}
      {!editorOpen && (
        <div style={{ position: 'absolute', left: 12, top: 12, zIndex: 5, display: 'flex', gap: 8 }}>
          <button
            onClick={() => setEditorOpen(true)}
            style={{
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}
          >
            Edit YAML
          </button>
          <select
            value={selectedExample}
            onChange={handleExampleChange}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #ddd',
              background: 'white',
              fontSize: 13,
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer',
            }}
          >
            {Object.keys(EXAMPLES).map(name => (
              <option key={name} value={name}>{name}</option>
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
