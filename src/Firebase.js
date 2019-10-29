import * as firebase from "firebase";
import "firebase/firestore";
import Util from './Util';
import { Geokit, LatLngLiteral } from 'geokit';
import AuthMain from './AuthMain';
// import _ from 'lodash';

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
            // Firebase.firestore.settings({ timestampsInSnapshots: true }); // Consider: remove
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
            // console.log('jdub', 'Firebase.setToken', 'set successful.');
        }).catch(function (error) {
            console.log('jdub', 'Firebase.setToken', error);
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
            lastLogInTime: time,
            postFilter: {
                showMe: 'Everyone',
                // ageRange: [18, 24]
            }
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
            // console.log('jdub', 'Firebase.createProfile', 'update successful.');
        }).catch(function (error) {
            console.log('jdub', 'Firebase.createProfile', error);
        });
    }

    static async removeProfilePictureRef(ref) {
        await Firebase.storage.ref(ref).delete();
    }

    static async updateProfile(uid, profile, updateAuth) {
        // 2. update user doc
        await Firebase.firestore.collection("users").doc(uid).update(profile);

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
                // console.log('jdub', 'Firebase.updateProfile, update firebase auth', 'update successful.');
            }).catch(function (error) {
                console.log('jdub', 'Firebase.updateProfile, update firebase auth', error);
            });
        }
    }

    static async updateProfilePicture(uid, data) {
        await Firebase.firestore.collection("users").doc(uid).update(data);

        const uri = data.picture.uri;
        const user = Firebase.auth.currentUser;
        await user.updateProfile({
            photoURL: uri
        }).then(function () {
            // console.log('jdub', 'Firebase.updateProfilePicture', 'update successful.');
        }).catch(function (error) {
            console.log('jdub', 'Firebase.updateProfilePicture', error);
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
            // console.log('jdub', "User document successfully deleted.");
            result = true;
        }).catch((error) => {
            console.log('jdub', 'Firebase.deleteProfile', error);
            result = false;
        });

        if (!result) return false;

        // delete firebase auth
        let user = Firebase.auth.currentUser;
        await user.delete().then(function () {
            // User deleted.
            // console.log('jdub', 'Firebase auth deleted.');
        }).catch(function (error) {
            // An error happened.
            console.log('jdub', 'Firebase.deleteProfile', error);
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

            console.log('jdub', 'Firebase.signOut result', response);
        } catch (error) {
            console.error(error);
        }

        // sign out
        AuthMain.animation = true;
        await Firebase.auth.signOut();
    }

    static async getPlaceRandomFeedImage(placeId, gender) {
        let uri = null;

        const feedRef = Firebase.firestore.collection("places").doc(placeId).collection("feed");

        const random = Util.getRandomNumber();

        if (gender) {
            const snap1 = await feedRef.where("d.gender", "==", gender).where("d.rn", ">", random).limit(1).get();
            if (snap1.docs.length === 0) {
                const snap2 = await feedRef.where("d.gender", "==", gender).where("d.rn", "<", random).limit(1).get();
                if (snap2.docs.length === 0) {
                    // this should never happen!
                    console.log('jdub', 'Firebase.getPlaceRandomFeedImage', '!!! THIS SHOULD NEVER HAPPEN !!!');
                } else {
                    snap2.forEach((doc) => {
                        // console.log('jdub', doc.id, '=>', doc.data());
                        let feed = doc.data();
                        // feedId = feed.d.id;
                        uri = feed.d.pictures.one.uri;
                        // console.log('jdub', '< uri', uri);
                    });
                }
            } else {
                snap1.forEach((doc) => {
                    // console.log('jdub', doc.id, '=>', doc.data());
                    let feed = doc.data();
                    // feedId = feed.d.id;
                    uri = feed.d.pictures.one.uri;
                    // console.log('jdub', '> uri', uri);
                });
            }
        } else {
            const snap1 = await feedRef.where("d.rn", ">", random).limit(1).get();
            if (snap1.docs.length === 0) {
                const snap2 = await feedRef.where("d.rn", "<", random).limit(1).get();
                if (snap2.docs.length === 0) {
                    // this should never happen!
                    console.log('jdub', 'Firebase.getPlaceRandomFeedImage', '!!! THIS SHOULD NEVER HAPPEN !!!');
                } else {
                    snap2.forEach((doc) => {
                        // console.log('jdub', doc.id, '=>', doc.data());
                        let feed = doc.data();
                        // feedId = feed.d.id;
                        uri = feed.d.pictures.one.uri;
                        // console.log('jdub', '< uri', uri);
                    });
                }
            } else {
                snap1.forEach((doc) => {
                    // console.log('jdub', doc.id, '=>', doc.data());
                    let feed = doc.data();
                    // feedId = feed.d.id;
                    uri = feed.d.pictures.one.uri;
                    // console.log('jdub', '> uri', uri);
                });
            }
        }

        return uri;
    }

    static async getRandomPlaces(size) {
        let places = [];
        const placesRef = Firebase.firestore.collection("places");

        const rn = Math.round(Math.random() * 100) % 3; // 0 ~ 2
        if (rn === 0) { // by timestamp
            const snap = await placesRef.orderBy("timestamp", "desc").limit(size).get();
            snap.forEach(doc => {
                // const data = doc.data();
                places.push(doc.id);
            });
        } else if (rn === 1) { // by rn (Descending)
            const snap = await placesRef.orderBy("rn", "desc").limit(size).get();
            snap.forEach(doc => {
                // const data = doc.data();
                places.push(doc.id);
            });
        } else if (rn === 2) { // by rn (Ascending)
            const snap = await placesRef.orderBy("rn", "asc").limit(size).get();
            snap.forEach(doc => {
                // const data = doc.data();
                places.push(doc.id);
            });
        }

        return places;
    }

    static subscribeToFeed(placeId, feedId, cb) {
        return Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).onSnapshot(
            snap => {
                const feed = snap.data();
                // console.log('jdub', 'Firebase.subscribeToFeed, feed changed.');
                cb(feed);
            },
            error => {
                console.log('jdub', 'Firebase.subscribeToFeed, error', error);
                cb(null);
            }
        );
    }

    static subscribeToPlace(placeId, cb) {
        return Firebase.firestore.collection("places").doc(placeId).onSnapshot(
            snap => {
                const place = snap.data();
                // console.log('jdub', 'Firebase.subscribeToPlace, place changed.');
                cb(place);
            },
            error => {
                console.log('jdub', 'Firebase.subscribeToPlace, error', error);
                cb(null);
            }
        );
    }

    static subscribeToProfile(uid, cb) {
        return Firebase.firestore.collection("users").doc(uid).onSnapshot(
            snap => {
                const user = snap.data();
                // console.log('jdub', 'Firebase.subscribeToProfile, user changed.');
                cb(user);
            },
            error => {
                console.log('jdub', 'Firebase.subscribeToProfile, error', error);
                cb(null);
            }
        );
    }

    static async getFeedByAverageRating(placeId, gender) { // 평점이 가장 높은 포스트
        let feed = null;

        if (gender) {
            const snap = await Firebase.firestore.collection("places").doc(placeId).collection("feed").where("d.gender", "==", gender).orderBy("d.averageRating", "desc").limit(1).get();
            snap.forEach(feedDoc => {
                feed = feedDoc.data();
            });
        } else {
            const snap = await Firebase.firestore.collection("places").doc(placeId).collection("feed").orderBy("d.averageRating", "desc").limit(1).get();
            snap.forEach(feedDoc => {
                feed = feedDoc.data();
            });
        }

        return feed;
    }

    static async getFeedByTimestamp(placeId, gender) { // 가장 최근에 생성된 포스트
        let feed = null;

        if (gender) {
            const snap = await Firebase.firestore.collection("places").doc(placeId).collection("feed").where("d.gender", "==", gender).orderBy("d.timestamp", "desc").limit(1).get();
            snap.forEach(feedDoc => {
                feed = feedDoc.data();
            });
        } else {
            const snap = await Firebase.firestore.collection("places").doc(placeId).collection("feed").orderBy("d.timestamp", "desc").limit(1).get();
            snap.forEach(feedDoc => {
                feed = feedDoc.data();
            });
        }

        return feed;
    }

    static async createFeed(data, extra) {
        let feed = {};
        const d = {
            uid: data.uid,
            id: data.id,
            placeId: data.placeId,
            placeName: data.placeName,
            location: data.location,
            note: data.note,
            pictures: data.pictures,
            name: data.name,
            birthday: data.birthday,
            gender: data.gender,
            height: data.height,
            weight: data.weight,
            bodyType: data.bodyType,
            bust: data.bust,
            muscle: data.muscle,
            likes: [],
            reviewCount: 0,
            averageRating: 0,
            reviewStats: [0, 0, 0, 0, 0],
            timestamp: Firebase.getTimestamp(),
            rn: Util.getRandomNumber(),
            visits: [],
            totalVisitCount: 0,
            reporters: []
        };
        feed.d = d;

        const coordinates: LatLngLiteral = { lat: data.location.latitude, lng: data.location.longitude };
        const hash: string = Geokit.hash(coordinates);
        feed.g = hash;
        feed.l = new firebase.firestore.GeoPoint(data.location.latitude, data.location.longitude);

        // 1. add feed
        await Firebase.firestore.collection("places").doc(data.placeId).collection("feed").doc(data.id).set(feed);

        // 2. update user profile & place
        const userRef = Firebase.firestore.collection("users").doc(data.uid);
        const placeRef = Firebase.firestore.collection("places").doc(data.placeId);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) return;

            // 2-1. place
            const placeDoc = await transaction.get(placeRef);
            if (!placeDoc.exists) { // new
                if (data.gender === 'Man') {
                    transaction.set(placeRef, { count: 1, men: 1, women: 0, timestamp: data.timestamp, name: data.placeName, rn: data.rn, lat: extra.lat, lng: extra.lng });
                } else if (data.gender === 'Woman') {
                    transaction.set(placeRef, { count: 1, men: 0, women: 1, timestamp: data.timestamp, name: data.placeName, rn: data.rn, lat: extra.lat, lng: extra.lng });
                } else {
                    transaction.set(placeRef, { count: 1, men: 0, women: 0, timestamp: data.timestamp, name: data.placeName, rn: data.rn, lat: extra.lat, lng: extra.lng });
                }
            } else { // update
                let place = placeDoc.data();

                let count = place.count;
                let men = place.men;
                let women = place.women;

                count++;

                if (data.gender === 'Man') men++;
                else if (data.gender === 'Woman') women++;

                place.count = count;
                place.men = men;
                place.women = women;
                place.timestamp = d.timestamp;

                transaction.update(placeRef, place);
            }

            // 2-2. user profile (add fields to feeds in user profile)
            /*
            const data = {
                feeds: firebase.firestore.FieldValue.arrayUnion({
                    placeId: feed.placeId,
                    feedId: feed.id,
                    picture: feed.pictures.one.uri,
                    reviewAdded: false
                })
            };

            transaction.update(userRef, data);
            */
            let user = userDoc.data();
            user.feeds.push(
                {
                    placeId: data.placeId,
                    feedId: data.id,
                    picture: data.pictures.one.uri,
                    reviewAdded: false
                }
            );

            transaction.update(userRef, user);
        });
    }

    static async updateFeed(uid, placeId, feedId, data, genderChanged, prevGender) {
        let result;
        // await Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).update(feed);

        const feedRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);

        // update feeds in user profile
        const picture = data.pictures.one.uri;
        const userRef = Firebase.firestore.collection("users").doc(uid);

        // update men, women in place
        const placeRef = Firebase.firestore.collection("places").doc(placeId);

        await Firebase.firestore.runTransaction(async transaction => {
            const feedDoc = await transaction.get(feedRef);
            if (!feedDoc.exists) throw 'Feed document not exist!';

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            let placeDoc = null;
            if (genderChanged) {
                placeDoc = await transaction.get(placeRef);
                if (!placeDoc.exists) throw 'Place document not exist!';
            }

            let feed = feedDoc.data();

            feed.d.note = data.note;
            feed.d.pictures = data.pictures;
            feed.d.name = data.name;
            feed.d.birthday = data.birthday;
            feed.d.gender = data.gender;
            feed.d.height = data.height;
            feed.d.weight = data.weight;
            feed.d.bodyType = data.bodyType;
            feed.d.bust = data.bust;
            feed.d.muscle = data.muscle;

            transaction.update(feedRef, feed);

            // let { feeds } = userDoc.data();
            let user = userDoc.data();
            let { feeds } = user;

            for (let i = 0; i < feeds.length; i++) {
                let item = feeds[i];
                if (item.placeId === placeId && item.feedId === feedId) {
                    item.picture = picture;
                    feeds[i] = item;
                    user.feeds = feeds;
                    break;
                }
            }

            transaction.update(userRef, user);

            if (placeDoc) {
                let place = placeDoc.data();
                let { men, women } = place;

                if (prevGender === 'Man') men--;
                else if (prevGender === 'Woman') women--;

                if (data.gender === 'Man') men++;
                else if (data.gender === 'Woman') women++;

                place.men = men;
                place.women = women;

                transaction.update(placeRef, place);
            }
        }).then(() => {
            console.log('jdub', "Firebase.updateFeed, success.");
            result = true;
        }).catch((error) => {
            console.log('jdub', 'Firebase.updateFeed', error);
            result = false;
        });

        return result;
    }

    static async getPost(placeId, feedId) {
        const feedDoc = await Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).get();
        if (feedDoc.exists) return feedDoc.data();

        return null;
    }

    static async getPlaceCounts(placeId) {
        const placeDoc = await Firebase.firestore.collection("places").doc(placeId).get();
        if (placeDoc.exists) {
            const place = placeDoc.data();
            const value = {
                count: place.count,
                men: place.men,
                women: place.women
            }

            return value;
        }

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

            let feed = feedDoc.data();

            // 1. delete storage
            const pictures = feed.d.pictures;
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
            let place = placeDoc.data();

            let count = place.count;
            let men = place.men;
            let women = place.women;

            count--;

            if (feed.d.gender === 'Man') men--;
            else if (feed.d.gender === 'Woman') women--;

            place.count = count;
            place.men = men;
            place.women = women;

            transaction.update(placeRef, place);

            // 3. remove feed
            transaction.delete(feedRef);

            // 4. update profile (remove fields to feeds in user profile)
            let user = userDoc.data();
            let { feeds } = user;
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
            user.feeds = feeds;

            transaction.update(userRef, user);
        }).then(() => {
            // console.log('jdub', "Transaction successfully committed!");
            result = true;
        }).catch((error) => {
            console.log('jdub', 'Firebase.removeFeed', error);
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
            // console.log('jdub', "Transaction successfully committed!");
            result = true;
        }).catch((error) => {
            console.log('jdub', 'Firebase.removeFeed', error);
            result = false;
        });
        */

        return result;
    }

    static async removeFeed(uid, placeId, feedId, pictures, gender) {
        let result;

        // remove reviews collection
        const db = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);
        const path = "reviews";
        Firebase.deleteCollection(db, path, 10);

        const feedRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);
        const placeRef = Firebase.firestore.collection("places").doc(placeId);
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const placeDoc = await transaction.get(placeRef);
            if (!placeDoc.exists) throw 'Place document not exist!';

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            // 1. delete storage
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
            let place = placeDoc.data();

            let count = place.count;
            let men = place.men;
            let women = place.women;

            count--;

            if (gender === 'Man') men--;
            else if (gender === 'Woman') women--;

            place.count = count;
            place.men = men;
            place.women = women;

            transaction.update(placeRef, place);

            // 3. remove feed
            transaction.delete(feedRef);

            // 4. update profile (remove fields to feeds in user profile)
            let user = userDoc.data();
            let { feeds } = user;
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
            user.feeds = feeds;

            transaction.update(userRef, user);
        }).then(() => {
            // console.log('jdub', "Transaction successfully committed!");
            result = true;
        }).catch((error) => {
            console.log('jdub', 'Firebase.removeFeed', error);
            result = false;
        });

        return result;
    }

    static async cleanRemovedFeed(uid, placeId, feedId) {
        let result;

        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            // 4. update profile (remove fields to feeds in user profile)
            let user = userDoc.data();

            let { feeds } = user;
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
            user.feeds = feeds;

            transaction.update(userRef, user);
        }).then(() => {
            // console.log('jdub', "Transaction successfully committed!");
            result = true;
        }).catch((error) => {
            console.log('jdub', 'Firebase.removeFeed', error);
            result = false;
        });

        return result;
    }

    static async updateUserFeed(uid, placeId, feedId, picture) {
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            let user = userDoc.data();
            let { feeds } = user;

            for (let i = 0; i < feeds.length; i++) {
                let item = feeds[i];
                if (item.placeId === placeId && item.feedId === feedId) {
                    item.picture = picture;
                    feeds[i] = item;
                    user.feeds = feeds;

                    break;
                }
            }

            transaction.update(userRef, user);
        }).then(() => {
            console.log('jdub', "Firebase.updateUserFeed, success.");
        }).catch((error) => {
            console.log('jdub', 'Firebase.updateUserFeed', error);
        });
    }

    static async addVisits(uid, placeId, feedId) {
        let result;

        const feedRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);

        await Firebase.firestore.runTransaction(async transaction => {
            const postDoc = await transaction.get(feedRef);
            if (!postDoc.exists) throw 'Post document not exist!';

            let post = postDoc.data();
            let { visits, totalVisitCount } = post.d;

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

            if (totalVisitCount === undefined) { // 하위호환
                // calculate
                let totalCount = 0;
                for (let i = 0; i < visits.length; i++) {
                    const visit = visits[i];
                    const count = visit.count;

                    totalCount = totalCount + count;
                }

                totalVisitCount = totalCount;
                // console.log('totalVisitCount is undefined. calcuate the total visit count: ' + totalVisitCount);
            } else {
                totalVisitCount += 1;
                // console.log('totalVisitCount is defined. (0 or higher) ' + totalVisitCount);
            }

            post.d.visits = visits;
            post.d.totalVisitCount = totalVisitCount;

            transaction.update(feedRef, post);

            result = post;
        }).then(() => {
            // console.log('jdub', "Firebase.addVisits, success.");
        }).catch((error) => {
            console.log('jdub', 'Firebase.addVisits', error);
            result = null;
        });

        return result;
    }

    static async toggleLikes(uid, placeId, feedId, name, placeName, uri) {
        let result;

        const feedRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const feedDoc = await transaction.get(feedRef);
            if (!feedDoc.exists) throw 'Post document not exist!';

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'Profile document not exist!';

            // 1. feed
            let feed = feedDoc.data();

            let { likes } = feed.d;
            const idx = likes.indexOf(uid);
            if (idx === -1) {
                likes.push(uid);
            } else {
                likes.splice(idx, 1);
            }

            feed.d.likes = likes;

            transaction.update(feedRef, feed);

            // 2. user
            let user = userDoc.data();
            let { likes: userLikes } = user;
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

            user.likes = userLikes;

            transaction.update(userRef, user);
        }).then(() => {
            // console.log('jdub', "Firebase.toggleLikes, success.");
            result = true;
        }).catch((error) => {
            console.log('jdub', 'Firebase.toggleLikes', error);
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

                let post = postDoc.data();

                let { likes } = post.d;
                const index = likes.indexOf(uid);
                if (index !== -1) likes.splice(index, 1);

                post.d.likes = likes;

                transaction.update(feedRef, post);
            }).then(() => {
                // console.log('jdub', "Firebase.removeLikes, success.");
            }).catch((error) => {
                console.log('jdub', 'Firebase.removeLikes', error);
            });
        }

        // update user profile
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            let user = userDoc.data();
            let { likes } = user;

            for (let i = 0; i < feeds.length; i++) {
                const feed = feeds[i];
                const placeId = feed.placeId;
                const feedId = feed.feedId;

                let index = -1;
                for (let j = 0; j < likes.length; j++) {
                    const item = likes[j];
                    if (item.placeId === placeId && item.feedId === feedId) {
                        index = j;
                        break;
                    }
                }

                if (index !== -1) likes.splice(index, 1);
            }

            user.likes = likes;

            transaction.update(userRef, user);
        }).then(() => {
            console.log('jdub', "Firebase.removeLikes, success.");
        }).catch((error) => {
            console.log('jdub', 'Firebase.removeLikes', error);
        });
    }

    static async updateLikesFromProfile(uid, placeId, feedId, name, placeName, picture) {
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            let user = userDoc.data();
            let { likes } = user;

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

            user.likes = likes;

            transaction.update(userRef, user);
        }).then(() => {
            console.log('jdub', "Firebase.updateLikes, success.");
        }).catch((error) => {
            console.log('jdub', 'Firebase.updateLikes', error);
        });
    }

    // update like in user profile
    static async removeLikesFromProfile(uid, placeId, feedId) {
        let result;

        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'Profile document not exist!';

            let user = userDoc.data();
            let { likes } = user;
            let index = -1;
            for (let i = 0; i < likes.length; i++) {
                const item = likes[i];
                if (item.placeId === placeId && item.feedId === feedId) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) likes.splice(index, 1);

            user.likes = likes;

            transaction.update(userRef, user);
        }).then(() => {
            console.log('jdub', "Firebase.removeLikes, success.");
            result = true;
        }).catch((error) => {
            console.log('jdub', 'Firebase.removeLikes', error);
            result = false;
        });

        return result;
    }

    static async reportPost(uid, placeId, feedId) {
        let result;

        const feedRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);

        await Firebase.firestore.runTransaction(async transaction => {
            const postDoc = await transaction.get(feedRef);
            if (!postDoc.exists) throw 'Post document not exist!';

            let feed = postDoc.data();

            let { reporters } = feed.d;

            // 하위호환
            if (!reporters) reporters = [];

            const idx = reporters.indexOf(uid);
            if (idx === -1) {
                reporters.push(uid);
            }

            feed.d.reporters = reporters;

            transaction.update(feedRef, feed);
        }).then(async () => {
            result = true;

            // add REPORTS (post)
            const id = feedId;
            const type = 'POST'; // 'POST', 'USER'
            const timestamp = Firebase.getTimestamp();

            const report = {
                uid, // user uid
                type,
                placeId,
                feedId,
                timestamp
            };

            await Firebase.firestore.collection("REPORTS").doc(id).set(report);
        }).catch((error) => {
            console.log('jdub', 'Firebase.reportPost', error);
            result = false;
        });

        return result;
    }

    static async reportReview(uid, placeId, feedId, reviewId) {
        let result;

        const reviewRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId);

        await Firebase.firestore.runTransaction(async transaction => {
            const reviewDoc = await transaction.get(reviewRef);
            if (!reviewDoc.exists) throw 'Review document not exist!';

            let review = reviewDoc.data();

            let { reporters } = review;

            // 하위호환
            if (!reporters) reporters = [];

            const idx = reporters.indexOf(uid);
            if (idx === -1) {
                reporters.push(uid);
            }

            review.reporters = reporters;

            transaction.update(reviewRef, review);
        }).then(async () => {
            result = true;

            // add REPORTS (review)
            const id = reviewId;
            const type = 'REVIEW'; // 'POST', 'USER', 'REVIEW'
            const timestamp = Firebase.getTimestamp();

            const report = {
                uid, // user uid
                type,
                placeId,
                feedId,
                reviewId,
                timestamp
            };

            await Firebase.firestore.collection("REPORTS").doc(id).set(report);
        }).catch((error) => {
            console.log('jdub', 'Firebase.reportReview', error);
            result = false;
        });

        return result;
    }

    /*
    static async reportReply(uid, placeId, feedId, reviewId, replyId) {
        const id = replyId;
        const type = 'REPLY'; // 'POST', 'USER', 'REVIEW', 'REPLY'
        const timestamp = Firebase.getTimestamp();

        const report = {
            uid, // user uid
            type,
            placeId,
            feedId,
            reviewId,
            replyId,
            timestamp
        };

        await Firebase.firestore.collection("REPORTS").doc(id).set(report);
    }
    */

    static async reportComment(reporterUid, ownerUid, commentId) {
        let result;

        const receiverRef = Firebase.firestore.collection("users").doc(ownerUid);
        const commentRef = receiverRef.collection("comments").doc(commentId);

        await Firebase.firestore.runTransaction(async transaction => {
            const commentDoc = await transaction.get(commentRef);
            if (!commentDoc.exists) throw 'Comment document not exist!';

            let comment = commentDoc.data();

            let { reporters } = comment;

            // 하위호환
            if (!reporters) reporters = [];

            const idx = reporters.indexOf(reporterUid);
            if (idx === -1) {
                reporters.push(reporterUid);
            }

            comment.reporters = reporters;

            transaction.update(commentRef, comment);
        }).then(async () => {
            result = true;

            // add REPORTS (comment)
            const id = commentId;
            const type = 'COMMENT'; // 'POST', 'USER', 'REVIEW', 'COMMENT'
            const timestamp = Firebase.getTimestamp();

            const report = {
                uid: reporterUid, // reporter
                type,
                userId: ownerUid,
                commentId, // owner
                timestamp
            };

            await Firebase.firestore.collection("REPORTS").doc(id).set(report);
        }).catch((error) => {
            console.log('jdub', 'Firebase.reportComment', error);
            result = false;
        });

        return result;
    }

    static async unblockPost(uid, placeId, feedId) {
        let result;

        const feedRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);

        await Firebase.firestore.runTransaction(async transaction => {
            const postDoc = await transaction.get(feedRef);
            if (!postDoc.exists) throw 'Post document not exist!';

            let feed = postDoc.data();

            let { reporters } = feed.d;

            // 하위호환
            // if (!reporters) reporters = [];

            const idx = reporters.indexOf(uid);
            if (idx !== -1) {
                reporters.splice(idx, 1);
            }

            feed.d.reporters = reporters;

            transaction.update(feedRef, feed);
        }).then(async () => {
            result = true;

            // remove REPORTS (post)
            const id = feedId;
            const reportRef = Firebase.firestore.collection("REPORTS").doc(id);
            await reportRef.delete();
        }).catch((error) => {
            console.log('jdub', 'Firebase.unblockPost', error);
            result = false;
        });

        return result;
    }

    static async unblockReview(uid, placeId, feedId, reviewId) {
        let result;

        const reviewRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId);

        await Firebase.firestore.runTransaction(async transaction => {
            const reviewDoc = await transaction.get(reviewRef);
            if (!reviewDoc.exists) throw 'Review document not exist!';

            let review = reviewDoc.data();

            let { reporters } = review;

            // 하위호환
            // if (!reporters) reporters = [];

            const idx = reporters.indexOf(uid);
            if (idx !== -1) {
                reporters.splice(idx, 1);
            }

            review.reporters = reporters;

            transaction.update(reviewRef, review);
        }).then(async () => {
            result = true;

            // remove REPORTS (review)
            const id = reviewId;
            const reportRef = Firebase.firestore.collection("REPORTS").doc(id);
            await reportRef.delete();
        }).catch((error) => {
            console.log('jdub', 'Firebase.unblockPost', error);
            result = false;
        });

        return result;
    }

    static async unblockComment(reporterUid, ownerUid, commentId) {
        let result;

        const receiverRef = Firebase.firestore.collection("users").doc(ownerUid);
        const commentRef = receiverRef.collection("comments").doc(commentId);

        await Firebase.firestore.runTransaction(async transaction => {
            const commentDoc = await transaction.get(commentRef);
            if (!commentDoc.exists) throw 'Comment document not exist!';

            let comment = commentDoc.data();

            let { reporters } = comment;

            // 하위호환
            // if (!reporters) reporters = [];

            const idx = reporters.indexOf(reporterUid);
            if (idx !== -1) {
                reporters.splice(idx, 1);
            }

            comment.reporters = reporters;

            transaction.update(commentRef, comment);
        }).then(async () => {
            result = true;

            // remove REPORTS (comment)
            const id = commentId;
            const reportRef = Firebase.firestore.collection("REPORTS").doc(id);
            await reportRef.delete();
        }).catch((error) => {
            console.log('jdub', 'Firebase.unblockComment', error);
            result = false;
        });

        return result;
    }

    static async updateReviewChecked(uid, placeId, feedId, checked) {
        let result;

        const ownerRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const ownerDoc = await transaction.get(ownerRef);
            if (!ownerDoc.exists) throw 'User document not exist!';

            let user = ownerDoc.data();
            let { feeds } = user;
            for (let i = 0; i < feeds.length; i++) {
                let feed = feeds[i];
                if (feed.placeId === placeId && feed.feedId === feedId) {
                    // update
                    feed.reviewAdded = checked;
                    feeds[i] = feed;

                    break;
                }
            }

            user.feeds = feeds;

            transaction.update(ownerRef, user);
        }).then(() => {
            result = true;
        }).catch((error) => {
            console.log('jdub', 'Firebase.updateReviewChecked', error);
            result = false;
        });

        return result;
    }

    // static async addReview(ownerUid, placeId, feedId, userUid, comment, rating, picture) {
    static async addReview(ownerUid, placeId, feedId, postPicture, userUid, name, place, picture, comment, rating) {
        let result;

        const id = Util.uid();
        const timestamp = Firebase.getTimestamp();

        const review = {
            id: id,
            rating: rating,
            comment: comment,
            timestamp: timestamp,
            uid: userUid,
            name,
            place,
            picture,
            reply: null,
            reporters: []
        };

        // update - averageRating, reviewCount, reviews, stats
        const feedRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId);
        const userRef = Firebase.firestore.collection("users").doc(userUid);

        await Firebase.firestore.runTransaction(async transaction => {
            const feedDoc = await transaction.get(feedRef);
            if (!feedDoc.exists) throw 'Post document not exist!';

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            let feed = feedDoc.data();

            // reviewCount
            let { reviewCount } = feed.d;

            // averageRating
            const size = reviewCount;
            let { averageRating } = feed.d;
            let totalRating = averageRating * size;
            totalRating += review.rating;
            averageRating = totalRating / (size + 1);
            averageRating = averageRating.toFixed(1);

            reviewCount++;

            // stats
            let { reviewStats } = feed.d;
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

            feed.d.reviewCount = reviewCount;
            feed.d.averageRating = averageRating;
            feed.d.reviewStats = reviewStats;

            transaction.update(feedRef, feed);

            // add new review item (map) in reviews (array)
            let user = userDoc.data();

            const item = {
                placeId: placeId,
                feedId: feedId,
                reviewId: id,
                replyAdded: false,
                postPicture
            };

            user.reviews.push(item);

            transaction.update(userRef, user);
        }).then(() => {
            result = true;
        }).catch((error) => {
            console.log('jdub', 'Firebase.addReview', error);
            result = false;
        });

        if (!result) return false;

        // add to reviews collection
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

            let user = userDoc.data();
            let { reviews } = user;

            if (picture === null) { // remove review
                let newReviews = [];
                for (let i = 0; i < reviews.length; i++) {
                    const review = reviews[i];
                    if (review.placeId === placeId && review.feedId === feedId) {
                        // skip
                    } else {
                        /*
                        const newReview = _.clone(review);
                        newReviews.push(newReview);
                        */
                        newReviews.push(review);
                    }
                }

                /*
                const data = {
                    reviews: newReviews
                };

                transaction.update(userRef, data);
                */
                user.reviews = newReviews;
                transaction.update(userRef, user);
            } else {
                for (let i = 0; i < reviews.length; i++) {
                    let review = reviews[i];
                    if (review.placeId === placeId && review.feedId === feedId) {
                        review.picture = picture;
                        reviews[i] = review;
                        // break;
                    }
                }

                user.reviews = reviews;

                transaction.update(userRef, user);
            }
        }).then(() => {
            // console.log('jdub', 'Firebase.updateReview, success.');
        }).catch((error) => {
            console.log('jdub', 'Firebase.updateReview', error);
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

        let review = reviewDoc.data();
        const rating = review.rating; // reviewDoc.data(): rating, comment, timestamp

        // update - averageRating, reviewCount, reviews
        await Firebase.firestore.runTransaction(async transaction => {
            const feedDoc = await transaction.get(feedRef);
            if (!feedDoc.exists) throw 'Post document not exist!';

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            let feed = feedDoc.data();

            // 1. reviewCount
            let { reviewCount } = feed.d;
            // console.log('jdub', 'reviewCount will be', reviewCount - 1);

            // 2. averageRating
            const size = reviewCount;
            let { averageRating } = feed.d;
            let totalRating = averageRating * size;
            totalRating -= rating;

            reviewCount--;

            if (size - 1 === 0) { // to avoid 0 / 0
                averageRating = 0;
            } else {
                averageRating = totalRating / (size - 1);
                averageRating = averageRating.toFixed(1);
            }
            // console.log('jdub', 'averageRating', averageRating);

            // 3. stats
            let { reviewStats } = feed.d;
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

            feed.d.reviewCount = reviewCount;
            feed.d.averageRating = averageRating;
            feed.d.reviewStats = reviewStats;

            // transaction.update(feedRef, { d: { reviewCount: Number(reviewCount - 1), averageRating: Number(averageRating), reviewStats: reviewStats } });
            transaction.update(feedRef, feed);

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

            let user = userDoc.data();
            let { reviews } = user;
            let index = -1;
            for (let i = 0; i < reviews.length; i++) {
                const item = reviews[i];
                if (item.reviewId === reviewId) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) reviews.splice(index, 1);

            user.reviews = reviews;

            transaction.update(userRef, user);
        }).then(() => {
            // console.log('jdub', "Transaction successfully committed!");
            result = true;
        }).catch((error) => {
            console.log('jdub', 'Firebase.removeReview', error);
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

            let user = userDoc.data();

            let { reviews } = user;
            for (let i = 0; i < reviews.length; i++) {
                let review = reviews[i];
                if (review.placeId === placeId && review.feedId === feedId && review.reviewId === reviewId) {
                    // update
                    review.replyAdded = checked;
                    reviews[i] = review;

                    break;
                }
            }

            user.reviews = reviews;

            transaction.update(userRef, user);
        }).then(() => {
            result = true;
        }).catch((error) => {
            console.log('jdub', 'Firebase.updateReplyChecked', error);
            result = false;
        });

        return result;
    }

    static async addReply(placeId, feedId, reviewOwnerUid, reviewId, userUid, message) {
        // add reply ref in profile (userUid)
        let reviewRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId);
        let userRef = Firebase.firestore.collection("users").doc(userUid);

        await Firebase.firestore.runTransaction(async transaction => {
            const reviewdoc = await transaction.get(reviewRef);
            if (!reviewdoc.exists) return;

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) return;

            let review = reviewdoc.data();

            const id = Util.uid(); // reply id
            const timestamp = Firebase.getTimestamp();
            const reply = {
                id: id,
                uid: userUid,
                comment: message,
                timestamp: timestamp
            }

            review.reply = reply;

            transaction.update(reviewRef, review);

            const item = {
                placeId: placeId,
                feedId: feedId,
                reviewId: reviewId,
                replyId: id
            };

            /*
            let userData = {
                replies: firebase.firestore.FieldValue.arrayUnion(item)
            };

            transaction.update(userRef, userData);
            */
            let user = userDoc.data();
            user.replies.push(item);

            transaction.update(userRef, user);
        });

        // return await Firebase.updateReplyChecked(placeId, feedId, reviewOwnerUid, reviewId, true);
        Firebase.updateReplyChecked(placeId, feedId, reviewOwnerUid, reviewId, true);
    };

    static async removeReply(placeId, feedId, reviewId, replyId, userUid) {
        let reviewRef = Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(reviewId);
        let userRef = Firebase.firestore.collection("users").doc(userUid);

        await Firebase.firestore.runTransaction(async transaction => {
            const reviewdoc = await transaction.get(reviewRef);
            if (!reviewdoc.exists) return;

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) return;

            let review = reviewDoc.data();
            review.reply = null;

            transaction.update(reviewRef, review);

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
            let user = userDoc.data();
            let { replies } = user;
            let index = -1;
            for (let i = 0; i < replies.length; i++) {
                const item = replies[i];
                if (item.replyId === replyId) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) replies.splice(index, 1);

            user.replies = replies;

            transaction.update(userRef, user);
        });

        // Consider: just leave the replyAdded valueuserRef in guest's user profile
    }

    // customer review
    // --
    // static async addComment(uid, targetUid, comment, placeId, feedId) { // uid: writer (boss, not girl), targetUid: receiver (guest)
    static async addComment(uid, targetUid, placeId, feedId, comment, name, address, picture) { // uid: writer (boss, not girl), targetUid: receiver (guest)
        let result;

        const id = Util.uid(); // comment id
        const timestamp = Firebase.getTimestamp();

        const obj = {
            id,
            timestamp,
            uid,
            placeId,
            feedId,
            comment,
            name,
            placeName: address,
            picture
        };

        const receiverRef = Firebase.firestore.collection("users").doc(targetUid); // receiver
        const writerRef = Firebase.firestore.collection("users").doc(uid); // writer (me)
        const commentRef = receiverRef.collection("comments").doc(id);

        await Firebase.firestore.runTransaction(async transaction => {
            const receiverDoc = await transaction.get(receiverRef);
            if (!receiverDoc.exists) throw 'User document not exist!';

            const writerDoc = await transaction.get(writerRef);
            if (!writerDoc.exists) throw 'User document not exist!';

            // 1. update receivedCommentsCount in receiver (guest) user profile
            let receiver = receiverDoc.data();
            let { receivedCommentsCount } = receiver;
            if (!receivedCommentsCount) receivedCommentsCount = 0; // 하위호환

            receivedCommentsCount++;

            receiver.receivedCommentsCount = receivedCommentsCount;
            receiver.commentAdded = true;

            transaction.update(receiverRef, receiver);

            // 2. update comments array in writer (boss) user profile
            let writer = writerDoc.data();
            const item = {
                userUid: targetUid,
                commentId: id,
                name: receiver.name,
                placeName: receiver.place,
                picture: receiver.picture.uri // customer profile picture
            };

            /*
            let data = {
                comments: firebase.firestore.FieldValue.arrayUnion(item)
            };
            */

            writer.comments.push(item);
            transaction.update(writerRef, writer);
        }).then(() => {
            // console.log('jdub', "Transaction successfully committed!");
            result = true;
        }).catch((error) => {
            console.log('jdub', 'Firebase.addComment', error);
            result = false;
        });

        if (!result) return false;

        // 3. add comment to receiver's comments collection
        await commentRef.set(obj);

        return true;
    };

    static async updateComments(uid, targetUid, name, place, picture) {
        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            let user = userDoc.data()

            let { comments } = user; // array

            if (name === null && place === null && picture === null) { // remove comment
                let newComments = [];
                for (let i = 0; i < comments.length; i++) {
                    const comment = comments[i];
                    if (comment.userUid === targetUid) {
                        // skip
                    } else {
                        /*
                        const newComment = _.clone(comment);
                        newComments.push(newComment);
                        */
                        newComments.push(comment);
                    }
                }

                /*
                const data = {
                    comments: newComments
                };
                */
                user.comments = newComments;

                transaction.update(userRef, user);
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

                /*
                const data = {
                    comments
                };
                */

                user.comments = comments;

                transaction.update(userRef, user);
            }
        }).then(() => {
            // console.log('jdub', 'Firebase.updateComments, success.');
        }).catch((error) => {
            console.log('jdub', 'Firebase.updateComments', error);
        });
    };

    static async updateCommentChecked(uid, checked) {
        /*
        const profile = {
            commentAdded: checked
        };

        await Firebase.firestore.collection("users").doc(uid).update(profile);
        */

        const userRef = Firebase.firestore.collection("users").doc(uid);

        await Firebase.firestore.runTransaction(async transaction => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw 'User document not exist!';

            let user = userDoc.data();
            user.commentAdded = checked;

            transaction.update(userRef, user);
        });
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
            let receiver = receiverDoc.data();
            let { receivedCommentsCount } = receiver;
            // console.log('jdub', 'receivedCommentsCount will be', receivedCommentsCount - 1);

            receivedCommentsCount--;

            receiver.receivedCommentsCount = receivedCommentsCount;

            transaction.update(receiverRef, receiver);

            // 2. update comments array in writer (boss) user profile
            let writer = writerDoc.data();
            let { comments } = writer;
            let index = -1;
            for (let i = 0; i < comments.length; i++) {
                const item = comments[i];
                if (item.commentId === commentId) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) comments.splice(index, 1);

            writer.comments = comments;

            transaction.update(writerRef, writer);
        }).then(() => {
            // console.log('jdub', "Transaction successfully committed!");
            result = true;
        }).catch((error) => {
            console.log('jdub', 'Firebase.removeComment', error);
            result = false;
        });

        if (!result) return false;

        // remove
        await commentRef.delete();

        return true;
    }
    // --

    static async updateShowMe(uid, profile) {
        await Firebase.firestore.collection("users").doc(uid).update(profile);
    }

    //// Realtime Database ////

    static async createChatRoom(uid, users, placeId, feedId, id, placeName, owner, addSystemMessage) {
        // console.log('jdub', uid, users, placeId, feedId, id, placeName, owner, addSystemMessage);

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

    static loadChatRoom(count, uid, cb) {
        Firebase.database.ref('chat').child(uid).orderByChild('timestamp').limitToLast(count).on('value', snapshot => {
            if (snapshot.exists()) {
                // invert the results
                let list = [];
                Util.reverseSnapshot(snapshot).forEach(child => {
                    list.push(child.val());
                });

                cb(list);
            } else {
                cb(null);
            }
        });
    }

    static stopChatRoom(uid) {
        Firebase.database.ref('chat').child(uid).off();
    }

    static loadMoreChatRoom(count, uid, timestamp, id, cb) {
        // console.log('jdub', 'timestamp', timestamp);

        Firebase.database.ref('chat').child(uid).orderByChild('timestamp').endAt(timestamp).limitToLast(count + 1).once('value', snapshot => {
            if (snapshot.exists()) {
                // invert the results
                let list = [];
                Util.reverseSnapshot(snapshot).forEach(child => {
                    if (child.val().id !== id) { // filter by id
                        list.push(child.val());
                    }
                });

                if (list.length === 0) cb(null);
                else cb(list);
            } else {
                cb(null);
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
            // console.log('jdub', item.key, item.val());
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

    static chatOn(count, id, cb) {
        Firebase.database.ref('contents').child(id).orderByChild('timestamp').limitToLast(count).on('child_added', snapshot => {
            if (snapshot.exists()) {
                cb(Firebase.parseChild(snapshot));
            } else {
                cb(null);
            }
        });
    }

    static chatOff(id) {
        Firebase.database.ref('contents').child(id).off();
    }

    static loadMoreMessage(count, id, lastMessageTimestamp, lastMessageId, cb) {
        // console.log('jdub', 'loadMoreMessage', id, lastMessageTimestamp, lastMessageId);

        Firebase.database.ref('contents').child(id).orderByChild('timestamp').endAt(lastMessageTimestamp).limitToLast(count + 1).once('value', snapshot => {
            if (snapshot.exists()) {
                cb(Firebase.parseValue(snapshot, lastMessageId));
            } else {
                cb(null);
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

        // console.log('jdub', 'type', snap.key);
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
        // console.log('jdub', 'Firebase.saveLastReadMessageId', uid, id, mid);

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
                // console.log('jdub', item.key, item.val());
                const key = item.key;
                const value = item.val();

                // console.log('jdub', 'value', value);

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
                    // console.log('jdub', item.key, item.val());

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
            console.log('jdub', 'Firebase.findChatRoomByPostId', error);
            result = false;
        });

        if (!result) return null;

        return room;
    }

    static async findChatRoomById(myUid, chatRoomId) {
        let room = null;

        await Firebase.database.ref('chat').child(myUid).child(chatRoomId).once('value').then(snapshot => {
            const data = snapshot.val();
            // console.log('jdub', 'room data', data);

            room = data;

            // return data;

            /*
            snapshot.forEach(item => {
                // console.log('jdub', item.key, item.val());
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
                // console.log('jdub', item.key, item.val());

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
            console.log('jdub', 'Firebase.deleteChatRooms', error);
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
            // console.log('jdub', 'Firebase.updateChatRoom, success.');
        }).catch((error) => {
            console.log('jdub', 'Firebase.updateChatRoom, error', error);
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
            // console.log('jdub', 'Firebase.updateChatRoom, success.');
        }).catch((error) => {
            console.log('jdub', 'Firebase.updateChatRoom, error', error);
        });
    }



}
