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
    // ログインしていなければ、空で返す
    const identity = await ctx.auth.getUserIdentity();
    console.log('======[getFiles]identity=======', identity);
    if (!identity) {
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
