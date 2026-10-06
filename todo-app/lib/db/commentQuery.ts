/** Shared Drizzle `with` shape for loading comments with author + reactions. */
export const COMMENT_WITH = {
  user: true,
  reactions: {
    with: {
      user: {
        columns: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  },
} as const
