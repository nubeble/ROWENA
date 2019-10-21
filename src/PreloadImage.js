import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

// const splash = require('../assets/splash.png');
const logo = require('../assets/logo.png');
// const background = require('../assets/background.png');
// const background = Platform.OS === 'android' ? require('../assets/android_background.png') : require('../assets/ios_background.png');
const background = require('../assets/ios_background.jpg');

// const user = require('../assets/icon/user.png');
const birth = require('../assets/icon/birth.png');
const bra = require('../assets/icon/bra.png');
const muscle = require('../assets/icon/muscle.png');
const ruler = require('../assets/icon/ruler.png');
const comment = require('../assets/icon/comment.png');
const home = require('../assets/icon/home.png');
const keyboard = require('../assets/icon/keyboard.png');

// sticker
const welcome = require('../assets/sticker/welcome.png');
const advertisement = require('../assets/sticker/advertise.png');
const hope = require('../assets/sticker/hope.png');
const explore = require('../assets/sticker/explore.png');
const chat = require('../assets/sticker/chat.png');
const likes = require('../assets/sticker/likes.png');
const find = require('../assets/sticker/find.png');
const reviews = require('../assets/sticker/reviews.png');
const comments = require('../assets/sticker/comments.png');
const post = require('../assets/sticker/post.png');

// emoji
const pin = require('../assets/icon/pin.png');
const emoji0 = require('../assets/emoji/0.png');
const emoji1 = require('../assets/emoji/1.png');
const emoji2 = require('../assets/emoji/2.png');
const emoji3 = require('../assets/emoji/3.png');
const emoji4 = require('../assets/emoji/4.png');
const emoji5 = require('../assets/emoji/5.png');

// ads
const starbucks1 = require('../assets/ads/starbucks/1.jpg');
const starbucks2 = require('../assets/ads/starbucks/2.jpg');
const starbucks3 = require('../assets/ads/starbucks/3.jpg');
const starbucks4 = require('../assets/ads/starbucks/4.jpg');

const coke1 = require('../assets/ads/coca-cola/1.jpg');
const coke2 = require('../assets/ads/coca-cola/2.jpg');
const coke3 = require('../assets/ads/coca-cola/3.jpg');
const coke4 = require('../assets/ads/coca-cola/4.jpg');

const burger1 = require('../assets/ads/burgerking/1.jpg');
const burger2 = require('../assets/ads/burgerking/2.jpg');
const burger3 = require('../assets/ads/burgerking/3.jpg');
const burger4 = require('../assets/ads/burgerking/4.jpg');

const wanted1 = require('../assets/ads/wanted/1.png');
const wanted2 = require('../assets/ads/wanted/2.png');
const wanted3 = require('../assets/ads/wanted/3.png');
const wanted4 = require('../assets/ads/wanted/4.png');

// tutorial
const tutorial1 = Platform.OS === 'android' ? require('../assets/tutorial/1.png') : require('../assets/tutorial/1-1.png');
const tutorial2 = Platform.OS === 'android' ? require('../assets/tutorial/2.png') : require('../assets/tutorial/2-2.png');
const tutorial3 = require('../assets/tutorial/3.png');
const tutorial4 = require('../assets/tutorial/4.png');

// Test
/*
const tmp1 = require('../assets/tmp/Bangkok.jpg');
const tmp2 = require('../assets/tmp/Manila.jpg');
const tmp3 = require('../assets/tmp/HCM.jpg');
const tmp4 = require('../assets/tmp/Vientiane.jpg');
const tmp5 = require('../assets/tmp/KK.jpg');
const tmp6 = require('../assets/tmp/Jakarta.jpg');
*/


export default class PreloadImage {
    // static splash = splash;
    static logo = logo;
    static background = background;

    // static user = user;
    static birth = birth;
    static bra = bra;
    static muscle = muscle;
    static ruler = ruler;
    static comment = comment;
    static home = home;
    static keyboard = keyboard;

    // sticker
    static welcome = welcome;
    static advertisement = advertisement;
    static hope = hope;
    static explore = explore;
    static chat = chat;
    static likes = likes;
    static find = find;
    static reviews = reviews;
    static comments = comments;
    static post = post;

    static pin = pin;
    static emoji0 = emoji0;
    static emoji1 = emoji1;
    static emoji2 = emoji2;
    static emoji3 = emoji3;
    static emoji4 = emoji4;
    static emoji5 = emoji5;

    static starbucks1 = starbucks1;
    static starbucks2 = starbucks2;
    static starbucks3 = starbucks3;
    static starbucks4 = starbucks4;

    static coke1 = coke1;
    static coke2 = coke2;
    static coke3 = coke3;
    static coke4 = coke4;

    static burger1 = burger1;
    static burger2 = burger2;
    static burger3 = burger3;
    static burger4 = burger4;

    static wanted1 = wanted1;
    static wanted2 = wanted2;
    static wanted3 = wanted3;
    static wanted4 = wanted4;

    static tutorial1 = tutorial1;
    static tutorial2 = tutorial2;
    static tutorial3 = tutorial3;
    static tutorial4 = tutorial4;

    /*
    static tmp1 = tmp1;
    static tmp2 = tmp2;
    static tmp3 = tmp3;
    static tmp4 = tmp4;
    static tmp5 = tmp5;
    static tmp6 = tmp6;
    */


    static downloadAsync(): Promise<*>[] {
        return [
            // Asset.loadAsync(Images.logo)
            Asset.loadAsync([
                // PreloadImage.splash,
                PreloadImage.logo,
                PreloadImage.background,

                // PreloadImage.user,
                PreloadImage.birth,
                PreloadImage.bra,
                PreloadImage.muscle,
                PreloadImage.ruler,
                PreloadImage.comment,
                PreloadImage.home,
                PreloadImage.keyboard,

                // sticker
                PreloadImage.welcome,
                PreloadImage.advertisement,
                PreloadImage.hope,
                PreloadImage.explore,
                PreloadImage.chat,
                PreloadImage.likes,
                PreloadImage.find,
                PreloadImage.reviews,
                PreloadImage.comments,
                PreloadImage.post,

                PreloadImage.pin,
                PreloadImage.emoji0,
                PreloadImage.emoji1,
                PreloadImage.emoji2,
                PreloadImage.emoji3,
                PreloadImage.emoji4,
                PreloadImage.emoji5,

                PreloadImage.starbucks1,
                PreloadImage.starbucks2,
                PreloadImage.starbucks3,
                PreloadImage.starbucks4,

                PreloadImage.coke1,
                PreloadImage.coke2,
                PreloadImage.coke3,
                PreloadImage.coke4,

                PreloadImage.burger1,
                PreloadImage.burger2,
                PreloadImage.burger3,
                PreloadImage.burger4,

                PreloadImage.wanted1,
                PreloadImage.wanted2,
                PreloadImage.wanted3,
                PreloadImage.wanted4,

                PreloadImage.tutorial1,
                PreloadImage.tutorial2,
                PreloadImage.tutorial3,
                PreloadImage.tutorial4,

                /*
                PreloadImage.tmp1,
                PreloadImage.tmp2,
                PreloadImage.tmp3,
                PreloadImage.tmp4,
                PreloadImage.tmp5,
                PreloadImage.tmp6
                */
            ])
        ];
    }
}
