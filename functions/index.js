// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// const rp = require('request-promise');

/*
const { Storage } = require('@google-cloud/storage');
const projectId = 'rowena-88cfd';
const gcs = new Storage({
    projectId: projectId,
});
*/
const BUCKET_NAME = 'rowena-88cfd.appspot.com';

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
var serviceAccount = require("./rowena-88cfd-firebase-adminsdk-nfrft-dbcfc156b6.json");
// admin.initializeApp();
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: BUCKET_NAME,
    databaseURL: "https://rowena-88cfd.firebaseio.com"
});

// admin.firestore().settings({ timestampsInSnapshots: true }); // Consider: remove

const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');
const spawn = require('child-process-promise').spawn;
const cors = require("cors");
const express = require("express");
const app = express();
app.use(cors({ origin: true }));

const fileUploader = require("./fileUploader");
fileUploader("/images", app); // ToDo: what is the "/images"??

const { Expo } = require('expo-server-sdk');
/*
const async = require('asyncawait').async;
const await = require('asyncawait').await;
*/
const async = require('./asyncawait').async;
const await = require('./asyncawait').await;

// Create a new Expo SDK client
let expo = new Expo();



// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
/*
exports.addMessage = functions.https.onRequest((req, res) => {
    // Grab the text parameter.
    const original = req.query.text;

    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    return admin.database().ref('/messages').push({ original: original }).then((snapshot) => {
        // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
        return res.redirect(303, snapshot.ref.toString());
    });
});
*/

// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
/*
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
*/



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

exports.onFileDelete = functions.storage.object().onDelete((snap, context) => {
    console.log('onFileDelete', event);

    return;
});
*/


const uploadImageToStorage = (file, fileDir) => {
    const storage = admin.storage();
    // const destBucket = gcs.bucket('rowena-88cfd.appspot.com');

    let prom = new Promise((resolve, reject) => {
        const fileUpload = storage.bucket(BUCKET_NAME).file(fileDir);
        // const fileUpload = destBucket.file(file.originalname);

        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype
            }
        });

        blobStream.on("error", error => reject(error));

        blobStream.on("finish", () => {
            fileUpload.getMetadata().then(metadata => resolve(metadata)).catch(error => reject(error));
        });

        blobStream.end(file.buffer);
    });

    return prom;
}

// app.post("/images", function (req, res, next) {
app.post("/images", function (req, res) {
    console.log('app.post', 'Image Upload', req.field);

    // const fileDir = 'images/' + req.field.userUid + '/profile/' + req.files.file[0].originalname;

    let fileDir = '';

    if (req.field.type === 'post') {
        fileDir = 'images/' + req.field.userUid + '/post/' + req.field.feedId + '/' + req.files.file[0].originalname;
    } else if (req.field.type === 'profile') {
        fileDir = 'images/' + req.field.userUid + '/profile/' + req.files.file[0].originalname;
    }

    return new Promise((resolve, reject) => {
        uploadImageToStorage(req.files.file[0], fileDir).then(metadata => {
            console.log('uploadImageToStorage', 'metadata', metadata);

            // get download URL
            const storage = admin.storage();
            storage.bucket(BUCKET_NAME).file(fileDir).getSignedUrl({
                action: 'read',
                // expires: '03-09-2491'
                expires: '03-09-2200'
            }).then((signedUrl) => {
                let url = signedUrl[0];
                // console.log('uploadImageToStorage', 'getSignedUrl', url);

                /*
                if (req.field.type === 'profile') {
                    // update database - write command in realtime database
                    admin.database().ref('/users').push({
                        command: 'addPicture',
                        userUid: req.field.userUid,
                        // pictureIndex: req.field.pictureIndex,
                        uri: url
                    }).then((snapshot) => {
                        resolve(); // then

                        // return response
                        let result = {
                            downloadUrl: url
                        };

                        res.status(200).send(result);
                    });
                } else { // 'post'
                    resolve(); // then

                    // return response
                    let result = {
                        downloadUrl: url
                    };

                    res.status(200).send(result);
                }
                */

                resolve(); // then

                // return response
                const result = {
                    downloadUrl: url
                };

                res.status(200).send(result);
            });
        }).catch(error => {
            console.error('uploadImageToStorage error', error);

            reject(); // catch

            res.status(500).send(error);
        });
    });
});

const runtimeOpts = {
    timeoutSeconds: 30
};
// exports.uploadFile = functions.https.onRequest(app);
exports.uploadFile = functions.runWith(runtimeOpts).https.onRequest(app);

/*
exports.updateDatabase = functions.database.ref('/users/{pushId}/command').onCreate((snapshot, context) => {
    // Grab the current value of what was written to the Realtime Database.
    const command = snapshot.val();

    return new Promise((resolve, reject) => {

        admin.database().ref('/users/' + context.params.pushId).once('value').then((dataSnapshot) => {
            var userUid = (dataSnapshot.val() && dataSnapshot.val().userUid);
            // var pictureIndex = (dataSnapshot.val() && dataSnapshot.val().pictureIndex);
            var uri = (dataSnapshot.val() && dataSnapshot.val().uri);

            // console.log('Updating Database', context.params.pushId, command, userUid, pictureIndex, uri);

            if (command === 'addPicture') {
                // let data = makeData(pictureIndex, uri);
                const data = {
                    picture: {
                        preview: null,
                        uri: uri
                    }
                };

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
            }
        }).catch(error => {
            console.error('once error', error);

            reject();
        });

    });
});

const makeData = (index, url) => {
    let data = { [`picture.uri`]: url };

    return data;
}
*/

/*
const saveToken = async(function () {
    const params = this;
    const fields = params.fields;
    const res = params.res;

    const result = await(admin.firestore().collection('tokens').doc(fields.uid).set(fields));

    res.status(200).send(result);
});

exports.setToken = functions.https.onRequest((req, res) => {
    if (req.method === "POST" && req.headers["content-type"].startsWith("multipart/form-data")) {
        const busboy = new Busboy({ headers: req.headers });

        let fields = {};

        busboy.on("field", (fieldname, val) => {
            fields[fieldname] = val;
        });

        let params = {};
        params.fields = fields;
        params.res = res;

        busboy.on("finish", saveToken.bind(params));

        // req.pipe(busboy); // not working!
        busboy.end(req.rawBody);

    } else {
        // Return a "method not allowed" error
        const error = 'only POST message acceptable.';

        res.status(405).end(error);
    }
});
*/

/*
const removeToken = async(function () {
    const params = this;
    const fields = params.fields;
    const res = params.res;

    const result = await(admin.firestore().collection('tokens').doc(fields.uid).delete());

    res.status(200).send(result);
});

exports.unsetToken = functions.https.onRequest((req, res) => {
    if (req.method === "POST" && req.headers["content-type"].startsWith("multipart/form-data")) {
        const busboy = new Busboy({ headers: req.headers });

        let fields = {};

        busboy.on("field", (fieldname, val) => {
            fields[fieldname] = val;
        });

        let params = {};
        params.fields = fields;
        params.res = res;

        busboy.on("finish", removeToken.bind(params));

        // req.pipe(busboy); // not working!
        busboy.end(req.rawBody);
    } else {
        // Return a "method not allowed" error
        const error = 'only POST message acceptable.';

        res.status(405).end(error);
    }
});
*/

const getToken = async(function (uid) {
    let targetToken = null;

    const doc = await(admin.firestore().collection("tokens").doc(uid).get());
    if (doc.exists) {
        const token = doc.data().token;
        if (token) {
            if (token.includes('ExponentPushToken')) { // 하위호환
                targetToken = token;
            } else {
                targetToken = 'ExponentPushToken[' + token + ']';
            }
        }
    }

    return targetToken;
});

const sendPushNotification = async(function (chunks) {
    // let result = [];
    for (let chunk of chunks) {
        try {
            let ticketChunk = await(expo.sendPushNotificationsAsync(chunk));
            console.log('sendPushNotification', ticketChunk);

            // result.push(...ticketChunk);
        } catch (error) {
            // NOTE: If a ticket contains an error code in ticket.details.error, you
            // must handle it appropriately. The error codes are listed in the Expo
            // documentation:
            // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
            console.error(error);
        }
    }

    // return result;
});

const getReceipts = async(function (receiptIdChunks) {
    for (let chunk of receiptIdChunks) {
        try {
            let receipts = await(expo.getPushNotificationReceiptsAsync(chunk));
            console.log('getReceipts', receipts);

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
});

const processSendPushNotification = async(function () {
    const params = this;
    const fields = params.fields;
    const res = params.res;

    const targetUid = fields.receiver; // uid

    const targetToken = await(getToken(targetUid));
    console.log('processSendPushNotification', 'targetToken', targetToken);

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

    // const sender = fields.sender;
    const senderName = fields.senderName;
    const msg = fields.message;

    let userData = {};

    let nameFooter = '';
    if (fields.type === '1') { // chat
        userData['message'] = fields.message;
        userData['chatRoomId'] = fields.chatRoomId;
        // userData['placeId'] = fields.placeId;
        // userData['feedId'] = fields.feedId;

        /*
        let users = [];

        let user1 = {
            name: fields.user1Name,
            picture: fields.user1Picture
        }

        let user2 = {
            name: fields.user2Name,
            picture: fields.user2Picture
        }

        users.push(user1);
        users.push(user2);

        userData['users'] = users;
        */

        nameFooter = ' sent you a message. 👄';
    } else if (fields.type === '2') { // review
        userData['message'] = fields.message;
        userData['placeId'] = fields.placeId;
        userData['feedId'] = fields.feedId;

        nameFooter = ' wrote a review of your post. ✍🏼';
    } else if (fields.type === '3') { // reply
        userData['message'] = fields.message;
        userData['placeId'] = fields.placeId;
        userData['feedId'] = fields.feedId;

        nameFooter = ' replied to your review. 🙋';
    } else if (fields.type === '4') { // comment
        userData['message'] = fields.message;

        nameFooter = ' wrote a review of you. ✍🏻';
    } else if (fields.type === '5') { // like
        userData['message'] = fields.message;
        userData['placeId'] = fields.placeId;
        userData['feedId'] = fields.feedId;

        nameFooter = ' liked your post. ❤';
    }

    let messages = [];
    messages.push({
        /**
         * An Expo push token specifying the recipient of this message.
         */
        to: targetToken,

        /**
         * A JSON object delivered to your app. It may be up to about 4KiB; the total
         * notification payload sent to Apple and Google must be at most 4KiB or else
         * you will get a "Message Too Big" error.
         */
        data: {
            sender: fields.sender,
            receiver: fields.receiver,
            type: fields.type,
            userData: userData
        },

        /**
         * The title to display in the notification. Devices often display this in
         * bold above the notification body. Only the title might be displayed on
         * devices with smaller screens like Apple Watch.
         */
        // title: 'title',
        title: senderName + nameFooter,

        /**
         * The message to display in the notification
         */
        body: msg,

        // iOS-specific fields

        /**
         * A sound to play when the recipient receives this notification. Specify
         * "default" to play the device's default notification sound, or omit this
         * field to play no sound.
         *
         * Note that on apps that target Android 8.0+ (if using `expo build`, built
         * in June 2018 or later), this setting will have no effect on Android.
         * Instead, use `channelId` and a channel with the desired setting.
         */
        // sound: 'default' | null,
        sound: 'default',

        /**
         * Number to display in the badge on the app icon. Specify zero to clear the
         * badge.
         */
        // badge?: number,

        _displayInForeground: true,

        // Android-specific fields

        /**
         * ID of the Notification Channel through which to display this notification
         * on Android devices. If an ID is specified but the corresponding channel
         * does not exist on the device (i.e. has not yet been created by your app),
         * the notification will not be displayed to the user.
         *
         * If left null, a "Default" channel will be used, and Expo will create the
         * channel on the device if it does not yet exist. However, use caution, as
         * the "Default" channel is user-facing and you may not be able to fully
         * delete it.
         */
        // channelId?: string
    });

    let chunks = expo.chunkPushNotifications(messages);

    /*
    let tickets = [];
    tickets = await(sendPushNotification(chunks));
    */
    await(sendPushNotification(chunks));

    // ToDo: save tickets to database & make api to get receipts
    // await(getReceipts(receiptIdChunks));

    // console.log('processSendPushNotification', 'tickets', tickets);

    // res.status(200).send(tickets);
    res.status(200).send("Sending Push Notification is done.");
});

exports.sendPushNotification = functions.https.onRequest((req, res) => {
    if (req.method === "POST" && req.headers["content-type"].startsWith("multipart/form-data")) {
        const busboy = new Busboy({ headers: req.headers });

        let fields = {};

        busboy.on("field", (fieldname, val) => {
            fields[fieldname] = val;

            // console.log('sendPushNotification', fieldname, val);
        });

        let params = {};
        params.fields = fields;
        params.res = res;

        busboy.on("finish", processSendPushNotification.bind(params));

        busboy.end(req.rawBody);
    } else {
        // Return a "method not allowed" error
        const error = 'only POST message acceptable.';

        res.status(405).end(error);
    }
});

const processCleanPostImages = async(function () {
    const params = this;
    const fields = params.fields;
    const res = params.res;

    // console.log('processCleanPostImages', 'Done parsing form.', fields);

    const storage = admin.storage();

    // let refs = [];

    const length = Object.keys(fields).length;
    for (let i = 0; i < length; i++) {
        const number = i + 1;
        const key = 'file' + number.toString();
        const value = fields[key];

        console.log('deleteFiles', key, value);

        if (value) {
            const fileRef = storage.bucket(BUCKET_NAME).file(value);
            /*
            fileRef.delete().then(function () {
                // File deleted successfully
            }).catch(function (error) {
                // Uh-oh, an error occurred!
                // res.status(405).end(error + fileRef);
                res.status(405).end(error);
            });
            */
            await(fileRef.delete());

            // refs.push(fileRef);
        }
    }

    res.status(200).send('Deleting files in database is done.');
});

exports.cleanPostImages = functions.https.onRequest((req, res) => {
    if (req.method === "POST" && req.headers["content-type"].startsWith("multipart/form-data")) {
        const busboy = new Busboy({ headers: req.headers });

        let fields = {};

        busboy.on("field", (fieldname, val) => {
            // console.log('cleanPostImages', 'Field [' + fieldname + ']: value: ' + val);

            fields[fieldname] = val;
        });

        let params = {};
        params.fields = fields;
        params.res = res;

        busboy.on("finish", processCleanPostImages.bind(params));

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

/*
exports.checkRecaptcha = functions.https.onRequest((req, res) => {
    const response = req.query.response;
    console.log("recaptcha response", response);

    rp({
        uri: 'https://recaptcha.google.com/recaptcha/api/siteverify',
        method: 'POST',
        formData: {
            secret: '6Lf1T6IUAAAAANKvDWYi72sEYW56YmJQDPT_iL0c',
            response: response
        },
        json: true
    }).then(result => {
        console.log("recaptcha result", result)
        if (result.success) {
            res.send("You're good to go, human.")
        }
        else {
            res.send("Recaptcha verification failed. Are you a robot?")
        }
    }).catch(reason => {
        console.log("Recaptcha request failure", reason)
        res.send("Recaptcha request failed.")
    });
});
*/

const processSignOutUsers = async(function () {
    const params = this;
    const fields = params.fields;
    const res = params.res;

    const uid = fields.uid;

    // Revoke all refresh tokens for a specified user for whatever reason.
    // Retrieve the timestamp of the revocation, in seconds since the epoch.
    let result = await(admin.auth().revokeRefreshTokens(uid).then(() => {
        console.log('revoke success.', uid);
        return admin.auth().getUser(uid);
    }).then((userRecord) => {
        console.log('userRecord.tokensValidAfterTime', userRecord.tokensValidAfterTime);
        return new Date(userRecord.tokensValidAfterTime).getTime() / 1000;
    }).then((timestamp) => {
        console.log("Tokens revoked at: ", timestamp);
    }));

    res.status(200).send(result);
});

exports.signOutUsers = functions.https.onRequest((req, res) => {
    if (req.method === "POST" && req.headers["content-type"].startsWith("multipart/form-data")) {
        const busboy = new Busboy({ headers: req.headers });

        let fields = {};

        busboy.on("field", (fieldname, val) => {
            // console.log('field [' + fieldname + ']: value: ' + val);

            fields[fieldname] = val;
        });

        let params = {};
        params.fields = fields;
        params.res = res;

        busboy.on("finish", processSignOutUsers.bind(params));

        busboy.end(req.rawBody);
    } else {
        // Return a "method not allowed" error
        const error = 'only POST message acceptable.';

        res.status(405).end(error);
    }
});

const processDeletePostImages = async(function () {
    const params = this;
    const fields = params.fields;
    const res = params.res;

    const uid = fields.uid;
    const feedId = fields.feedId;

    const storage = admin.storage();
    storage.bucket(BUCKET_NAME).deleteFiles({
        prefix: `images/${uid}/post/${feedId}`
    });

    res.status(200).send('Deleting files in database is done.');
});

// Deleting all files within a folder
exports.deletePostImages = functions.https.onRequest((req, res) => {
    if (req.method === "POST" && req.headers["content-type"].startsWith("multipart/form-data")) {
        const busboy = new Busboy({ headers: req.headers });

        let fields = {};

        busboy.on("field", (fieldname, val) => {
            fields[fieldname] = val;
        });

        let params = {};
        params.fields = fields;
        params.res = res;

        busboy.on("finish", processDeletePostImages.bind(params));

        busboy.end(req.rawBody);
    } else {
        // Return a "method not allowed" error
        const error = 'only POST message acceptable.';

        res.status(405).end(error);
    }
});

/***
// 1. subscribeToTopic
const processSubscribeToTopic = async(function () {
    const params = this;
    const fields = params.fields;
    const res = params.res;
    const topic = fields.topic;
    const token = fields.token;

    const tokens = [];
    tokens.push(token);

    // Subscribe the devices corresponding to the registration tokens to the topic.
    admin.messaging().subscribeToTopic(tokens, topic).then(function (response) {
        // See the MessagingTopicManagementResponse reference documentation for the contents of response.
        console.log('Successfully subscribed to topic:', response);

        // log
        const e = response.errors;
        for (i = 0; i < e.length; i++) console.log('response error: ', i, e[i].error);

        res.status(200).send(response);
    }).catch(function (error) {
        console.log('Error subscribing to topic:', error);

        res.status(405).end(error);
    });
});

exports.subscribeToTopic = functions.https.onRequest((req, res) => {
    if (req.method === "POST" && req.headers["content-type"].startsWith("multipart/form-data")) {
        const busboy = new Busboy({ headers: req.headers });

        let fields = {};

        busboy.on("field", (fieldname, val) => {
            fields[fieldname] = val;

            console.log('subscribeToTopic', fieldname, val);
        });

        let params = {};
        params.fields = fields;
        params.res = res;

        busboy.on("finish", processSubscribeToTopic.bind(params));

        busboy.end(req.rawBody);
    } else {
        // Return a "method not allowed" error
        const error = 'only POST message acceptable.';

        res.status(405).end(error);
    }
});

// 2. unsubscribeToTopic
const processUnsubscribeToTopic = async(function () {
    const params = this;
    const fields = params.fields;
    const res = params.res;
    const topic = fields.topic;
    const token = fields.token;

    const tokens = [];
    tokens.push(token);

    // Subscribe the devices corresponding to the registration tokens to the topic.
    admin.messaging().unsubscribeFromTopic(tokens, topic).then(function (response) {
        // See the MessagingTopicManagementResponse reference documentation for the contents of response.
        console.log('Successfully unsubscribed from topic:', response);

        res.status(200).send(response);
    }).catch(function (error) {
        console.log('Error unsubscribing from topic:', error);

        res.status(405).end(error);
    });
});

exports.unsubscribeToTopic = functions.https.onRequest((req, res) => {
    if (req.method === "POST" && req.headers["content-type"].startsWith("multipart/form-data")) {
        const busboy = new Busboy({ headers: req.headers });

        let fields = {};

        busboy.on("field", (fieldname, val) => {
            fields[fieldname] = val;

            // console.log('unsubscribeToTopic', fieldname, val);
        });

        let params = {};
        params.fields = fields;
        params.res = res;

        busboy.on("finish", processUnsubscribeToTopic.bind(params));

        busboy.end(req.rawBody);
    } else {
        // Return a "method not allowed" error
        const error = 'only POST message acceptable.';

        res.status(405).end(error);
    }
});

// 3. sendPushNotificationToTopic
const processPushNotificationToTopic = async(function () {
    const params = this;
    const fields = params.fields;
    const res = params.res;

    const topic = fields.topic;
    const title = fields.title;
    const subtitle = fields.subtitle;

    const message = {
        data: {
            title: title,
            subtitle: subtitle
        },
        topic: topic
    };

    // Send a message to devices subscribed to the provided topic.
    admin.messaging().send(message).then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);

        res.status(200).send(response);
    }).catch((error) => {
        console.log('Error sending message:', error);

        res.status(405).end(error);
    });
});

exports.sendPushNotificationToTopic = functions.https.onRequest((req, res) => {
    if (req.method === "POST" && req.headers["content-type"].startsWith("multipart/form-data")) {
        const busboy = new Busboy({ headers: req.headers });

        let fields = {};

        busboy.on("field", (fieldname, val) => {
            fields[fieldname] = val;

            // console.log('sendPushNotification', fieldname, val);
        });

        let params = {};
        params.fields = fields;
        params.res = res;

        busboy.on("finish", processPushNotificationToTopic.bind(params));

        busboy.end(req.rawBody);
    } else {
        // Return a "method not allowed" error
        const error = 'only POST message acceptable.';

        res.status(405).end(error);
    }
});
***/

const getTokens = async(function (topic) {
    const doc = await(admin.firestore().collection("topics").doc(topic).get());
    if (doc.exists) {
        const tokens = doc.data().subscribers;
        return tokens;
    }

    return null;

    /*
    let tokens = null;

    const ref = admin.firestore().collection("topics").doc(topic);

    await(admin.firestore().runTransaction(transaction => {
        const topicDoc = await(transaction.get(ref));
        if (topicDoc.exists) {
            let data = topicDoc.data();

            tokens = data.subscribers;

            data.lastSentTime = Date.now();

            transaction.update(ref, data);
        }
    }));

    return tokens;
    */
});

const processSendPushNotificationToTopic = async(function () {
    const params = this;
    const fields = params.fields;
    const res = params.res;

    const type = fields.type;
    const placeName = fields.placeName;
    const placeId = fields.placeId;
    const feedId = fields.feedId;
    const topic = fields.topic;

    const tokens = await(getTokens(topic));
    // console.log('processSendPushNotificationToTopic', 'tokens', tokens);

    if (!tokens || tokens.length === 0) {
        res.status(200).send(`Subscribers not exist.`);

        return;
    }

    // validation check & assemble token
    let targetTokens = [];
    for (i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const __token = 'ExponentPushToken[' + token + ']';

        if (!Expo.isExpoPushToken(__token)) {
            const error = `Push token ${__token} is not a valid Expo push token.`;
            console.error(error);
        } else {
            targetTokens.push(__token);
        }
    }

    if (targetTokens.length === 0) {
        res.status(200).send(`Valid subscribers not exist.`);

        return;
    }

    let userData = {};
    userData['placeId'] = placeId;
    userData['feedId'] = feedId;

    const title = 'New post in ' + placeName + ' just uploaded.';
    const subtitle = 'Take a look now!⭐';


    let messages = [];
    messages.push({
        /**
         * An Expo push token specifying the recipient of this message.
         */
        to: targetTokens,

        /**
         * A JSON object delivered to your app. It may be up to about 4KiB; the total
         * notification payload sent to Apple and Google must be at most 4KiB or else
         * you will get a "Message Too Big" error.
         */
        data: {
            type: type,
            userData: userData
        },

        /**
         * The title to display in the notification. Devices often display this in
         * bold above the notification body. Only the title might be displayed on
         * devices with smaller screens like Apple Watch.
         */
        // title: 'title',
        title: title,

        /**
         * The message to display in the notification
         */
        body: subtitle,

        // iOS-specific fields

        /**
         * A sound to play when the recipient receives this notification. Specify
         * "default" to play the device's default notification sound, or omit this
         * field to play no sound.
         *
         * Note that on apps that target Android 8.0+ (if using `expo build`, built
         * in June 2018 or later), this setting will have no effect on Android.
         * Instead, use `channelId` and a channel with the desired setting.
         */
        // sound: 'default' | null,
        sound: 'default',

        /**
         * Number to display in the badge on the app icon. Specify zero to clear the
         * badge.
         */
        // badge?: number,

        _displayInForeground: true,

        // Android-specific fields

        /**
         * ID of the Notification Channel through which to display this notification
         * on Android devices. If an ID is specified but the corresponding channel
         * does not exist on the device (i.e. has not yet been created by your app),
         * the notification will not be displayed to the user.
         *
         * If left null, a "Default" channel will be used, and Expo will create the
         * channel on the device if it does not yet exist. However, use caution, as
         * the "Default" channel is user-facing and you may not be able to fully
         * delete it.
         */
        // channelId?: string
    });

    let chunks = expo.chunkPushNotifications(messages);

    /*
    let tickets = [];
    tickets = await(sendPushNotification(chunks));
    */
    await(sendPushNotification(chunks));

    // ToDo: save tickets to database & make api to get receipts
    // await(getReceipts(receiptIdChunks));

    // console.log('processSendPushNotificationToTopic', 'tickets', tickets);

    // res.status(200).send(tickets);
    res.status(200).send("Sending Push Notifications is done.");
});

exports.sendPushNotificationToTopic = functions.https.onRequest((req, res) => {
    if (req.method === "POST" && req.headers["content-type"].startsWith("multipart/form-data")) {
        const busboy = new Busboy({ headers: req.headers });

        let fields = {};

        busboy.on("field", (fieldname, val) => {
            fields[fieldname] = val;

            // console.log('sendPushNotificationToTopic', fieldname, val);
        });

        let params = {};
        params.fields = fields;
        params.res = res;

        busboy.on("finish", processSendPushNotificationToTopic.bind(params));

        busboy.end(req.rawBody);
    } else {
        // Return a "method not allowed" error
        const error = 'only POST message acceptable.';

        res.status(405).end(error);
    }
});
