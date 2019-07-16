import * as firebase from "firebase";
import "firebase/firestore";
import Util from './Util';
import { Geokit, LatLngLiteral } from 'geokit';
import _ from 'lodash';

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
        let collectionRef = db.collection(collectionPath);
        let query = collectionRef.orderBy('__name__').limit(batchSize);

        return new Promise((resolve, reject) => {
            Firebase.deleteQueryBatch(db, query, batchSize, resolve, reject);
        });
    }

    static deleteQueryBatch(db, query, batchSize, resolve, reject) {
        query.get().then((snapshot) => {
            // When there are no documents left, we are done
            if (snapshot.size == 0) {
                return 0;
            }

            // Delete documents in a batch
            // let batch = db.batch();
            const batch = Firebase.firestore.batch();
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

            // Recurse on the next process tick, to avoid exploding the stack.
            process.nextTick = setImmediate;
            process.nextTick(() => {
                Firebase.deleteQueryBatch(db, query, batchSize, resolve, reject);
            });
        }).catch(reject);
    }

    static async setToken(uid, data) {
        await Firebase.firestore.collection("tokens").doc(uid).set(data).then(function () {
            console.log('Firebase.setToken', 'set successful.');
        }).catch(function (error) {
            console.log('Firebase.setToken', error);
        });
    }

    static async deleteToken(uid) {
        await Firebase.firestore.collection("tokens").doc(uid).delete();
    }

    static async getProfile(uid) {
        const userDoc = await Firebase.firestore.collection("users").doc(uid).get();
        if (userDoc.exists) return userDoc.data();

        return null;
    }

    static async createProfile(uid, name, email, phoneNumber, photoURL) {
        const time = Firebase.getTimestamp();

        const profile = {
            uid: uid,
            name: name,
            birthday: null,
            gender: null,
            place: null,
            email: email,
            phoneNumber: phoneNumber,
            picture: {
                uri: photoURL,
                ref: null
            },
            about: null,
            feeds: [],
            reviews: [],
            replies: [],
            likes: [],
            comments: [],
            receivedCommentsCount: 0,
            commentAdded: false,
            timestamp: time,
            activating: false,
            lastLogInTime: time
        };

        await Firebase.firestore.collection("users").doc(uid).set(profile);

        // update firebase auth
        const user = Firebase.auth.currentUser;
        await user.updateProfile({
            // displayName: "Jane Q. User",
            // photoURL: "https://example.com/jane-q-user/profile.jpg"
            displayName: name,
            photoURL
        }).then(function () {
            console.log('Firebase.createProfile', 'update successful.');
        }).catch(function (error) {
            console.log('Firebase.createProfile', error);
        });
    }

    static async removeProfilePictureRef(ref) {
        await Firebase.storage.ref(ref).delete();
    }

    static async updateProfile(uid, profile, updateAuth) {
        // 2. update user doc
        await Firebase.firestore.collection("users").doc(uid).update(profile).then(function () {
            console.log('Firebase.updateProfile', 'update successful.');
        }).catch(function (error) {
            console.log('Firebase.updateProfile', error);
        });

        // 3. update firebase auth
        if (updateAuth) {
            const name = profile.name;
            let uri = null;
            if (profile.picture.uri) uri = profile.picture.uri;
            const user = Firebase.auth.currentUser;
            await user.updateProfile({
                // displayName: "Jane Q. User",
                // photoURL: "https://example.com/jane-q-user/profile.jpg"
                displayName: name,
                photoURL: uri
            }).then(function () {
                console.log('Firebase.updateProfile, update firebase auth', 'update successful.');
            }).catch(function (error) {
                console.log('Firebase.updateProfile, update firebase auth', error);
            });
        }
    }

    static async updateProfilePicture(uid, data) {
        await Firebase.firestore.collection("users").doc(uid).update(data);

        const uri = data.picture.uri;
        await user.updateProfile({
            photoURL: uri
        }).then(function () {
            console.log('Firebase.updateProfilePicture', 'update successful.');
        }).catch(function (error) {
            console.log('Firebase.updateProfilePicture', error);
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
            if (!userDoc.exists) throw 'User document not exist!';

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
        let user = Firebase.auth.currentUser;
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
        // sign out all users
        const formData = new FormData();
        formData.append("uid", uid);

        try {
            let response = await fetch(SERVER_ENDPOINT + "signOutUsers", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "multipart/form-data"
                },
                body: formData
            });

            console.log('Firebase.signOut result', response);
        } catch (error) {
            console.error(error);
        }

        // sign out
        await Firebase.auth.signOut();
    }

    static async getPlaceRandomFeedImage(placeId) {
        let uri = null;

        const random = Util.getRandomNumber();
        // console.log('random', random);

        const postsRef = Firebase.firestore.collection("places").doc(placeId).collection("feed");
        const snap1 = await postsRef.where("rn", ">", random).orderBy("rn").limit(1).get();
        if (snap1.docs.length === 0) {
            const snap2 = await postsRef.where("rn", "<", random).orderBy("rn", "desc").limit(1).get();
            if (snap2.docs.length === 0) {
                // this should never happen!
                console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                console.log('Firebase.getPlaceRandomFeedImage', 'THIS SHOULD NOT HAPPEN!!!');
                console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
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

    /*
    static async getRandomPlace() {
        let placeId = null;

        const random = Util.getRandomNumber();

        const postsRef = Firebase.firestore.collection("places");
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
    */
    static async getRandomPlaces(size) {
        let places = [];

        const postsRef = Firebase.firestore.collection("places");
        const snap = await postsRef.orderBy("timestamp", "desc").limit(size).get();
        snap.forEach(doc => {
            // const data = doc.data();
            places.push(doc.id);
        });

        return places;
    }

    static subscribeToFeed(placeId, feedId, callback) {
        return Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).onSnapshot(
            snap => {
                const feed = snap.data();
                console.log('Firebase.subscribeToFeed, feed changed.');
                callback(feed);
            },
            error => {
                console.log('Firebase.subscribeToFeed, error', error);
            }
        );
    }

    static subscribeToPlace(placeId, callback) {
        return Firebase.firestore.collection("places").doc(placeId).onSnapshot(
            snap => {
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
            },
            error => {
                console.log('Firebase.subscribeToPlace, error', error);
            }
        );
    }

    static subscribeToProfile(uid, callback) {
        return Firebase.firestore.collection("users").doc(uid).onSnapshot(
            snap => {
                const user = snap.data();
                console.log('Firebase.subscribeToProfile, user changed.');
                callback(user);
            },
            error => {
                console.log('Firebase.subscribeToProfile, error', error);
            }
        );
    }

    static async getFeedByAverageRating(placeId) { // 평점이 가장 높은 포스트
        let feed = null;

        const snap = await Firebase.firestore.collection("places").doc(placeId).collection("feed").orderBy("averageRating", "desc").limit(1).get();
        snap.forEach(feedDoc => {
            feed = feedDoc.data();
            // console.log('Firebase.getFeedByAverageRating, feed', feed);
        });

        return feed;
    }
    /*
    static async getFeedByAverageRating(placeId, size) {
        let feeds = [];

        const snap = await Firebase.firestore.collection("places").doc(placeId).collection("feed").orderBy("averageRating", "desc").limit(size).get();
        snap.forEach(feedDoc => {
            const feed = feedDoc.data();
            feeds.push(feed);
        });

        return feeds;
    }
    */

    static async getFeedByTimestamp(placeId) { // 가장 최근에 생성된 포스트
        let feed = null;

        const snap = await Firebase.firestore.collection("places").doc(placeId).collection("feed").orderBy("timestamp", "desc").limit(1).get();
        snap.forEach(feedDoc => {
            feed = feedDoc.data();
        });

        return feed;
    }
    /*
    static async getFeedByTimestamp(placeId, size) {
        let feeds = [];

        const snap = await Firebase.firestore.collection("places").doc(placeId).collection("feed").orderBy("timestamp", "desc").limit(size).get();
        snap.forEach(feedDoc => {
            const feed = feedDoc.data();
            feeds.push(feed);
        });

        return feeds;
    }
    */

    /*
    static subscribeToPlaceSize(placeId, callback) {
        return Firebase.firestore.collection("places").doc(placeId).onSnapshot(snap => {
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

        feed.visits = [];


        // 1. add feed
        await Firebase.firestore.collection("places").doc(feed.placeId).collection("feed").doc(feed.id).set(feed);

        // 2. update user profile & place
        const userRef = Firebase.firestore.collection("users").doc(feed.uid);
        const placeRef = Firebase.firestore.collection("places").doc(feed.placeId);

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
                if (field) count = field; // this will never happen
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
                    picture: feed.pictures.one.uri,
                    reviewAdded: false
                })
            };

            transaction.update(userRef, data);
        });
    }

    static async updateFeed(uid, placeId, feedId, feed) {
        await Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).update(feed);

        // update feeds in user profile
        const picture = feed.pictures.one.uri;
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            let { feeds } = userDoc.data();

            for (let i = 0; i < feeds.length; i++) {
                let item = feeds[i];
                if (item.placeId === placeId && item.feedId === feedId) {
                    item.picture = picture;
                    break;
                }

                feeds[i] = item;
            }

            transaction.update(userRef, { feeds });
        }).then(() => {
            console.log("Firebase.updateFeed, success.");
        }).catch((error) => {
            console.log('Firebase.updateFeed', error);
        });
    }

    static async getPost(placeId, feedId) {
        const feedDoc = await Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).get();
        if (feedDoc.exists) return feedDoc.data();

        return null;
    }

    static async getFeedSize(placeId) {
        const placeDoc = await Firebase.firestore.collection("places").doc(placeId).get();
        if (placeDoc.exists) return placeDoc.data().count;

        return 0;
    }

    static async removeFeed(uid, placeId, feedId) {
        let result;

        // remove reviews collection
        const db = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);
        const path = "reviews";
        Firebase.deleteCollection(db, path, 10);

        const feedRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);
        const placeRef = Firebase.firestore.collection("places").doc(placeId);
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const feedDoc = await transaction.get(feedRef);
            if (!feedDoc.exists) throw 'Feed document not exist!';

            const placeDoc = await transaction.get(placeRef);
            if (!placeDoc.exists) throw 'Place document not exist!';

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';


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
            for (let i = 0; i < feeds.length; i++) {
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
            if (!userDoc.exists) throw 'User document not exist!';

            const { feeds } = userDoc.data();
            let index = -1;

            for (let i = 0; i < feeds.length; i++) {
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
    static async updateUserFeed(uid, placeId, feedId, picture) {
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            let { feeds } = userDoc.data();

            for (let i = 0; i < feeds.length; i++) {
                let item = feeds[i];
                if (item.placeId === placeId && item.feedId === feedId) {
                    item.picture = picture;

                    break;
                }

                feeds[i] = item;
            }

            transaction.update(userRef, { feeds });
        }).then(() => {
            console.log("Firebase.updateUserFeed, success.");
        }).catch((error) => {
            console.log('Firebase.updateUserFeed', error);
        });
    }
    */

    /*
    static async getUserFeeds(profile) { // user posted feeds
        const feeds = profile.feeds; // object NOT map

        const keys = Object.keys(feeds);
        console.log('user feeds length', keys.length);

        let userFeeds = [];

        for (i = 0; i < keys.length; i++) { // map
            let num = i;
            let key = num.toString();

            let value = feeds.get(key);

            const feedDoc = await Firebase.firestore.collection("places").doc(value.placeId).collection("feed").doc(value.feedId).get();

            userFeeds.push(feedDoc.data());
        }

        console.log('userFeeds', userFeeds);

        return userFeeds;
    }
    */

    static async addVisits(uid, placeId, feedId) {
        console.log('Firebase.addVisits', placeId, feedId);

        const feedRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);

        await Firebase.firestore.runTransaction(async transaction => {
            const postDoc = await transaction.get(feedRef);
            if (!postDoc.exists) throw 'Post document not exist!';

            let { visits } = postDoc.data();

            // if (!visits) visits = [];

            let index = -1;
            for (let i = 0; i < visits.length; i++) {
                const visit = visits[i];

                if (visit.userUid === uid) {
                    index = i;
                    break;
                }
            }

            if (index === -1) {
                // add new
                const visit = {
                    userUid: uid,
                    count: 1,
                    timestamp: Firebase.getTimestamp()
                };
                visits.push(visit);
            } else {
                // update
                let visit = visits[index];
                visit.count = visit.count + 1;
                visit.timestamp = Firebase.getTimestamp();
                visits[index] = visit;
            }

            transaction.update(feedRef, { visits });
        }).then(() => {
            console.log("Firebase.addVisits, success.");
        }).catch((error) => {
            console.log('Firebase.addVisits', error);
        });
    }

    static async toggleLikes(uid, placeId, feedId, name, placeName, uri) {
        let result;

        const feedRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const postDoc = await transaction.get(feedRef);
            if (!postDoc.exists) throw 'Post document not exist!';

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'Profile document not exist!';


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
            let index = -1;
            for (let i = 0; i < userLikes.length; i++) {
                const item = userLikes[i];
                if (item.placeId === placeId && item.feedId === feedId) {
                    index = i;
                    break;
                }
            }

            if (index === -1) { // add
                const data = { // LikeRef
                    placeId,
                    feedId,
                    picture: uri,
                    name,
                    placeName
                }
                userLikes.push(data);
            } else { // remove
                userLikes.splice(index, 1);
            }

            transaction.update(userRef, { likes: userLikes });
        }).then(() => {
            console.log("Firebase.toggleLikes, success.");
            result = true;
        }).catch((error) => {
            console.log('Firebase.toggleLikes', error);
            result = false;
        });

        return result;
    }

    static async removeLikes(feeds, uid) {
        if (feeds.length === 0) return;

        // update posts
        for (let i = 0; i < feeds.length; i++) {
            const feed = feeds[i];
            const placeId = feed.placeId;
            const feedId = feed.feedId;

            const feedRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);

            await Firebase.firestore.runTransaction(async transaction => {
                const postDoc = await transaction.get(feedRef);
                if (!postDoc.exists) throw 'Feed document not exist!';

                let { likes } = postDoc.data();
                const index = likes.indexOf(uid);
                if (index !== -1) likes.splice(index, 1);

                transaction.update(feedRef, { likes });
            }).then(() => {
                // console.log("Firebase.removeLikes, success.");
            }).catch((error) => {
                console.log('Firebase.removeLikes', error);
            });
        }

        // update user profile
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            let { likes } = userDoc.data();

            for (let i = 0; i < feeds.length; i++) {
                const feed = feeds[i];
                const placeId = feed.placeId;
                const feedId = feed.feedId;

                let index = -1;
                for (let j = 0; i < likes.length; j++) {
                    const item = likes[j];
                    if (item.placeId === placeId && item.feedId === feedId) {
                        index = j;
                        break;
                    }
                }

                if (index !== -1) likes.splice(index, 1);
            }

            transaction.update(userRef, { likes });
        }).then(() => {
            // console.log("Firebase.removeLikes, success.");
        }).catch((error) => {
            console.log('Firebase.removeLikes', error);
        });
    }

    static async updateLikesFromProfile(uid, placeId, feedId, name, placeName, picture) {
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            let { likes } = userDoc.data();

            for (let i = 0; i < likes.length; i++) {
                let item = likes[i];
                if (item.placeId === placeId && item.feedId === feedId) {
                    item.name = name;
                    item.placeName = placeName;
                    item.picture = picture;

                    likes[i] = item;

                    break;
                }
            }

            transaction.update(userRef, { likes });
        }).then(() => {
            console.log("Firebase.updateLikes, success.");
        }).catch((error) => {
            console.log('Firebase.updateLikes', error);
        });
    }

    // update like in user profile
    static async removeLikesFromProfile(uid, placeId, feedId) {
        let result;

        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'Profile document not exist!';

            let { likes } = userDoc.data();
            let index = -1;
            for (let i = 0; i < likes.length; i++) {
                const item = likes[i];
                if (item.placeId === placeId && item.feedId === feedId) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) likes.splice(index, 1);

            transaction.update(userRef, { likes });
        }).then(() => {
            result = true;
        }).catch((error) => {
            console.log('Firebase.removeLikes', error);
            result = false;
        });

        return result;
    }

    static async updateReviewChecked(uid, placeId, feedId, checked) {
        let result;

        const ownerRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const ownerDoc = await transaction.get(ownerRef);
            if (!ownerDoc.exists) throw 'Owner document not exist!';


            let { feeds } = ownerDoc.data();
            for (let i = 0; i < feeds.length; i++) {
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
        const feedRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);
        const userRef = Firebase.firestore.collection("users").doc(userUid);

        await Firebase.firestore.runTransaction(async transaction => {
            const feedDoc = await transaction.get(feedRef);
            if (!feedDoc.exists) throw 'Post document not exist!';

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
                    value++;
                } else {
                    value = 1;
                }
                reviewStats[4] = value;
            } else if (rating === 2) {
                let value = reviewStats[3];
                if (value) {
                    value++;
                } else {
                    value = 1;
                }
                reviewStats[3] = value;
            } else if (rating === 3) {
                let value = reviewStats[2];
                if (value) {
                    value++;
                } else {
                    value = 1;
                }
                reviewStats[2] = value;
            } else if (rating === 4) {
                let value = reviewStats[1];
                if (value) {
                    value++;
                } else {
                    value = 1;
                }
                reviewStats[1] = value;
            } else if (rating === 5) {
                let value = reviewStats[0];
                if (value) {
                    value++;
                } else {
                    value = 1;
                }
                reviewStats[0] = value;
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
        await Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(id).set(review);

        // update owner profile
        /*
        result = await Firebase.updateReviewChecked(ownerUid, placeId, feedId, true);

        return result;
        */
        Firebase.updateReviewChecked(ownerUid, placeId, feedId, true);

        return result;
    };

    static async updateReview(uid, placeId, feedId, picture) {
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            let { reviews } = userDoc.data();

            if (picture === null) { // remove review
                let newReviews = [];
                for (let i = 0; i < reviews.length; i++) {
                    const review = reviews[i];
                    if (review.placeId === placeId && review.feedId === feedId) {
                        // skip
                    } else {
                        const newReview = _.clone(review);
                        newReviews.push(newReview);
                    }
                }

                const data = {
                    reviews: newReviews
                };

                transaction.update(userRef, data);
            } else {
                for (let i = 0; i < reviews.length; i++) {
                    let review = reviews[i];
                    if (review.placeId === placeId && review.feedId === feedId) {
                        review.picture = picture;

                        reviews[i] = review;
                        // break;
                    }
                }

                const data = {
                    reviews
                };

                transaction.update(userRef, data);
            }
        }).then(() => {
            console.log('Firebase.updateReview, success.');
        }).catch((error) => {
            console.log('Firebase.updateReview', error);
        });
    };

    static async removeReview(placeId, feedId, reviewId, userUid) {
        let result;

        const reviewRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId);
        const feedRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);
        const userRef = Firebase.firestore.collection("users").doc(userUid);

        // get rating
        const reviewDoc = await reviewRef.get();
        if (!reviewDoc.exists) return false;
        const rating = reviewDoc.data().rating; // reviewDoc.data(): rating, comment, timestamp

        // update - averageRating, reviewCount, reviews
        await Firebase.firestore.runTransaction(async transaction => {
            const feedDoc = await transaction.get(feedRef);
            if (!feedDoc.exists) throw 'Post document not exist!';

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';


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
                value--;
                reviewStats[4] = value;
            } else if (rating === 2) {
                let value = reviewStats[3];
                value--;
                reviewStats[3] = value;
            } else if (rating === 3) {
                let value = reviewStats[2];
                value--;
                reviewStats[2] = value;
            } else if (rating === 4) {
                let value = reviewStats[1];
                value--;
                reviewStats[1] = value;
            } else if (rating === 5) {
                let value = reviewStats[0];
                value--;
                reviewStats[0] = value;
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
            for (let i = 0; i < reviews.length; i++) {
                const item = reviews[i];
                if (item.reviewId === reviewId) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) reviews.splice(index, 1);

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
            if (!userDoc.exists) throw 'User document not exist!';


            let { reviews } = userDoc.data();
            for (let i = 0; i < reviews.length; i++) {
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
        let reviewRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId);
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
        let reviewRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId);
        let userRef = Firebase.firestore.collection("users").doc(userUid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

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
            for (let i = 0; i < replies.length; i++) {
                const item = replies[i];
                if (item.replyId === replyId) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) replies.splice(index, 1);

            transaction.update(userRef, { replies });
        });

        // Consider: just leave the replyAdded valueuserRef in guest's user profile
    }

    // customer review
    // --
    static async addComment(uid, targetUid, comment, placeId, feedId) { // uid: writer (boss, not girl), targetUid: receiver (guest)
        // console.log(uid, targetUid, comment, placeId, feedId);
        let result;

        const id = Util.uid(); // comment id
        const timestamp = Firebase.getTimestamp();

        const obj = {
            id,
            timestamp,
            uid,
            comment,
            placeId,
            feedId
        };

        const writerRef = Firebase.firestore.collection("users").doc(uid); // writer (me)
        const receiverRef = Firebase.firestore.collection("users").doc(targetUid); // receiver
        const commentRef = receiverRef.collection("comments").doc(id);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(receiverRef);
            if (!userDoc.exists) throw 'User document not exist!';

            // 1. update receivedCommentsCount in receiver (guest) user profile
            let receivedCommentsCount = userDoc.data().receivedCommentsCount;
            if (!receivedCommentsCount) receivedCommentsCount = 0;
            console.log('receivedCommentsCount will be', receivedCommentsCount + 1);

            transaction.update(receiverRef, { receivedCommentsCount: Number(receivedCommentsCount + 1), commentAdded: true });

            // 2. update comments array in writer (boss) user profile
            const item = {
                userUid: targetUid,
                commentId: id,
                name: userDoc.data().name,
                placeName: userDoc.data().place,
                picture: userDoc.data().picture.uri // customer profile picture
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

        // 3. add comment to receiver's comments collection
        await commentRef.set(obj);

        return true;
    };

    static async updateComments(uid, targetUid, name, place, picture) {
        console.log('Firebase.updateComments', uid, targetUid, name, place, picture);

        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            let { comments } = userDoc.data(); // array

            if (name === null && place === null && picture === null) { // remove comment
                let newComments = [];
                for (let i = 0; i < comments.length; i++) {
                    const comment = comments[i];
                    if (comment.userUid === targetUid) {
                        // skip
                    } else {
                        const newComment = _.clone(comment);
                        newComments.push(newComment);
                    }
                }

                const data = {
                    comments: newComments
                };

                transaction.update(userRef, data);
            } else { // update comment
                for (let i = 0; i < comments.length; i++) {
                    let comment = comments[i];
                    if (comment.userUid === targetUid) {
                        comment.name = name;
                        comment.placeName = place;
                        comment.picture = picture;
                    }

                    comments[i] = comment;
                }

                const data = {
                    comments
                };

                transaction.update(userRef, data);
            }
        }).then(() => {
            console.log('Firebase.updateComments, success.');
        }).catch((error) => {
            console.log('Firebase.updateComments', error);
        });
    };

    static async updateCommentChecked(uid, checked) {
        const profile = {
            commentAdded: checked
        };

        await Firebase.firestore.collection("users").doc(uid).update(profile);
    }

    static async removeComment(uid, targetUid, commentId) { // uid: writer, userUid: receiver
        let result;

        const writerRef = Firebase.firestore.collection("users").doc(uid); // boss (writer)
        const receiverRef = Firebase.firestore.collection("users").doc(targetUid); // guest (receiver)
        const commentRef = receiverRef.collection("comments").doc(commentId);

        await Firebase.firestore.runTransaction(async transaction => {
            const writerDoc = await transaction.get(writerRef);
            if (!writerDoc.exists) throw 'User document not exist!';

            const receiverDoc = await transaction.get(receiverRef);
            if (!receiverDoc.exists) throw 'User document not exist!';

            // 1. update receivedCommentsCount in receiver (guest) user profile
            let receivedCommentsCount = receiverDoc.data().receivedCommentsCount;
            console.log('receivedCommentsCount will be', receivedCommentsCount - 1);

            transaction.update(receiverRef, { receivedCommentsCount: Number(receivedCommentsCount - 1) });

            // 2. update comments array in writer (boss) user profile
            const { comments } = writerDoc.data();
            let index = -1;
            for (let i = 0; i < comments.length; i++) {
                const item = comments[i];
                if (item.commentId === commentId) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) comments.splice(index, 1);

            transaction.update(writerRef, { comments });
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

    //// Realtime Database ////

    static async createChatRoom(uid, users, placeId, feedId, id, placeName, owner, addSystemMessage) {
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
            placeName,
            owner // owner's uid
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

    static loadChatRoom(count, uid, callback) {
        Firebase.database.ref('chat').child(uid).orderByChild('timestamp').limitToLast(count).on('value', snapshot => {
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

    static stopChatRoom(uid) {
        Firebase.database.ref('chat').child(uid).off();
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

    static chatOn(count, id, callback) {
        Firebase.database.ref('contents').child(id).orderByChild('timestamp').limitToLast(count).on('child_added', snapshot => {
            if (snapshot.exists()) {
                callback(Firebase.parseChild(snapshot));
            }
        });
    }

    static chatOff(id) {
        Firebase.database.ref('contents').child(id).off();
    }

    static loadMoreMessage(count, id, lastMessageTimestamp, lastMessageId, callback) {
        console.log('loadMoreMessage', id, lastMessageTimestamp, lastMessageId);

        Firebase.database.ref('contents').child(id).orderByChild('timestamp').endAt(lastMessageTimestamp).limitToLast(count + 1).once('value', snapshot => {
            if (snapshot.exists()) {
                callback(Firebase.parseValue(snapshot, lastMessageId));
            } else {
                callback(null);
            }
        });
    }

    /*
    static uid() {
        return (Firebase.auth.currentUser || {}).uid;
    }
    */

    static user() {
        let user = Firebase.auth.currentUser;
        let name, email, photoUrl, uid, emailVerified;

        if (user !== null) {
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

    static getTimestamp() {
        return Date.now();
    }

    static timestamp() { // as a token that you use when inserting data into Realtime Database
        // return Firebase.database.ServerValue.TIMESTAMP;
        return firebase.database.ServerValue.TIMESTAMP;
    }

    static async sendMessage(id, message, item) {
        const { text, user } = message;

        let _user = {};
        _user._id = user._id; // save only _id

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
        const senderUid = item.users[0].uid;
        const updateData = {
            contents: text,
            timestamp,
            mid
        };

        await Firebase.database.ref('chat').child(senderUid).child(id).update(updateData);

        //// update timestamp, contents to chat of receiver ////
        const receiverUid = item.users[1].uid;
        const room = await Firebase.findChatRoomById(receiverUid, id);
        if (!room) {
            // create new chat room
            // --
            let users = []; // name, picture, uid
            users.push(item.users[1]);
            users.push(item.users[0]);

            await Firebase.createChatRoom(receiverUid, users, item.placeId, item.feedId, id, item.placeName, item.owner, false);
            // --
        }

        await Firebase.database.ref('chat').child(receiverUid).child(id).update(updateData);
    };

    static async saveLastReadMessageId(uid, id, mid) {
        console.log('Firebase.saveLastReadMessageId', uid, id, mid);

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

                // console.log('value', value);

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
            if (!snapshot.exists()) throw 'Chat - uid data not exist!';

            let BreakException = {};

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
        let opponentExists = false;
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
            if (!snapshot.exists()) throw 'Chat - uid data not exist!';

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

    static async updateChatRoom(myUid, opponentUid, roomId, myUsers) {
        // update my chat room
        await Firebase.database.ref('chat').child(myUid).child(roomId).once('value').then(snapshot => {
            if (!snapshot.exists()) throw 'Database data not exist! (User left the chat room.)';

            // update
            const updateData = {
                users: myUsers
            };

            Firebase.database.ref('chat').child(myUid).child(roomId).update(updateData);
        }).then(() => {
            console.log('Firebase.updateChatRoom, success.');
        }).catch((error) => {
            console.log('Firebase.updateChatRoom, error', error);
        });

        // update the opponent chat room
        await Firebase.database.ref('chat').child(opponentUid).child(roomId).once('value').then(snapshot => {
            if (!snapshot.exists()) throw 'Opponent chat room not exist! (User left the chat room.)';

            let users = [];
            users.push(myUsers[1]);
            users.push(myUsers[0]);

            // update
            const updateData = {
                users
            };

            Firebase.database.ref('chat').child(opponentUid).child(roomId).update(updateData);
        }).then(() => {
            console.log('Firebase.updateChatRoom, success.');
        }).catch((error) => {
            console.log('Firebase.updateChatRoom, error', error);
        });
    }



}
