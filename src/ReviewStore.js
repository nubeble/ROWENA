// @flow
import { observable, computed } from "mobx";
import Firebase from "./Firebase";
// import type { Comment, Comments, CommentEntry } from "../../components/Model";
import type { Review, Reviews, ReviewEntry } from "./rnff/src/components/Model";



export default class ReviewStore {
    @observable _reviews: Reviews = [];
    // @observable _review: string = ""; // ToDo

    @computed get reviews(): Reviews { return this._reviews; }
    set reviews(reviews: Reviews) { this._reviews = reviews; }

    /*
    @computed get review(): string { return this._review; }
    set review(review: string) { this._review = review; }
    */


    async init(placeId: string, feedId: string): Promise<void> { // get [{review: profile}] in real time
        // console.log('placeId', placeId, 'feedId', feedId);

        const query = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").orderBy("timestamp", "desc");

        query.onSnapshot(async snap => {
            const reviews: Promise<ReviewEntry>[] = [];

            snap.forEach(reviewDoc => reviews.push((async () => {
                const review = reviewDoc.data();

                const profileDoc = await Firebase.firestore.collection("users").doc(review.uid).get(); // get user uid
                const profile = profileDoc.data();

                // console.log('review', review, 'profile', profile);

                return { review, profile };
            })()));

            this.reviews = await Promise.all(reviews);

            // console.log('reviews', this.reviews);
        });
    }

    /*
    async addReview(placeId: string, feedId: string, review: Review): Promise<void> {
        let userUid = review.uid;
        let reviewId = review.id;

        await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(id).set(review);


        // 업데이트 2개 - averageRating, postedReviews

        let feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        let userRef = Firebase.firestore.collection("users").doc(userUid);

        let size = await Firebase.getReviewsSize(placeId, feedId);
        // console.log('returned size', size);

        await Firebase.firestore.runTransaction(async transaction => {
            // averageRating (number)
            const feedDoc = await transaction.get(feedRef);
            let averageRating = feedDoc.data().averageRating;
            let totalRating = averageRating * (size - 1);
            totalRating += review.rating;
            averageRating = totalRating / size;
            averageRating = averageRating.toFixed(1);
            console.log('averageRating', averageRating);
            transaction.update(feedRef, { averageRating: Number(averageRating) });

            // postedReviews (array)
            let data = {
                postedReviews: firebase.firestore.FieldValue.arrayUnion(reviewId)
            };
            await transaction.update(userRef, data);
        });
    }
    */
}
