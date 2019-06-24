// @flow
import { Asset } from 'expo-asset';

const logo = require("../../../../../assets/logo.png");

export default class Images {

    static logo = logo;

    static downloadAsync(): Promise<*>[] {
        return [
            Asset.loadAsync(Images.logo)
        ];
    }
}
