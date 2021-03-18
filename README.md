# Redwood+StepZen and Shopify

![stepzen-redwood-cover](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rm3wlutvpe0hnytr1al0.png)

Create and deploy a GraphQL API for a Shopify backend connected to a React frontend and deployed on a static hosting provider. Redwood's `api` side is auto-configured with a GraphQL handler that can be deployed with a serverless function, enabling [secure API routes](https://stepzen.com/blog/how-to-secure-api-routes-for-jamstack-sites).

## Setup

Enter the following command in the root directory to install dependencies:

```terminal
yarn
```

### Fire it up

```terminal
yarn rw dev
```

Your browser should open automatically to `http://localhost:8910` to see the web app. Lambda functions run on `http://localhost:8911` and are also proxied to `http://localhost:8910/.redwood/functions/*`.

## Project Structure

```
├── api
│   ├── src
│   │   ├── functions
│   │   │   └── graphql.js
│   │   ├── graphql
│   │   │   └── products.sdl.js
│   │   ├── lib
│   │   │   └── client.js
│   │   └── services
│   │       └── products
│   │           └── products.js
│   └── stepzen
│       ├── shopify
│       │   └── products.graphql
│       └── index.graphql
└── web
    ├── public
    │   ├── README.md
    │   ├── favicon.png
    │   └── robots.txt
    └── src
        ├── components
        │   └── ProductsCell
        │       ├── ProductsCell.js
        │       ├── ProductsCell.mock.js
        │       ├── ProductsCell.stories.js
        │       └── ProductsCell.test.js
        ├── layouts
        ├── pages
        │   ├── FatalErrorPage
        │   │   └── FatalErrorPage.js
        │   ├── HomePage
        │   │   └── HomePage.js
        │   └── NotFoundPage
        │       └── NotFoundPage.js
        ├── App.js
        ├── Routes.js
        ├── index.css
        └── index.html

```

## StepZen Side

### products.graphql

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

* `resultroot` tells StepZen where the root of the data is, in this case `products[]`
* `endpoint` is the URL you want to call
* `configuration` is for anything you want to pass down into headers, and/or stuff that you do not want to write in your SDL

### index.graphql

This file tells StepZen how to assemble the various type definition files into a complete GraphQL schema. It includes a comma-separated list of `.graphql` files in your project folder that you want to roll up to build out your GraphQL API endpoint.

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

`config.yaml` contains the keys and other credential information that StepZen needs to access your backend data sources. This file should be added to `.gitignore` as it likely contains secret information.

```bash
touch api/stepzen/config.yaml
```

To connect your Shopify account, enter your `api_key`, `api_password`, and `store_name`.

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

This will open a GraphQL explorer on `localhost:5000`.

### Query endpoint

`ProductsQuery` returns an array of `Product` objects with the `title`, `id`, and `handle` of each.

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

### products.sdl.js

In Redwood we will create a `schema` that matches our schema in `products.graphql`. This includes a `Product` type, and each `Product` has an `id`, `handle`, and `title`. The `products` query returns an array of `Product` objects.

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

### client.js

While Redwood's `web` side includes Apollo Client by default, its `api` side does not include any built in mechanism for making HTTP requests. There are two common solutions to this among Redwood applications. The first solution, demonstrated in the Redwood documentation, includes using [`node-fetch`](https://redwoodjs.com/cookbook/using-a-third-party-api#the-service).

We will follow the model of numerous community projects that have used `graphql-requests` to connect to services such as [Contentful](https://community.redwoodjs.com/t/what-dbs-does-redwood-support/143/14), [AppSync](https://community.redwoodjs.com/t/how-can-i-wire-up-a-graphql-api-to-redwoodjs/1112), [Hasura](https://community.redwoodjs.com/t/building-a-minimum-viable-stack-with-redwoodjs-and-faunadb/1048/11), and [FaunaDB](https://community.redwoodjs.com/t/building-a-minimum-viable-stack-with-redwoodjs-and-faunadb/1048).

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

* `endpoint` is set to the url generated by `stepzen start`
* `authorization` includes your StepZen API key appended to `apikey `

### `products` service

The `products` service sends a `query` with the `GraphQLClient` imported from `src/lib/client`. The query is asking for the list of `products` and their `title`, `id`, and `handle`. 

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

`ProductsQuery` returns the `id`, `title`, and `handle` of each `Product`. This will send the query to our `api` side, which in turn sends a query to our StepZen API.

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

Our `HomePage` displays the information fetched by `ProductsCell`.

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

Redwood provides helpful setup commands to deploy to various hosting providers. We will deploy our project with [Netlify](https://redwoodjs.com/docs/deploy#netlify-deploy). Depending on your needs you can configuration your project to be deploy on [Vercel](https://redwoodjs.com/docs/deploy#vercel-deploy), [Render](https://community.redwoodjs.com/t/using-render-com-instead-of-netlify-and-heroku/728/4), or [Heroku](https://community.redwoodjs.com/t/self-host-on-heroku/1765/4). If you're particularly adventurous and enjoy configuring Linux servers you can even host it yourself with [PM2 and Nginx](https://redwoodjs.com/cookbook/self-hosting-redwood).

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

This lets Netlify know that:
* Your `build` command is `yarn rw deploy netlify`
* The `publish` directory for your assets is `web/dist`
* Your `functions` will be in `api/dist/functions`

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/054g4nmv18e9vbqte86a.png)

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/kkobxqb731w0j7k3nw01.png)
