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

    profiles: { [uid: string]: Profile } = {};

    allReviewsLoaded = false;


    // To block keeping calling loadReview() while scrolling
    setAddToReviewFinishedCallback(cb) {
        this.addToReviewFinishedCallback = cb;
    }

    loadReviewFromTheStart() {
        if (this.query) this.init(this.query);
    }

    init(query: any, count = DEFAULT_REVIEW_COUNT) {
        this.cursor = undefined;
        this.lastKnownEntry = undefined;
        this.query = undefined;
        this.profiles = {};
        this.reviews = undefined;
        this.allReviewsLoaded = false;

        this.query = query;
        this.loadReview(count);
    }

    async loadReview(count = DEFAULT_REVIEW_COUNT): Promise<void> {
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
            if (this.addToReviewFinishedCallback) this.addToReviewFinishedCallback();

            return;
        }

        const reviews: Comment[] = [];
        snap.forEach(reviewDoc => {
            reviews.push(reviewDoc.data());
        });

        const _reviews = await this.joinProfiles(reviews);
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

        if (this.addToReviewFinishedCallback) this.addToReviewFinishedCallback();
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

            // return { profile, review };
            if (profile) return { profile, review };
        });
    }

    addToReview(entries: CommentEntry[]) {
        const _reviews = _.uniqBy([...this.reviews.slice(), ...entries], entry => entry.review.id);

        this.reviews = _.orderBy(_reviews, entry => entry.review.timestamp, ["desc"]);
    }

    async checkForNewEntries(): Promise<void> {
        console.log('checkForNewEntries', this.lastKnownEntry);

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

            const _reviews = await this.joinProfiles(reviews);
            if (!this.reviews) {
                this.reviews = [];
                this.lastKnownEntry = snap.docs[0];
            }

            this.addToReview(_reviews);

            this.lastKnownEntry = snap.docs[0];
        }
    }
}
