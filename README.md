# Redwood+StepZen and Shopify

![stepzen-redwood-cover](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rm3wlutvpe0hnytr1al0.png)

Create and deploy a GraphQL API for a Shopify backend connected to a React frontend and deployed on a static hosting provider. Redwood's `api` side is auto-configured with a GraphQL handler that can be deployed with a serverless function, enabling [secure API routes](https://stepzen.com/blog/how-to-secure-api-routes-for-jamstack-sites).

## Outline

* [Setup](https://github.com/stepzen-samples/stepzen-redwood#setup)
  * [Fire it up](https://github.com/stepzen-samples/stepzen-redwood#fire-it-up)
* [Project Structure](https://github.com/stepzen-samples/stepzen-redwood#project-structure)
* [StepZen Side](https://github.com/stepzen-samples/stepzen-redwood#stepzen-side)
  * [`products.graphql`](https://github.com/stepzen-samples/stepzen-redwood#productsgraphql)
  * [`index.graphql`](https://github.com/stepzen-samples/stepzen-redwood#indexgraphql)
  * [`config.yaml`](https://github.com/stepzen-samples/stepzen-redwood#configyaml)
  * [Deploy endpoint](https://github.com/stepzen-samples/stepzen-redwood#deploy-endpoint)
  * [Query endpoint](https://github.com/stepzen-samples/stepzen-redwood#query-endpoint)
* [Redwood API Side](https://github.com/stepzen-samples/stepzen-redwood#redwood-api-side)
  * [`products.sdl.js`](https://github.com/stepzen-samples/stepzen-redwood#productssdljs)
  * [`client.js`](https://github.com/stepzen-samples/stepzen-redwood#clientjs)
  * [`products.js`](https://github.com/stepzen-samples/stepzen-redwood#productsjs)
* [Redwood Web Side](https://github.com/stepzen-samples/stepzen-redwood#redwood-web-side)
  * [`ProductsCell`](https://github.com/stepzen-samples/stepzen-redwood#productscell)
  * [`HomePage`](https://github.com/stepzen-samples/stepzen-redwood#homepage)
* [Finished Project Structure](https://github.com/stepzen-samples/stepzen-redwood#finished-project-structure)
* [Deploy to Netlify](https://github.com/stepzen-samples/stepzen-redwood#deploy-to-netlify)
  * [Setup command](https://github.com/stepzen-samples/stepzen-redwood#setup-command)

## Setup

Create a Redwood application.

```bash
yarn create redwood-app stepzen-redwood-shopify
```

### Fire it up

```bash
cd stepzen-redwood-shopify && yarn rw dev
```

Your browser should open automatically to `http://localhost:8910` to see the web app.

![01-create-redwood-app-yarn-rw-dev](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/hp05gffv8yp1clwn8m98.png)

Lambda functions run on `http://localhost:8911` and are also proxied to `http://localhost:8910/.redwood/functions/*`.

![02-localhost-8911](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/sosrq710r7hawawbb2aj.png)

## Project Structure

```
├── api
│   ├── src
│   │   ├── functions
│   │   │   └── graphql.js
│   │   ├── graphql
│   │   ├── lib
│   │   │   └── db.js
│   │   └── services
└── web
    ├── public
    │   ├── README.md
    │   ├── favicon.png
    │   └── robots.txt
    └── src
        ├── components
        ├── layouts
        ├── pages
        │   ├── FatalErrorPage
        │   │   └── FatalErrorPage.js
        │   └── NotFoundPage
        │       └── NotFoundPage.js
        ├── App.js
        ├── Routes.js
        ├── index.css
        └── index.html
```

## StepZen Side

To setup our StepZen API create a `stepzen` directory containing a `schema` directory.

```bash
mkdir api/stepzen api/stepzen/schema
```

Create an `index.graphql` file for our `schema` and a `products.graphql` file for our `Product` interface and `Query` type.

```bash
touch api/stepzen/schema/products.graphql api/stepzen/schema/index.graphql
```

### `products.graphql`

`products.graphql` has a `Product` interface and a `products` query that returns an array of `Product` objects.

```graphql
# api/stepzen/shopify/products.graphql

interface Product {
  id: ID!
  handle: String
  title: String
}

type ShopifyProduct implements Product {}

type Query { ... }
```

The `@rest` directive accepts the `endpoint` from Shopify and the `@supplies` directive provides the query.

```graphql
# api/stepzen/shopify/products.graphql

interface Product { ... }

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

### `index.graphql`

Our `schema` in `index.graphql` ties together all of our other schemas. For this example we just have the `products.graphql` file included in our `@sdl` directive.

```graphql
# api/stepzen/index.graphql

schema
  @sdl(
    files: [ "shopify/products.graphql" ]
  ) {
  query: Query
}
```

This file tells StepZen how to assemble the various type definition files into a complete GraphQL schema. It includes a comma-separated list of `.graphql` files in your project folder.

### `config.yaml`

`config.yaml` contains the keys and other credential information that StepZen needs to access your backend data sources.

```bash
touch api/stepzen/config.yaml
```

This file should be added to `.gitignore` as it likely contains secret information.

```
.idea
.DS_Store
.env
.netlify
.redwood
dev.db
dist
dist-babel
node_modules
yarn-error.log
web/public/mockServiceWorker.js
config.yaml
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

`ProductsQuery` returns an array of `Product` objects with the `title`, `id`, and `handle` for each.

```graphql
query ProductsQuery {
  products {
    title
    id
    handle
  }
}
```

![03-stepzen-graphiql-editor](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/2st9xj5kl640xdaritns.png)

## Redwood API Side

`api/src` contains all other backend code including four directories:

* `functions`
* `graphql`
* `lib`
* `services`

The `functions` directory contains a `graphql.js` file auto-generated by Redwood that is required to use the GraphQL API. Since we will not use the Prisma client or a database, we can replace the default template with the following code.

```javascript
// api/src/functions/graphql.js

import {
  createGraphQLHandler,
  makeMergedSchema,
  makeServices,
} from '@redwoodjs/api'

import schemas from 'src/graphql/**/*.{js,ts}'
import services from 'src/services/**/*.{js,ts}'

export const handler = createGraphQLHandler({
  schema: makeMergedSchema({
    schemas,
    services: makeServices({ services }),
  }),
})
```

### `products.sdl.js`

The `graphql` directory contains `products.sdl.js` with your GraphQL schema written in a Schema Definition Language. This ensures that our Redwood API will have a `schema` that matches our `schema` in `products.graphql`.

```bash
touch api/src/graphql/products.sdl.js
```

The schema includes a `Product` type, and each `Product` has an `id`, `handle`, and `title`. The `products` query returns an array of `Product` objects.

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

### `client.js`

The `lib` directory contains two files by default
* `db.js` for importing the [Prisma client](https://www.prisma.io/docs/concepts/components/prisma-client)
* `logger.js` for using the [Redwood logger](https://redwoodjs.com/docs/logger)

While Redwood's `web` side includes Apollo Client by default, its `api` side does not include any built in mechanism for making HTTP requests. There are two common solutions to this among Redwood applications.

* The first solution, demonstrated in the Redwood documentation, includes using [`node-fetch`](https://redwoodjs.com/cookbook/using-a-third-party-api#the-service).
* We will follow the model of numerous community projects that have used `graphql-requests` to connect to services such as [Contentful](https://community.redwoodjs.com/t/what-dbs-does-redwood-support/143/14), [AppSync](https://community.redwoodjs.com/t/how-can-i-wire-up-a-graphql-api-to-redwoodjs/1112), [Hasura](https://community.redwoodjs.com/t/building-a-minimum-viable-stack-with-redwoodjs-and-faunadb/1048/11), and [FaunaDB](https://community.redwoodjs.com/t/building-a-minimum-viable-stack-with-redwoodjs-and-faunadb/1048).

First install `graphql-requests` as a dependency in the `api` side.

```bash
yarn workspace api add graphql-request
```

Since we will not be using the Prisma Client we can rename `db.js` to `client.js` and include the following code.

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

### `products.js`

In the `services` directory we will create a `products` directory with a `products.js` service.

```bash
mkdir api/src/services/products && touch api/src/services/products/products.js
```

We will include code for querying or mutating data with GraphQL. 

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

A `query` is sent with the `GraphQLClient` imported from `src/lib/client`. The query is asking for the list of `products` and their `title`, `id`, and `handle`.

![04-redwood-api-graphiql-editor](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nw0tmstq7r5wl4xx41dy.png)

## Redwood Web Side

The `web` side contains our `ProductsCell` for fetching `products` and a `HomePage` for rendering the cell.

### `ProductsCell`

```bash
yarn rw g cell products
```

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

### `HomePage`

```bash
yarn rw g page home /
```

Import `ProductsCell` onto `HomePage` to display the information fetched by the cell's query.

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

![05-home-page-localhost](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/gj4pvqmrlil8wwsewlqr.png)

## Finished Project Structure

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

## Deploy to Netlify

Redwood provides helpful setup commands to deploy to various hosting providers. We will deploy our project with [Netlify](https://redwoodjs.com/docs/deploy#netlify-deploy).
* Depending on your needs you can configure your project to be deploy on [Vercel](https://redwoodjs.com/docs/deploy#vercel-deploy), [Render](https://community.redwoodjs.com/t/using-render-com-instead-of-netlify-and-heroku/728/4), or [Heroku](https://community.redwoodjs.com/t/self-host-on-heroku/1765/4).
* If you're particularly adventurous and enjoy configuring Linux servers you can even host it yourself with [PM2 and Nginx](https://redwoodjs.com/cookbook/self-hosting-redwood).
* If you're a little less adventurous but still want some servers in your life you can run a Docker container with [Dokku](https://community.redwoodjs.com/t/selfhosting-redwood-using-dokku/1998).

### Setup command

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

![06-home-page-hosted-on-netlify](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/054g4nmv18e9vbqte86a.png)

Open your browser's developer tools and look at the console.

![07-console-log-response-data](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/kkobxqb731w0j7k3nw01.png)


# Cheat Sheet

## Setup

```bash
yarn create redwood-app stepzen-redwood-shopify
```

### Fire it up

```bash
cd stepzen-redwood-shopify && yarn rw dev
```

![01-create-redwood-app-yarn-rw-dev](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/hp05gffv8yp1clwn8m98.png)

![02-localhost-8911](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/sosrq710r7hawawbb2aj.png)

## StepZen Side

```bash
mkdir api/stepzen api/stepzen/schema
```

```bash
touch api/stepzen/schema/products.graphql api/stepzen/schema/index.graphql
```

### `products.graphql`

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

### `index.graphql`

```graphql
# api/stepzen/index.graphql

schema
  @sdl(
    files: [ "shopify/products.graphql" ]
  ) {
  query: Query
}
```

### `config.yaml`

```bash
touch api/stepzen/config.yaml
```

```
.idea
.DS_Store
.env
.netlify
.redwood
dev.db
dist
dist-babel
node_modules
yarn-error.log
web/public/mockServiceWorker.js
config.yaml
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

### Query endpoint

```graphql
query ProductsQuery {
  products {
    title
    id
    handle
  }
}
```

![03-stepzen-graphiql-editor](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/2st9xj5kl640xdaritns.png)

## Redwood API Side

```javascript
// api/src/functions/graphql.js

import {
  createGraphQLHandler,
  makeMergedSchema,
  makeServices,
} from '@redwoodjs/api'

import schemas from 'src/graphql/**/*.{js,ts}'
import services from 'src/services/**/*.{js,ts}'

export const handler = createGraphQLHandler({
  schema: makeMergedSchema({
    schemas,
    services: makeServices({ services }),
  }),
})
```

### `products.sdl.js`

```bash
touch api/src/graphql/products.sdl.js
```

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

### `client.js`

```bash
yarn workspace api add graphql-request
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

### `products.js`

```bash
mkdir api/src/services/products && touch api/src/services/products/products.js
```

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

![04-redwood-api-graphiql-editor](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nw0tmstq7r5wl4xx41dy.png)

## Redwood Web Side

### `ProductsCell`

```bash
yarn rw g cell products
```

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

### `HomePage`

```bash
yarn rw g page home /
```

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

![05-home-page-localhost](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/gj4pvqmrlil8wwsewlqr.png)

## Deploy to Netlify

### Setup command

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

![06-home-page-hosted-on-netlify](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/054g4nmv18e9vbqte86a.png)

![07-console-log-response-data](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/kkobxqb731w0j7k3nw01.png)
