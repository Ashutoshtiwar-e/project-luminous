export interface Review {
  id: string;
  userId?: string;
  user: string;
  rating: number;
  text: string;
  date: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string[];
  publicationDate: string;
  rating: number;
  coverImage: string;
  summary: string;
  aiSummary: string[];
  contentWarnings?: string[];
  reviews: Review[];
  pageCount: number;
  publisher: string;
}

export interface Post {
  _id: string;
  communityId: string;
  authorId: string;
  authorUsername: string;
  title: string;
  content: string;
  upvotes: number;
  createdAt: string;
  tags?: string[];
  replyCount?: number;
}

export interface Reply {
  _id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  content: string;
  createdAt: string;
}
