import { Asset } from "expo";

const Splash = require('../assets/splash.png');

const Bangkok = require('../assets/place/Bangkok.jpg');
const Manila = require('../assets/place/Manila.jpg');
const HoChiMinh = require('../assets/place/HoChiMinh.jpg');
const Vientiane = require('../assets/place/Vientiane.jpg');
const PhnomPenh = require('../assets/place/PhnomPenh.jpg');
const Jakarta = require('../assets/place/Jakarta.jpg');


export default class PreloadImage {
    static Splash = Splash;
    static Bangkok = Bangkok;
    static Manila = Manila;
    static HoChiMinh = HoChiMinh;
    static Vientiane = Vientiane;
    static PhnomPenh = PhnomPenh;
    static Jakarta = Jakarta;

    static downloadAsync(): Promise<*>[] {
        return [
            // Asset.loadAsync(Images.logo)
            Asset.loadAsync([
                PreloadImage.Splash,
                PreloadImage.Bangkok,
                PreloadImage.Manila,
                PreloadImage.HoChiMinh,
                PreloadImage.Vientiane,
                PreloadImage.PhnomPenh,
                PreloadImage.Jakarta
            ])
        ];
    }
}
