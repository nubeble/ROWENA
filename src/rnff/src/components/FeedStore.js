// @flow
import * as _ from "lodash";
import { observable, computed } from "mobx";
import Firebase from "../../../Firebase";
import type { Feed, FeedEntry, Profile, Post } from "../components/Model";

const DEFAULT_FEED_COUNT = 10;

/*
const DEFAULT_PROFILE: Profile = {
    uid: 'uid',
    name: 'default name',
    country: 'country',
    city: 'city',
    email: 'email',
    phoneNumber: 'phoneNumber',
    picture: {
        preview: null,
        uri: null
    },
    about: 'about',
    feeds: [],
    reviews: [],
    replies: [],
    likes: []
};
*/

type Subscription = () => void;


export default class FeedStore {
    // eslint-disable-next-line flowtype/no-weak-types
    cursor: any;
    // eslint-disable-next-line flowtype/no-weak-types
    lastKnownEntry: any;
    // eslint-disable-next-line flowtype/no-weak-types
    query: any;

    profiles: { [uid: string]: Profile } = {};

    @observable _feed: Feed;

    @computed get feed(): Feed { return this._feed; }
    set feed(feed: Feed) { this._feed = feed; }

    allFeedsLoaded = false;

    order; // 'timestamp', 'averageRating', 'reviewCount'


    setAddToFeedFinishedCallback(cb) {
        this.addToFeedFinishedCallback = cb;
    }

    unsetAddToFeedFinishedCallback(cb) {
        if (this.addToFeedFinishedCallback === cb) this.addToFeedFinishedCallback = undefined;
    }

    loadFeedFromStart() {
        if (this.query && this.order) this.init(this.query, this.order);
    }

    // eslint-disable-next-line flowtype/no-weak-types
    init(query: any, order) {
        this.cursor = undefined;
        this.lastKnownEntry = undefined;
        // this.query = undefined;
        this.profiles = {};
        this.feed = undefined;
        this.allFeedsLoaded = false;
        // this.order = undefined;

        this.query = query;
        this.order = order;
        this.loadFeed();
    }

    async loadFeed(): Promise<void> {
        // eslint-disable-next-line prefer-destructuring
        let query = this.query;
        // console.log('jdub', 'loadFeed() query', query);

        if (this.cursor) {
            query = query.startAfter(this.cursor);
        }

        const snap = await query.limit(DEFAULT_FEED_COUNT).get();

        if (snap.docs.length === 0) {
            if (!this.feed) {
                this.feed = [];
            }

            this.allFeedsLoaded = true;
            if (this.addToFeedFinishedCallback) this.addToFeedFinishedCallback();

            return;
        }

        const posts: Post[] = [];
        snap.forEach(postDoc => {
            // console.log('jdub', 'loadFeed() id', postDoc.id, 'data', postDoc.data());

            posts.push(postDoc.data());
        });

        // console.log('jdub', 'loadFeed() posts', posts);

        const feed = await this.joinProfiles(posts);
        if (!this.feed) {
            this.feed = [];
            // eslint-disable-next-line prefer-destructuring
            this.lastKnownEntry = snap.docs[0];
        }

        this.addToFeed(feed);
        this.cursor = _.last(snap.docs);

        /*
        let allFeedsLoaded = false;
        if (posts.length < DEFAULT_FEED_COUNT) allFeedsLoaded = true;
        this.allFeedsLoaded = allFeedsLoaded;
        */
        if (posts.length < DEFAULT_FEED_COUNT) this.allFeedsLoaded = true;

        if (this.addToFeedFinishedCallback) this.addToFeedFinishedCallback();
    }

    addToFeed(entries: FeedEntry[]) {
        const feed = _.uniqBy([...this.feed.slice(), ...entries], entry => entry.post.d.id);

        if (this.order === 'd.timestamp') this.feed = _.orderBy(feed, entry => entry.post.d.timestamp, ["desc"]);
        else if (this.order === 'd.averageRating') this.feed = _.orderBy(feed, entry => entry.post.d.averageRating, ["desc"]);
        else if (this.order === 'd.reviewCount') this.feed = _.orderBy(feed, entry => entry.post.d.reviewCount, ["desc"]);
        else if (this.order === 'd.totalVisitCount') this.feed = _.orderBy(feed, entry => entry.post.d.totalVisitCount, ["desc"]);
        else this.feed = feed;
    }

    async checkForNewEntriesInFeed(): Promise<void> {
        console.log('jdub', 'checkForNewEntriesInFeed');

        if (this.lastKnownEntry) {
            const snap = await this.query.endBefore(this.lastKnownEntry).get();
            if (snap.docs.length === 0) {
                if (!this.feed) {
                    this.feed = [];
                }
                return;
            }
            const posts: Post[] = [];
            snap.forEach(postDoc => {
                posts.push(postDoc.data());
            });

            console.log('jdub', 'checkForNewEntriesInFeed() posts', posts);

            const feed = await this.joinProfiles(posts);
            this.addToFeed(feed);
            // eslint-disable-next-line prefer-destructuring
            this.lastKnownEntry = snap.docs[0];
        }
    }

    subscribeToPost(placeId: string, id: string, callback: Post => void): Subscription {
        console.log('jdub', 'FeedStore.subscribeToPost', placeId, id);
        /*
        // return Firebase.firestore.collection("places").doc(placeId).collection("feed").where("id", "==", id).onSnapshot(async snap => {
        return Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(id).onSnapshot(snap => {
            // const post = snap.docs[0].data();
            const post = snap.data();
            console.log('jdub', 'FeedStore, feed changed.');
            callback(post);

            this.feed.forEach((entry, index) => {
                if (entry.post.id === post.id) {
                    this.feed[index].post = post;
                }
            });
        });
        */
        return Firebase.firestore.collection("places").doc(placeId).collection("feed").doc(id).onSnapshot(
            snap => {
                const post = snap.data();

                if (post) {
                    console.log('jdub', 'FeedStore, feed changed.');
                } else {
                    console.log('jdub', 'FeedStore, feed removed.');
                }

                callback(post);

                if (this.feed) {
                    this.feed.forEach((entry, index) => {
                        if (entry.post.d.id === id) {
                            this.feed[index].post = post;
                        }
                    });
                }
            },
            error => {
                console.log('jdub', 'FeedStore.subscribeToPost, error', error);
            }
        );
    }

    subscribeToProfile(uid: string, callback: Profile => void): Subscription {
        console.log('jdub', 'FeedStore.subscribeToProfile');

        /*
        return Firebase.firestore.collection("users").doc(uid).onSnapshot(snap => {
            const profile = snap.exists ? snap.data() : DEFAULT_PROFILE;
            console.log('jdub', 'FeedStore, profile changed.');
            callback(profile);

            this.feed.forEach((entry, index) => {
                if (entry.post.uid === uid) {
                    this.feed[index].profile = profile;
                }
            });
        });
        */
        return Firebase.firestore.collection("users").doc(uid).onSnapshot(
            snap => {
                const profile = snap.data();

                if (profile) {
                    console.log('jdub', 'FeedStore, profile changed.');
                } else {
                    console.log('jdub', 'FeedStore, profile removed.');
                }

                callback(profile);

                if (this.feed) {
                    this.feed.forEach((entry, index) => {
                        if (entry.post.d.uid === uid) {
                            this.feed[index].profile = profile;
                        }
                    });
                }
            },
            error => {
                console.log('jdub', 'FeedStore.subscribeToProfile, error', error);
            }
        );
    }

    async joinProfiles(posts: Post[]): Promise<FeedEntry[]> {
        // console.log('jdub', 'FeedStore.joinProfiles');

        const uids = posts.map(post => post.d.uid).filter(uid => this.profiles[uid] === undefined);

        const profilePromises = _.uniq(uids).map(uid => (async () => {
            try {
                // load database
                const profileDoc = await Firebase.firestore.collection("users").doc(uid).get();
                this.profiles[uid] = profileDoc.data();
            } catch (e) {
                // this.profiles[uid] = DEFAULT_PROFILE;
            }
        })());

        await Promise.all(profilePromises);

        return posts.map(post => {
            const profile = this.profiles[post.d.uid];

            // return { profile, post };
            if (profile) return { profile, post };
        });
    }

    updateFeed(post) {
        if (this.feed) {
            this.feed.forEach((entry, index) => {
                if (entry.post.d.id === post.d.id) {
                    this.feed[index].post = post;
                }
            });
        }
    }

    updateFeeds(posts) {
        if (this.feed) {
            this.feed.forEach((entry, index) => {
                for (let i = 0; i < posts.length; i++) {
                    const post = posts[i];
                    if (entry.post.d.id === post.d.id) {
                        this.feed[index].post = post;
                        break;
                    }
                }
            });
        }
    }
}
