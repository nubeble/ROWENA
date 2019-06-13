// @flow
import { observable, computed } from "mobx";
import Firebase from "../../../Firebase";
import type { Profile } from "../components/Model";

const DEFAULT_PROFILE: Profile = {
    /*
    uid: 'uid',
    name: 'default name',
    country: 'country',
    city: 'city',
    email: 'email',
    phoneNumber: 'phoneNumber',
    picture: {
        preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAABgElEQVQYGQ2Qu0tbcQCFv1+87xCrSb0mJMaQpPGi1QwtilmEqlPHQuna/6B/gnOhQ6aOxaWUIuLiA4eIhSrSDg4mJAqNpNhq6qPk0cTcJLd3ONP5OB8cwcalg3BY0mDckLm7vcbs3lMzI3xs2NDHrQUe1RBMeAUM6vR6bR7nPhHe+UDYrvHar5PWBQE30rwqCBka5n2D8P46oaNV5P4V7bEI9vIrfA98lP51kKZ8Ov5WjWBujdBu1lUkcUSKwb33XKoG4WcvMFxGGmveEMitE9l8i9b283XUS0dTWa4oDGxnsVUNdeE5Ay8T8ZXE5zcoVzr5QIxoapikqXBhS0TyZYxfh9RH4u5i8Tv9E8hnJhl99JCJSgVNl5CsGGfiCcmtbaLzx4gNw3RKs2msoIZ1cc75aZ1ezSa1EOSnNUX5xy2xowLi3eKiY7n3mKU8N6XfNL0ysugx1OgTylhUp6cpVFtI8W4dvnyj8Nfh2qPQNboMyx4aHYXWQZFg9Q8zT+f4D7nQgfd+SkaGAAAAAElFTkSuQmCC",
        uri: null
    },
    about: 'about',
    feeds: [],
    reviews: [],
    replies: [],
    likes: []
    */

    uid: null,
    name: null,
    birthday: null,
    gender: null,
    place: null,
    email: null,
    phoneNumber: null,
    picture: {
        uri: null,
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
    timestamp: 0
};


export default class ProfileStore {
    lastChangedTime: number;
    lastTimeFeedsUpdated: number;
    lastTimeLikesUpdated: number;
    lastTimeReviewsUpdated: number;
    lastTimeCommentsUpdated: number;


    // @observable _profile: Profile = DEFAULT_PROFILE;
    @observable _profile: Profile;

    @computed get profile(): Profile { return this._profile; }
    set profile(profile: Profile) { this._profile = profile; }

    async init(): Promise<void> {
        // Load Profile
        const uid = Firebase.user().uid;
        this.instance = Firebase.firestore.collection("users").doc(uid).onSnapshot(
            snap => {
                if (snap.exists) {
                    console.log('ProfileStore, profile changed.');

                    this.lastChangedTime = Date.now();

                    if (this.profile) {
                        // 1. check if feeds changed
                        const oldFeeds = this.profile.feeds;
                        const newFeeds = snap.data().feeds;
                        const resultFeeds = this.compareFeeds(oldFeeds, newFeeds);
                        if (!resultFeeds) this.lastTimeFeedsUpdated = this.lastChangedTime;

                        // 2. check if likes changed
                        const oldLikes = this.profile.likes;
                        const newLikes = snap.data().likes;
                        const resultLikes = this.compareLikes(oldLikes, newLikes);
                        if (!resultLikes) this.lastTimeLikesUpdated = this.lastChangedTime;

                        // 3. check if reviews changed
                        const oldReviews = this.profile.reviews;
                        const newReviews = snap.data().reviews;
                        const resultReviews = this.compareReviews(oldReviews, newReviews);
                        if (!resultReviews) this.lastTimeReviewsUpdated = this.lastChangedTime;

                        // 4. check if comments changed
                        const oldComments = this.profile.comments;
                        const newComments = snap.data().comments;
                        const resultComments = this.compareComments(oldComments, newComments);
                        if (!resultComments) this.lastTimeCommentsUpdated = this.lastChangedTime;

                    } else {
                        this.lastTimeFeedsUpdated = this.lastChangedTime;
                        this.lastTimeLikesUpdated = this.lastChangedTime;
                        this.lastTimeReviewsUpdated = this.lastChangedTime;
                        this.lastTimeCommentsUpdated = this.lastChangedTime;
                    }

                    this.profile = snap.data();
                } else {
                    console.log('ProfileStore, profile removed.');

                    this.profile = undefined;
                    /*
                    // create default
                    await Firebase.firestore.collection("users").doc(uid).set(DEFAULT_PROFILE);
                    this.profile = DEFAULT_PROFILE;
                    */
                }
            },
            error => {
                console.log('ProfileStore, an error happened.', error);
            }
        );
    }

    final() {
        if (this.instance) this.instance();
    }

    compareFeeds(oldFeeds, newFeeds) {
        // 1. size
        if (oldFeeds.length !== newFeeds.length) return false;

        // 2. contents
        for (let i = 0; i < oldFeeds.length; i++) {

            const a = oldFeeds[i]; // LikeRef
            const b = newFeeds[i]; // LikeRef

            if (a.placeId !== b.placeId) return false;
            if (a.feedId !== b.feedId) return false;
        }

        return true;
    }

    compareLikes(oldLikes, newLikes) {
        // 1. size
        if (oldLikes.length !== newLikes.length) return false;

        // 2. contents
        for (let i = 0; i < oldLikes.length; i++) {

            const a = oldLikes[i]; // LikeRef
            const b = newLikes[i]; // LikeRef

            if (a.placeId !== b.placeId) return false;
            if (a.feedId !== b.feedId) return false;
        }

        return true;
    }

    compareReviews(oldReviews, newReviews) {
        // 1. size
        if (oldReviews.length !== newReviews.length) return false;

        // 2. contents
        for (let i = 0; i < oldReviews.length; i++) {

            const a = oldReviews[i]; // LikeRef
            const b = newReviews[i]; // LikeRef

            if (a.placeId !== b.placeId) return false;
            if (a.feedId !== b.feedId) return false;
            if (a.reviewId !== b.reviewId) return false;
        }

        return true;
    }

    compareComments(oldComments, newComments) {
        // 1. size
        if (oldComments.length !== newComments.length) return false;

        // 2. contents
        for (let i = 0; i < oldComments.length; i++) {

            const a = oldComments[i]; // CommentRef
            const b = newComments[i]; // CommentRef

            if (a.commentId !== b.commentId) return false;
        }

        return true;
    }
}
