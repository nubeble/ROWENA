import * as _ from "lodash";
import { observable, computed } from "mobx";
import Firebase from "./Firebase";
import type { Review, Reviews, ReviewEntry, Profile } from "./rnff/src/components/Model";

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
    feeds: [],
    reviews: []
};



export default class ChatStore {
    @observable _reviews: Reviews;

    @computed get reviews(): Reviews { return this._reviews; }
    set reviews(reviews: Reviews) { this._reviews = reviews; }

    cursor: any;
    lastKnownEntry: any;
    query: any;

    profiles: { [uid: string]: Profile } = {};

    setAddToReviewFinishedCallback(cb) {
        this.addToReviewFinishedCallback = cb; // to block keeping calling loadReview() while scrolling 
    }

    loadReviewFromTheStart() {
        if (this.query) this.init(this.query);
    }

    init(query: any, count = DEFAULT_PAGE_SIZE) {
        this.cursor = undefined;
        this.lastKnownEntry = undefined;
        this.query = undefined;
        this.profiles = {};
        this.reviews = undefined;

        this.query = query;
        this.loadReview(count);
    }

    async loadReview(count = DEFAULT_PAGE_SIZE): Promise<void> {
        let query = this.query;

        if (this.cursor) {
            query = query.startAfter(this.cursor);
        }

        const snap = await query.limit(count).get();
        if (snap.docs.length === 0) {
            if (!this.reviews) {
                this.reviews = [];
            }

            if (this.addToReviewFinishedCallback !== undefined && this.addToReviewFinishedCallback) this.addToReviewFinishedCallback(false);

            return;
        }

        const reviews: Review[] = [];
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

        if (this.addToReviewFinishedCallback !== undefined && this.addToReviewFinishedCallback) this.addToReviewFinishedCallback(true);
    }

    async joinProfiles(reviews: Review[]): Promise<ReviewEntry[]> { // mapping review and review writer
        const uids = reviews.map(review => review.uid).filter(uid => this.profiles[uid] === undefined);

        const profilePromises = _.uniq(uids).map(uid => (async () => {
            try {
                const profileDoc = await Firebase.firestore.collection("users").doc(uid).get();
                this.profiles[uid] = profileDoc.data();
            } catch (e) {
                this.profiles[uid] = DEFAULT_PROFILE;
            }
        })());

        await Promise.all(profilePromises);

        return reviews.map(review => {
            const profile = this.profiles[review.uid];

            console.log('joinProfiles profile', profile, 'review', review);

            return { profile, review };
        });
    }

    addToReview(entries: ReviewEntry[]) {
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

            const reviews: Review[] = [];
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
