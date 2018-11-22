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

const path = require('path');
const os = require('os');
const fs = require('fs');
const spawn = require('child-process-promise').spawn;
const cors = require("cors");
const express = require("express");
const fileUploader = require("./fileUploader");
const api = express().use(cors({ origin: true }));
fileUploader("/images", api);


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
/*
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});
*/

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


/*
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
exports.onFileCreate = functions.storage.object().onFinalize((event) => {
    console.log(event);

    const bucket = event.bucket;
    const contentType = event.contentType;
    const filePath = event.name; // folder included
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
exports.onFileDelete = functions.storage.object().onDelete((event) => {
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

    let data = { [`pictures.${key}.uri`] : url };

    return data;
}
