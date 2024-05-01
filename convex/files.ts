import { MutationCtx, QueryCtx, mutation, query } from './_generated/server';
import { ConvexError, v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';
import { getUser } from './users';
import { fileTypes } from './schema';

/**
 * @description
 */
export const generateUploadUrl = mutation(async (ctx) => {
  // ログインしていなければ、エラー
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError('you must be logged in to upload a file');
  }

  return await ctx.storage.generateUploadUrl();
});
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
    fileId: v.id('_storage'),
    type: fileTypes,
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
      fileId: args.fileId,
      type: args.type,
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
    query: v.optional(v.string()),
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

    const files = await ctx.db
      .query('files')
      .withIndex('by_orgId', (q) => q.eq('orgId', args.orgId))
      .collect();

    const filesWithUrl = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.fileId),
      }))
    );
    console.log('======[getFiles]files=======', files);

    // 検索
    const query = args.query;
    if (query) {
      return filesWithUrl.filter(({ name }) =>
        name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      );
    } else {
      return filesWithUrl;
    }
  },
});
/**
 * @description
 */
export const deleteFile = mutation({
  args: {
    fileId: v.id('files'),
  },
  async handler(ctx, args) {
    // ログインしていなければ、エラー
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('you must be logged in to upload a file');
    }

    // ファイルが存在していなければ、エラー
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new ConvexError('this file does not exist');
    }

    // ユーザーが指定した組織に属していなければ、エラー
    const hasAccess = await hasAccessToOrg(
      ctx,
      identity.tokenIdentifier,
      file.orgId
    );
    if (!hasAccess) {
      throw new ConvexError('you do not have access to this org');
    }

    await ctx.db.delete(args.fileId);
  },
});
