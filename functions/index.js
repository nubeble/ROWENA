// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

/*
const { Storage } = require('@google-cloud/storage');
const projectId = 'rowena-88cfd';
const gcs = new Storage({
    projectId: projectId,
});
*/
const bucketName = 'rowena-88cfd.appspot.com';

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
var serviceAccount = require("./rowena-88cfd-firebase-adminsdk-nfrft-dbcfc156b6.json");
// admin.initializeApp();
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: bucketName,
    databaseURL: "https://rowena-88cfd.firebaseio.com"
});

admin.firestore().settings({ timestampsInSnapshots: true });

const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');
const spawn = require('child-process-promise').spawn;
const cors = require("cors");
const express = require("express");
const fileUploader = require("./fileUploader");
const api = express().use(cors({ origin: true }));

fileUploader("/images", api);



// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.addMessage = functions.https.onRequest((req, res) => {
    // Grab the text parameter.
    const original = req.query.text;

    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    return admin.database().ref('/messages').push({ original: original }).then((snapshot) => {
        // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
        return res.redirect(303, snapshot.ref.toString());
    });
});

// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
exports.makeUppercase = functions.database.ref('/messages/{pushId}/original').onCreate((snapshot, context) => {
    // Grab the current value of what was written to the Realtime Database.
    const original = snapshot.val();
    console.log('Uppercasing', context.params.pushId, original);

    const uppercase = original.toUpperCase();

    // You must return a Promise when performing asynchronous tasks inside a Functions such as
    // writing to the Firebase Realtime Database.
    // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
    return snapshot.ref.parent.child('uppercase').set(uppercase);
});

/*
{
    bucket: 'rowena-88cfd.appspot.com',
    contentDisposition: 'inline; filename*=utf-8\'\'498b702a885c1dd2c0fc435268dd7ffd.jpg',
    contentType: 'image/jpeg',
    crc32c: '60HmDg==',
    etag: 'CPjgz6jRzt4CEAE=',
    generation: '1542018166943864',
    id: 'rowena-88cfd.appspot.com/images/498b702a885c1dd2c0fc435268dd7ffd.jpg/1542018166943864',
    kind: 'storage#object',
    md5Hash: 'qo/gdEuwwtolW6qRNBKDbA==',
    mediaLink: 'https://www.googleapis.com/download/storage/v1/b/rowena-88cfd.appspot.com/o/images%2F498b702a885c1dd2c0fc435268dd7ffd.jpg?generation=1542018166943864&alt=media',
    metadata: { firebaseStorageDownloadTokens: '75f1ea0b-69f6-4789-be7b-b1e08cca7cd4' },
    metageneration: '1',
    name: 'images/498b702a885c1dd2c0fc435268dd7ffd.jpg',
    selfLink: 'https://www.googleapis.com/storage/v1/b/rowena-88cfd.appspot.com/o/images%2F498b702a885c1dd2c0fc435268dd7ffd.jpg',
    size: '211954',
    storageClass: 'STANDARD',
    timeCreated: '2018-11-12T10:22:46.943Z',
    timeStorageClassUpdated: '2018-11-12T10:22:46.943Z',
    updated: '2018-11-12T10:22:46.943Z'
}
*/
/*
exports.onFileCreate = functions.storage.object().onFinalize((object, context) => {
    const bucket = object.bucket;
    const contentType = object.contentType;
    const filePath = object.name; // folder included
    const fileName = filePath.split('/').pop();
    // const fileDir = path.dirname(filePath); // folder path

    if (path.basename(filePath).startsWith('resized_')) {
        // console.log('We already resized it!');

        return 'skip the resized file.';
    }

    const tmpFilePath = path.join(os.tmpdir(), fileName);
    // console.log('Temp Path:', tmpFilePath); // /tmp/9968D23359B3622120.jpeg

    // const destBucket = gcs.bucket(bucket);
    const destBucket = admin.storage().bucket(bucket);
    const metadata = { contentType: contentType };

    return destBucket.file(filePath).download({
        destination: tmpFilePath
    }).then(() => {
        // console.log('Image downloaded locally to', tmpFilePath);

        return spawn('convert', [tmpFilePath, '-resize', '1080x1080', tmpFilePath]);
    }).then(() => {
        // console.log('Resized image created at', tmpFilePath);

        // We add a 'resized_' prefix to new file name.
        const resizedFileName = `resized_${fileName}`;
        const resizedFilePath = path.join(path.dirname(filePath), resizedFileName);

        return destBucket.upload(tmpFilePath, {
            destination: resizedFilePath,
            metadata: metadata
        });
        // Once the thumbnail has been uploaded delete the local file to free up disk space.
    }).then(() => {
        return fs.unlinkSync(tmpFilePath);
    });
});
*/

/*
exports.onFileDelete = functions.storage.object().onDelete((snap, context) => {
    console.log(event);

    return;
});
*/



api.post("/images", function (req, response, next) {
    console.log('Image Upload', req.field);

    const storage = admin.storage();
    const fileDir = 'images/' + req.field.userUid + '/profile/' + req.files.file[0].originalname;

    return new Promise((resolve, reject) => {

        uploadImageToStorage(req.files.file[0], fileDir).then(metadata => {
            console.log('metadata', metadata);

            // get download URL
            storage.bucket(bucketName).file(fileDir).getSignedUrl({
                action: 'read',
                // expires: '03-09-2491'
                expires: '03-09-2200'
            }).then((signedUrl) => {
                let url = signedUrl[0];
                // console.log('getSignedUrl', url);

                // update database - write command in realtime database
                admin.database().ref('/users').push({
                    command: 'addPicture',
                    userUid: req.field.userUid,
                    pictureIndex: req.field.pictureIndex,
                    uri: url
                }).then((snapshot) => {
                    resolve();

                    // return response
                    let result = {
                        downloadUrl: url
                    };
                    response.status(200).send(result);

                    next();
                });
            });
        }).catch(error => {
            console.error('uploadImageToStorage error', error);

            reject();

            response.status(500).send(error);
            next();
        });

    });
});

// exports.api = functions.https.onRequest(api);
const runtimeOpts = {
    timeoutSeconds: 30
};

exports.api = functions.runWith(runtimeOpts).https.onRequest(api);

const uploadImageToStorage = (file, fileDir) => {
    const storage = admin.storage();
    // const destBucket = gcs.bucket('rowena-88cfd.appspot.com');

    let prom = new Promise((resolve, reject) => {
        const fileUpload = storage.bucket(bucketName).file(fileDir);
        // const fileUpload = destBucket.file(file.originalname);

        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype
            }
        });

        blobStream.on("error", error => reject(error));

        blobStream.on("finish", () => {
            fileUpload.getMetadata().then(metadata => {
                resolve(metadata);
            }).catch(error => reject(error));
        });

        blobStream.end(file.buffer);
    });

    return prom;
}

exports.updateDatabase = functions.database.ref('/users/{pushId}/command').onCreate((snapshot, context) => {
    // Grab the current value of what was written to the Realtime Database.
    const command = snapshot.val();

    return new Promise((resolve, reject) => {

        admin.database().ref('/users/' + context.params.pushId).once('value').then((dataSnapshot) => {
            var userUid = (dataSnapshot.val() && dataSnapshot.val().userUid) || 'Anonymous';
            var pictureIndex = (dataSnapshot.val() && dataSnapshot.val().pictureIndex) || 'Anonymous';
            var uri = (dataSnapshot.val() && dataSnapshot.val().uri) || 'Anonymous';

            // console.log('Updating Database', context.params.pushId, command, userUid, pictureIndex, uri);

            if (command === 'addPicture') {
                let data = makeData(pictureIndex, uri);

                admin.firestore().collection('users').doc(userUid).update(data).then(() => {
                    console.log("User info updated.");

                    // remove
                    admin.database().ref('/users/' + context.params.pushId).remove().then(() => {
                        console.log("Database removed.");
                    });

                    resolve();
                }).catch((error) => {
                    console.log('update user error', err);

                    reject(error);
                });

                // --
                /*
                let data = makeData(pictureIndex, uri);
                var query = admin.firestore().collection('users');
                query = query.where('uid', '==', userUid);
                query.get().then((querySnapshot) => {
                    if (!querySnapshot.size) {
                        console.log("No such a user!");
                    } else {
                        querySnapshot.forEach((queryDocumentSnapshot) => {
                            // console.log(queryDocumentSnapshot.id, queryDocumentSnapshot.data());
                            admin.firestore().collection('users').doc(queryDocumentSnapshot.id).update(data).then(() => {
                                console.log("User info updated.");

                                // remove
                                admin.database().ref('/users/' + context.params.pushId).remove().then(() => {
                                    console.log("Database removed.");
                                });

                                resolve();
                            });
                        });
                    }
                });
                */
                // --
            }
        }).catch(error => {
            console.error('once error', error);

            reject();
        });

    });
});
/*
const makeData = (index, url) => {
    switch (index) {
        case '0': return {
            // 'pictures.one.preview': admin.firestore.FieldValue.delete(),
            'pictures.one.uri': url
        };

        case '1': return {
            'pictures.two.uri': url
        };

        case '2': return {
            'pictures.three.uri': url
        };

        case '3': return {
            'pictures.four.uri': url
        };

        case '4': return {
            'pictures.five.uri': url
        };

        case '5': return {
            'pictures.six.uri': url
        };
    }

    return null;
}
*/
const makeData = (index, url) => {
    /*
    switch (index) {
        case '0': return {
            // 'pictures.one.preview': admin.firestore.FieldValue.delete(),
            'pictures.one.uri': url
        };

        case '1': return {
            'pictures.two.uri': url
        };

        case '2': return {
            'pictures.three.uri': url
        };

        case '3': return {
            'pictures.four.uri': url
        };

        case '4': return {
            'pictures.five.uri': url
        };

        case '5': return {
            'pictures.six.uri': url
        };
    }

    return null;
    */
    let key;
    switch (index) {
        case '0': key = 'one'; break;
        case '1': key = 'two'; break;
        case '2': key = 'three'; break;
        case '3': key = 'four'; break;
        case '4': key = 'five'; break;
        case '5': key = 'six'; break;
    }

    let data = { [`pictures.${key}.uri`]: url };

    return data;
}

exports.setToken = functions.https.onRequest((req, res) => {
    if (req.method === "POST" && req.headers["content-type"].startsWith("multipart/form-data")) {
        const busboy = new Busboy({ headers: req.headers });

        const fields = {};

        busboy.on("field", (fieldname, val) => {
            // console.log('Field [' + fieldname + ']: value: ' + val);

            fields[fieldname] = val;
        });

        busboy.on("finish", () => {

            /*
            const data = {
                token: fields.token,
                uid: fields.uid,
                name: fields.name
            };
            */

            console.log('Done parsing form.', fields);

            // Push the token info into the Realtime Database using the Firebase Admin SDK.
            /*
            return admin.database().ref('/tokens').push(data).then((snapshot) => {
                // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
                return res.redirect(303, snapshot.ref.toString());
            });
            */

            /*
            // return admin.database().ref('tokens').child(data.uid).set(data).then((snapshot) => {
            return admin.database().ref('/tokens/' + data.uid).set(data).then((snapshot) => {
                // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
                return res.redirect(303, snapshot.ref.toString());
            });
            */


            return admin.firestore().collection('tokens').doc(fields.uid).set(fields).then(() => {
                console.log('Done saving to database.');

                res.status(200).send(fields);
            });
        });

        // req.pipe(busboy); // not working!
        busboy.end(req.rawBody);


        /*
        res.writeHead(303, { Connection: 'close', Location: '/' });
        res.end();
        */

        // res.status(200).send(fields);
    } else {
        // Return a "method not allowed" error
        const error = 'only POST message acceptable.';
        res.status(405).end(error);
    }
});

exports.sendPushNotification = functions.https.onRequest((req, res) => {
    if (req.method === "POST" && req.headers["content-type"].startsWith("multipart/form-data")) {
        const busboy = new Busboy({ headers: req.headers });

        const fields = {};

        busboy.on("field", (fieldname, val) => {
            fields[fieldname] = val;
        });

        busboy.on("finish", () => {
            console.log('Done parsing form.', fields);

            const sender = fields.sender;
            const targetUid = fields.receiver; // uid
            const msg = fields.message;

            let targetToken = null;

            await(Firebase.firestore.collection("tokens").doc(targetUid).get().then(doc => {
                if (doc.exists) {
                    const token = doc.data().token;
                    if (token) targetToken = token;
                }
            }));

            if (!targetToken) {
                const error = `Push token is null.`;
                console.error(error);

                res.status(500).send(error);

                return;
            }

            if (!Expo.isExpoPushToken(targetToken)) {
                const error = `Push token ${targetToken} is not a valid Expo push token.`;
                console.error(error);

                res.status(500).send(error);

                return;
            }

            let messages = [];
            messages.push({
                to: targetToken,
                sound: 'default',
                // body: 'This is a test notification',
                body: msg,
                // data: { withSome: 'data' }, // ToDo: check the spec.!
                data: {
                    sender: sender
                }
            });

            let chunks = expo.chunkPushNotifications(messages);

            let tickets = [];

            (async(function _sendNotification() {
                for (let chunk of chunks) {
                    try {
                        let ticketChunk = await(expo.sendPushNotificationsAsync(chunk));

                        console.log(ticketChunk);

                        tickets.push(...ticketChunk);
                    } catch (error) {
                        // NOTE: If a ticket contains an error code in ticket.details.error, you
                        // must handle it appropriately. The error codes are listed in the Expo
                        // documentation:
                        // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
                        console.error(error);
                    }
                }

                // ToDo: save tickets to database

                // ToDo: make api to get receipts
            }))();



            res.status(200).send(fields);
        });

        busboy.end(req.rawBody);
    } else {
        // Return a "method not allowed" error
        const error = 'only POST message acceptable.';
        res.status(405).end(error);
    }
});


const { Expo } = require('expo-server-sdk');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

// Create a new Expo SDK client
let expo = new Expo();

const _sendNotification = (somePushTokens) => {

    // Create the messages that you want to send to clients
    let messages = [];

    for (let pushToken of somePushTokens) {
        // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

        // Check that all your push tokens appear to be valid Expo push tokens
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token.`);
            continue;
        }

        // Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications.html)
        messages.push({
            to: pushToken,
            sound: 'default',
            body: 'This is a test notification',
            data: { withSome: 'data' },
        })
    }


    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    let chunks = expo.chunkPushNotifications(messages);

    let tickets = [];

    /*
    (async () => {
        // Send the chunks to the Expo push notification service. There are
        // different strategies you could use. A simple one is to send one chunk at a
        // time, which nicely spreads the load out over time:
        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);

                console.log(ticketChunk);

                tickets.push(...ticketChunk);

                // NOTE: If a ticket contains an error code in ticket.details.error, you
                // must handle it appropriately. The error codes are listed in the Expo
                // documentation:
                // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
            } catch (error) {
                console.error(error);
            }
        }
    })();
    */
    (async(function _sendNotification() {
        // Send the chunks to the Expo push notification service. There are
        // different strategies you could use. A simple one is to send one chunk at a
        // time, which nicely spreads the load out over time:
        for (let chunk of chunks) {
            try {
                let ticketChunk = await(expo.sendPushNotificationsAsync(chunk));

                console.log(ticketChunk);

                tickets.push(...ticketChunk);

                // NOTE: If a ticket contains an error code in ticket.details.error, you
                // must handle it appropriately. The error codes are listed in the Expo
                // documentation:
                // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
            } catch (error) {
                console.error(error);
            }
        }
    }))();




    /* ... */

    // Later, after the Expo push notification service has delivered the
    // notifications to Apple or Google (usually quickly, but allow the the service
    // up to 30 minutes when under load), a "receipt" for each notification is
    // created. The receipts will be available for at least a day; stale receipts
    // are deleted.
    //
    // The ID of each receipt is sent back in the response "ticket" for each
    // notification. In summary, sending a notification produces a ticket, which
    // contains a receipt ID you later use to get the receipt.
    //
    // The receipts may contain error codes to which you must respond. In
    // particular, Apple or Google may block apps that continue to send
    // notifications to devices that have blocked notifications or have uninstalled
    // your app. Expo does not control this policy and sends back the feedback from
    // Apple and Google so you can handle it appropriately.
    let receiptIds = [];
    for (let ticket of tickets) {
        // NOTE: Not all tickets have IDs; for example, tickets for notifications
        // that could not be enqueued will have error information and no receipt ID.
        if (ticket.id) {
            receiptIds.push(ticket.id);
        }
    }

    let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    /*
    (async () => {
        // Like sending notifications, there are different strategies you could use
        // to retrieve batches of receipts from the Expo service.
        for (let chunk of receiptIdChunks) {
            try {
                let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
                console.log(receipts);

                // The receipts specify whether Apple or Google successfully received the
                // notification and information about an error, if one occurred.
                for (let receipt of receipts) {
                    if (receipt.status === 'ok') {
                        continue;
                    } else if (receipt.status === 'error') {
                        console.error(`There was an error sending a notification: ${receipt.message}`);
                        if (receipt.details && receipt.details.error) {
                            // The error codes are listed in the Expo documentation:
                            // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
                            // You must handle the errors appropriately.
                            console.error(`The error code is ${receipt.details.error}`);
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }
    })();
    */
    (async(function _getReceipts() {
        // Like sending notifications, there are different strategies you could use
        // to retrieve batches of receipts from the Expo service.
        for (let chunk of receiptIdChunks) {
            try {
                let receipts = await(expo.getPushNotificationReceiptsAsync(chunk));
                console.log(receipts);

                // The receipts specify whether Apple or Google successfully received the
                // notification and information about an error, if one occurred.
                for (let receipt of receipts) {
                    if (receipt.status === 'ok') {
                        continue;
                    } else if (receipt.status === 'error') {
                        console.error(`There was an error sending a notification: ${receipt.message}`);
                        if (receipt.details && receipt.details.error) {
                            // The error codes are listed in the Expo documentation:
                            // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
                            // You must handle the errors appropriately.
                            console.error(`The error code is ${receipt.details.error}`);
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }
    }))();

}
