import * as _ from "lodash";
import { observable, computed } from "mobx";
import Firebase from "./Firebase";
import type { Comment, Comments, CommentEntry, Profile } from "./rnff/src/components/Model";

const DEFAULT_REVIEW_COUNT = 5;


export default class CommentStore {
    @observable _reviews: Comments;

    @computed get reviews(): Comments { return this._reviews; }
    set reviews(reviews: Comments) { this._reviews = reviews; }

    cursor: any;
    lastKnownEntry: any;
    query: any;

    // profiles: { [uid: string]: Profile } = {};
    posts: { [id: string]: Post } = {}; // id: comment id

    addToReviewFinishedCallbackList = [];

    allReviewsLoaded = false;


    // To block keeping calling loadReview() while scrolling
    /*
    setAddToReviewFinishedCallback(cb) {
        this.addToReviewFinishedCallback = cb;
    }
    */
    setAddToReviewFinishedCallback(cb) {
        this.addToReviewFinishedCallbackList.push(cb);
    }

    unsetAddToReviewFinishedCallback(cb) {
        const index = this.addToReviewFinishedCallbackList.indexOf(cb);
        this.addToReviewFinishedCallbackList.splice(index, 1);
    }

    callAddToReviewFinishedCallback() {
        for (let i = 0; i < this.addToReviewFinishedCallbackList.length; i++) {
            const cb = this.addToReviewFinishedCallbackList[i];
            cb();
        }
    }

    loadReviewFromStart(count) {
        if (this.query) this.init(this.query, count);
    }

    init(query, count) {
        this.cursor = undefined;
        this.lastKnownEntry = undefined;
        // this.query = undefined;
        // this.profiles = {};
        this.posts = {};
        this.reviews = undefined;
        this.allReviewsLoaded = false;

        this.query = query;
        this.loadReview(count);
    }

    async loadReview(count): Promise<void> {
        let query = this.query;

        if (this.cursor) {
            query = query.startAfter(this.cursor);
        }

        const snap = await query.limit(count).get();
        if (snap.docs.length === 0) {
            if (!this.reviews) {
                this.reviews = [];
            }

            this.allReviewsLoaded = true;
            // if (this.addToReviewFinishedCallback) this.addToReviewFinishedCallback();
            this.callAddToReviewFinishedCallback();

            return;
        }

        const reviews: Comment[] = [];
        snap.forEach(reviewDoc => {
            reviews.push(reviewDoc.data());
        });

        // const _reviews = await this.joinProfiles(reviews);
        const _reviews = await this.joinPost(reviews);
        if (!this.reviews) {
            this.reviews = [];
            this.lastKnownEntry = snap.docs[0];
        }

        this.addToReview(_reviews);
        this.cursor = _.last(snap.docs);

        /*
        let allReviewsLoaded = false;
        if (reviews.length < DEFAULT_REVIEW_COUNT) allReviewsLoaded = true;

        this.allReviewsLoaded = allReviewsLoaded;
        */
        if (reviews.length < count) this.allReviewsLoaded = true;

        // if (this.addToReviewFinishedCallback) this.addToReviewFinishedCallback();
        this.callAddToReviewFinishedCallback();
    }

    async joinProfiles(reviews: Comment[]): Promise<ReviewEntry[]> { // mapping review and review writer
        const uids = reviews.map(review => review.uid).filter(uid => this.profiles[uid] === undefined);

        const profilePromises = _.uniq(uids).map(uid => (async () => {
            try {
                const profileDoc = await Firebase.firestore.collection("users").doc(uid).get();
                this.profiles[uid] = profileDoc.data();
            } catch (e) {
                // this.profiles[uid] = DEFAULT_PROFILE;
            }
        })());

        await Promise.all(profilePromises);

        return reviews.map(review => {
            const profile = this.profiles[review.uid];

            return { profile, review };
            // if (profile) return { profile, review };
        });
    }

    async joinPost(comments: Comment[]): Promise<CommentEntry[]> { // mapping review and review writer
        let array: Comment[] = [];
        for (let i = 0; i < comments.length; i++) {
            const comment = comments[i];
            if (this.posts[comment.id] === undefined) {
                array.push(comment);
            }
        }

        // console.log('jdub', 'CommentStore.joinPost, array', array);

        const promises = _.uniqBy(array, item => item.id).map(item => (async () => {
            // console.log('jdub', 'CommentStore.joinPost, uniqBy', item.placeId, item.feedId);

            try {
                const feedDoc = await Firebase.firestore.collection("places").doc(item.placeId).collection("feed").doc(item.feedId).get();
                if (feedDoc.exists) this.posts[item.id] = feedDoc.data();
            } catch (e) {
                console.log('jdub', 'CommentStore.joinPost, feed not exists. (old comment)');
            }
        })());

        await Promise.all(promises);

        return comments.map(comment => {
            const post = this.posts[comment.id];

            return { comment, post };
        });
    }

    addToReview(entries: CommentEntry[]) {
        const _reviews = _.uniqBy([...this.reviews.slice(), ...entries], entry => entry.comment.id);

        this.reviews = _.orderBy(_reviews, entry => entry.comment.timestamp, ["desc"]);
    }

    async checkForNewEntries(): Promise<void> {
        // console.log('jdub', 'checkForNewEntries', this.lastKnownEntry);

        if (this.lastKnownEntry) {
            const snap = await this.query.endBefore(this.lastKnownEntry).get();
            if (snap.docs.length === 0) {
                if (!this.reviews) {
                    this.reviews = [];
                }

                return;
            }

            const reviews: Comment[] = [];
            snap.forEach(reviewDoc => {
                reviews.push(reviewDoc.data());
            });

            // const _reviews = await this.joinProfiles(reviews);
            const _reviews = await this.joinPost(reviews);
            if (!this.reviews) {
                this.reviews = [];
                this.lastKnownEntry = snap.docs[0];
            }

            this.addToReview(_reviews);

            this.lastKnownEntry = snap.docs[0];
        }
    }
}
