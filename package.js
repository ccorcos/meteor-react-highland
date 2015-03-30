Package.describe({
  name: "ccorcos:react-highland",
  version: "0.0.1",
  summary: "React + Highland + Meteor",
  git: "https://github.com/ccorcos/meteor-react-highland",
});


Package.onUse(function(api) {
  api.use([
    "coffeescript@1.0.5",
    "ccorcos:react@0.0.1",
    "ccorcos:highland@0.0.1",
    "meteorhacks:flow-router@1.0.2",
  ]);
  api.imply([
    "ccorcos:react",
    "ccorcos:highland",
  ]);

  api.addFiles([
    "src/react-highland.coffee",
    "src/highland-extensions.js",
    "src/meteor-highland.coffee",
  ]);
});