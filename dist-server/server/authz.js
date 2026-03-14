export function canViewSpace(input) {
    const visibility = input.visibility ?? 'private';
    if (visibility === 'private') {
        return input.currentUserId === input.ownerId;
    }
    // Stage 1 keeps all spaces private; this branch is reserved for future expansion.
    return input.currentUserId === input.ownerId;
}
export function canEditSpace(input) {
    return canViewSpace(input);
}
