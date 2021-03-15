# Redwood+StepZen and Shopify

### Setup

To get the dependencies installed, just do this in the root directory:

```terminal
yarn
```

### Fire it up

```terminal
yarn rw dev
```

Your browser should open automatically to `http://localhost:8910` to see the web app. Lambda functions run on `http://localhost:8911` and are also proxied to `http://localhost:8910/.redwood/functions/*`.

## StepZen Side

`products.graphql` has a `Product` interface and a `products` query that returns an array of `Product` objects.

```graphql
# api/stepzen/shopify/products.graphql

interface Product {
  id: ID!
  handle: String
  title: String
}

type ShopifyProduct implements Product {}

type Query {
  products: [Product]
  shopifyProductList: [ShopifyProduct]
    @supplies(query: "products")
    @rest(
      resultroot: "products[]"
      endpoint: "https://$api_key:$api_password@$store_name.myshopify.com/admin/api/2020-01/products.json"
      configuration: "shopify_config"
    )
}
```

### index.graphql

```graphql
# api/stepzen/index.graphql

schema
  @sdl(
    files: [ "shopify/products.graphql" ]
  ) {
  query: Query
}
```

### config.yaml

```bash
touch api/stepzen/config.yaml
```

```yaml
configurationset:
  - configuration:
      name: shopify_config
      api_key: <API_KEY>
      api_password: <API_PASSWORD>
      store_name: ajcwebdev
```

### Deploy endpoint

```bash
cd api/stepzen && stepzen start stepzen-redwood/shopify
```

### Query

```graphql
query ProductsQuery {
  products {
    title
    id
    handle
  }
}
```

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/2st9xj5kl640xdaritns.png)

## Redwood API Side

```javascript
// api/src/graphql/products.sdl.js

export const schema = gql`
  type Product {
    id: ID
    handle: String
    title: String
  }

  type Query {
    products: [Product]
  }
`
```

```javascript
// api/src/lib/client.js

import { GraphQLClient } from 'graphql-request'

export const request = async (query = {}) => {
  const endpoint = process.env.API_ENDPOINT

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: 'apikey ' + process.env.API_KEY
    },
  })
  try {
    return await graphQLClient.request(query)
  } catch (err) {
    console.log(err)
    return err
  }
}
```

### `products` service

The `products` service sends a `query` with the `GraphQLClient` imported from `src/lib/client`.

```javascript
// api/src/services/products/products.js

import { request } from 'src/lib/client'
import { gql } from 'graphql-request'

export const products = async () => {
  const query = gql`
  {
    products {
      title
      id
      handle
    }
  }
  `

  const data = await request(query)

  return data['products']
}
```

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nw0tmstq7r5wl4xx41dy.png)

## Redwood Web Side

The `web` side contains our `ProductsCell` for fetching `products` and a `HomePage` for rendering the cell.

### `ProductsCell`

`ProductsQuery` and returns the `id`, `title`, and `handle` of each `Product`.

```javascript
// web/src/components/ProductsCell/ProductsCell.js

export const QUERY = gql`
  query ProductsQuery {
    products {
      id
      title
      handle
    }
  }
`

export const Loading = () => <div>Almost there...</div>
export const Empty = () => <div>WE NEED PRODUCTS</div>
export const Failure = ({ error }) => <div>{error.message}</div>

export const Success = ({ products }) => {
  return (
    <ul>
      {products.map(product => (
        <li>{product.title}</li>
      ))}
    </ul>
  )
}
```

### Import `ProductsCell` on `HomePage`

```javascript
// web/src/pages/HomePage/HomePage.js

import ProductsCell from 'src/components/ProductsCell'

const HomePage = () => {
  return (
    <>
      <h1>HomePage</h1>
      <ProductsCell />
    </>
  )
}

export default HomePage
```

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/gj4pvqmrlil8wwsewlqr.png)

## Deploy to Netlify

```bash
yarn rw setup deploy netlify
```

This generates the following `netlify.toml` file:

```toml
[build]
command = "yarn rw deploy netlify"
publish = "web/dist"
functions = "api/dist/functions"

[dev]
  command = "yarn rw dev"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/054g4nmv18e9vbqte86a.png)

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/kkobxqb731w0j7k3nw01.png)