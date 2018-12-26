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

export type Profile = {
    uid: string,
    name: string,
    country: string,
    city: string,
    email: string,
    phoneNumber: string,
    picture: Picture,
    location: Location,
    about: string,
    feeds: FeedRef[],
    reviews: ReviewRef[],
    replies: ReplyRef[]
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
    location: Location,
    note: string,
    pictures: Pictures,
    placeId: string,
    // reviews: Review[], // 저장해 두지 않고, review 창이 뜰 때 동적으로 서버에서 가져온다. (Comments 처럼)
    reviewCount: number,
    averageRating: number,
    name: string,
    age: number,
    height: number,
    weight: number,
    timestamp: number
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
