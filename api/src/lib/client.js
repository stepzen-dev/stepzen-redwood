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