# React + Highland + Meteor

This package is an experiment using [Highland](http://highlandjs.org/) and [Metoer](https://www.meteor.com/) to reactively render with [React](https://facebook.github.io/react/). [Check out the example](/examples/search/main.coffee)!

    meteor add ccorcos:react-highland

### Motivation

The one thing I didn't like about React is that I found myself passing functions between components all of the time. When I started experimenting more with [React for Meteor](https://github.com/ccorcos/meteor-react-utils), I realized that Meteor's `ReactiveVar`s can help to aleviate this pain. But eventually, I hit some frustrations. I had a search query in a `ReactiveVar` that I wanted to debounce before creating a Meteor subscription. This could be done with another `ReactiveVar` but I recalled a more elegant solution with observable streams that I learned from [Jafar Husain's Netflix Javascript talk](https://www.youtube.com/watch?v=XRYN2xt11Ek). 

Long story short, this package is a result of trying to integrate React and Meteor using the Highland.js observable streams library. I'm pretty happy with the result. The following creates a stream of search queries from a ["controlled input"](https://facebook.github.io/react/docs/forms.html) and displays the results. 


```coffee
search = _()
_.route '/', (params, queryParams) ->
    (div {},
      (search.fork().map (x) ->
        (input {
          value: x,
          placeholder:'Search', 
          onChange: (e) -> 
            search.write(e.target.value)
        })
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
                posts = Posts.find({
                  title:filter
                }, {
                  sort: {
                    name: 1, 
                    date: -1
                  }, 
                  limit: 20
                }).fetch()
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
```

## Highland + React

This package allows you to pass highland streams of React components as children to React components. You can do this by passing a factory to the `React.streamable` function. For example, the following will counter of seconds.

```js
div = React.streamable(React.DOM.div);
span = React.streamable(React.DOM.span);
stream = _();
React.render(
  div({}, "seconds: ", stream)
, document.body);
i = 0;
stream.write(i);
setInterval(function() {
  i++;
  stream.write(span({}, i.toString()));
}, 1000)
```
## Highland Extensions

One extension that needs clarification is a concept of *parallel streams* which involve the `_.join` and `_.multi` functions. `_.join` takes a function that returns a stream, and that stream is run in parallel with the source stream. Whenever either stream changes, a new value is emitted with both values in an array. Perhaps its easier to understand from this example:

```js
a = _()
b = null
a.through(_.join(function(x) {
  b = _()
  b.write(x*2)
  return b
})).each(_.log)
a.write(1)
// => [1, 2]
a.write(2)
// => [2, 4]
b.write(3)
// => [2, 3]
a.write(3)
// => [3, 6]
```

`_.multi` is just a helper so that the parallel streams appear as arguments to a transform function as opposed to a single array argument. It takes two arguments, a transform function, and a function to run with that transform. For example:

```js
a = _()
b = null
a.through(_.join(function(x) {
  b = _()
  b.write(x*2)
  return b
})).through(_.multi(_.each, function(aValue, bValue) {
  console.log(aValue, bValue);
}))
a.write(1)
// => 1 2
a.write(2)
// => 2 4
b.write(3)
// => 2 3
a.write(3)
// => 3 6
```

## Highland + Meteor

This package has a few stream functions to integrate Meteor's reactivity with Highland's streams.

`_.autorunStream` will run a function in a reactive context and will write the returned value to a stream. For example, the following will return a stream of posts: 

```js
_.autorunStream(function() {
  return Posts.find().fetch()
});
```

`_.subscribe` will run a function that returns a subscription object. That subscription will be stopped whenever the stream ends or whenever a new value is written to the source stream. It also creates a stream of ready values and passes it on as a *parallel stream*. For example:

```js
selectedPostIdStream = _()
selectedPostIdStream.subscribe(function(postId){
  return Meteor.subscribe('post', postId)
}).through(_.multi(_.map, function(postId, ready) {
  if (ready) {
    var post = Posts.findOne(postId)
    return div({}, post.title) 
  } else {
    return div({}, 'loading...')
  }
})).map(function(x) {
  React.render(x, document.body)
})
selectedPostIdStream.write("MmjwG9ELrbBfrFGPv")
```

`_.route` uses [`FlowRouter`](https://github.com/meteorhacks/flow-router/) to create a stream for your routes providing a nice entry point for your app. For example:

```js
selectedPostIdStream = _()
_.route('/post/:postId', function(params, queryParams) {
  return params.postId
}).subscribe(function(postId){
  return Meteor.subscribe('post', postId)
}).through(_.multi(_.map, function(postId, ready) {
  if (ready) {
    var post = Posts.findOne(postId)
    return div({}, post.title) 
  } else {
    return div({}, 'loading...')
  }
})).map(function(x) {
  React.render(x, document.body)
})
```

#### Acknowledgements

Thanks to [vqvu](https://github.com/vqvu) for all the help with Highland.js.