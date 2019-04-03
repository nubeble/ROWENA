type Location = {
    description: string,
    // streetId: string, // place_id for street
    longitude: number,
    latitude: number
};

export type Picture = {
    preview: string,
    uri: string
};

type FeedRef = {
    placeId: string,
    feedId: string
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
    feedId: string,
    /*
    name: string,
    placeName: string,
    averageRating: number,
    reviewCount: number,
    picture: string,
    valid: boolean
    */
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
    likes: LikeRef[]
};

type Pictures = {
    one: Picture,
    two: Picture,
    three: Picture,
    four: Picture
};

// feed: user id, place id, feed id, pictures, location, note, reviews[review id], averageRating, name, age
export type Post = {
    uid: string,
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
    // age: number,
    birthday: string, // DDMMYYYY
    height: number,
    weight: number,
    bust: string,
    timestamp: number,
    rn: number // random number
};

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


export type FeedEntry = { post: Post, profile: Profile };
export type Feed = FeedEntry[];


export type ReviewEntry = { review: Review, profile: Profile };
export type Reviews = ReviewEntry[];



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
