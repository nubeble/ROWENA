import { SecureStore } from 'expo'

/*
export async function LoadStorage(key: string) {
    console.log('jdub', 'LoadStorage', key);

    try {
        let result = await SecureStore.getItemAsync(key);

        console.log('jdub', '1: ' + result);

        return result;
    } catch (error) {
        console.log('jdub', 'LoadStorage, error occurred', error);

        return null;
    }
}

export async function SaveStorage(key: string, value: Object) {
    if ('object' == typeof value) {
        console.log('jdub', 'SaveStorage', JSON.stringify(value));

        try {
            let result = await SecureStore.setItemAsync(key, JSON.stringify(value));

            console.log('jdub', '2: ' + result);

            return result;
        } catch (error) {
            console.log('jdub', 'SaveStorage, error occurred', error);
    
            return null;
        }
    }
}

export async function RemoveStorage(key: string) {
    console.log('jdub', 'RemoveStorage', key);

    try {
        let result = await SecureStore.deleteItemAsync(key);

        console.log('jdub', '3: ' + result);

        return result;
    } catch (error) {
        console.log('jdub', 'RemoveStorage, error occurred', error);

        return null;
    }
}
*/

export function LoadStorage(key: string, cbSuccess, cbFail, param) {
    console.log('jdub', 'LoadStorage', key);

    SecureStore.getItemAsync(key).then((result) => {
        console.log('jdub', 'LoadStorage, then', result);

        if (result) {
            if (cbSuccess) cbSuccess(result, param);
        } else {
            if (cbFail) cbFail(param);
        }

        return true;
    }).catch((error) => {
        console.log('jdub', 'LoadStorage, catch', error);

        if (cbFail) cbFail(param);

        return false;
    });
}

export function SaveStorage(key: string, value: Object, cbSuccess) {
    if ('object' == typeof value) {
        console.log('jdub', 'SaveStorage', JSON.stringify(value));

        SecureStore.setItemAsync(key, JSON.stringify(value)).then((result) => {
            console.log('jdub', 'SaveStorage success');

            // return result;
            // cb(result);
            if (cbSuccess) cbSuccess();

            return true;
        }).catch((error) => {
            console.log('jdub', 'SaveStorage, catch', error);

            return false;
        });
    }
}

export function RemoveStorage(key: string, cbSuccess) {
    console.log('jdub', 'RemoveStorage', key);

    SecureStore.deleteItemAsync(key).then((result) => {
        console.log('jdub', 'RemoveStorage success');

        // return result;

        if (cbSuccess) {
            console.log('jdub', 'call callback');
            cbSuccess();
        } else {
            console.log('jdub', 'callback is null');
        }

        return true;
    }).catch((error) => {
        console.log('jdub', 'RemoveStorage, catch', error);

        return false;
    });
}
