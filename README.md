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

```graphql
interface Product {
  id: ID!
  handle: String
  title: String
}

type ShopifyProduct implements Product {}

type Query {
  product(id: ID!): Product
  products: [Product]
  shopifyProduct(id: ID!): ShopifyProduct
    @supplies(query: "product")
    @rest(
      resultroot: "product"
      endpoint: "https://$api_key:$api_password@$store_name.myshopify.com/admin/api/2020-01/products/$id.json"
      configuration: "shopify_config"
    )
  shopifyProductList: [ShopifyProduct]
    @supplies(query: "products")
    @rest(
      resultroot: "products[]"
      endpoint: "https://$api_key:$api_password@$store_name.myshopify.com/admin/api/2020-01/products.json"
      configuration: "shopify_config"
    )
}
```

### config.yaml

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
stepzen start redwood-shopify/shopify
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

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nq9dzwemb71d52g54k02.png)

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
    product(id: ID): Product
    products: [Product]
  }
`
```

```javascript
// api/src/lib/db.js

import { GraphQLClient } from 'graphql-request'

export const request = async (query = {}) => {
  const endpoint = 'https://pleasanton.stepzen.net/redwood-shopify/shopify/__graphql'

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: 'apikey ' + process.env.API_KEY
    },
  })
  try {
    return await graphQLClient.request(query)
  } catch (error) {
    console.log(error)
    return error
  }
}
```

```javascript
// api/src/services/product.js

import { request } from 'src/lib/db'
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

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/km0sptt2ikudsd7q99z8.png)

## Deploy to Netlify

```bash
yarn rw setup deploy netlify
```

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

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/r5d5w2z27imslznuimab.png)
