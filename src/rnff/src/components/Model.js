import * as firebase from "firebase";

type Location = {
    description: string,
    longitude: number,
    latitude: number
};

export type Picture = {
    // preview: string,
    uri: string,
    ref: string // to delete file (Firebase.deleteProfile)
};

type FeedRef = {
    placeId: string,
    feedId: string,
    picture: string,
    reviewAdded: boolean
};

type ReviewRef = {
    placeId: string,
    feedId: string,
    reviewId: string,
    replyAdded: boolean,
    picture: string
};

type ReplyRef = {
    placeId: string,
    feedId: string,
    reviewId: string,
    replyId: string
};

type LikeRef = {
    placeId: string,
    feedId: string,
    picture: string,
    name: string,
    placeName: string
};

type CommentRef = {
    userUid: string, // receiver
    commentId: string,
    // comment: string
    name: string,
    placeName: string,
    picture: string
};

type PostFilter = {
    showMe: string,
    // ageRange: Array<number>
};

type Message = {
    count: number,
    lastInitTime: number
};

export type Profile = {
    uid: string,
    name: string,
    birthday: string, // DDMMYYYY
    gender: string,
    // country: string,
    // city: string,
    place: string, // Bangkok, Thailand
    // location: Location,
    email: string,
    phoneNumber: string,
    picture: Picture,
    about: string,
    feeds: FeedRef[], // 내가 만든 feed
    reviews: ReviewRef[], // 내가 남긴 review
    replies: ReplyRef[], // 내가 남긴 reply
    likes: LikeRef[], // 내가 찜한 feed
    comments: CommentRef[], // 내가 남긴 comment (내가 받은 comment는 comments collection에 달린다)
    receivedCommentsCount: number, // 내가 받은 comment 개수
    commentAdded: boolean,
    timestamp: number,
    activating: boolean,
    lastLogInTime: number,
    postFilter: PostFilter,
    initiatedMessage: Message // 내가 말을 건 대화 개수
};

type Pictures = {
    one: Picture,
    two: Picture,
    three: Picture,
    four: Picture
};

type VisitRef = {
    userUid: string, // visitor uid
    count: number, // total visit count
    timestamp: number // last visit time
};

// feed: user id, place id, feed id, pictures, location, note, reviews[review id], averageRating, name, age
export type Post = {
    d: {
        uid: string, // user uid
        id: string,
        placeId: string,
        placeName: string, // country | city, country | city, state, country
        location: Location,
        note: string,
        pictures: Pictures,
        reviewCount: number,
        averageRating: number,
        reviewStats: Array<number>, // [0] - 5, [1] - 4, [2] - 3, [3] - 2, [4] - 1
        likes: Array<string>, // user uid array
        name: string,
        birthday: string, // DDMMYYYY
        gender: string, // 'Man', 'Woman', 'Other'
        height: number,
        weight: number,
        bodyType: string, // 'Skinny', Fit', 'Thick'
        bust: string,
        muscle: string,
        timestamp: number,
        rn: number, // random number
        visits: VisitRef[], // visit count array
        totalVisitCount: number,
        // ranking: number,
        reporters: Array<string> // user uid array
    },
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
    reply: Reply,
    name: string,
    place: string,
    picture: Picture,
    reporters: Array<string>
};

export type ReviewEntry = { review: Review, profile: Profile };
export type Reviews = ReviewEntry[];

type Comment = {
    id: string,
    timestamp: string,
    uid: string, // boss's uid
    comment: string,
    placeId: string,
    feedId: string,
    name: string,
    placeName: string,
    picture: string,
    reporters: Array<string>
};

export type CommentEntry = { comment: Comment, post: Post };
export type Comments = CommentEntry[];
