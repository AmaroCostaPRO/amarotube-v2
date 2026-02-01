export interface Poll {
  id: string;
  creator_id: string;
  question: string;
  options: string[];
  status: 'open' | 'closed' | 'resolved';
  correct_option_index: number | null;
  total_pool: number;
  created_at: string;
  expires_at: string | null;
  profiles?: { username: string; avatar_url: string } | null;
}

export interface PollBet {
  id: string;
  user_id: string;
  poll_id: string;
  option_index: number;
  amount: number;
  created_at: string;
}