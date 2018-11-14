import { Expo } from 'expo'

export async function SaveStorage(key: string, value: Object) {
    if ('object' == typeof value) {
        Expo.SecureStore.setItemAsync(key, JSON.stringify(value));
    }
}

export async function LoadStorage(key: string) {
    try {

        const result = await Expo.SecureStore.getItemAsync(key);

        return result;

    } catch (error) {

        console.log('error occured', error);

        return null;
    }
}
