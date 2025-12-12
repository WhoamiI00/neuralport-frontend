# Architecture

## Storage Access Rationale

Major hosting platforms such as Vercel and Netlify cap request bodies at roughly 5–8 MB.
For file upload and download flows, prefer letting clients talk directly to Supabase Storage via the SDK instead of proxying through the Web API server.

## System Diagram

```mermaid
flowchart TB
    subgraph BaaS
        S[Supabase DB]
        T[Supabase Storage]
    end

    subgraph Server-side
        D[Django Web API Server]
    end

    subgraph Client-side
        V[Vue Web App]
        U[Unity Client]
    end

    S <--> |"HTTPS<br/>Enable&nbsp;RLS(supabase.postgrest.auth(access_token))"| D
    D <--> |"HTTPS<br/>Authorization:&nbsp;Bearer&nbsp;access_token"| V
    D <--> |"HTTPS<br/>Authorization:&nbsp;Bearer&nbsp;access_token"| U
    V <--> |"Supabase SDK"| T
    U <--> |"Supabase SDK"| T
```

## Reference Links

- https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions
- https://answers.netlify.com/t/file-upload-limits-on-forms/136798
