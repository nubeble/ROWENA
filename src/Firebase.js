import * as firebase from "firebase";
import "firebase/firestore";
import Util from './Util';
import { Geokit, LatLngLiteral } from 'geokit';

const config = {
    apiKey: "AIzaSyCT1LV1HF5REJw_SePsUeUdwFalo5IzrsQ",
    authDomain: "rowena-88cfd.firebaseapp.com",
    databaseURL: "https://rowena-88cfd.firebaseio.com",
    projectId: "rowena-88cfd",
    storageBucket: "rowena-88cfd.appspot.com",
    messagingSenderId: "457192015889"
};

// Firebase.instance = new Firebase();

const SERVER_ENDPOINT = "https://us-central1-rowena-88cfd.cloudfunctions.net/";


export default class Firebase {
    static auth: firebase.auth.Auth;
    static firestore: firebase.firestore.Firestore;
    static storage: firebase.storage.Storage;
    static database: firebase.database.Database;

    static init() {
        if (!firebase.apps.length) {
            firebase.initializeApp(config);

            Firebase.auth = firebase.auth();
            Firebase.firestore = firebase.firestore();
            Firebase.firestore.settings({ timestampsInSnapshots: true }); // Consider: remove
            Firebase.storage = firebase.storage();
            Firebase.database = firebase.database();
        }
    }


    //// firestore ////

    static deleteCollection(db, collectionPath, batchSize) {
        var collectionRef = db.collection(collectionPath);
        var query = collectionRef.orderBy('__name__').limit(batchSize);

        return new Promise((resolve, reject) => {
            Firebase.deleteQueryBatch(db, query, batchSize, resolve, reject);
        });
    }

    static deleteQueryBatch(db, query, batchSize, resolve, reject) {
        query.get()
            .then((snapshot) => {
                // When there are no documents left, we are done
                if (snapshot.size == 0) {
                    return 0;
                }

                // Delete documents in a batch
                // var batch = db.batch();
                var batch = Firebase.firestore.batch();
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });

                return batch.commit().then(() => {
                    return snapshot.size;
                });
            }).then((numDeleted) => {
                if (numDeleted === 0) {
                    resolve();
                    return;
                }

                // Recurse on the next process tick, to avoid
                // exploding the stack.
                process.nextTick(() => {
                    Firebase.deleteQueryBatch(db, query, batchSize, resolve, reject);
                });
            })
            .catch(reject);
    }

    static async getProfile(uid) {
        const userDoc = await Firebase.firestore.collection("users").doc(uid).get();
        if (userDoc.exists) return userDoc.data();

        return null;
    }

    static async createProfile(uid, name, email, phoneNumber) {
        const profile = {
            uid: uid,
            name: name,
            birthday: null,
            gender: null,
            place: null,
            email: email,
            phoneNumber: phoneNumber,
            picture: {
                // preview: null,
                uri: null
            },
            about: null,
            feeds: [],
            reviews: [],
            replies: [],
            likes: [],
            comments: [],
            receivedCommentsCount: 0,
            commentAdded: false,
            timestamp: Firebase.getTimestamp()
        };

        await Firebase.firestore.collection("users").doc(uid).set(profile);

        // update firebase auth
        let picture = null;
        const user = Firebase.auth.currentUser;
        await user.updateProfile({
            // displayName: "Jane Q. User",
            // photoURL: "https://example.com/jane-q-user/profile.jpg"
            displayName: name,
            photoURL: picture
        }).then(function () {
            // Update successful.
            console.log('Firebase.updateProfile', 'update successful.');
        }).catch(function (error) {
            // An error happened.
            console.log('Firebase.updateProfile', error);
        });
    }

    static async updateProfile(uid, profile) {
        console.log('Firebase.updateProfile');
        await Firebase.firestore.collection("users").doc(uid).update(profile);

        // update firebase auth
        const name = profile.name;
        let picture = null;
        if (profile.picture && profile.picture.uri) picture = profile.picture.uri;
        const user = Firebase.auth.currentUser;
        await user.updateProfile({
            // displayName: "Jane Q. User",
            // photoURL: "https://example.com/jane-q-user/profile.jpg"
            displayName: name,
            photoURL: picture
        }).then(function () {
            // Update successful.
            console.log('Firebase.updateProfile', 'update successful.');
        }).catch(function (error) {
            // An error happened.
            console.log('Firebase.updateProfile', error);
        });
    }

    static async deleteProfile(uid) {
        let result;

        // remove comments collection
        const db = Firebase.firestore.collection("users").doc(uid);
        const path = "comments";
        Firebase.deleteCollection(db, path, 10);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(db);
            if (!userDoc.exists) throw 'User document does not exist!';

            // remove storage
            const picture = userDoc.data().picture;
            if (picture.ref) {
                ref.delete();
            }

            // remove user document
            transaction.delete(db);
        }).then(() => {
            // console.log("Transaction successfully committed!");
            console.log("User document successfully deleted.");
            result = true;
        }).catch((error) => {
            console.log('Firebase.deleteProfile', error);
            result = false;
        });

        if (!result) return false;

        // delete firebase auth
        var user = Firebase.auth.currentUser;
        await user.delete().then(function () {
            // User deleted.
            console.log('Firebase auth deleted.');
        }).catch(function (error) {
            // An error happened.
            console.log('Firebase.deleteProfile', error);
            result = false;
        });

        // if (!result) return false;

        // await Firebase.auth.signOut();

        return result;
    }

    static async signOut(uid) {
        await Firebase.auth.signOut();


        // sign out all users
        const formData = new FormData();
        formData.append("uid", uid);

        await fetch(SERVER_ENDPOINT + "signOutUsers", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "multipart/form-data"
            },
            body: formData
        });
    }

    static async deleteToken(uid) {
        await Firebase.firestore.collection("tokens").doc(uid).delete();
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
                // nothing to do here
            } else {
                snap2.forEach((doc) => {
                    // console.log(doc.id, '=>', doc.data());
                    if (doc.exists) {
                        const data = doc.data();
                        if (data.count > 0) placeId = doc.id;
                    }
                });
            }
        } else {
            snap1.forEach((doc) => {
                // console.log(doc.id, '=>', doc.data());
                if (doc.exists) {
                    const data = doc.data();
                    if (data.count > 0) placeId = doc.id;
                }
            });
        }

        return placeId;
    }

    static subscribeToFeed(placeId, feedId, callback) {
        return Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).onSnapshot(snap => {
            const feed = snap.data();
            console.log('Firebase.subscribeToFeed, feed changed.');
            callback(feed);
        });
    }

    static subscribeToPlace(placeId, callback) {
        return Firebase.firestore.collection("place").doc(placeId).onSnapshot(snap => {
            /*
            let count = 0;

            if (snap.exists) {
                const field = snap.data().count;
                if (field) count = field;
            }

            callback(count);
            */

            const place = snap.data();
            console.log('Firebase.subscribeToPlace, place changed.');
            callback(place);
        });
    }

    static subscribeToProfile(uid, callback) {
        return Firebase.firestore.collection("users").doc(uid).onSnapshot(snap => {
            const user = snap.data();
            console.log('Firebase.subscribeToProfile, user changed.');
            callback(user);
        });
    }

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

    static async createFeed(feed, extra) {
        feed.likes = [];
        feed.reviewCount = 0;
        feed.averageRating = 0;
        feed.reviewStats = [0, 0, 0, 0, 0];
        feed.timestamp = Firebase.getTimestamp();
        feed.rn = Util.getRandomNumber();

        const coordinates: LatLngLiteral = { lat: feed.location.latitude, lng: feed.location.longitude };
        const hash: string = Geokit.hash(coordinates);

        feed.g = hash;
        feed.l = new firebase.firestore.GeoPoint(feed.location.latitude, feed.location.longitude);

        // 1. add feed
        await Firebase.firestore.collection("place").doc(feed.placeId).collection("feed").doc(feed.id).set(feed);

        // 2. update user profile & place
        const userRef = Firebase.firestore.collection("users").doc(feed.uid);
        const placeRef = Firebase.firestore.collection("place").doc(feed.placeId);

        await Firebase.firestore.runTransaction(async transaction => {
            // 2-1. place
            const placeDoc = await transaction.get(placeRef);
            if (!placeDoc.exists) {
                // new
                transaction.set(placeRef, {
                    count: 1, timestamp: feed.timestamp, name: feed.placeName, rn: feed.rn,
                    lat: extra.lat, lng: extra.lng
                });
            } else {
                // update
                let count = 0;
                let field = placeDoc.data().count;
                if (field) count = field; // never happen
                count++;

                transaction.update(placeRef, {
                    count, timestamp: feed.timestamp,
                    // name: feed.placeName, rn: feed.rn, lat: extra.lat, lng: extra.lng
                });
            }

            // 2-2. user profile (add fields to feeds in user profile)
            const data = {
                feeds: firebase.firestore.FieldValue.arrayUnion({
                    placeId: feed.placeId,
                    feedId: feed.id,
                    picture: feed.pictures.one.uri, // ToDo: update this when the post changed
                    reviewAdded: false
                })
            };

            transaction.update(userRef, data);
        });
    }

    static async removeFeed(uid, placeId, feedId) {
        let result;

        const feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        const placeRef = Firebase.firestore.collection("place").doc(placeId);
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const feedDoc = await transaction.get(feedRef);
            if (!feedDoc.exists) throw 'Feed document does not exist!';

            const placeDoc = await transaction.get(placeRef);
            if (!placeDoc.exists) throw 'Place document does not exist!';

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document does not exist!';


            // 1. delete storage
            const pictures = feedDoc.data().pictures;
            if (pictures.one.ref) {
                // await Firebase.storage.refFromURL(pictures.one.uri).delete();
                Firebase.storage.ref(pictures.one.ref).delete();
            }

            if (pictures.two.ref) {
                Firebase.storage.ref(pictures.two.ref).delete();
            }

            if (pictures.three.ref) {
                Firebase.storage.ref(pictures.three.ref).delete();
            }

            if (pictures.four.ref) {
                Firebase.storage.ref(pictures.four.ref).delete();
            }

            // 2. update the count first!
            let count = placeDoc.data().count;
            console.log('Firebase.removeFeed', 'current count', count);
            transaction.update(placeRef, { count: Number(count - 1) });

            // 3. remove feed
            transaction.delete(feedRef);

            // 4. update profile (remove fields to feeds in user profile)
            const { feeds } = userDoc.data();
            let index = -1;

            for (var i = 0; i < feeds.length; i++) {
                const item = feeds[i];
                if (item.placeId === placeId && item.feedId === feedId) {
                    index = i;
                    break;
                }
            }

            if (index === -1) { // add
                // nothing to do
            } else { // remove
                feeds.splice(index, 1);
            }

            transaction.update(userRef, { feeds });
        }).then(() => {
            // console.log("Transaction successfully committed!");
            result = true;
        }).catch((error) => {
            console.log('Firebase.removeFeed', error);
            result = false;
        });

        // if (!result) return false;

        /*
        // 3. update profile (remove fields to feeds in user profile)
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document does not exist!';

            const { feeds } = userDoc.data();
            let index = -1;

            for (var i = 0; i < feeds.length; i++) {
                const item = feeds[i];
                if (item.placeId === placeId && item.feedId === feedId) {
                    index = i;
                    break;
                }
            }

            if (index === -1) { // add
                // nothing to do
            } else { // remove
                feeds.splice(index, 1);
            }

            transaction.update(userRef, { feeds });
        }).then(() => {
            // console.log("Transaction successfully committed!");
            result = true;
        }).catch((error) => {
            console.log('Firebase.removeFeed', error);
            result = false;
        });
        */

        return result;
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

    static async updateLikes(uid, placeId, feedId, name, placeName, uri) {
        let result;

        const feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        const userRef = Firebase.firestore.collection("users").doc(uid);

        // update count to post
        await Firebase.firestore.runTransaction(async transaction => {
            const postDoc = await transaction.get(feedRef);
            if (!postDoc.exists) throw 'Post document does not exist!';

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'Profile document does not exist!';


            // 1.
            let { likes } = postDoc.data();
            const idx = likes.indexOf(uid);
            if (idx === -1) {
                likes.push(uid);
            } else {
                likes.splice(idx, 1);
            }

            transaction.update(feedRef, { likes });

            // 2.
            let { likes: userLikes } = userDoc.data();
            let _idx = -1;

            for (var i = 0; i < userLikes.length; i++) {
                const item = userLikes[i];
                if (item.placeId === placeId && item.feedId === feedId) {
                    _idx = i;
                    break;
                }
            }

            if (_idx === -1) { // add
                const data = { // LikeRef
                    placeId,
                    feedId,
                    picture: uri,
                    name,
                    placeName
                }
                userLikes.push(data);
            } else { // remove
                userLikes.splice(_idx, 1);
            }

            transaction.update(userRef, { likes: userLikes });
        }).then(() => {
            // console.log("Transaction successfully committed!");
            result = true;
        }).catch((error) => {
            console.log('Firebase.updateLikes', error);
            result = false;
        });

        if (!result) return false;

        // save to user profile
        /*
        await Firebase.firestore.runTransaction(async transaction => {
            const userRef = Firebase.firestore.collection("users").doc(uid);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'Profile document does not exist!';

            let { likes } = userDoc.data();
            let _idx = -1;

            for (var i = 0; i < likes.length; i++) {
                const item = likes[i];
                if (item.placeId === placeId && item.feedId === feedId) {
                    _idx = i;
                    break;
                }
            }

            if (_idx === -1) { // add
                const data = { // LikeRef
                    placeId,
                    feedId,

                    picture: uri,
                    name,
                    placeName
                }
                likes.push(data);
            } else { // remove
                likes.splice(_idx, 1);
            }

            transaction.update(userRef, { likes });
        }).then(() => {
            // console.log("Transaction successfully committed!");
            result = true;
        }).catch((error) => {
            console.log('Firebase.updateLikes', error);
            result = false;
        });
        */

        return true;
    }

    static async updateReviewChecked(uid, placeId, feedId, checked) {
        let result;

        const ownerRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const ownerDoc = await transaction.get(ownerRef);
            if (!ownerDoc.exists) throw 'Owner document does not exist!';


            let { feeds } = ownerDoc.data();
            for (var i = 0; i < feeds.length; i++) {
                let feed = feeds[i];
                if (feed.placeId === placeId && feed.feedId === feedId) {
                    // update
                    feed.reviewAdded = checked;
                    feeds[i] = feed;

                    transaction.update(ownerRef, { feeds });

                    break;
                }
            }
        }).then(() => {
            result = true;
        }).catch((error) => {
            console.log('Firebase.updateReviewChecked', error);
            result = false;
        });

        return result;
    }

    static async addReview(ownerUid, placeId, feedId, userUid, comment, rating, picture) {
        let result;

        const id = Util.uid();
        const timestamp = Firebase.getTimestamp();

        const review = {
            id: id,
            uid: userUid,
            rating: rating,
            comment: comment,
            timestamp: timestamp
        };

        // update - averageRating, reviewCount, reviews, stats
        const feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        const userRef = Firebase.firestore.collection("users").doc(userUid);

        await Firebase.firestore.runTransaction(async transaction => {
            const feedDoc = await transaction.get(feedRef);
            if (!feedDoc.exists) throw 'Post document does not exist!';

            // reviewCount
            let reviewCount = feedDoc.data().reviewCount;
            console.log('reviewCount will be', reviewCount + 1);

            // averageRating (number)
            const size = reviewCount;
            let averageRating = feedDoc.data().averageRating;
            let totalRating = averageRating * size;
            totalRating += review.rating;
            averageRating = totalRating / (size + 1);
            averageRating = averageRating.toFixed(1);
            console.log('averageRating', averageRating);

            // stats
            let reviewStats = feedDoc.data().reviewStats;
            if (rating === 1) {
                let value = reviewStats[4];
                if (value) {
                    value++
                } else {
                    value = 1;
                }
                reviewStats[4] = value;
            } else if (rating === 2) {
                let value = reviewStats[3];
                if (value) {
                    value++
                } else {
                    value = 1;
                }
                reviewStats[3] = value++;
            } else if (rating === 3) {
                let value = reviewStats[2];
                if (value) {
                    value++
                } else {
                    value = 1;
                }
                reviewStats[2] = value++;
            } else if (rating === 4) {
                let value = reviewStats[1];
                if (value) {
                    value++
                } else {
                    value = 1;
                }
                reviewStats[1] = value++;
            } else if (rating === 5) {
                let value = reviewStats[0];
                if (value) {
                    value++
                } else {
                    value = 1;
                }
                reviewStats[0] = value++;
            }

            transaction.update(feedRef, { reviewCount: Number(reviewCount + 1), averageRating: Number(averageRating), reviewStats: reviewStats });

            // add new review item (map) in reviews (array)
            const item = {
                placeId: placeId,
                feedId: feedId,
                reviewId: id,
                replyAdded: false,
                picture
            };

            let data = {
                reviews: firebase.firestore.FieldValue.arrayUnion(item)
            };

            transaction.update(userRef, data);
        }).then(() => {
            result = true;
        }).catch((error) => {
            console.log('Firebase.addReview', error);
            result = false;
        });

        if (!result) return false;

        // add
        await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(id).set(review);

        // update owner profile
        /*
        result = await Firebase.updateReviewChecked(ownerUid, placeId, feedId, true);

        return result;
        */
        Firebase.updateReviewChecked(ownerUid, placeId, feedId, true);

        return result;
    };

    static async removeReview(placeId, feedId, reviewId, userUid) {
        let result;

        // get review
        /*
        const reviewDoc = await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId).get();
        if (!reviewDoc.exists) return false;
        */

        const reviewRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId);
        const feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        const userRef = Firebase.firestore.collection("users").doc(userUid);

        // get rating
        const reviewDoc = await reviewRef.get();
        if (!reviewDoc.exists) return false;
        const rating = reviewDoc.data().rating; // reviewDoc.data(): rating, comment, timestamp

        // update - averageRating, reviewCount, reviews
        await Firebase.firestore.runTransaction(async transaction => {
            const feedDoc = await transaction.get(feedRef);
            if (!feedDoc.exists) throw 'Post document does not exist!';

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document does not exist!';


            // 1. reviewCount
            const reviewCount = feedDoc.data().reviewCount;
            console.log('reviewCount will be', reviewCount - 1);

            // 2. averageRating
            const size = reviewCount;
            let averageRating = feedDoc.data().averageRating;
            let totalRating = averageRating * size;
            totalRating -= rating;

            if (size - 1 === 0) { // to avoid 0 / 0
                averageRating = 0;
            } else {
                averageRating = totalRating / (size - 1);
                averageRating = averageRating.toFixed(1);
            }
            console.log('averageRating', averageRating);

            // 3. stats
            let reviewStats = feedDoc.data().reviewStats;
            if (rating === 1) {
                let value = reviewStats[4];
                reviewStats[4] = value--;
            } else if (rating === 2) {
                let value = reviewStats[3];
                reviewStats[3] = value--;
            } else if (rating === 3) {
                let value = reviewStats[2];
                reviewStats[2] = value--;
            } else if (rating === 4) {
                let value = reviewStats[1];
                reviewStats[1] = value--;
            } else if (rating === 5) {
                let value = reviewStats[0];
                reviewStats[0] = value--;
            }

            transaction.update(feedRef,
                { reviewCount: Number(reviewCount - 1), averageRating: Number(averageRating), reviewStats: reviewStats }
            );

            // remove review item (map) in reviews (array)
            /*
            const item = {
                placeId: placeId,
                feedId: feedId,
                reviewId: reviewId,


                picture,
                replyAdded,
            };

            const data = {
                reviews: firebase.firestore.FieldValue.arrayRemove(item)
            };

            transaction.update(userRef, data);
            */
            const { reviews } = userDoc.data();
            let index = -1;
            for (var i = 0; i < reviews.length; i++) {
                const item = reviews[i];
                if (item.reviewId === reviewId) {
                    index = i;
                    break;
                }
            }

            reviews.splice(index, 1);
            transaction.update(userRef, { reviews });
        }).then(() => {
            // console.log("Transaction successfully committed!");
            result = true;
        }).catch((error) => {
            console.log('Firebase.removeReview', error);
            result = false;
        });

        if (!result) return false;

        await reviewRef.delete();

        // Consider: just leave the reviewAdded value in host's user profile

        return true;
    }

    static async updateReplyChecked(placeId, feedId, uid, reviewId, checked) {
        let result;

        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document does not exist!';


            let { reviews } = userDoc.data();
            for (var i = 0; i < reviews.length; i++) {
                let review = reviews[i];
                if (review.placeId === placeId && review.feedId === feedId && review.reviewId === reviewId) {
                    // update
                    review.replyAdded = checked;
                    reviews[i] = review;

                    transaction.update(userRef, { reviews });

                    break;
                }
            }
        }).then(() => {
            result = true;
        }).catch((error) => {
            console.log('Firebase.updateReplyChecked', error);
            result = false;
        });

        return result;
    }

    static async addReply(placeId, feedId, reviewOwnerUid, reviewId, userUid, message) {
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

        // return await Firebase.updateReplyChecked(placeId, feedId, reviewOwnerUid, reviewId, true);
        Firebase.updateReplyChecked(placeId, feedId, reviewOwnerUid, reviewId, true);
    };

    static async removeReply(placeId, feedId, reviewId, replyId, userUid) {
        let reviewRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId);
        let userRef = Firebase.firestore.collection("users").doc(userUid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document does not exist!';


            transaction.update(reviewRef, { reply: firebase.firestore.FieldValue.delete() });

            /*
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
            */
            const { replies } = userDoc.data();
            let index = -1;
            for (var i = 0; i < replies.length; i++) {
                const item = replies[i];
                if (item.replyId === replyId) {
                    index = i;
                    break;
                }
            }

            replies.splice(index, 1);
            transaction.update(userRef, { replies });
        });

        // Consider: just leave the replyAdded value in guest's user profile
    }

    // comment
    // --
    static async addComment(uid, targetUid, comment, name, place, picture) { // uid: writer, targetUid: receiver, comment: string
        let result;

        const id = Util.uid(); // comment id
        const timestamp = Firebase.getTimestamp();

        const obj = {
            uid,
            comment,
            id,
            timestamp,
            name,
            place,
            picture
        };

        const writerRef = Firebase.firestore.collection("users").doc(uid); // writer (me)
        const receiverRef = Firebase.firestore.collection("users").doc(targetUid); // receiver
        const commentRef = receiverRef.collection("comments").doc(id);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(receiverRef);
            if (!userDoc.exists) throw 'User document does not exist!';


            // update reviewCount in user (receiver)
            let receivedCommentsCount = userDoc.data().receivedCommentsCount;
            if (!receivedCommentsCount) receivedCommentsCount = 0;
            console.log('receivedCommentsCount will be', receivedCommentsCount + 1);

            transaction.update(receiverRef, { receivedCommentsCount: Number(receivedCommentsCount + 1), commentAdded: true });

            // update comments array in user (writer)
            const item = {
                userUid: targetUid,
                commentId: id,

                name: userDoc.data().name,
                placeName: userDoc.data().place,
                picture: userDoc.data().picture.uri
            };

            let data = {
                comments: firebase.firestore.FieldValue.arrayUnion(item)
            };

            transaction.update(writerRef, data);
        }).then(() => {
            // console.log("Transaction successfully committed!");
            result = true;
        }).catch((error) => {
            console.log('Firebase.addComment', error);
            result = false;
        });

        if (!result) return false;

        // add (to receiver)
        await commentRef.set(obj);

        return true;
    };

    static async updateCommentChecked(uid, checked) {
        const profile = {
            commentAdded: checked
        };

        await Firebase.firestore.collection("users").doc(uid).update(profile);
    }

    static async removeComment(uid, targetUid, commentId) { // uid: writer, userUid: receiver
        let result;

        const writerRef = Firebase.firestore.collection("users").doc(uid); // Me (writer)
        const receiverRef = Firebase.firestore.collection("users").doc(targetUid); // You (receiver)
        const commentRef = receiverRef.collection("comments").doc(commentId);

        await Firebase.firestore.runTransaction(async transaction => {
            // update reviewCount in user (receiver)
            const userDoc = await transaction.get(receiverRef);
            if (!userDoc.exists) throw 'User document does not exist!';


            // 1. receivedCommentsCount
            let receivedCommentsCount = userDoc.data().receivedCommentsCount;
            console.log('receivedCommentsCount will be', receivedCommentsCount - 1);

            // 2. comments
            const { comments } = userDoc.data();
            let index = -1;
            for (var i = 0; i < comments.length; i++) {
                const item = comments[i];
                if (item.commentId === commentId) {
                    index = i;
                    break;
                }
            }

            comments.splice(index, 1);

            transaction.update(receiverRef, { receivedCommentsCount: Number(receivedCommentsCount - 1), comments });
        }).then(() => {
            // console.log("Transaction successfully committed!");
            result = true;
        }).catch((error) => {
            console.log('Firebase.removeComment', error);
            result = false;
        });

        if (!result) return false;

        // remove
        await commentRef.delete();

        return true;
    }
    // --

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
                system: true
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
            } else {
                callback(null);
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
            } else {
                callback(null);
            }
        });
    }

    // parse a received message
    static parseChild = snapshot => {
        const { timestamp: numberStamp, text, user, system } = snapshot.val();
        const { key: _id } = snapshot;
        const createdAt = new Date(numberStamp);
        const _system = system !== undefined;

        if (_system) {
            const message = {
                _id,
                text,
                createdAt,
                system: true
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
                const { timestamp: numberStamp, text, user, system } = value;
                const _id = key;
                const createdAt = new Date(numberStamp);
                const _system = system !== undefined;

                const message = {
                    _id,
                    text,
                    createdAt,
                    user,
                    system: _system
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
            if (!name) name = 'Anonymous'; // test
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

    static async sendMessage(id, message, isSameDay, post) {
        const { text, user } = message;

        let _user = {};
        _user._id = user._id; // save only _id

        if (!text || text.length === 0) return;

        const timestamp = Firebase.timestamp();

        /*
        if (!isSameDay) {
            const dateData = {
                text: "",
                timestamp: timestamp,
                system: true
            };

            await Firebase.database.ref('contents').child(id).push(dateData);
        }
        */

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
        console.log('Firebase.saveLastReadMessageId');

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

        let result;

        await Firebase.database.ref('chat').child(myUid).once('value').then(snapshot => {
            if (!snapshot.exists()) throw 'Chat - uid data does not exist!';

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
        }).then(() => {
            result = true;
        }).catch((error) => {
            console.log('Firebase.findChatRoomByPostId', error);
            result = false;
        });

        if (!result) return null;

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

    static async deleteChatRoom(myUid, myName, opponentUid, postId) {
        // 1. delete room (realtime database)
        await Firebase.database.ref('chat').child(myUid).child(postId).remove();

        // check if the opponent exists
        var opponentExists = false;
        await Firebase.database.ref('chat').child(opponentUid).child(postId).once('value').then(snapshot => {
            if (snapshot.exists()) opponentExists = true;
        });

        if (opponentExists) {
            // 2. add a system message
            const text = myName + " has left the chat room.";
            const timestamp = Firebase.timestamp();
            const message = {
                text,
                timestamp: timestamp,
                system: true
            };

            await Firebase.database.ref('contents').child(postId).push(message);
        } else {
            // 3. delete chat contents if all the users have left
            await Firebase.database.ref('contents').child(postId).remove();
        }
    }

    static async deleteChatRooms(myUid) {
        let result;

        await Firebase.database.ref('chat').child(myUid).once('value').then(snapshot => {
            if (!snapshot.exists()) throw 'Chat - uid data does not exist.';

            snapshot.forEach(async item => {
                // console.log(item.key, item.val());

                // const key = item.key;
                const value = item.val();

                const users = value.users;
                const feedId = value.feedId;

                const myUid = users[0].uid;
                const myName = users[0].name;
                const opponentUid = users[1].uid;

                await Firebase.deleteChatRoom(myUid, myName, opponentUid, feedId);
            });

        }).then(() => {
            result = true;
        }).catch((error) => {
            console.log('Firebase.deleteChatRooms', error);
            result = false;
        });

        return result;
    }



}
