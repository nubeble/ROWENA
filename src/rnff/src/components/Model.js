// @flow
export type Picture = {
    uri: string,
    preview: string
};

/*
export type Profile = {
    picture: Picture,
    name: string,
    outline: string
};
*/
export type Profile = { // done
    // outline: string, // ToDo

    uid: string,
    name: string,
    country: string,
    city: string,
    email: string,
    phoneNumber: string,
    pictures: Pictures,
    location: Location,
    about: string,
    receivedReviews: string[],
    averageRating: number,
    postedReviews: string[]
};

type Pictures = {
    one: Picture,
    two: Picture,
    three: Picture,
    four: Picture,
    five: Picture,
    six: Picture
};



export type Post = { // done
    uid: string,
    id: string,
    likes: string[],
    comments: number,
    timestamp: number,
    text: string,
    picture: Picture
};

export type Comment = { // ToDo
    id: string,
    text: string,
    uid: string,
    timestamp: number
};

export type FeedEntry = { post: Post, profile: Profile };
export type Feed = FeedEntry[];

export type CommentEntry = { comment: Comment, profile: Profile };
export type Comments = CommentEntry[];
