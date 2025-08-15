import { Injectable } from '@nestjs/common';
import { Poll, PollOption } from '../common/interfaces/poll.interface';

@Injectable()
export class PollingService {
  private polls = new Map<string, Poll>();
  private currentPoll: string | null = null;

  createPoll(question: string, options: string[]): Poll {
    const pollId = Date.now().toString();
    
    const poll: Poll = {
      id: pollId,
      question,
      options: options.map((option, index) => ({
        id: index,
        text: option,
        votes: 0,
      })),
      active: true,
      totalVotes: 0,
    };
    
    this.polls.set(pollId, poll);
    this.currentPoll = pollId;
    
    return poll;
  }

  getPoll(pollId: string): Poll | undefined {
    return this.polls.get(pollId);
  }

  getCurrentPoll(): Poll | undefined {
    return this.currentPoll ? this.polls.get(this.currentPoll) : undefined;
  }

  getCurrentPollId(): string | null {
    return this.currentPoll;
  }

  vote(pollId: string, optionId: number): Poll | null {
    const poll = this.polls.get(pollId);
    
    if (!poll || !poll.active) {
      return null;
    }
    
    const option = poll.options.find(opt => opt.id === optionId);
    if (!option) {
      return null;
    }
    
    option.votes++;
    poll.totalVotes++;
    
    return poll;
  }

  stopPoll(pollId: string): Poll | null {
    const poll = this.polls.get(pollId);
    if (!poll) {
      return null;
    }
    
    poll.active = false;
    return poll;
  }

  setCurrentPoll(pollId: string | null): void {
    this.currentPoll = pollId;
  }

  getAllPolls(): Poll[] {
    return Array.from(this.polls.values());
  }
}