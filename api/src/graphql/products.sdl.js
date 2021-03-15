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