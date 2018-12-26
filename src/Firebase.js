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

            feeds: [], // 내가 등록한 feed. ToDo: 삭제 시 배열을 전체 검색
            /*
            {
                'placeId': 'ChIJ82ENKDJgHTERIEjiXbIAAQE',
                'feedId': '965b0af6-d189-3190-bf6c-9d2e4535deb5'
            },
            {
                'placeId': 'ChIJ82ENKDJgHTERIEjiXbIAAQE',
                'feedId': '965b0af6-d189-3190-bf6c-9d2e4535deb5'
            },
            ...
            */

            reviews: [], // 내가 남긴 리뷰.
            replies: []
        };

        await Firebase.firestore.collection("users").doc(uid).set(profile);
    }

    static async deleteProfile(uid) {
        await Firebase.firestore.collection("users").doc(uid).delete();
    }

    static async createFeed(feedId, userUid, placeId, name, age, height, weight, location, image1Uri, image2Uri, image3Uri, image4Uri, note) {
        const feed = {
            uid: userUid,
            placeId: placeId,
            name: name,
            age: age,
            height: height,
            weight: weight,
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

            // reviews: [], // collection

            // 총 리뷰 갯수 - reviews.length
            averageRating: 0.0, // 리뷰가 추가될 때마다 다시 계산해서 업데이트

            timestamp: Date.now()
        };

        const feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        const userRef = Firebase.firestore.collection("users").doc(userUid);
        const placeRef = Firebase.firestore.collection("place").doc(placeId);

        await Firebase.firestore.runTransaction(async transaction => {
            // update count first
            transaction.get(placeRef).then(async function(doc) {
                if (doc.exists) {
                    let count = 0;

                    let field = doc.data().count;
                    if (field) {
                        count = field;
                    }

                    // 1. count
                    console.log('count', count);
                    transaction.update(placeRef, { count: Number(count + 1) });

                    transaction.set(feedRef, feed);

                } else {
                    // doc not created yet

                    // 1. then write feed first
                    await transaction.set(feedRef, feed);

                    // 2. then write count 1
                    transaction.update(placeRef, { count: 1 });
                    
                }

                
            });

            /*
            const placeDoc = await transaction.get(placeRef);
            if (placeDoc.exists) {
                let count = placeDoc.data().count;
            }
            console.log('count', count);
            transaction.update(placeRef, { count: Number(count + 1) });
            */

            // 1. write feed
            // transaction.set(feedRef, feed);

            // 2. write count



            // 3. add fields to feeds in user profile
            let data = {
                feeds: firebase.firestore.FieldValue.arrayUnion({
                    placeId: placeId,
                    feedId: feedId
                })
            };

            transaction.update(userRef, data);
        });
    }

    static async deleteFeed(placeId, feedId) {
        // await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).delete();

        const feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        const placeRef = Firebase.firestore.collection("place").doc(placeId);

        await Firebase.firestore.runTransaction(async transaction => {
            // update count first!
            const placeDoc = await transaction.get(placeRef);
            let count = placeDoc.data().count;
            console.log('count', count);
            transaction.update(placeRef, { count: Number(count - 1) });

            transaction.delete(feedRef);
        });
    }

    /*
    static async getUserFeeds(profile) { // user posted feeds
        const feeds = profile.feeds; // object NOT map

        const keys = Object.keys(feeds);
        console.log('user feeds length', keys.length);

        let userFeeds = [];

        for (i = 0; i < keys.length; i++) { // map
            var num = i;
            var key = num.toString();

            var value = feeds.get(key);

            const feedDoc = await Firebase.firestore.collection("place").doc(value.placeId).collection("feed").doc(value.feedId).get();

            userFeeds.push(feedDoc.data());
        }

        console.log('userFeeds', userFeeds);

        return userFeeds;
    }
    */

    static async addReview(placeId, feedId, userUid, comment, rating) {
        const id = Util.uid();

        const review = {
            id: id,
            uid: userUid,
            rating: rating,
            comment: comment,
            timestamp: Date.now()
        };

        // await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").add(review);
        await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(id).set(review);


        // 업데이트 2개 - averageRating, reviews

        let feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        let userRef = Firebase.firestore.collection("users").doc(userUid);

        let size = await Firebase.getReviewsSize(placeId, feedId);
        // console.log('returned size', size);

        await Firebase.firestore.runTransaction(async transaction => {
            // averageRating (number)
            const feedDoc = await transaction.get(feedRef);
            let averageRating = feedDoc.data().averageRating;
            let totalRating = averageRating * (size - 1);
            totalRating += review.rating;
            averageRating = totalRating / size;
            averageRating = averageRating.toFixed(1);
            console.log('averageRating', averageRating);
            transaction.update(feedRef, { averageRating: Number(averageRating) });

            // add new review item (map) in reviews (array)
            const item = {
                placeId: placeId,
                feedId: feedId,
                reviewId: id
            };

            let data = {
                reviews: firebase.firestore.FieldValue.arrayUnion(item)
            };

            transaction.update(userRef, data);
        });
    };

    static async removeReview(placeId, feedId, reviewId, userUid) {
        const reviewDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId).get();
        let rating = reviewDoc.data().rating; // rating, comment, timestamp

        // 업데이트 2개 - averageRating, reviews

        let feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        let userRef = Firebase.firestore.collection("users").doc(userUid);

        let size = await Firebase.getReviewsSize(placeId, feedId);

        await Firebase.firestore.runTransaction(async transaction => {
            // averageRating (number)
            const feedDoc = await transaction.get(feedRef);
            let averageRating = feedDoc.data().averageRating;
            let totalRating = averageRating * size;
            totalRating -= rating;
            averageRating = totalRating / (size - 1);
            averageRating = averageRating.toFixed(1);
            console.log('averageRating', averageRating);
            transaction.update(feedRef, { averageRating: Number(averageRating) });

            // remove review item (map) in reviews (array)
            const item = {
                placeId: placeId,
                feedId: feedId,
                reviewId: reviewId
            };

            let data = {
                reviews: firebase.firestore.FieldValue.arrayRemove(item)
            };

            await transaction.update(userRef, data);
        });

        await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId).delete();
    }

    static async getReviewsSize(placeId, feedId) {
        let size = -1;

        await Firebase.firestore.collection("place").doc(placeId).collection("feed")
            .doc(feedId).collection("reviews").get().then(snap => {
                size = snap.size;
            });

        return size;
    }

    static async addReply(placeId, feedId, reviewId, userUid, message) {
        const id = Util.uid(); // reply id

        const replyData = {
            reply: {
                id: id,
                uid: userUid,
                comment: message,
                timestamp: Date.now()
            }
        };

        // add reply ref in profile (userUid)
        let reviewRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId);
        let userRef = Firebase.firestore.collection("users").doc(userUid);

        await Firebase.firestore.runTransaction(async transaction => {
            transaction.update(reviewRef, replyData);

            const item = {
                placeId: placeId,
                feedId: feedId,
                reviewId: reviewId,
                replyId: id
            };

            let userData = {
                replies: firebase.firestore.FieldValue.arrayUnion(item)
            };

            transaction.update(userRef, userData);
        });
    };

    static async removeReply(placeId, feedId, reviewId, replyId, userUid) {
        let reviewRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId);
        let userRef = Firebase.firestore.collection("users").doc(userUid);

        await Firebase.firestore.runTransaction(async transaction => {
            transaction.update(reviewRef, { reply: firebase.firestore.FieldValue.delete() });

            const item = {
                placeId: placeId,
                feedId: feedId,
                reviewId: reviewId,
                replyId: replyId
            };

            let data = {
                replies: firebase.firestore.FieldValue.arrayRemove(item)
            };

            transaction.update(userRef, data);
        });
    }


}
