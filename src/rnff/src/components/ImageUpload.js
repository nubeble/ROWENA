// @flow
import {ImageManipulator} from "expo";

import Firebase from "./Firebase";

export type Picture = {
    uri: string,
    width: number,
    height: number
};

const {manipulate} = ImageManipulator;
const id = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);

export default class ImageUpload {

    static uid(): string {
        return `${id()}${id()}-${id()}-${id()}-${id()}-${id()}${id()}${id()}`;
    }

    static async preview({ uri }: Picture): Promise<string> {
        const result = await manipulate(uri, [{ resize: { width: 10, height: 10 }}], { base64: true });
        return `data:image/jpeg;base64,${result.base64 || ""}`;
    }

    static async upload(picture: Picture): Promise<string> {
        const response = await fetch(picture.uri);
        const blob = await response.blob();
        const ref = Firebase
            .storage
            .ref()
            .child(ImageUpload.uid());
        const snapshot = await ref.put(blob);
        const downloadURL = await snapshot.ref.getDownloadURL();
        return downloadURL;
    }
}
