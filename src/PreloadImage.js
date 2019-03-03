import { Asset } from "expo";

const Splash = require('../assets/splash.png');
const Background = require('../assets/background.png');

/*
const Avatar1 = require('../assets/place/avatar1.jpg');
const Avatar2 = require('../assets/place/avatar2.jpg');
const Avatar3 = require('../assets/place/avatar3.jpeg');
const Avatar4 = require('../assets/place/avatar4.jpeg');
const Avatar5 = require('../assets/place/avatar5.jpg');
const Avatar6 = require('../assets/place/avatar6.jpg');
const Avatar7 = require('../assets/place/avatar7.jpg');
const Avatar8 = require('../assets/place/avatar8.jpg');
const Avatar9 = require('../assets/place/avatar9.jpg');
*/

const user = require('../assets/user.png');
const birth = require('../assets/icon/birth.png');
const bra = require('../assets/icon/bra.png');
const ruler = require('../assets/icon/ruler.png');
const scale = require('../assets/icon/scale.png');


export default class PreloadImage {
    static Splash = Splash;
    static Background = Background;

    /*
    static Avatar1 = Avatar1;
    static Avatar2 = Avatar2;
    static Avatar3 = Avatar3;
    static Avatar4 = Avatar4;
    static Avatar5 = Avatar5;
    static Avatar6 = Avatar6;
    static Avatar7 = Avatar7;
    static Avatar8 = Avatar8;
    static Avatar9 = Avatar9;
    */

    static user = user;
    static bra = bra;
    static birth = birth;
    static ruler = ruler;
    static scale = scale;


    static downloadAsync(): Promise<*>[] {
        return [
            // Asset.loadAsync(Images.logo)
            Asset.loadAsync([
                PreloadImage.Splash,
                PreloadImage.Background,

                /*
                PreloadImage.Avatar1,
                PreloadImage.Avatar2,
                PreloadImage.Avatar3,
                PreloadImage.Avatar4,
                PreloadImage.Avatar5,
                PreloadImage.Avatar6,
                PreloadImage.Avatar7,
                PreloadImage.Avatar8,
                PreloadImage.Avatar9,
                */

                PreloadImage.user,
                PreloadImage.bra,
                PreloadImage.birth,
                PreloadImage.ruler,
                PreloadImage.scale
            ])
        ];
    }
}
