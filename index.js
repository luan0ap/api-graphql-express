const express = require('express')
const cors = require('cors')
const graphqlHTTP = require('express-graphql')
const gql = require('graphql-tag')
const { buildASTSchema } = require('graphql')

const app = express()
app.use(cors())

const schema = buildASTSchema(gql`
  type Query {
    posts: [Post]
    post(id: ID): Post
    authors: [Person]
    author(id: ID): Person
  }

  type Post {
    id: ID
    author: Person
    body: String
  }

  type Person {
    id: ID
    posts: [Post]
    name: String!
    lastName: String!
  }
`)

const POSTS = new Map()
const PEOPLE = new Map()

class Post {
  constructor(data) {
    Object.assign(this, data)
  }

  get author() {
    return PEOPLE.get(this.authorID)
  }
}

class Person {
  constructor(data) { Object.assign(this, data) }

  get posts() {
    return [...POSTS.values()].filter(post => post.authorID === this.id)
  }
}

(() => {
  const fakePeople = [
    { id: '1', name: 'John', lastName: 'Doe' },
    { id: '2', name: 'Jane', lastName: 'Doe' }
  ]

  fakePeople.forEach(person => PEOPLE.set(person.id, new Person(person)))

  const fakePosts = [
    { id: '1', authorID: '1', body: 'Hello world' },
    { id: '2', authorID: '2', body: 'Hi, planet!' }
  ]

  fakePosts.forEach(post => POSTS.set(post.id, new Post(post)))
})()

const rootValue = {
  posts: () => POSTS.values(),
  post: ({ id }) => POSTS.get(id),
  authors: () => PEOPLE.values(),
  author: ({ id }) => PEOPLE.get(id)
}

app.use('/graphql', graphqlHTTP({ schema, rootValue }))

app.listen(4000)
