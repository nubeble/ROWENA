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

    static async getProfile(uid) {
        const userDoc = await Firebase.firestore.collection("users").doc(uid).get();
        if (userDoc.exists) return userDoc.data();

        return null;
    }

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

            feeds: [], // 내가 등록한 feed. ToDo: feed 삭제 시 배열에서 삭제
            reviews: [], // 내가 남긴 리뷰. (collection)
            replies: [],
            likes: []
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

    static async getPlaceRandomFeedImage(placeId) {
        let uri = null;

        const random = Util.getRandomNumber();
        // console.log('random', random);

        const postsRef = Firebase.firestore.collection("place").doc(placeId).collection("feed");
        const snap1 = await postsRef.where("rn", ">", random).orderBy("rn").limit(1).get();
        if (snap1.docs.length === 0) {
            const snap2 = await postsRef.where("rn", "<", random).orderBy("rn", "desc").limit(1).get();
            if (snap2.docs.length === 0) {
                // this should never happen!
            } else {
                snap2.forEach((doc) => {
                    // console.log(doc.id, '=>', doc.data());
                    feedId = doc.data().id;
                    uri = doc.data().pictures.one.uri;
                    // console.log('< uri', uri);
                });
            }
        } else {
            snap1.forEach((doc) => {
                // console.log(doc.id, '=>', doc.data());
                feedId = doc.data().id;
                uri = doc.data().pictures.one.uri;
                // console.log('> uri', uri);
            });
        }

        return uri;
    }

    static async getRandomPlace() {
        let placeId = null;

        const random = Util.getRandomNumber();

        const postsRef = Firebase.firestore.collection("place");
        const snap1 = await postsRef.where("rn", ">", random).orderBy("rn").limit(1).get();
        if (snap1.docs.length === 0) {
            const snap2 = await postsRef.where("rn", "<", random).orderBy("rn", "desc").limit(1).get();
            if (snap2.docs.length === 0) {
                // this should never happen!
            } else {
                snap2.forEach((doc) => {
                    // console.log(doc.id, '=>', doc.data());
                    placeId = doc.id;
                });
            }
        } else {
            snap1.forEach((doc) => {
                // console.log(doc.id, '=>', doc.data());
                placeId = doc.id;
            });
        }

        return placeId;
    }

    /*
    static subscribeToFeed(placeId, feedId, callback) {
        return Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).onSnapshot(snap => {
            const feed = snap.data();
            console.log('Firebase.subscribeToFeed, feed changed.');
            callback(feed);
        });
    }
    */

    /*
    static async getFeedByAverageRating(placeId) { // 평점이 가장 높은 포스트
        let feed = null;

        const snap = await Firebase.firestore.collection("place").doc(placeId).collection("feed").orderBy("averageRating", "desc").limit(1).get();
        snap.forEach(feedDoc => {
            feed = feedDoc.data();
        });

        return feed;
    }
    */
    static async getFeedByAverageRating(placeId, size) {
        let feeds = [];

        const snap = await Firebase.firestore.collection("place").doc(placeId).collection("feed").orderBy("averageRating", "desc").limit(size).get();
        snap.forEach(feedDoc => {
            const feed = feedDoc.data();
            feeds.push(feed);
        });

        return feeds;
    }

    /*
    static async getFeedByTimestamp(placeId) { // 가장 최근에 생성된 포스트
        let feed = null;

        const snap = await Firebase.firestore.collection("place").doc(placeId).collection("feed").orderBy("timestamp", "desc").limit(1).get();
        snap.forEach(feedDoc => {
            feed = feedDoc.data();
        });

        return feed;
    }
    */
    static async getFeedByTimestamp(placeId, size) {
        let feeds = [];

        const snap = await Firebase.firestore.collection("place").doc(placeId).collection("feed").orderBy("timestamp", "desc").limit(size).get();
        snap.forEach(feedDoc => {
            const feed = feedDoc.data();
            feeds.push(feed);
        });

        return feeds;
    }

    /*
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
    */

    static async createFeed(feed) {
        feed.likes = [];
        feed.reviewCount = 0;
        feed.averageRating = 0.0;
        feed.timestamp = Firebase.getTimestamp();
        feed.rn = Util.getRandomNumber();

        // 1. add feed
        await Firebase.firestore.collection("place").doc(feed.placeId).collection("feed").doc(feed.id).set(feed);

        const userRef = Firebase.firestore.collection("users").doc(feed.uid);
        const placeRef = Firebase.firestore.collection("place").doc(feed.placeId);

        await Firebase.firestore.runTransaction(async transaction => {
            const placeDoc = await transaction.get(placeRef);
            let count = 0;
            if (placeDoc.exists) {
                let field = placeDoc.data().count;
                if (field) count = field;
            }

            // console.log('count', count);

            // 2. update the count & timestamp
            // transaction.update(placeRef, { count: Number(count + 1) });
            transaction.set(placeRef, { count: Number(count + 1), timestamp: feed.timestamp, name: feed.placeName, rn: feed.rn });

            // 3. update profile (add fields to feeds in user profile)
            const data = {
                feeds: firebase.firestore.FieldValue.arrayUnion({
                    placeId: feed.placeId,
                    feedId: feed.id,
                    picture: feed.pictures.one.uri, // ToDo: update this after changing
                    valid: true // ToDo: update this after removing
                })
            };

            transaction.update(userRef, data);
        });
    }

    static async removeFeed(uid, placeId, feedId) {
        const feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        const placeRef = Firebase.firestore.collection("place").doc(placeId);

        await Firebase.firestore.runTransaction(async transaction => {
            // 1. update the count first!
            const placeDoc = await transaction.get(placeRef);
            if (!placeDoc.exists) throw 'Place document does not exist!';

            let count = placeDoc.data().count;
            console.log('Firebase.removeFeed', 'current count', count);

            transaction.update(placeRef, { count: Number(count - 1) });

            // 2. remove feed
            transaction.delete(feedRef);
        }).then(() => {
            // console.log("Transaction successfully committed!");
        }).catch((error) => {
            console.log('Firebase.removeFeed', error);
            return false;
        });

        // 3. update profile (remove fields to feeds in user profile)
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document does not exist!';

            const { feeds } = userDoc.data();
            let _idx = -1;

            for (var i = 0; i < feeds.length; i++) {
                const item = feeds[i];
                if (item.placeId === placeId && item.feedId === feedId) {
                    _idx = i;
                    break;
                }
            }

            if (_idx === -1) { // add
                // nothing to do
            } else { // remove
                feeds.splice(_idx, 1);
            }

            transaction.update(userRef, { feeds });
        }).then(() => {
            // console.log("Transaction successfully committed!");
        }).catch((error) => {
            console.log('Firebase.removeFeed', error);
            return false;
        });

        return true;
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

    static async updateLikes(uid, placeId, feedId, uri) {
        // update count
        await Firebase.firestore.runTransaction(async transaction => {
            const feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
            const postDoc = await transaction.get(feedRef);
            if (!postDoc.exists) throw 'Post document does not exist!';

            const { likes } = postDoc.data();
            const idx = likes.indexOf(uid);
            if (idx === -1) {
                likes.push(uid);
            } else {
                likes.splice(idx, 1);
            }

            transaction.update(feedRef, { likes });
        }).then(() => {
            // console.log("Transaction successfully committed!");
        }).catch((error) => {
            console.log('Firebase.updateLikes', error);
            return false;
        });

        // save to user profile
        await Firebase.firestore.runTransaction(async transaction => {
            const userRef = Firebase.firestore.collection("users").doc(uid);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'Profile document does not exist!';

            const { likes } = userDoc.data();
            let _idx = -1;

            for (var i = 0; i < likes.length; i++) {
                const item = likes[i];
                if (item.placeId === placeId && item.feedId === feedId) {
                    _idx = i;
                    break;
                }
            }

            if (_idx === -1) { // add
                const data: LikeRef = {
                    placeId: placeId,
                    feedId: feedId,
                    picture: uri,
                    valid: true // ToDo: update this after removing
                }
                likes.push(data);
            } else { // remove
                likes.splice(_idx, 1);
            }

            transaction.update(userRef, { likes });
        }).then(() => {
            // console.log("Transaction successfully committed!");
            // result = true;
        }).catch((error) => {
            console.log('Firebase.updateLikes', error);
            return false;
        });

        return true;
    }

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

        const feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        const userRef = Firebase.firestore.collection("users").doc(userUid);

        // save later
        // await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(id).set(review);

        // update - averageRating, reviews, reviewCount

        let size = await Firebase.getReviewsSize(placeId, feedId);
        if (size === -1) return false;

        await Firebase.firestore.runTransaction(async transaction => {
            // averageRating (number)
            const feedDoc = await transaction.get(feedRef);
            if (!feedDoc.exists) throw 'Post document does not exist!';

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
        }).then(() => {
            // console.log("Transaction successfully committed!");
            // result = true;
        }).catch((error) => {
            console.log('Firebase.addReview', error);
            return false;
        });

        await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(id).set(review);

        return true;
    };

    static async removeReview(placeId, feedId, reviewId, userUid) {
        const reviewDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId).get();
        if (!reviewDoc.exists) return false;

        let rating = reviewDoc.data().rating; // rating, comment, timestamp

        // 업데이트 3개 - averageRating, reviews, reviewCount

        let feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        let userRef = Firebase.firestore.collection("users").doc(userUid);

        let size = await Firebase.getReviewsSize(placeId, feedId);
        if (size === -1) return false;

        await Firebase.firestore.runTransaction(async transaction => {
            // averageRating (number)
            const feedDoc = await transaction.get(feedRef);
            if (!feedDoc.exists) throw 'Post document does not exist!';

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
        }).then(() => {
            // console.log("Transaction successfully committed!");
        }).catch((error) => {
            console.log('Firebase.removeReview', error);
            return false;
        });

        await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId).delete();

        return true;
    }

    static async getReviewsSize(placeId, feedId) {
        let size = -1;

        /*
        await Firebase.firestore.collection("place").doc(placeId).collection("feed")
            .doc(feedId).collection("reviews").get().then(snap => {
                size = snap.size;
            });
        */
        const feedDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).get();
        if (feedDoc.exists) {
            const field = feedDoc.data().reviewCount;
            size = field;
        }

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
            // return new Promise(resolve => {
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

            // resolve(true);
            // });
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
        const timestamp = Firebase.timestamp();

        const data = {
            id: id,
            timestamp: timestamp, // lastest timestamp
            contents: '', // lastest message text
            // mid: null, // lastest message id
            // lastReadMessageId: null, // last read message id
            users: users,
            placeId: placeId,
            feedId: feedId,
            owner
        };

        await Firebase.database.ref('chat').child(uid).child(id).set(data);

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

    static loadMoreChatRoom(count, uid, timestamp, id, callback) {
        // console.log('timestamp', timestamp);

        Firebase.database.ref('chat').child(uid).orderByChild('timestamp').endAt(timestamp).limitToLast(count + 1).once('value', snapshot => {
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

    // parse a received message
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
        console.log('loadMoreMessage', id, lastMessageTimestamp, lastMessageId);

        Firebase.database.ref('contents').child(id).orderByChild('timestamp').endAt(lastMessageTimestamp).limitToLast(20 + 1).once('value', snapshot => {
            if (snapshot.exists()) {
                callback(Firebase.parseValue(snapshot, lastMessageId));
            }
        });
    }

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

        const snap = await Firebase.database.ref('contents').child(id).push(pushData);
        // "https://rowena-88cfd.firebaseio.com/contents/e1cee3fe-21e6-1ba0-4db2-59b38b615c6b/-LYoaoDio_CJ_WwOC4mX"

        // console.log('type', snap.key);
        const mid = snap.key;

        //// update the latest message info (timestamp, contents, message id) to chat of sender ////
        const senderUid = post.users[0].uid;

        const updateData = {
            contents: text,
            timestamp: timestamp,
            mid: mid
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

            await Firebase.createChatRoom(receiverUid, users, post.placeId, post.feedId, id, post.owner, false);
            // --
        }

        await Firebase.database.ref('chat').child(receiverUid).child(id).update(updateData);
    };

    static async saveLastReadMessageId(uid, id, mid) {
        const updateData = {
            lastReadMessageId: mid
        };

        await Firebase.database.ref('chat').child(uid).child(id).update(updateData);
    }

    static async getLastChatRoom(uid) {
        let result = null;

        const snapshot = await Firebase.database.ref('chat').child(uid).orderByChild('timestamp').limitToLast(1).once('value');
        if (snapshot.exists()) {

            snapshot.forEach(item => {
                // console.log(item.key, item.val());
                const key = item.key;
                const value = item.val();

                console.log('value', value);

                result = value;
            });
        }

        return result;
    }

    /*
    static async saveUnreadChatRoomId(uid, chatRoomId) {

        const item = {
            id: chatRoomId
        }

        let userData = {
            unreadChatRooms: firebase.firestore.FieldValue.arrayUnion(item)
        };

        await Firebase.firestore.collection('users').doc(uid).update(userData);
    }
    */

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
        // 1. delete room (realtime database)
        await Firebase.database.ref('chat').child(myUid).child(postId).remove();

        // 2. delete chat contents
        // await Firebase.database.ref('contents').child(postId).remove();

        // ToDo: add message (000님이 방을 나갔습니다.)


    }



}
