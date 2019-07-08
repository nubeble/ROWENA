import { Asset } from 'expo-asset';

const Splash = require('../assets/splash.png');
const Title = require('../assets/title.png');
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

const user = require('../assets/icon/user.png');
const birth = require('../assets/icon/birth.png');
const bra = require('../assets/icon/bra.png');
const ruler = require('../assets/icon/ruler.png');
const scale = require('../assets/icon/scale.png');
const comment = require('../assets/icon/comment.png');
const home = require('../assets/icon/home.png');

// illustration
const feed = require('../assets/sample/feed.png');
const explore = require('../assets/sample/explore.jpg');
const advertisement = require('../assets/sample/write.jpg');
const find = require('../assets/sample/find.png');


const likes = require('../assets/sanrio/likes.png'); // 581 x 277
const chat = require('../assets/sanrio/chat.png'); // 554 x 340
const review = require('../assets/sanrio/review.png'); // 560 x 304
const customer = require('../assets/sanrio/customer.png'); // 446 x 250
const customer2 = require('../assets/sanrio/customer2.png'); // 496 x 403
const post = require('../assets/sanrio/post.png'); // 566 x 352
const hope = require('../assets/sanrio/hope.png'); // 474 x 394


const wait = require('../assets/sample/wait.png');
const keyboard = require('../assets/sample/keyboard.png');


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


export default class PreloadImage {
    static Splash = Splash;
    static Title = Title;
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
    static birth = birth;
    static bra = bra;
    static ruler = ruler;
    static scale = scale;
    static comment = comment;
    static home = home;

    static feed = feed;
    static explore = explore;
    static advertisement = advertisement;
    static find = find;


    static likes = likes;
    static chat = chat;
    static review = review;
    static customer = customer;
    static customer2 = customer2;
    static post = post;
    static hope = hope;


    static wait = wait;
    static keyboard = keyboard;

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


    static downloadAsync(): Promise<*>[] {
        return [
            // Asset.loadAsync(Images.logo)
            Asset.loadAsync([
                PreloadImage.Splash,
                PreloadImage.Title,
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
                PreloadImage.birth,
                PreloadImage.bra,
                PreloadImage.ruler,
                PreloadImage.scale,
                PreloadImage.comment,
                PreloadImage.home,

                PreloadImage.feed,
                PreloadImage.explore,
                PreloadImage.advertisement,
                PreloadImage.find,


                PreloadImage.likes,
                PreloadImage.chat,
                PreloadImage.review,
                PreloadImage.customer,
                PreloadImage.customer2,
                PreloadImage.post,
                PreloadImage.hope,


                PreloadImage.wait,
                PreloadImage.keyboard,

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
                PreloadImage.burger4
            ])
        ];
    }
}
