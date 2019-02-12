import { Permissions, Notifications } from 'expo';
import Firebase from './Firebase';
import { Globals } from './Globals';

// const PUSH_ENDPOINT = 'https://your-server.com/users/push-token';
// const PUSH_ENDPOINT = "https://us-central1-rowena-88cfd.cloudfunctions.net/setToken";
const PUSH_ENDPOINT = "https://us-central1-rowena-88cfd.cloudfunctions.net/";


export async function registerExpoPushToken() {
    const { status: existingStatus } = await Permissions.getAsync(
        Permissions.NOTIFICATIONS
    );
    let finalStatus = existingStatus;

    // console.log("existingStatus", existingStatus);

    // only ask if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    if (existingStatus !== "granted") {
        // Android remote notification permissions are granted during the app
        // install, so this will only ask on iOS
        const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
        finalStatus = status;
    }

    // console.log("finalStatus", finalStatus);

    // Stop here if the user did not grant permissions
    if (finalStatus !== "granted") {
        return;
    }

    // Get the token that uniquely identifies this device
    let token = await Notifications.getExpoPushTokenAsync();

    console.log("token", token);

    const user = Firebase.user();

    const formData = new FormData();
    formData.append("token", token);
    formData.append("uid", user.uid);
    formData.append("name", user.name);

    // POST the token to your backend server from where you can retrieve it to send push notifications.
    return fetch(PUSH_ENDPOINT + "setToken", {
        method: "POST",
        headers: {
            Accept: "application/json",
            // "Content-Type": "application/json",
            "Content-Type": "multipart/form-data"
        },
        /*
        body: JSON.stringify({
            token: {
                value: token,
            },
            user: {
                uid: user.uid,
                name: user.name
            }
        })
        */
        body: formData
    });
}

export function sendPushNotification(sender, receiver, type, data) {
    console.log(sender, receiver, data);

    const formData = new FormData();
    formData.append("sender", sender);
    formData.append("receiver", receiver);
    formData.append("type", type);

    if (type === Globals.pushNotification.chat) {
        formData.append("message", data.message);
        formData.append("chatRoomId", data.chatRoomId);
        // formData.append("placeId", data.placeId);
        // formData.append("feedId", data.feedId);

        const users = data.users;
        const user1 = users[0];
        const user2 = users[1];

        // formData.append("user1Uid", user1.uid);
        if (user1.name) formData.append("user1Name", user1.name);
        if (user1.picture) formData.append("user1Picture", user1.picture);
        // formData.append("user2Uid", user2.uid);
        if (user2.name) formData.append("user2Name", user2.name);
        if (user2.picture) formData.append("user2Picture", user2.picture);
    } else if (type === Globals.pushNotification.review) {
        // ToDo: ...
    } else if (type === Globals.pushNotification.reply) {
        // ToDo: ...
    }

    return fetch(PUSH_ENDPOINT + "sendPushNotification", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data"
        },
        body: formData
    });
}
