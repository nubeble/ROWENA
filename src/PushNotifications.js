import { Permissions, Notifications, Linking } from 'expo';
import Firebase from './Firebase';
import { Cons } from './Globals';
// import Util from './Util';

const SERVER_ENDPOINT = "https://us-central1-rowena-88cfd.cloudfunctions.net/";


export async function registerExpoPushToken(uid, name) {
    console.log('registerExpoPushToken', uid, name);

    const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
    let finalStatus = existingStatus;

    // only ask if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    if (existingStatus !== "granted") {
        // Android remote notification permissions are granted during the app
        // install, so this will only ask on iOS
        const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
        finalStatus = status;
    }

    // Stop here if the user did not grant permissions
    if (finalStatus !== "granted") {
        console.log('Permission to access notifications was denied.');

        // await Util.openSettings();
        return;
    }

    // Get the token that uniquely identifies this device
    let token = await Notifications.getExpoPushTokenAsync();
    console.log("push token", token);

    // const user = Firebase.user();

    /*
    const formData = new FormData();
    formData.append("token", token);
    // formData.append("uid", user.uid);
    // formData.append("name", user.name);
    formData.append("uid", uid);
    formData.append("name", name);

    // POST the token to your backend server from where you can retrieve it to send push notifications.
    return fetch(SERVER_ENDPOINT + "setToken", {
        method: "POST",
        headers: {
            Accept: "application/json",
            // "Content-Type": "application/json",
            "Content-Type": "multipart/form-data"
        },
        body: formData
    });
    */
    const data = {
        token,
        uid,
        name
    };
    
    await Firebase.setToken(uid, data);
}

/*
export async function unregisterExpoPushToken(uid) {
    console.log('unregisterExpoPushToken', uid);

    const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
    let finalStatus = existingStatus;

    // only ask if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    if (existingStatus !== "granted") {
        // Android remote notification permissions are granted during the app
        // install, so this will only ask on iOS
        const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
        finalStatus = status;
    }

    // Stop here if the user did not grant permissions
    if (finalStatus !== "granted") {
        console.log('Permission to access notifications was denied.');

        // await Util.openSettings();
        return;
    }

    // Get the token that uniquely identifies this device
    let token = await Notifications.getExpoPushTokenAsync();
    console.log("token", token);

    // const user = Firebase.user();

    const formData = new FormData();
    formData.append("token", token);
    formData.append("uid", uid);
    // formData.append("name", name);

    // POST the token to your backend server from where you can retrieve it to send push notifications.
    return fetch(SERVER_ENDPOINT + "unsetToken", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data"
        },
        body: formData
    });
}
*/

export function sendPushNotification(sender, senderName, receiver, type, data) {
    console.log('sendPushNotification', sender, receiver, data);

    const formData = new FormData();
    formData.append("sender", sender);
    formData.append("senderName", senderName);
    formData.append("receiver", receiver);
    formData.append("type", type);

    if (type === Cons.pushNotification.chat) {
        formData.append("message", data.message);
        formData.append("chatRoomId", data.chatRoomId);
        // formData.append("placeId", data.placeId);
        // formData.append("feedId", data.feedId);

        /*
        const users = data.users;
        const user1 = users[0];
        const user2 = users[1];

        // formData.append("user1Uid", user1.uid);
        if (user1.name) formData.append("user1Name", user1.name);
        if (user1.picture) formData.append("user1Picture", user1.picture);
        // formData.append("user2Uid", user2.uid);
        if (user2.name) formData.append("user2Name", user2.name);
        if (user2.picture) formData.append("user2Picture", user2.picture);
        */
    } else if (type === Cons.pushNotification.review) {
        formData.append("message", data.message);
        formData.append("placeId", data.placeId);
        formData.append("feedId", data.feedId);
    } else if (type === Cons.pushNotification.reply) {
        formData.append("message", data.message);
        formData.append("placeId", data.placeId);
        formData.append("feedId", data.feedId);
    } else if (type === Cons.pushNotification.comment) {
        formData.append("message", data.message);
    } else if (type === Cons.pushNotification.like) {
        formData.append("message", data.message);
        formData.append("placeId", data.placeId);
        formData.append("feedId", data.feedId);
    }

    return fetch(SERVER_ENDPOINT + "sendPushNotification", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data"
        },
        body: formData
    });
}
