import { mutation, query } from './_generated/server';
import { ConvexError, v } from 'convex/values';

/**
 * @description ファイルを新規作成
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

    await ctx.db.insert('files', {
      name: args.name,
      orgId: args.orgId,
    });
  },
});
/**
 * @description ファイル一覧を取得
 */
export const getFiles = query({
  args: {
    orgId: v.string(),
  },
  async handler(ctx, args) {
    console.log('======args=======', args);

    // ログインしていなければ、空で返す
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return (
      ctx.db
        .query('files')
        // .withIndex('by_orgId', ({ eq }) => eq('orgId', args.orgId))
        .collect()
    );
  },
});
