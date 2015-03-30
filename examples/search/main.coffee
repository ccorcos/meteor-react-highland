@Posts = new Mongo.Collection('posts')

if Meteor.isServer
  @Posts._ensureIndex('title')

  Meteor.publish 'search', (query, limit) ->
    filter = new RegExp(query, 'ig')
    Posts.find({title:filter}, {sort: {name: 1, date: -1}, limit: limit})
  
  # seed the database with fake data
  Meteor.startup ->
    if Posts.find().count() is 0
      console.log "adding fake posts"
      for j in [0...10000]
        Posts.insert({title: Fake.sentence(3)})
      

_ = highland

div = React.streamable(React.DOM.div)
input = React.streamable(React.DOM.input)
span = React.streamable(React.DOM.span)

# blog post about this!

search = _()
_.route '/', (params, queryParams) ->
    (div {},
      (search.fork().map (x) ->
        (input {value: x, placeholder:'Search', onChange: (e) -> search.write(e.target.value)})
      )
      (div {},
        (search.fork()
          .debounce(500)
          .through _.filterRepeats
          .through _.subscribe (query) ->
            if query.length >= 1
              Meteor.subscribe('search', query, 20)
          .through _.multi _.map, (query, ready) ->
            if query.length < 1
              false
            else if not ready
              (div {}, "loading...")
            else
              _.autorunStream ->
                filter = new RegExp(query, 'ig')
                posts = Posts.find({title:filter}, {sort: {name: 1, date: -1}, limit: 20}).fetch()
                (div {}, 
                  do ->
                    p = posts.map (post) ->
                      (div {key:post._id}, post.title)
                    if p.length is 0
                      return "No results for '#{query}'"
                    else
                      return p
                )
          .through _.switchOnNext
        )
      )
    )
  .each (x) ->
    React.render(x, document.body)
    search.write('')

