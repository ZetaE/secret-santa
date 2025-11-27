export type SecretSantaStatus = 'PENDING' | 'COMPLETED';

export interface SecretSanta {
  id: string;
  name: string;
  status: SecretSantaStatus;
  created_at: string;
}

export interface Participant {
  id: string;
  secret_santa_id: string;
  name: string;
  access_code: string;
  assigned_to_id: string | null;
  has_accessed: boolean;
}

export interface ParticipantWithAssignment extends Participant {
  assigned_to?: Participant;
}

export interface SecretSantaWithParticipants extends SecretSanta {
  participants: ParticipantWithAssignment[];
}
