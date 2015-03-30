var _ = highland;

// takeUntil
// _ = highland
// a = _()
// b = _()
// a.through(_.takeUntil(b)).each(_.log)
// a.write(1)
// a.write(2)
// b.write(1)
// a.write(3)

var takeUntil = _.curry(function(stream, source) {
  var first = true,
      done = false;
  return source.consume( function(err, x, push, next) {
    if (first) {
      stream.pull(function() {
        if (!done) {
          push(null, _.nil);
          done = true;
        }
      })
      first = false;
    }
    if (err) {
      push(err)
      next()
    }
    else if (x === _.nil) {
      done = true
      push(null, x)
    }
      
    else if (!done) {
      push(null, x)
      next()
    }
  });
});

_.takeUntil = takeUntil

// Stream.prototype.takeUntil = function(stream) {
//   return takeUntil(stream, this)
// }

// switchOnNext
// _ = highland
// a = _()
// b = null
// a.map(function(x){
//   b = _()
//   b.write(x*2)
//   return b
// }).through(switchOnNext).each(_.log)

// a.write(1)
// // => 2
// a.write(2)
// // => 4
// b.write(1)
// // => 1
// b.write(6)
// // => 6
// a.write(4)
// // => 8

var coerceStream = function(x) {
  if (_.isStream(x)) {
    return x;
  } else {
    return _([x]);
  }
};

var switchOnNext = function(source) {
  return _(function(outerPush) {
    var stop = null;
    return source
      .map(coerceStream)
      .map(function(stream) {
        if (stop) {
          stop.end();
          stop = null;
        }
        stop = _();
        return stream.through(takeUntil(stop));
      })
      .errors(function(err, push) {
        if (stop) {
          stop.end();
          stop = null;
        }
        push(err);
      })
      .consume(function(err, x, push, next) {
        outerPush(err, x);
        if (x !== _.nil) {
          next();
        }
      })
      .resume();
  }).sequence();
};

_.switchOnNext = switchOnNext
// Stream.prototype.switchOnNext = function() {
//   return switchOnNext(this)
// }
  

// _ = highland
// a = _()
// a.map(function(x){
//   return x*2
// }).through(switchOnNext).each(_.log)


var onDone = _.curry(function(f, source) {
  return source.consume(function(err, x, push, next) {
    if (err) {
      push(err);
      next();
    } 
    else if (x === _.nil) {
      f();
      push(null, x);
    } 
    else {
      push(null, x);
      next();
    }
  });
});

_.onDone = onDone

// Stream.prototype.onDone = function(f) {
//   return onDone(f, this)
// }

var stopOn = function(stopStream, source) {
  return stopStream.through(onDone(function() {
    source.end();
  }));
};

_.stopOn = stopOn

// Stream.prototype.stopOn = function(stopStream) {
//   return stopOn(stopStream, this)
// }

// _ = highland
// a = _()
// b = null
// a.through(join(function(x){
//   b = _()
//   b.write(x*2)
//   return b
// })).through(multi(_.each, function(x,y){
//   console.log(x,y)
// }))

// a.write(1)
// // => 1 2
// a.write(2)
// // => 2 4
// b.write(5)
// // => 2 5
// a.write(5)
// // => 5 10


// _ = highland
// a = _()
// b = null
// c = null
// a.through(join(function(x){
//   b = _()
//   b.write(x*2)
//   return b
// })).through(join(function(x,y){
//   c = _()
//   c.write(x+y)
//   return c
// })).through(multi(_.each, function(x,y,z){
//   console.log(x,y,z)
// }))
// a.write(1)
// // 1 2 3
// a.write(2)
// // 2 4 6
// b.write(3)
// // 2 3 5
// b.write(5)
// // 2 5 7
// c.write(10)
// // 2 5 10
// a.write(4)
// // 4 8 12

var corceArray = function(x) {
  if (x instanceof Array) {
    return x;
  } else {
    return [x];
  }
};

var join = _.curry(function(f, source) {
  return source.map(function(x) {
    x = corceArray(x);
    return f.apply(null, x).map(function(y) {
      y = corceArray(y);
      return x.concat(y);
    });
  }).through(switchOnNext);
});

_.join = join

// Stream.prototype.stopOn = function(f) {
//   join(f, this)
// }

var multi = function(transform, f) {
  return function(source) {
    return source.through(transform(function(arr) {
      return f.apply(null, arr);
    }));
  };
};

_.multi = multi


// _ = highland
// a = _()
// a.through(filterRepeats).each(_.log)
// a.write(1)
// a.write(1)
// a.write(1)
// a.write(2)
// a.write(1)
// a.write(2)
// a.write(2)

var filterRepeats = function(source) {
  var last = null;
  return source.consume(function(err, x, push, next) {
    if (err) {
      push(err);
      next();
    } 
    else if (x === _.nil) {
      push(null, x);
    } 
    else {
      if (last === null || x !== last) {
        last = x;
        push(null, x);
      }
      next();
    }
  });
};

_.filterRepeats = filterRepeats

// Stream.prototype.filterRepeats = function() {
//   return filterRepeats(this)
// }