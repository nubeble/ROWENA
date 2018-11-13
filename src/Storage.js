import Expo from 'expo'

export default SaveStorage = async (key: string, value: Object) => {
    if ('object' == typeof value) {
        Expo.SecureStore.setItemAsync(key, JSON.stringify(value));
    }
}

export default LoadStorage = async (key: string) => {
    let json = '';
    json = await Expo.SecureStore.getItemAsync(key);

    return json;
}
