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