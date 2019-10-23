// @flow
import { observable, computed } from "mobx";
import Firebase from "../../../Firebase";
import type { Profile } from "../components/Model";

/*
const DEFAULT_PROFILE: Profile = {
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
*/


export default class ProfileStore {
    // @observable _profile: Profile = DEFAULT_PROFILE;
    @observable _profile: Profile;

    @computed get profile(): Profile { return this._profile; }
    set profile(profile: Profile) { this._profile = profile; }

    lastChangedTime: number;
    lastTimeFeedsUpdated: number;
    lastTimeLikesUpdated: number;
    lastTimeReviewsUpdated: number;
    lastTimeCommentsUpdated: number;

    feedsUpdatedCallbackList = [];
    likesUpdatedCallbackList = [];
    reviewsUpdatedCallbackList = [];
    commentsUpdatedCallbackList = [];

    replyAddedOnReviewCallbackList = [];


    setFeedsUpdatedCallback(cb) {
        this.feedsUpdatedCallbackList.push(cb);
    }

    unsetFeedsUpdatedCallback(cb) {
        const index = this.feedsUpdatedCallbackList.indexOf(cb);
        this.feedsUpdatedCallbackList.splice(index, 1);
    }

    callFeedsUpdatedCallback() {
        for (let i = 0; i < this.feedsUpdatedCallbackList.length; i++) {
            const cb = this.feedsUpdatedCallbackList[i];
            cb();
        }
    }


    setLikesUpdatedCallback(cb) {
        this.likesUpdatedCallbackList.push(cb);
    }

    unsetLikesUpdatedCallback(cb) {
        const index = this.likesUpdatedCallbackList.indexOf(cb);
        this.likesUpdatedCallbackList.splice(index, 1);
    }

    callLikesUpdatedCallback() {
        for (let i = 0; i < this.likesUpdatedCallbackList.length; i++) {
            const cb = this.likesUpdatedCallbackList[i];
            cb();
        }
    }


    setReviewsUpdatedCallback(cb) {
        this.reviewsUpdatedCallbackList.push(cb);
    }

    unsetReviewsUpdatedCallback(cb) {
        const index = this.reviewsUpdatedCallbackList.indexOf(cb);
        this.reviewsUpdatedCallbackList.splice(index, 1);
    }

    callReviewsUpdatedCallback() {
        for (let i = 0; i < this.reviewsUpdatedCallbackList.length; i++) {
            const cb = this.reviewsUpdatedCallbackList[i];
            cb();
        }
    }


    setCommentsUpdatedCallback(cb) {
        this.commentsUpdatedCallbackList.push(cb);
    }

    unsetCommentsUpdatedCallback(cb) {
        const index = this.commentsUpdatedCallbackList.indexOf(cb);
        this.commentsUpdatedCallbackList.splice(index, 1);
    }

    callCommentsUpdatedCallback() {
        for (let i = 0; i < this.commentsUpdatedCallbackList.length; i++) {
            const cb = this.commentsUpdatedCallbackList[i];
            cb();
        }
    }


    // if review added on my feed
    setReviewAddedOnFeedCallback(cb) {
        this.reviewAddedOnFeedCallback = cb;
    }

    unsetReviewAddedOnFeedCallback(cb) {
        if (this.reviewAddedOnFeedCallback === cb) this.reviewAddedOnFeedCallback = undefined;
    }


    // if reply added on my review
    setReplyAddedOnReviewCallback(cb) {
        this.replyAddedOnReviewCallbackList.push(cb);
    }

    unsetReplyAddedOnReviewCallback(cb) {
        const index = this.replyAddedOnReviewCallbackList.indexOf(cb);
        this.replyAddedOnReviewCallbackList.splice(index, 1);
    }

    callReplyAddedOnReviewCallback() {
        for (let i = 0; i < this.replyAddedOnReviewCallbackList.length; i++) {
            const cb = this.replyAddedOnReviewCallbackList[i];
            cb();
        }
    }


    init() {
        const uid = Firebase.user().uid;
        this.instance = Firebase.firestore.collection("users").doc(uid).onSnapshot(
            snap => {
                if (snap.exists) {
                    console.log('jdub', 'ProfileStore, profile changed.');

                    const data = snap.data();

                    const __profile = this.profile;
                    this.profile = data;

                    this.lastChangedTime = Date.now();

                    if (__profile) {
                        // 1. check if feeds changed
                        const oldFeeds = __profile.feeds;
                        const newFeeds = data.feeds;
                        const resultFeeds = this.compareFeeds(oldFeeds, newFeeds);
                        if (!resultFeeds) {
                            this.lastTimeFeedsUpdated = this.lastChangedTime;
                            this.callFeedsUpdatedCallback();
                        }

                        // 2. check if likes changed
                        const oldLikes = __profile.likes;
                        const newLikes = data.likes;
                        const resultLikes = this.compareLikes(oldLikes, newLikes);
                        if (!resultLikes) {
                            this.lastTimeLikesUpdated = this.lastChangedTime;
                            this.callLikesUpdatedCallback();
                        }

                        // 3. check if reviews changed
                        const oldReviews = __profile.reviews;
                        const newReviews = data.reviews;
                        const resultReviews = this.compareReviews(oldReviews, newReviews);
                        if (!resultReviews) {
                            this.lastTimeReviewsUpdated = this.lastChangedTime;
                            this.callReviewsUpdatedCallback();
                        }

                        // 4. check if comments changed
                        const oldComments = __profile.comments;
                        const newComments = data.comments;
                        const resultComments = this.compareComments(oldComments, newComments);
                        if (!resultComments) {
                            this.lastTimeCommentsUpdated = this.lastChangedTime;
                            this.callCommentsUpdatedCallback();
                        }



                        // check if a review added on my feed
                        // const resultReview = this.checkReviewAddedOnFeed(data.feeds);
                        // if (!resultReview) {
                        const resultReview = this.compareReviewAddedOnFeed(__profile.feeds, data.feeds);
                        if (resultReview === false) {
                            if (this.reviewAddedOnFeedCallback) this.reviewAddedOnFeedCallback();
                        }

                        // check if a reply added on my received review
                        // const resultReply = this.checkReplyAddedOnReview(data.reviews);
                        const resultReply = this.compareReplyAddedOnReview(__profile.reviews, data.reviews);
                        if (!resultReply) {
                            this.callReplyAddedOnReviewCallback();
                        }
                    } else {
                        this.lastTimeFeedsUpdated = this.lastChangedTime;
                        this.lastTimeLikesUpdated = this.lastChangedTime;
                        this.lastTimeReviewsUpdated = this.lastChangedTime;
                        this.lastTimeCommentsUpdated = this.lastChangedTime;
                    }
                } else {
                    console.log('jdub', 'ProfileStore, profile removed.');

                    this.profile = undefined;

                    /*
                    // create default
                    await Firebase.firestore.collection("users").doc(uid).set(DEFAULT_PROFILE);
                    this.profile = DEFAULT_PROFILE;
                    */
                }
            },
            error => {
                console.log('jdub', 'ProfileStore, an error happened.', error);
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

    /*
    checkReviewAddedOnFeed(feeds) {
        for (let i = 0; i < feeds.length; i++) {
            const feed = feeds[i];
            if (feed.reviewAdded) return true;
        }

        return false;
    }

    checkReplyAddedOnReview(reviews) {
        for (let i = 0; i < reviews.length; i++) {
            const review = reviews[i];
            if (review.replyAdded) return true;
        }

        return false;
    }
    */

    compareReviewAddedOnFeed(oldFeeds, newFeeds) {
        if (oldFeeds.length !== newFeeds.length) return null; // can not make a decision

        for (let i = 0; i < oldFeeds.length; i++) {
            const a = oldFeeds[i];
            const b = newFeeds[i];

            if (a.placeId !== b.placeId) return null; // can not make a decision
            if (a.feedId !== b.feedId) return null; // can not make a decision

            if (a.reviewAdded !== b.reviewAdded) return false;
        }

        return true;
    }

    compareReplyAddedOnReview(oldReviews, newReviews) {
        // 1. size
        if (oldReviews.length !== newReviews.length) return false;

        // 2. review added
        for (let i = 0; i < oldReviews.length; i++) {
            const a = oldReviews[i];
            const b = newReviews[i];

            if (a.replyAdded !== b.replyAdded) return false;
        }

        return true;
    }
}
