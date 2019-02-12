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
        Firebase.firestore.settings({ timestampsInSnapshots: true }); // Consider: remove
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

            reviews: [], // 내가 남긴 리뷰. (collection)
            replies: []
        };

        await Firebase.firestore.collection("users").doc(uid).set(profile);
    }

    static async updateProfile(uid, profile) {
        await Firebase.firestore.collection('users').doc(uid).update(profile);

        // ToDo: update firebase auth
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

    static subscribeToPlaceSize(placeId, callback) {
        return Firebase.firestore.collection("place").doc(placeId).onSnapshot(snap => {
            let count = 0;

            if (snap.exists) {
                const field = snap.data().count;
                if (field) count = field;
            }

            callback(count);
        });
    }

    static async createFeed(feedId, userUid, placeId, name, age, height, weight, location, image1Uri, image2Uri, image3Uri, image4Uri, note) {
        const timestamp = Firebase.getTimestamp();

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
            timestamp: timestamp
        };

        // 1. write feed first
        await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).set(feed);

        const userRef = Firebase.firestore.collection("users").doc(userUid);
        const placeRef = Firebase.firestore.collection("place").doc(placeId);

        await Firebase.firestore.runTransaction(async transaction => {
            const placeDoc = await transaction.get(placeRef);
            let count = 0;
            if (placeDoc.data()) {
                let field = placeDoc.data().count;
                if (field) count = field;
            }

            console.log('count', count);

            // 2. update the count
            // transaction.update(placeRef, { count: Number(count + 1) });
            transaction.set(placeRef, { count: Number(count + 1) });

            // 3. update (add fields to feeds in user profile)
            let data = {
                feeds: firebase.firestore.FieldValue.arrayUnion({
                    placeId: placeId,
                    feedId: feedId,
                    imageUri: image1Uri, // ToDo: update this after chaging
                    valid: true // ToDo: update this after removing
                })
            };

            transaction.update(userRef, data);
        });
    }

    static async deleteFeed(placeId, feedId) {
        const feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        const placeRef = Firebase.firestore.collection("place").doc(placeId);

        await Firebase.firestore.runTransaction(async transaction => {
            // update the count first!
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
        const timestamp = Firebase.getTimestamp();

        const review = {
            id: id,
            uid: userUid,
            rating: rating,
            comment: comment,
            timestamp: timestamp
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
                reviews: firebase.firestore.FieldValue.arrayUnion(item)
            };

            transaction.update(userRef, data);

            // reviewCount
            let reviewCount = feedDoc.data().reviewCount;
            console.log('reviewCount will be', reviewCount + 1);
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
                reviews: firebase.firestore.FieldValue.arrayRemove(item)
            };

            transaction.update(userRef, data);

            // reviewCount
            let reviewCount = feedDoc.data().reviewCount;
            console.log('reviewCount will be', reviewCount - 1);
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
        const timestamp = Firebase.getTimestamp();

        const replyData = {
            reply: {
                id: id,
                uid: userUid,
                comment: message,
                timestamp: timestamp
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
                    replies: firebase.firestore.FieldValue.arrayUnion(item)
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

                resolve(true);
            });
        });
    }

    //// database ////

    static async createChatRoom(uid, users, placeId, feedId, id, owner, addSystemMessage) {
        // const id = Util.uid(); // create chat room id

        const timestamp = Firebase.timestamp();

        const data = {
            id: id,
            timestamp: timestamp, // lastest timestamp
            contents: '', // lastest message
            users: users,
            placeId: placeId,
            feedId: feedId,
            owner
        };

        await Firebase.database.ref('chat').child(uid).child(id).set(data);

        // await Firebase.database.ref('chat').child(owner).child(id).set(data);

        // --
        // add a system message
        if (addSystemMessage) {
            const text = "Well you've come this far, might as well say something to her.";
            const message = {
                text,
                timestamp: timestamp,
                _system: true
            };

            await Firebase.database.ref('contents').child(id).push(message);
        }
        // --

        return data;
    }

    static loadChatRoom(uid, callback) {
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

    static loadMoreChatRoom(uid, timestamp, id, callback) {
        // console.log('timestamp', timestamp);

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
        const { timestamp: numberStamp, text, user, _system } = snapshot.val();
        const { key: _id } = snapshot;
        const createdAt = new Date(numberStamp);
        const system = _system !== undefined;

        if (system) {
            const message = {
                _id,
                text,
                createdAt,
                system
            };

            return message;
        } else {
            const message = {
                _id,
                text,
                createdAt,
                user,
                // image, video
            };

            return message;
        }
    };

    static parseValue = (snapshot, id) => {
        const array = [];
        snapshot.forEach(item => {
            // console.log(item.key, item.val());
            const key = item.key;
            const value = item.val();

            if (key !== id) {
                const { timestamp: numberStamp, text, user, _system } = value;
                const _id = key;
                const createdAt = new Date(numberStamp);
                const system = _system !== undefined;

                const message = {
                    _id,
                    text,
                    createdAt,
                    user,
                    system
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

    static loadMoreMessage(id, lastMessageTimestamp, lastMessageId, callback) {
        // console.log('timestamp', lastMessageTimestamp);

        console.log('loadMoreMessage', id, lastMessageTimestamp, lastMessageId);

        Firebase.database.ref('contents').child(id).orderByChild('timestamp').endAt(lastMessageTimestamp).limitToLast(20 + 1).once('value', snapshot => {
            if (snapshot.exists()) {
                callback(Firebase.parseValue(snapshot, lastMessageId));
            }
        });
    }

    //// send
    /*
    static uid() {
        return (Firebase.auth.currentUser || {}).uid;
    }
    */

    static user() {
        var user = Firebase.auth.currentUser;
        var name, email, photoUrl, uid, emailVerified;

        if (user !== null) {
            name = user.displayName;
            if (!name) name = 'Firebase Name'; // test
            email = user.email;
            photoUrl = user.photoURL;
            if (!photoUrl) photoUrl = "http://images.coocha.co.kr//upload/2018/09/mrsst/18/thumb4_139961481.jpg"; // test
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

    static getTimestamp() {
        return Date.now();
    }

    static timestamp() { // as a token that you use when inserting data into Realtime Database
        // return Firebase.database.ServerValue.TIMESTAMP;
        return firebase.database.ServerValue.TIMESTAMP;
    }

    static async sendMessage(id, message, post) {
        //// save contents ////
        // for (let i = 0; i < messages.length; i++) {
        // const { text, user } = messages[i];
        const { text, user } = message;

        let _user = {};
        _user._id = user._id; // save only _id

        // if (!text || text.length === 0) continue;
        if (!text || text.length === 0) return;

        const timestamp = Firebase.timestamp();

        const pushData = {
            text,
            // user,
            user: _user,
            timestamp: timestamp
        };

        await Firebase.database.ref('contents').child(id).push(pushData);

        
        //// update timestamp, contents to chat of sender ////
        const senderUid = post.users[0].uid;

        const updateData = {
            contents: text,
            timestamp: timestamp
        };

        await Firebase.database.ref('chat').child(senderUid).child(id).update(updateData);

        
        //// update timestamp, contents to chat of receiver ////
        const receiverUid = post.users[1].uid;

        const room = await Firebase.findChatRoomById(receiverUid, id);
        if (!room) {
            // create new chat room
            // --
            let users = []; // name, picture, uid
            users.push(post.users[1]);
            users.push(post.users[0]);

            await Firebase.createChatRoom(receiverUid, users, post.placeId, post.feedId, id, senderUid, false);
            // --
        }

        await Firebase.database.ref('chat').child(receiverUid).child(id).update(updateData);

        // }
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

        const uid = Firebase.user().uid;

        Firebase.database.ref('chat').child(uid).child(id).update(updateData);
    }
    */

    static async findChatRoomByPostId(myUid, postId) {
        let room = null;

        await Firebase.database.ref('chat').child(myUid).once('value').then(snapshot => {
            var BreakException = {};

            try {
                snapshot.forEach(item => {
                    // console.log(item.key, item.val());

                    // const key = item.key;
                    const value = item.val();

                    /*
                    const users = value.users;

                    if (users[1].pid === postId) {
                        room = value;
                    }
                    */
                    if (value.feedId === postId) {
                        // console.log('!!!!!!!!!!!', value);

                        room = value;

                        throw BreakException;
                    }
                });
            } catch (e) {
                if (e !== BreakException) throw e;
            }
        });

        return room;
    }

    static async findChatRoomById(myUid, chatRoomId) {
        let room = null;

        await Firebase.database.ref('chat').child(myUid).child(chatRoomId).once('value').then(snapshot => {
            const data = snapshot.val();
            console.log('room data', data);

            room = data;

            // return data;

            /*
                        snapshot.forEach(item => {
                            // console.log(item.key, item.val());
                            // const key = item.key;
                            const value = item.val();
            
                            if (value.feedId === postId) {
                                return value;
                            }
                        });
            */
        });

        return room;
    }

    static async deleteChatRoom(myUid, postId) {
        // 1. delete room
        await Firebase.database.ref('chat').child(myUid).child(postId).remove();

        // 2. delete chat contents
        // await Firebase.database.ref('contents').child(postId).remove();

        // ToDo: add message (000님이 방을 나갔습니다.)



        // 3. send notification

    }



}
