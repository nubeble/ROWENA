import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import Firebase from './Firebase';
import { Cons } from './Globals';
// import Util from './Util';

const SERVER_ENDPOINT = "https://us-central1-rowena-88cfd.cloudfunctions.net/";


export async function registerExpoPushToken(uid, name, email, mobile) {
    console.log('jdub', 'registerExpoPushToken', uid, name, email, mobile);

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
        console.log('jdub', 'Permission to access notifications was denied.');

        // await Util.openSettings("NOTIFICATIONS");
        return;
    }

    // Get the token that uniquely identifies this device
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('jdub', "push token", token);

    // const user = Firebase.user();

    /*
    let formData = new FormData();
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
        uid, name, email, mobile, token
    };
    await Firebase.setToken(uid, data);
}

/*
export async function unregisterExpoPushToken(uid) {
    console.log('jdub', 'unregisterExpoPushToken', uid);

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
        console.log('jdub', 'Permission to access notifications was denied.');

        // await Util.openSettings("NOTIFICATIONS");
        return;
    }

    // Get the token that uniquely identifies this device
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('jdub', "token", token);

    // const user = Firebase.user();

    let formData = new FormData();
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
    console.log('jdub', 'sendPushNotification', sender, receiver, data);

    let formData = new FormData();
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

    fetch(SERVER_ENDPOINT + "sendPushNotification", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data"
        },
        body: formData
    }).then(function (response) {
        if (response.status < 200 || response.status >= 400 || Object.keys(response).length === 0) {
            throw "Error subscribing to topic: " + response.status + " - " + response.text();
        }

        console.log('Subscribed to "' + topic + '"');
    }).catch(function (err) {
        console.error(err);
    });
}

/***
// 1.
export async function subscribeToTopic(topic) {
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
        console.log('jdub', 'Permission to access notifications was denied.');

        // await Util.openSettings("NOTIFICATIONS");
        return;
    }

    // Get the token that uniquely identifies this device
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('jdub', "push token", token);

    const start = token.indexOf('[');
    const end = token.indexOf(']');
    const __token = token.substring(start + 1, end);
    console.log('token', __token);

    let formData = new FormData();
    formData.append("token", __token);
    formData.append("topic", topic);

    fetch(SERVER_ENDPOINT + "subscribeToTopic", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data"
        },
        body: formData
    }).then(function (response) {
        if (response.status < 200 || response.status >= 400 || Object.keys(response).length === 0) {
            throw "Error subscribing to topic: " + response.status + " - " + response.text();
        }

        console.log('Subscribed to "' + topic + '"');
    }).catch(function (err) {
        console.error(err);
    });
}

// 2.
export async function unsubscribeToTopic(topic) {
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
        console.log('jdub', 'Permission to access notifications was denied.');

        // await Util.openSettings("NOTIFICATIONS");
        return;
    }

    // Get the token that uniquely identifies this device
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('jdub', "push token", token);

    let formData = new FormData();
    formData.append("token", token);
    formData.append("topic", topic);

    fetch(SERVER_ENDPOINT + "unsubscribeToTopic", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data"
        },
        body: formData
    }).then(function (response) {
        if (response.status < 200 || response.status >= 400 || Object.keys(response).length === 0) {
            throw "Error unsubscribing to topic: " + response.status + " - " + response.text();
        }

        console.log('Unsubscribed to "' + topic + '"');
    }).catch(function (err) {
        console.error(err);
    });
}

// 3.
export function sendPushNotificationToTopic(title, subtitle, topic) {
    let formData = new FormData();
    formData.append("title", title);
    formData.append("subtitle", subtitle);
    formData.append("topic", topic);

    fetch(SERVER_ENDPOINT + "sendPushNotificationToTopic", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data"
        },
        body: formData
    }).then(function (response) {
        if (response.status < 200 || response.status >= 400 || Object.keys(response).length === 0) {
            throw "Error sending push notification to topic: " + response.status + " - " + response.text();
        }

        console.log('Sent push notification to "' + topic + '"');
    }).catch(function (err) {
        console.error(err);
    });
}
***/

export async function subscribeToTopic(topic) { // topic: place id, user id, ...
    // ToDo: token을 저장하기 때문에, 아래의 경우 token이 새로 발급되므로 이전에 저장된 token으로는 노티가 가지 않는다!
    // uid를 저장하고, 그 uid로 token을 찾아서 처리해야 하나, 성능 이슈가 있다.
    // 따라서 현재는 아래 경우를 제외한 일반적인 상태에서만 노티를 보낸다.
    // The app deletes Instance ID
    // The app is restored on a new device
    // The user uninstalls/reinstall the app
    // The user clears app data

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
        console.log('jdub', 'Permission to access notifications was denied.');

        // await Util.openSettings("NOTIFICATIONS");
        return;
    }

    // Get the token that uniquely identifies this device
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('jdub', "push token", token);

    Firebase.addTokenToTopic(topic, token);
}

export async function unsubscribeToTopic(topic) {
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
        console.log('jdub', 'Permission to access notifications was denied.');

        // await Util.openSettings("NOTIFICATIONS");
        return;
    }

    // Get the token that uniquely identifies this device
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('jdub', "push token", token);

    Firebase.removeTokenToTopic(topic, token);
}

export function sendPushNotificationToTopic(type, placeName, placeId, feedId, topic) {
    let formData = new FormData();
    formData.append("type", type);
    formData.append("placeName", placeName);
    formData.append("placeId", placeId);
    formData.append("feedId", feedId);
    formData.append("topic", topic);

    fetch(SERVER_ENDPOINT + "sendPushNotificationToTopic", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data"
        },
        body: formData
    }).then(function (response) {
        if (response.status < 200 || response.status >= 400 || Object.keys(response).length === 0) {
            throw "Error sending push notification to topic: " + response.status + " - " + response.text();
        }

        console.log('Sent push notification to "' + topic + '"');
    }).catch(function (err) {
        console.error(err);
    });
}
