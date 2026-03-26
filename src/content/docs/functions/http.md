---
title: http
description: Make HTTP/HTTPS requests with authentication, headers, and structured response parsing
---

Make HTTP/HTTPS requests with support for all standard methods, authentication, headers, query parameters, and structured response parsing.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `func` | string | yes | Must be `http` |
| `args.url` | string | yes | Target URL (supports template expressions) |
| `args.method` | string | yes | HTTP method: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS` |
| `args.headers` | map | no | Request headers as key-value pairs |
| `args.query` | map | no | Query parameters appended to URL |
| `args.body` | object/string | no | Request body. Objects auto-marshal to JSON. Strings sent as-is. Use `@vars.name` for variable reference. |
| `args.body_json` | string | no | Pre-formatted JSON string with template processing |
| `args.auth` | object | no | Authentication config (see below) |
| `args.timeout` | int | no | Request timeout in seconds |
| `timeout` | string | no | Step-level timeout (e.g., `30s`) |
| `outputs` | map | no | Named output extraction from response |

### Authentication

**Bearer token:**
```yaml
args:
  auth:
    type: bearer
    token: "{{ vars.api_token }}"
```

**Basic auth:**
```yaml
args:
  auth:
    type: basic
    username: "{{ vars.username }}"
    password: "{{ vars.password }}"
```

## Return Values

| Field | Type | Description |
|-------|------|-------------|
| `result.status_code` | int | HTTP response status code |
| `result.body` | string | Raw response body text |
| `result.data` | object | Auto-parsed JSON response (dot-notation access) |
| `result.headers` | map | Response headers |

## Examples

### Simple GET Request

```yaml
steps:
  - name: fetch_users
    func: http
    args:
      url: "https://api.example.com/users"
      method: GET
    outputs:
      status: "{{ result.status_code }}"
      users: "{{ result.data }}"
```

### POST with JSON Body

```yaml
steps:
  - name: create_user
    func: http
    args:
      url: "https://api.example.com/users"
      method: POST
      headers:
        Content-Type: "application/json"
        X-Request-ID: "{{ uuidv4 }}"
      body:
        name: "{{ vars.username }}"
        email: "{{ vars.email }}"
        role: admin
    outputs:
      user_id: "{{ result.data.id }}"
```

### With Query Parameters

```yaml
steps:
  - name: search
    func: http
    args:
      url: "{{ vars.api_base }}/search"
      method: GET
      query:
        q: "{{ vars.search_term }}"
        page: "1"
        limit: "50"
```

### Bearer Token Authentication

```yaml
steps:
  - name: api_call
    func: http
    args:
      url: "{{ vars.api_base }}/protected/resource"
      method: GET
      auth:
        type: bearer
        token: "{{ vars.api_token }}"
    outputs:
      data: "{{ result.data }}"
```

### Body via Variable Reference

Pass a complex variable structure as the request body:

```yaml
vars:
  payload:
    user:
      name: "{{ vars.username }}"
      email: "{{ vars.email }}"
    metadata:
      source: "orchstep"
      tags: ["automated", "v2"]

steps:
  - name: create
    func: http
    args:
      url: "{{ vars.api_base }}/users"
      method: POST
      body: "@vars.payload"
```

### Response Field Access

```yaml
steps:
  - name: fetch_order
    func: http
    args:
      url: "https://api.example.com/orders/123"
      method: GET
    outputs:
      order_status: "{{ result.data.status }}"
      customer_email: "{{ result.data.customer.email }}"
      first_item: "{{ result.data.items.0.name }}"
      content_type: "{{ result.headers.Content-Type }}"
```

### Health Check with Retry

```yaml
steps:
  - name: health_check
    func: http
    args:
      url: "https://{{ vars.env }}.example.com/health"
      method: GET
    retry:
      max_attempts: 5
      interval: 10s
      backoff_rate: 1.5
      when: "result.status_code >= 500 || result.status_code == 429"

  - name: verify
    func: assert
    args:
      condition: '{{ eq steps.health_check.status_code 200 }}'
      message: "Health check must return 200"
```
