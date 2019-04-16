import * as firebase from "firebase";

type Location = {
    description: string,
    longitude: number,
    latitude: number
};

export type Picture = {
    preview: string,
    uri: string
};

type FeedRef = {
    placeId: string,
    feedId: string,
    picture: string, // ToDo: update when the origin post changed

    newReviewAdded: boolean
};

type ReviewRef = {
    placeId: string,
    feedId: string,
    reviewId: string
};

type ReplyRef = {
    placeId: string,
    feedId: string,
    reviewId: string,
    replyId: string
};

type LikeRef = {
    placeId: string,
    feedId: string
    /*
    name: string,
    placeName: string,
    averageRating: number,
    reviewCount: number,
    picture: string,
    valid: boolean
    */
};

type CommentRef = {
    userUid: string, // receiver
    commentId: string
    // comment: string
};

export type Profile = {
    uid: string,
    name: string,
    country: string,
    city: string,
    email: string,
    phoneNumber: string,
    picture: Picture,
    // location: Location,
    about: string,
    feeds: FeedRef[],
    reviews: ReviewRef[],
    replies: ReplyRef[],
    likes: LikeRef[],
    comments: CommentRef[], // 내가 남긴 comment (내가 받은 comment는 comments collection에 달린다)
    receivedCommentsCount: number // 내가 받은 comment 개수
};

type Pictures = {
    one: Picture,
    two: Picture,
    three: Picture,
    four: Picture
};

// feed: user id, place id, feed id, pictures, location, note, reviews[review id], averageRating, name, age
export type Post = {
    uid: string, // user uid
    id: string,
    placeId: string,
    placeName: string,
    location: Location,
    note: string,
    pictures: Pictures,
    reviewCount: number,
    averageRating: number,
    reviewStats: Array<number>, // [0] - 5, [1] - 4, [2] - 3, [3] - 2, [4] - 1
    likes: Array<string>, // user uid list
    name: string,
    birthday: string, // DDMMYYYY
    gender: string, // 'male', 'female'
    height: number,
    weight: number,
    bodyType: string, // 'Skinny', Fit', 'Thick'
    bust: string,
    timestamp: number,
    rn: number, // random number
    g: string,
    l: firebase.firestore.GeoPoint
};

export type FeedEntry = { post: Post, profile: Profile };
export type Feed = FeedEntry[];

type Reply = {
    comment: string,
    id: string,
    timestamp: string,
    uid: string
};

// review: user id, review id, rating, date, comment
export type Review = {
    uid: string,
    id: string,
    rating: number,
    timestamp: number,
    comment: string,
    reply: Reply
};

export type ReviewEntry = { review: Review, profile: Profile };
export type Reviews = ReviewEntry[];

type Comment = {
    uid: string, // boss's uid
    comment: string,
    id: string,
    timestamp: string,

    name: string,
    place: string, // city, country
    picture: string // uri
};

export type CommentEntry = { comment: Comment, profile: Profile };
export type Comments = CommentEntry[];



/*
export type Post = {
    uid: string,
    id: string,
    likes: string[],
    comments: number,
    timestamp: number,
    text: string,
    picture: Picture
};

export type Comment = {
    uid: string,
    id: string,
    text: string,
    timestamp: number
};
*/

// export type CommentEntry = { comment: Comment, profile: Profile };
// export type Comments = CommentEntry[];
