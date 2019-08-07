var fs = require('fs');
var Promise = require('bluebird');
var async = require('..').async;
var await = require('..').await;


var ITER = async.mod({ isIterable: true, acceptsCallback: true, returnValue: 'thunk' });


var someNums = ITER (function (yield_) {
    await (Promise.delay(500));
    yield_(111);
    await (Promise.delay(500));
    yield_(222);
    await (Promise.delay(500));
    yield_(333);
    await (Promise.delay(500));
});


var program = async (function() {
    var iterator = someNums();

    var thunk = iterator.forEach(console.log, function (err) {
        console.log('jdub', 'Finished (callback)');
    });

    thunk(function (err) {
        console.log('jdub', 'Finished (thunk)');
    });
    console.log('jdub', 'Finished (synchronous)');
});


console.log('jdub', 'running...');
program().catch(function (err) { console.log('jdub', 'ERROR: ' + err); });
