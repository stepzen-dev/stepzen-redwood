# Redwood+StepZen and Shopify

![stepzen-redwood-cover](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rm3wlutvpe0hnytr1al0.png)

Create and deploy a GraphQL API for a Shopify backend connected to a React frontend and deployed on a static hosting provider. Redwood's `api` side is auto-configured with a GraphQL handler that can be deployed with a serverless function, enabling [secure API routes](https://stepzen.com/blog/how-to-secure-api-routes-for-jamstack-sites).

## Setup

Install dependencies

```bash
yarn
```

### Fire it up

```bash
yarn rw dev
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
