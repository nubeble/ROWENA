import * as firebase from "firebase";
import "firebase/firestore";
import Util from './Util';

const config = {
    apiKey: "AIzaSyCT1LV1HF5REJw_SePsUeUdwFalo5IzrsQ",
    authDomain: "rowena-88cfd.firebaseapp.com",
    databaseURL: "https://rowena-88cfd.firebaseio.com",
    projectId: "rowena-88cfd",
    storageBucket: "rowena-88cfd.appspot.com",
    messagingSenderId: "457192015889"
};


export default class Firebase {
    static auth: firebase.auth.Auth;
    static firestore: firebase.firestore.Firestore;
    static storage: firebase.storage.Storage;

    static init() {
        firebase.initializeApp(config);

        Firebase.auth = firebase.auth();
        Firebase.firestore = firebase.firestore();
        Firebase.firestore.settings({ timestampsInSnapshots: true });
        Firebase.storage = firebase.storage();
    }


    // firestore

    static async createProfile(uid, name, email, phoneNumber) { // set
        const profile = {
            uid: uid,
            name: name,
            country: null,
            city: null,
            email: email,
            phoneNumber: phoneNumber,
            picture: {
                preview: null,
                uri: null
            },
            location: {
                description: null, // "Cebu, Philippines"
                longitude: 0.0, // 경도
                latitude: 0.0 // 위도
            },
            about: null,

            // feeds: {}, // 내가 등록한 feed. ToDo: 삭제 시 배열을 전체 검색
            /*
            '0': {
                'placeId': 'ChIJ82ENKDJgHTERIEjiXbIAAQE',
                'feedId': '965b0af6-d189-3190-bf6c-9d2e4535deb5'
            },
            '1': {
                'placeId': 'ChIJ82ENKDJgHTERIEjiXbIAAQE',
                'feedId': '965b0af6-d189-3190-bf6c-9d2e4535deb5'
            },
            ...
            */

            feeds: [],

            postedReviews: [] // [review id] 내가 남긴 리뷰. ToDo: 삭제 시 배열을 전체 검색
        };

        await Firebase.firestore.collection("users").doc(uid).set(profile);
    }

    static async createFeed(feedId, userUid, placeId, name, age, location, image1Uri, image2Uri, image3Uri, image4Uri, note) {
        // const id = Util.uid(); // create uuid

        const feed = {
            uid: userUid, // owner
            placeId: placeId,
            /*
            location: {
                description: 'Bangkok, Thailand',
                longitude: 100.5017651,
                latitude: 13.7563309
            },
            */
            name: name,
            age: age,
            location: location,
            id: feedId,
            pictures: { // 4
                one: {
                    // preview: null,
                    uri: image1Uri
                },
                two: {
                    // preview: null,
                    uri: image2Uri
                },
                three: {
                    // preview: null,
                    uri: image3Uri
                },
                four: {
                    // preview: null,
                    uri: image4Uri
                }
            },
            note: note,

            // reviews: [], // ToDo: collection 으로 변경!!!

            // 총 리뷰 갯수 - reviews.length
            averageRating: 0.0, // 리뷰가 추가될 때마다 다시 계산해서 업데이트

            timestamp: Date.now() // 1543145425396
        };

        await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).set(feed);
    }

    static async createReview(userUid, rating, comment) {
        const id = Util.uid(); // create uuid

        const review = {
            uid: userUid,
            id: id,
            rating: rating,
            comment: comment,
            timestamp: Date.now()
        };

        return await Firebase.firestore.collection("reviews").doc(id).set(review);
    }

    static async getUserFeeds(profile) { // user posted feeds
        const feeds = profile.feeds; // object NOT map

        const keys = Object.keys(feeds);
        console.log('user feeds length', keys.length);
        /*
        '0': {
            'placeId': 'ChIJ82ENKDJgHTERIEjiXbIAAQE',
            'feedId': '965b0af6-d189-3190-bf6c-9d2e4535deb5'
        },
        '1': {
            'placeId': 'ChIJ82ENKDJgHTERIEjiXbIAAQE',
            'feedId': '965b0af6-d189-3190-bf6c-9d2e4535deb5'
        },
        ...
        */

        let userFeeds = [];

        for (i = 0; i < keys.length; i++) { // map
            var num = i;
            var key = num.toString();

            var value = feeds.get(key);

            // ToDo:
            const feedDoc = await Firebase.firestore.collection("place").doc(value.placeId).collection("feed")
                .doc(value.feedId).get();

            userFeeds.push(feedDoc.data());
        }

        console.log('userFeeds', userFeeds);

        return userFeeds;
    }

    static async getPlaceLength(places) {
        let _places = [];

        // places.forEach(element => {
        for (var i = 0; i < places.length; i++) {
            let placeId = places[i].place_id;

            let size = 0;
            // get document length
            await Firebase.firestore.collection("place").doc(placeId).collection("feed").get().then(snapshot => {
                size = snapshot.size;
                console.log('getPlaceLength()', size);
            });

            // places[i].length = size;
            _places[i].length = size;
        // });
        }

        console.log('_places', _places);
        
        return _places;
    }










}
