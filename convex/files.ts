import { MutationCtx, QueryCtx, mutation, query } from './_generated/server';
import { ConvexError, v } from 'convex/values';
import { getUser } from './users';

/**
 * @description ユーザーが組織に属しているかどうか判定
 */
export const hasAccessToOrg = async (
  ctx: QueryCtx | MutationCtx,
  tokenIdentifier: string,
  orgId: string
) => {
  // 違うユーザーであれば、エラー
  const user = await getUser(ctx, tokenIdentifier);
  return user.orgIds.includes(orgId) || user.tokenIdentifier.includes(orgId);
};

/**
 * @description ファイルを新規作成する
 */
export const createFile = mutation({
  args: {
    name: v.string(),
    orgId: v.string(),
  },
  async handler(ctx, args) {
    // ログインしていなければ、エラー
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('you must be logged in to upload a file');
    }

    // ユーザーが指定した組織に属していなければ、エラー
    const hasAccess = await hasAccessToOrg(
      ctx,
      identity.tokenIdentifier,
      args.orgId
    );
    if (!hasAccess) {
      throw new ConvexError('you do not have access to this org');
    }

    await ctx.db.insert('files', {
      name: args.name,
      orgId: args.orgId,
    });
  },
});
/**
 * @description ファイル一覧を取得する
 */
export const getFiles = query({
  args: {
    orgId: v.string(),
  },
  async handler(ctx, args) {
    // ログインしていなければ、空で返す
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // ユーザーが指定した組織に属していなければ、エラー、空で返す
    const hasAccess = await hasAccessToOrg(
      ctx,
      identity.tokenIdentifier,
      args.orgId
    );
    if (!hasAccess) {
      return [];
    }

    const output = await ctx.db
      .query('files')
      .withIndex('by_orgId', (q) => q.eq('orgId', args.orgId))
      .collect();
    console.log('======[getFiles]output=======', output);

    return output;
  },
});
