const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const helmet = require("helmet");

const typeDefs = gql`
  type Query {
    hello: String
    date: String
  }
`;

const resolvers = {
  Query: {
    hello: () => "Hello from EKS example",
    date: () => new Date().toISOString()
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const app = express();
app.use(helmet());
server.applyMiddleware({ app });

app.listen({ port: 8090 }, () =>
  console.log(`Server started on port 8090, ${server.graphqlPath}`)
);