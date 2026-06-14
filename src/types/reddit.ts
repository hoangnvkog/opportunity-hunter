/**
 * Reddit API response types
 */

export interface RedditPost {
  kind: string;
  data: {
    id: string;
    subreddit: string;
    title: string;
    selftext: string;
    url: string;
    permalink: string;
    score: number;
    created_utc: number;
    author: string;
    num_comments: number;
    over_18: boolean;
    spoiler: boolean;
    stickied: boolean;
  };
}

export interface RedditListingResponse {
  kind: string;
  data: {
    modhash: string;
    dist: number;
    children: RedditPost[];
    after: string | null;
    before: string | null;
  };
}
