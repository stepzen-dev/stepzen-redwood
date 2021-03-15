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