import { request } from 'src/lib/client'
import { gql } from 'graphql-request'

export const products = async () => {
  const GET_PRODUCTS_QUERY = gql`
    query getProducts {
      products {
        title
        id
        handle
      }
    }
  `

  const data = await request(GET_PRODUCTS_QUERY)

  return data['products']
}