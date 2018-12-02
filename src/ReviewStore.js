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


    async init(placeId: string, feedId: string): Promise<void> {
        const query = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews")
            .orderBy("timestamp", "desc");

        query.onSnapshot(async snap => {
            const reviews: Promise<ReviewEntry>[] = [];

            snap.forEach(reviewDoc => reviews.push((async () => {
                const review = reviewDoc.data();

                const profileDoc = await Firebase.firestore.collection("users").doc(review.uid).get();
                const profile = profileDoc.data();

                return { review, profile };
            })()));

            this.reviews = await Promise.all(reviews);
        });
    }

    async addReview(placeId: string, feedId: string, review: Review): Promise<void> {
        // this.review = ""; // ToDo

        /*
        const postRef = Firebase.firestore.collection("feed").doc(postId);

        await postRef.collection("reviews").add(review);

        await Firebase.firestore.runTransaction(async transaction => {
            const postDoc = await transaction.get(postRef);
            const reviews = postDoc.data().reviews + 1;
            transaction.update(postRef, { reviews });
        });
        */

        let userUid = review.uid;
        let reviewId = review.id;

        await Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId).collection("reviews").doc(id).set(review);


        // 업데이트 2개 - averageRating, postedReviews

        let feedRef = Firebase.firestore.collection("place").doc(placeId).collection("feed").doc(feedId);
        let userRef = Firebase.firestore.collection("users").doc(userUid);

        let size = await this.getReviewsSize(placeId, feedId);
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
}
