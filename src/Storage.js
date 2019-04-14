import { SecureStore } from 'expo'

/*
export async function LoadStorage(key: string) {
    console.log('LoadStorage', key);

    try {
        let result = await SecureStore.getItemAsync(key);

        console.log('1: ' + result);

        return result;
    } catch (error) {
        console.log('LoadStorage, error occured', error);

        return null;
    }
}

export async function SaveStorage(key: string, value: Object) {
    if ('object' == typeof value) {
        console.log('SaveStorage', JSON.stringify(value));

        try {
            let result = await SecureStore.setItemAsync(key, JSON.stringify(value));

            console.log('2: ' + result);

            return result;
        } catch (error) {
            console.log('SaveStorage, error occured', error);
    
            return null;
        }
    }
}

export async function RemoveStorage(key: string) {
    console.log('RemoveStorage', key);

    try {
        let result = await SecureStore.deleteItemAsync(key);

        console.log('3: ' + result);

        return result;
    } catch (error) {
        console.log('RemoveStorage, error occured', error);

        return null;
    }
}
*/

export function LoadStorage(key: string, cbSuccess, cbFail, param) {
    console.log('LoadStorage', key);

    SecureStore.getItemAsync(key).then((result) => {
        console.log('LoadStorage, then', result);

        if (result) {
            if (cbSuccess) cbSuccess(result, param);
        } else {
            if (cbFail) cbFail(param);
        }

        return true;
    }).catch((error) => {
        console.log('LoadStorage, catch', error);

        if (cbFail) cbFail(param);

        return false;
    });
}

export function SaveStorage(key: string, value: Object, cbSuccess) {
    console.log('1111111111111111');

    if ('object' == typeof value) {
        console.log('SaveStorage', JSON.stringify(value));

        SecureStore.setItemAsync(key, JSON.stringify(value)).then((result) => {
            console.log('SaveStorage success');

            // return result;
            // cb(result);
            if (cbSuccess) cbSuccess();

            return true;
        }).catch((error) => {
            console.log('SaveStorage, catch', error);

            return false;
        });
    }
}

export function RemoveStorage(key: string, cbSuccess) {
    console.log('RemoveStorage', key);

    SecureStore.deleteItemAsync(key).then((result) => {
        console.log('RemoveStorage success');

        // return result;

        if (cbSuccess) {
            console.log('call callback');
            cbSuccess();
        } else {
            console.log('callback is null');
        }

        return true;
    }).catch((error) => {
        console.log('RemoveStorage, catch', error);

        return false;
    });
}
