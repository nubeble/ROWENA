// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const { Storage } = require('@google-cloud/storage');
const projectId = 'rowena-88cfd';
const gcs = new Storage({
    projectId: projectId,
});

const path = require('path');
const os = require('os');
const fs = require('fs');
const spawn = require('child-process-promise').spawn;

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();




// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.addMessage = functions.https.onRequest((req, res) => {
    // Grab the text parameter.
    const original = req.query.text;

    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    return admin.database().ref('/messages').push({ original: original }).then((snapshot) => { // /messages/{pushId}/original
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
exports.onFileCreate = functions.storage.object().onFinalize((event) => {
    console.log(event);

    const bucket = event.bucket;
    const contentType = event.contentType;
    const filePath = event.name; // folder included
    const fileName = filePath.split('/').pop();
    // const fileDir = path.dirname(filePath); // folder path

    if (path.basename(filePath).startsWith('resized_')) {
        // console.log('We already resized it!');

        return;
    }

    const tmpFilePath = path.join(os.tmpdir(), fileName);
    // console.log('Temp Path: ', tmpFilePath); // /tmp/9968D23359B3622120.jpeg
    const destBucket = gcs.bucket(bucket);
    const metadata = { contentType: contentType };

    return destBucket.file(filePath).download({
            destination: tmpFilePath
        }).then(() => {
            // console.log('Image downloaded locally to ', tmpFilePath);

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
        }).then(() => fs.unlinkSync(tmpFilePath));
});

exports.onFileDelete = functions.storage.object().onDelete((event) => {
    console.log(event);

    // return;
});
