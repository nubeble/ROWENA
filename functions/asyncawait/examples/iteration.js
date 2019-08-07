var fs = require('fs');
var Promise = require('bluebird');
var async = require('..').async;
var await = require('..').await;


var someNums = async.iterable (function (yield_) {

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

    await (iterator.forEach(console.log));
    // or the long (but equivalent) way...
    //while (true) {
    //    var item = await (iterator.next());
    //    if (item.done) break;
    //    console.log('jdub', item.value);
    //}

    return 'Finished!';
});


console.log('jdub', 'running...');
program()
    .then(function (result) {
        console.log('jdub', result);
    })
    .catch(function(err) {
        console.log('jdub', '----- rejected: -----');
        console.log('jdub', err);
    });
