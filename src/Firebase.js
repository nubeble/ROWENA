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

// Firebase.instance = new Firebase();

export default class Firebase {
    static auth: firebase.auth.Auth;
    static firestore: firebase.firestore.Firestore;
    static storage: firebase.storage.Storage;
    static database: firebase.database.Database;

    static init() {
        firebase.initializeApp(config);

        Firebase.auth = firebase.auth();
        Firebase.firestore = firebase.firestore();
        Firebase.firestore.settings({ timestampsInSnapshots: true });
        Firebase.storage = firebase.storage();
        Firebase.database = firebase.database();
    }


    //// firestore ////

    static async createProfile(uid, name, email, phoneNumber) {
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

    static async updateProfile(profile) {
        const { uid } = Firebase.auth.currentUser;

        await Firebase.firestore.collection('users').doc(uid).update(profile);

        // ToDo: update info to firebase auth
        /*
        Firebase.auth.currentUser.updateProfile({
            displayName: "Jane Q. User",
            photoURL: "https://example.com/jane-q-user/profile.jpg"
        }).then(function () {
            // Update successful.
        }).catch(function (error) {
            // An error happened.
        });
        */
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
            reviewCount: 0, // 총 리뷰 개수

            averageRating: 0.0, // 리뷰가 추가될 때마다 다시 계산해서 업데이트

            timestamp: Date.now()
        };

        // 1. write feed first
        await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).set(feed);

        const userRef = Firebase.firestore.collection("users").doc(userUid);
        const placeRef = Firebase.firestore.collection("place").doc(placeId);

        await Firebase.firestore.runTransaction(async transaction => {
            // 1. get
            const placeDoc = await transaction.get(placeRef);
            let count = 0;
            if (placeDoc.data()) {
                let field = placeDoc.data().count;
                if (field) count = field;
            }

            console.log('count', count);

            // 2. update
            // transaction.update(placeRef, { count: Number(count + 1) });
            transaction.set(placeRef, { count: Number(count + 1) });

            // 3. update (add fields to feeds in user profile)
            let data = {
                /*
                feeds: firebase.firestore.FieldValue.arrayUnion({
                    placeId: placeId,
                    feedId: feedId
                })
                */
                feeds: Firebase.firestore.FieldValue.arrayUnion({
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


        // 업데이트 3개 - averageRating, reviews, reviewCount

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
                // reviews: firebase.firestore.FieldValue.arrayUnion(item)
                reviews: Firebase.firestore.FieldValue.arrayUnion(item)
            };

            transaction.update(userRef, data);

            // reviewCount
            let reviewCount = feedDoc.data().reviewCount;
            console.log('reviewCount', reviewCount);
            transaction.update(feedRef, { reviewCount: Number(reviewCount + 1) });
        });
    };

    static async removeReview(placeId, feedId, reviewId, userUid) {
        const reviewDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId).get();
        let rating = reviewDoc.data().rating; // rating, comment, timestamp

        // 업데이트 3개 - averageRating, reviews, reviewCount

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
                // reviews: firebase.firestore.FieldValue.arrayRemove(item)
                reviews: Firebase.firestore.FieldValue.arrayRemove(item)
            };

            transaction.update(userRef, data);

            // reviewCount
            let reviewCount = feedDoc.data().reviewCount;
            console.log('reviewCount', reviewCount);
            transaction.update(feedRef, { reviewCount: Number(reviewCount - 1) });
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

        await Firebase.firestore.runTransaction(transaction => {
            return new Promise(resolve => {
                transaction.update(reviewRef, replyData);

                const item = {
                    placeId: placeId,
                    feedId: feedId,
                    reviewId: reviewId,
                    replyId: id
                };

                let userData = {
                    // replies: firebase.firestore.FieldValue.arrayUnion(item)
                    replies: Firebase.firestore.FieldValue.arrayUnion(item)
                };

                transaction.update(userRef, userData);

                resolve(true);
            });
        });
    };

    static async removeReply(placeId, feedId, reviewId, replyId, userUid) {
        let reviewRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId);
        let userRef = Firebase.firestore.collection("users").doc(userUid);

        await Firebase.firestore.runTransaction(transaction => {
            return new Promise(resolve => {
                // transaction.update(reviewRef, { reply: firebase.firestore.FieldValue.delete() });
                transaction.update(reviewRef, { reply: Firebase.firestore.FieldValue.delete() });

                const item = {
                    placeId: placeId,
                    feedId: feedId,
                    reviewId: reviewId,
                    replyId: replyId
                };

                let data = {
                    replies: Firebase.firestore.FieldValue.arrayRemove(item)
                };

                transaction.update(userRef, data);

                resolve(true);
            });
        });
    }

    //// database ////

    static createChatRoom(users) {
        const uid = Firebase.uid(); // user uid
        const id = Util.uid(); // chat room id

        const data = {
            id: id,
            // timestamp: 9999999999999,
            timestamp: 1111111111111,
            contents: 'last message',
            users: users
        };

        Firebase.database.ref('chat').child(uid).child(id).set(data);
    }

    static loadChatRoom = callback => {
        const uid = Firebase.uid(); // user uid

        Firebase.database.ref('chat').child(uid).orderByChild('timestamp').limitToLast(10).on('value', snapshot => {
            if (snapshot.exists()) {
                // invert the results
                let list = [];
                Util.reverseSnapshot(snapshot).forEach(child => {
                    list.push(child.val());
                });

                callback(list);
            }
        });
    }

    static loadMoreChatRoom = (timestamp, id, callback) => {
        // console.log('timestamp', timestamp);

        const uid = Firebase.uid(); // user uid

        Firebase.database.ref('chat').child(uid).orderByChild('timestamp').endAt(timestamp).limitToLast(10 + 1).once('value', snapshot => {
            if (snapshot.exists()) {
                // invert the results
                let list = [];
                Util.reverseSnapshot(snapshot).forEach(child => {
                    if (child.val().id !== id) { // filter by id
                        list.push(child.val());
                    }
                });

                callback(list);
            }
        });
    }

    //// receive

    static parseChild = snapshot => {
        const { timestamp: numberStamp, text, user } = snapshot.val();
        const { key: _id } = snapshot;

        const timestamp = new Date(numberStamp);

        const message = {
            _id,
            timestamp,
            text,
            user
        };

        return message;
    };

    static parseValue = (snapshot, id) => {
        const array = [];
        snapshot.forEach(item => {
            // console.log(item.key, item.val());
            const key = item.key;
            const value = item.val();

            if (key !== id) {
                const { timestamp: numberStamp, text, user } = value;
                const _id = key;
                const timestamp = new Date(numberStamp);

                const message = {
                    _id,
                    timestamp,
                    text,
                    user
                };

                array.push(message);
            }
        });

        if (array.length === 0) return null;

        return array.reverse();
    };

    static chatOn = (id, callback) => {
        Firebase.database.ref('contents').child(id).orderByChild('timestamp').limitToLast(20).on('child_added', snapshot => {
            if (snapshot.exists()) {
                callback(Firebase.parseChild(snapshot));
            }
        });
    }

    static chatOff(id) {
        Firebase.database.ref('contents').child(id).off();
    }

    static loadMoreMessage = (id, lastMessageTimestamp, lastMessageId, callback) => {
        // console.log('timestamp', lastMessageTimestamp);

        Firebase.database.ref('contents').child(id).orderByChild('timestamp').endAt(lastMessageTimestamp).limitToLast(20 + 1).once('value', snapshot => {
            if (snapshot.exists()) {
                callback(Firebase.parseValue(snapshot, lastMessageId));
            }
        });
    }

    //// send

    static uid() {
        return (Firebase.auth.currentUser || {}).uid;
    }

    static user() {
        var user = Firebase.auth.currentUser;
        var name, email, photoUrl, uid, emailVerified;

        if (user != null) {
            name = user.displayName;
            email = user.email;
            photoUrl = user.photoURL;
            emailVerified = user.emailVerified;
            uid = user.uid;
        }

        const data = {
            name: name,
            email: email,
            photoUrl: photoUrl,
            emailVerified: emailVerified,
            uid, uid
        };

        return data;
    }

    static timestamp() {
        // return Firebase.database.ServerValue.TIMESTAMP;
        return firebase.database.ServerValue.TIMESTAMP;
    }

    static sendMessage(id, messages) {
        for (let i = 0; i < messages.length; i++) {
            const { text, user } = messages[i];
            const timestamp = Firebase.timestamp();

            const pushData = {
                text,
                user,
                timestamp: timestamp
            };
    
            // Firebase.database.ref('chat' + '/' + id + '/contents').push(data);
            Firebase.database.ref('contents').child(id).push(pushData);
    
            // update timestamp, contents to chat
    
            const updateData = {
                contents: text,
                timestamp: timestamp
            };
    
            const uid = Firebase.uid();
    
            Firebase.database.ref('chat').child(uid).child(id).update(updateData);
        }
    };

    // tmp
    /*
    static send(id, user, text) { // 2. add chat contents
        const timestamp = Firebase.timestamp();

        const pushData = {
            text,
            user,
            timestamp: timestamp
        };

        // Firebase.database.ref('chat' + '/' + id + '/contents').push(data);
        Firebase.database.ref('contents').child(id).push(pushData);

        // update timestamp, contents to chat

        const updateData = {
            contents: text,
            timestamp: timestamp
        };

        const uid = Firebase.uid();

        Firebase.database.ref('chat').child(uid).child(id).update(updateData);
    }
    */


}
