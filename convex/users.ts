import { MutationCtx, QueryCtx, internalMutation } from './_generated/server';
import { ConvexError, v } from 'convex/values';

/**
 * @description ユーザー取得する
 */
export const getUser = async (
  ctx: QueryCtx | MutationCtx,
  tokenIdentifier: string
) => {
  const output = await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', (q) =>
      q.eq('tokenIdentifier', tokenIdentifier)
    )
    .first();

  // ユーザーが存在していなければ、エラー
  if (!output) {
    throw new ConvexError('expected user to be defined');
  }

  return output;
};
/**
 * @description ユーザーを新規登録する
 */
export const createUser = internalMutation({
  args: { tokenIdentifier: v.string() },
  async handler(ctx, args) {
    await ctx.db.insert('users', {
      tokenIdentifier: args.tokenIdentifier,
      orgIds: [],
    });
  },
});
/**
 * @description ユーザーに組織IDを追加更新する
 */
export const addOrgIdToUser = internalMutation({
  args: { tokenIdentifier: v.string(), orgId: v.string() },
  async handler(ctx, args) {
    const user = await getUser(ctx, args.tokenIdentifier);

    await ctx.db.patch(user._id, {
      orgIds: [...user.orgIds, args.orgId],
    });
  },
});
