import { Permissions, Notifications } from 'expo';
import Firebase from './Firebase';

// const PUSH_ENDPOINT = 'https://your-server.com/users/push-token';
const PUSH_ENDPOINT = "https://us-central1-rowena-88cfd.cloudfunctions.net/setToken";


export async function registerExpoPushToken() {
    const { status: existingStatus } = await Permissions.getAsync(
        Permissions.NOTIFICATIONS
    );
    let finalStatus = existingStatus;

    console.log("existingStatus", existingStatus);

    // only ask if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    if (existingStatus !== "granted") {
        // Android remote notification permissions are granted during the app
        // install, so this will only ask on iOS
        const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
        finalStatus = status;
    }

    console.log("finalStatus", finalStatus);

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
    return fetch(PUSH_ENDPOINT, {
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
