import type {SpaceVisibility} from './types';

export function canViewSpace(input: {
  currentUserId: string;
  ownerId: string;
  visibility?: SpaceVisibility;
}): boolean {
  const visibility = input.visibility ?? 'private';
  if (visibility === 'private') {
    return input.currentUserId === input.ownerId;
  }

  // Stage 1 keeps all spaces private; this branch is reserved for future expansion.
  return input.currentUserId === input.ownerId;
}

export function canEditSpace(input: {
  currentUserId: string;
  ownerId: string;
  visibility?: SpaceVisibility;
}): boolean {
  return canViewSpace(input);
}
