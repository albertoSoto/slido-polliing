export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  active: boolean;
  totalVotes: number;
  slideIndex?: number;
}

export interface PresentationSlide {
  id: number;
  content: string;
  type: 'intro' | 'poll' | 'results' | 'content' | 'conclusion';
  title: string;
  poll?: {
    question: string;
    options: string[];
  };
  resultsFor?: number;
}