_ = highland

_.autorunStream = (f) ->
  stream = _()

  c = Tracker.autorun ->
    results = f()
    stream.write(results)

  stream.through _.onDone ->
    c.stop()

subscribe = _.curry (f, source) ->
  sub = null
  source.through _.join (args...) ->
      # start the next sub before unsubscribing
      # so we dont waste subscriptions
      nextSub = f.apply(null, args)
      sub?.stop?()
      sub = nextSub
      _.autorunStream -> sub?.ready?()
    .through _.onDone ->
      sub?.stop()

_.subscribe = subscribe

# create a route stream for each a route
_.route = (string, callback) ->
  s = _()
  FlowRouter.route(string, {action: (args...) ->
    s.write(callback.apply(FlowRouter, args))
  })
  return s