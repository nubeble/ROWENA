// @flow
import * as _ from "lodash";
import { observable, computed } from "mobx";
import Firebase from "../../../Firebase";
import type { Feed, FeedEntry, Profile, Post } from "../components/Model";

const DEFAULT_PAGE_SIZE = 5;

const DEFAULT_PROFILE: Profile = {
    uid: 'uid',
    name: 'name',
    country: 'country',
    city: 'city',
    email: 'email',
    phoneNumber: 'phoneNumber',
    picture: {
        preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAABgElEQVQYGQ2Qu0tbcQCFv1+87xCrSb0mJMaQpPGi1QwtilmEqlPHQuna/6B/gnOhQ6aOxaWUIuLiA4eIhSrSDg4mJAqNpNhq6qPk0cTcJLd3ONP5OB8cwcalg3BY0mDckLm7vcbs3lMzI3xs2NDHrQUe1RBMeAUM6vR6bR7nPhHe+UDYrvHar5PWBQE30rwqCBka5n2D8P46oaNV5P4V7bEI9vIrfA98lP51kKZ8Ov5WjWBujdBu1lUkcUSKwb33XKoG4WcvMFxGGmveEMitE9l8i9b283XUS0dTWa4oDGxnsVUNdeE5Ay8T8ZXE5zcoVzr5QIxoapikqXBhS0TyZYxfh9RH4u5i8Tv9E8hnJhl99JCJSgVNl5CsGGfiCcmtbaLzx4gNw3RKs2msoIZ1cc75aZ1ezSa1EOSnNUX5xy2xowLi3eKiY7n3mKU8N6XfNL0ysugx1OgTylhUp6cpVFtI8W4dvnyj8Nfh2qPQNboMyx4aHYXWQZFg9Q8zT+f4D7nQgfd+SkaGAAAAAElFTkSuQmCC",
        uri: 'https://firebasestorage.googleapis.com/v0/b/react-native-e.appspot.com/o/a2a3dd0004c35ac29dea5921158b5122d3f4a275.png?alt=media&token=2849b892-fbcd-4c5f-ba45-575694f9094a'
    },
    location: {
        description: 'description',
        longitude: 0.0,
        latitude: 0.0
    },
    about: 'about',
    // feeds: {},
    feeds: [],
    reviews: []
};

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


    setAddToFeedFinishedCallback(cb) {
        this.addToFeedFinishedCallback = cb;
    }

    // eslint-disable-next-line flowtype/no-weak-types
    init(query: any) {
        this.cursor = undefined;
        this.lastKnownEntry = undefined;
        this.query = undefined;
        this.profiles = {};
        this.feed = undefined;

        this.query = query;
        this.loadFeed();
    }

    async loadFeed(): Promise<void> {
        // eslint-disable-next-line prefer-destructuring
        let query = this.query;
        // console.log('loadFeed() query', query);

        if (this.cursor) {
            query = query.startAfter(this.cursor);
        }

        const snap = await query.limit(DEFAULT_PAGE_SIZE).get();
        if (snap.docs.length === 0) {
            if (!this.feed) {
                this.feed = [];
            }

            if(this.addToFeedFinishedCallback !== undefined && this.addToFeedFinishedCallback) this.addToFeedFinishedCallback(false);

            return;
        }

        const posts: Post[] = [];
        snap.forEach(postDoc => {
            // print
            console.log('loadFeed() id', postDoc.id, 'data', postDoc.data());

            posts.push(postDoc.data());
        });

        console.log('loadFeed() posts', posts);

        const feed = await this.joinProfiles(posts);
        if (!this.feed) {
            this.feed = [];
            // eslint-disable-next-line prefer-destructuring
            this.lastKnownEntry = snap.docs[0];
        }

        this.addToFeed(feed);
        this.cursor = _.last(snap.docs);

        if(this.addToFeedFinishedCallback !== undefined && this.addToFeedFinishedCallback) this.addToFeedFinishedCallback(true);
    }

    addToFeed(entries: FeedEntry[]) {
        const feed = _.uniqBy([...this.feed.slice(), ...entries], entry => entry.post.id);

        this.feed = _.orderBy(feed, entry => entry.post.timestamp, ["desc"]);
    }

    async checkForNewEntriesInFeed(): Promise<void> {
        console.log('checkForNewEntriesInFeed');

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

            console.log('checkForNewEntriesInFeed() posts', posts);

            const feed = await this.joinProfiles(posts);
            this.addToFeed(feed);
            // eslint-disable-next-line prefer-destructuring
            this.lastKnownEntry = snap.docs[0];
        }
    }

    subscribeToPost(placeId: string, id: string, callback: Post => void): Subscription {
        console.log('FeedStore::subscribeToPost', placeId, id);

        /*
        return Firebase.firestore.collection("feed").where("id", "==", id).onSnapshot(async snap => {
            const post = snap.docs[0].data();
            callback(post);
            this.feed.forEach((entry, index) => {
                if (entry.post.id === post.id) {
                    this.feed[index].post = post;
                }
            });
        });
        */

        // return Firebase.firestore.collection("place").doc(placeId).collection("feed").where("id", "==", id).onSnapshot(async snap => {
        return Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(id).onSnapshot(async snap => {
            // const post = snap.docs[0].data();
            const post = snap.data();
            console.log('feed changed.', post);
            callback(post);

            this.feed.forEach((entry, index) => {
                if (entry.post.id === post.id) {
                    this.feed[index].post = post;
                }
            });
        });
    }

    subscribeToProfile(id: string, callback: Profile => void): Subscription {
        console.log('FeedStore::subscribeToProfile');

        return Firebase.firestore.collection("users").doc(id).onSnapshot(async snap => {
            const profile = snap.exists ? snap.data() : DEFAULT_PROFILE;
            console.log('profile changed.', profile);
            callback(profile);

            this.feed.forEach((entry, index) => {
                if (entry.post.uid === id) {
                    this.feed[index].profile = profile;
                }
            });
        });
    }

    async joinProfiles(posts: Post[]): Promise<FeedEntry[]> { // feed와 feed의 owner를 계산
        console.log('FeedStore::joinProfiles');

        const uids = posts.map(post => post.uid).filter(uid => this.profiles[uid] === undefined);

        const profilePromises = _.uniq(uids).map(uid => (async () => {
            try {
                const profileDoc = await Firebase.firestore.collection("users").doc(uid).get();
                this.profiles[uid] = profileDoc.data();
            } catch (e) {
                this.profiles[uid] = DEFAULT_PROFILE;
            }
        })());

        await Promise.all(profilePromises);

        return posts.map(post => {
            const profile = this.profiles[post.uid];

            // print
            console.log('joinProfiles profile', profile, 'post', post);

            return { profile, post };
        });
    }
}
