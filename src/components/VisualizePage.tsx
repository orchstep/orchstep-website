import React, { useState } from 'react'
import { WorkflowViewer } from './workflow-viewer'

const EXAMPLES: Record<string, string> = {
  'CI/CD Pipeline': `name: ci-cd-pipeline
desc: Build, test, and deploy

tasks:
  build:
    steps:
      - name: compile
        func: shell
        do: go build -o app ./cmd/app
      - name: test
        func: shell
        do: go test ./...
        retry:
          max_attempts: 2
          interval: 5s

  deploy:
    steps:
      - name: run_build
        task: build
      - name: check_env
        if: '{{ eq vars.environment "production" }}'
        task: deploy_prod
        else: deploy_staging

  deploy_prod:
    steps:
      - name: push
        func: shell
        do: docker push myapp:latest
      - name: apply
        func: shell
        do: kubectl apply -f prod.yml
        catch:
          - name: rollback
            func: shell
            do: kubectl rollout undo

  deploy_staging:
    steps:
      - name: apply
        func: shell
        do: kubectl apply -f staging.yml
`,
  'Data Pipeline': `name: data-pipeline
desc: ETL with validation

tasks:
  extract:
    steps:
      - name: fetch
        func: http
        args:
          url: https://api.example.com/data
          method: GET
      - name: download
        func: shell
        do: aws s3 sync s3://bucket ./data

  transform:
    steps:
      - name: run_extract
        task: extract
      - name: clean
        func: shell
        do: python clean.py
      - name: validate
        func: assert
        args:
          condition: '{{ gt steps.clean.rows 0 }}'

  load:
    steps:
      - name: run_transform
        task: transform
      - name: upload
        func: shell
        do: python load.py
`,
  'Basic Example': `name: hello-world
desc: Simple two-step workflow

tasks:
  greet:
    steps:
      - name: say_hello
        func: shell
        do: echo "Hello, World!"
      - name: say_goodbye
        func: shell
        do: echo "Goodbye!"
`,
}

export default function VisualizePage() {
  const [yaml, setYaml] = useState(Object.values(EXAMPLES)[0])
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedExample, setSelectedExample] = useState(Object.keys(EXAMPLES)[0])

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', fontFamily: 'sans-serif' }}>
      {/* Collapsible editor */}
      {editorOpen ? (
        <div style={{ width: '35%', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', minWidth: 300 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
            <select
              value={selectedExample}
              onChange={e => {
                setSelectedExample(e.target.value)
                setYaml(EXAMPLES[e.target.value])
              }}
              style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }}
            >
              {Object.keys(EXAMPLES).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <button
              onClick={() => setEditorOpen(false)}
              style={{ background: 'none', border: '1px solid #ddd', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}
            >
              Hide Editor
            </button>
          </div>
          <textarea
            value={yaml}
            onChange={e => setYaml(e.target.value)}
            spellCheck={false}
            style={{ flex: 1, padding: 12, fontFamily: 'monospace', fontSize: 13, border: 'none', outline: 'none', resize: 'none', background: '#fafafa' }}
          />
        </div>
      ) : (
        <button
          onClick={() => setEditorOpen(true)}
          style={{
            position: 'absolute', left: 8, top: 72, zIndex: 5,
            background: 'white', border: '1px solid #ddd', borderRadius: 4,
            padding: '6px 12px', cursor: 'pointer', fontSize: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          Edit YAML
        </button>
      )}

      {/* Viewer */}
      <div style={{ flex: 1 }}>
        <WorkflowViewer yaml={yaml} />
      </div>
    </div>
  )
}
