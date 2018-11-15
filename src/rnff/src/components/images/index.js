// @flow
import {Asset} from "expo";

const cover = require("./cover.png");

export default class Images {

    static cover = cover;

    static downloadAsync(): Promise<*>[] {
        return [
            Asset.loadAsync(cover)
        ];
    }
}
