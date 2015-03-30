_ = highland

Stream = React.createFactory(React.createClass({
  displayName: "Stream"
  componentWillMount: ->
    @props.stream.each (x) =>
      if _.isStream(x)
        @component = (Stream {stream:x})
      else
        @component = x
      @forceUpdate()
  componentWillUnmount: ->
    @props.stream.destroy()
  render: -> 
    @component or false
}))

React.streamable = (factory) ->
  (props, children...) ->
    args = [props]
    c = children.map (x) ->
      if _.isStream(x)
        return (Stream {stream:x})
      else
        return x
    return factory.apply(null, args.concat(c))