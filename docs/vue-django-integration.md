# Client Authentication

## Requirements

- When calling the Django Web API server, include the Supabase access token
  from the Supabase SDK in the Authorization header to enforce RLS.
- Retrieve the Supabase session access token on the client and send it as a
  Bearer token to the Django API.
- Keep `credentials: 'include'` when the API requires cookies.

## Example (Vue / TypeScript)

### Setup Supabase client

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabasePublishableKey)
```

### Send a request to Django

```ts
// Retrieve Supabase access token
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

// Attach the access token to the Authorization header
const djangoApiBaseUrl = import.meta.VITE_DJANGO_API_BASE_URL
const res = await fetch(`${djangoApiBaseUrl}/xxx`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    Authorization: `Bearer ${token}`
  },
  }
)
const data = await res.json()
```

## Reference Links

- https://supabase.com/docs/guides/getting-started/quickstarts/vue
